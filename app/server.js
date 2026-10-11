const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const client = require('prom-client');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. PROMETHEUS METRICS SETUP
// ==========================================
const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'news_app_' });

const httpRequestsTotal = new client.Counter({
  name: 'news_http_requests_total',
  help: 'Total number of HTTP requests made to the News Portal',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'news_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});

const articleViewsCounter = new client.Counter({
  name: 'news_article_views_total',
  help: 'Total views of news articles',
  labelNames: ['category_name']
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(articleViewsCounter);

// ==========================================
// 2. DATABASE CONFIGURATION & RETRY LOGIC
// ==========================================
const dbConfig = {
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'news_user',
  password: process.env.DB_PASSWORD || 'NewsSecure@2026',
  database: process.env.DB_NAME || 'news_portal_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDBConnection() {
  let retries = 15;
  while (retries > 0) {
    try {
      pool = mysql.createPool(dbConfig);
      const connection = await pool.getConnection();
      logger.info('Connected successfully to MySQL Database!', { db: dbConfig.database });
      connection.release();
      return;
    } catch (err) {
      retries--;
      logger.warn(`Failed to connect to MySQL. Retrying in 3s... (${retries} retries left)`, { error: err.message });
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  logger.error('Could not connect to MySQL after multiple attempts. Application will continue, but DB features will fail.');
}

// ==========================================
// 3. MIDDLEWARES & VIEW ENGINE
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'news_portal_secret_key_devops_2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day
}));

app.use(flash());

// Multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Request duration & Logging middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    
    // Normalize route label for Prometheus
    const route = req.route ? req.route.path : req.path;
    
    // Don't record internal health/metrics calls in business counters
    if (req.path !== '/metrics' && req.path !== '/health') {
      httpRequestsTotal.inc({
        method: req.method,
        route: route,
        status_code: res.statusCode
      });
      
      httpRequestDurationMicroseconds.observe(
        { method: req.method, route: route, status_code: res.statusCode },
        durationInSeconds
      );
      
      logger.info('HTTP Request handled', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration_ms: Math.round(durationInSeconds * 1000),
        ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
      });
    }
  });
  
  next();
});

// Flash messages & Global locals middleware
app.use(async (req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentUser = req.session.user || null;
  
  // Pass categories to all views for navbar
  try {
    if (pool) {
      const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
      res.locals.navCategories = categories;
    } else {
      res.locals.navCategories = [];
    }
  } catch (e) {
    res.locals.navCategories = [];
  }
  next();
});

// Auth Guard Middleware
function requireAdmin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Vui lòng đăng nhập để truy cập khu vực quản trị!');
    return res.redirect('/admin/login');
  }
  next();
}

// Slug generator helper
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// ==========================================
// 4. MONITORING & HEALTH ROUTES
// ==========================================
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (pool) {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    }
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'news-portal',
    database: dbStatus,
    uptime_seconds: process.uptime()
  });
});

// ==========================================
// 5. PUBLIC NEWS ROUTES (ĐỘC GIẢ)
// ==========================================

// Trang chủ
app.get('/', async (req, res) => {
  try {
    // 1. Featured articles (Tin nổi bật)
    const [featured] = await pool.query(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.is_featured = 1
      ORDER BY a.created_at DESC
      LIMIT 5
    `);

    // 2. Latest articles (Tin mới nhất)
    const [latest] = await pool.query(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 8
    `);

    // 3. Most viewed articles (Tin đọc nhiều)
    const [mostViewed] = await pool.query(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.views DESC
      LIMIT 5
    `);

    res.render('index', {
      title: 'Cổng Thông Tin Điện Tử & Báo Tin Tức Mới Nhất',
      featured: featured.length > 0 ? featured : latest.slice(0, 5),
      latest,
      mostViewed
    });
  } catch (err) {
    logger.error('Error loading home page', { error: err.message });
    res.status(500).render('error', { title: 'Lỗi máy chủ', message: 'Không thể tải dữ liệu trang chủ.' });
  }
});

// Xem bài viết theo danh mục
app.get('/category/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const [catRows] = await pool.query('SELECT * FROM categories WHERE slug = ?', [slug]);
    
    if (catRows.length === 0) {
      return res.status(404).render('error', { title: 'Không tìm thấy', message: 'Danh mục không tồn tại!' });
    }
    
    const category = catRows[0];
    const [articles] = await pool.query(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.category_id = ?
      ORDER BY a.created_at DESC
    `, [category.id]);

    res.render('category', {
      title: `${category.name} - Cổng Tin Tức`,
      category,
      articles
    });
  } catch (err) {
    logger.error('Error loading category', { error: err.message });
    res.status(500).render('error', { title: 'Lỗi máy chủ', message: 'Không thể tải danh mục.' });
  }
});

// Chi tiết bài viết
app.get('/article/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;
    const [articleRows] = await pool.query(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.slug = ?
    `, [slug]);

    if (articleRows.length === 0) {
      return res.status(404).render('error', { title: 'Không tìm thấy', message: 'Bài viết không tồn tại!' });
    }

    const article = articleRows[0];

    // Tăng lượt xem (view count)
    await pool.query('UPDATE articles SET views = views + 1 WHERE id = ?', [article.id]);
    
    // Tăng metric Prometheus
    articleViewsCounter.inc({ category_name: article.category_name || 'Uncategorized' });

    // Lấy bài viết liên quan cùng danh mục
    const [relatedArticles] = await pool.query(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.category_id = ? AND a.id != ?
      ORDER BY a.created_at DESC
      LIMIT 4
    `, [article.category_id, article.id]);

    res.render('article', {
      title: `${article.title} - Cổng Tin Tức`,
      article,
      relatedArticles
    });
  } catch (err) {
    logger.error('Error loading article detail', { error: err.message });
    res.status(500).render('error', { title: 'Lỗi máy chủ', message: 'Không thể tải chi tiết bài viết.' });
  }
});

// Tìm kiếm bài viết
app.get('/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query.trim()) {
      return res.redirect('/');
    }

    const [articles] = await pool.query(`
      SELECT a.*, c.name as category_name, c.slug as category_slug
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.title LIKE ? OR a.summary LIKE ? OR a.content LIKE ?
      ORDER BY a.created_at DESC
    `, [`%${query}%`, `%${query}%`, `%${query}%`]);

    res.render('search', {
      title: `Kết quả tìm kiếm: "${query}"`,
      query,
      articles
    });
  } catch (err) {
    logger.error('Error in search query', { error: err.message });
    res.status(500).render('error', { title: 'Lỗi máy chủ', message: 'Lỗi tìm kiếm.' });
  }
});

// ==========================================
// 6. ADMIN CMS ROUTES (QUẢN TRỊ VIÊN)
// ==========================================

// Trang đăng nhập
app.get('/admin/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { title: 'Đăng nhập Quản Trị Viên' });
});

app.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      req.flash('error', 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      logger.warn('Failed admin login attempt', { username, ip: req.ip });
      return res.redirect('/admin/login');
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Tên đăng nhập hoặc mật khẩu không chính xác!');
      logger.warn('Failed admin login attempt (invalid password)', { username, ip: req.ip });
      return res.redirect('/admin/login');
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    };

    logger.info('Admin logged in successfully', { username: user.username, ip: req.ip });
    req.flash('success', `Chào mừng ${user.full_name} quay trở lại!`);
    res.redirect('/admin/dashboard');
  } catch (err) {
    logger.error('Error during login', { error: err.message });
    req.flash('error', 'Đã xảy ra lỗi hệ thống khi đăng nhập!');
    res.redirect('/admin/login');
  }
});

// Đăng xuất
app.get('/admin/logout', (req, res) => {
  const username = req.session.user ? req.session.user.username : 'unknown';
  req.session.destroy(() => {
    logger.info('Admin logged out', { username });
    res.redirect('/admin/login');
  });
});

// Dashboard Quản trị
app.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const [[{ total_articles }]] = await pool.query('SELECT COUNT(*) as total_articles FROM articles');
    const [[{ total_categories }]] = await pool.query('SELECT COUNT(*) as total_categories FROM categories');
    const [[{ total_views }]] = await pool.query('SELECT COALESCE(SUM(views), 0) as total_views FROM articles');

    const [recentArticles] = await pool.query(`
      SELECT a.*, c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
      LIMIT 6
    `);

    res.render('admin/dashboard', {
      title: 'Bảng Điều Khiển Quản Trị - Dashboard',
      stats: { total_articles, total_categories, total_views },
      recentArticles
    });
  } catch (err) {
    logger.error('Error loading admin dashboard', { error: err.message });
    res.status(500).render('error', { title: 'Lỗi', message: 'Không thể tải bảng điều khiển.' });
  }
});

// Quản lý danh sách bài viết
app.get('/admin/posts', requireAdmin, async (req, res) => {
  try {
    const [articles] = await pool.query(`
      SELECT a.*, c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY a.created_at DESC
    `);
    res.render('admin/posts', {
      title: 'Quản Lý Bài Viết',
      articles
    });
  } catch (err) {
    logger.error('Error loading posts list', { error: err.message });
    res.status(500).render('error', { title: 'Lỗi', message: 'Không thể tải danh sách bài viết.' });
  }
});

// Tạo bài viết mới
app.get('/admin/posts/new', requireAdmin, async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.render('admin/post-editor', {
      title: 'Đăng Bài Viết Mới',
      article: null,
      categories
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', message: 'Không thể tải form tạo bài viết.' });
  }
});

app.post('/admin/posts/new', requireAdmin, upload.single('image_file'), async (req, res) => {
  try {
    const { title, summary, content, category_id, is_featured, image_url } = req.body;
    let finalImageUrl = image_url || '/images/default-news.jpg';

    if (req.file) {
      finalImageUrl = '/uploads/' + req.file.filename;
    }

    let baseSlug = slugify(title);
    let finalSlug = baseSlug + '-' + Math.floor(Math.random() * 10000);

    await pool.query(`
      INSERT INTO articles (title, slug, summary, content, image_url, category_id, is_featured, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [title, finalSlug, summary, content, finalImageUrl, category_id, is_featured ? 1 : 0]);

    logger.info('Article published successfully', { title, slug: finalSlug, author: req.session.user.username });
    req.flash('success', 'Đăng bài viết mới thành công!');
    res.redirect('/admin/posts');
  } catch (err) {
    logger.error('Error publishing article', { error: err.message });
    req.flash('error', 'Lỗi khi đăng bài: ' + err.message);
    res.redirect('/admin/posts/new');
  }
});

// Chỉnh sửa bài viết
app.get('/admin/posts/edit/:id', requireAdmin, async (req, res) => {
  try {
    const [articleRows] = await pool.query('SELECT * FROM articles WHERE id = ?', [req.params.id]);
    if (articleRows.length === 0) {
      req.flash('error', 'Bài viết không tồn tại!');
      return res.redirect('/admin/posts');
    }
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.render('admin/post-editor', {
      title: 'Chỉnh Sửa Bài Viết',
      article: articleRows[0],
      categories
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', message: 'Không thể tải bài viết để sửa.' });
  }
});

app.post('/admin/posts/edit/:id', requireAdmin, upload.single('image_file'), async (req, res) => {
  try {
    const { title, summary, content, category_id, is_featured, image_url } = req.body;
    const articleId = req.params.id;

    let updateQuery = `
      UPDATE articles
      SET title = ?, summary = ?, content = ?, category_id = ?, is_featured = ?, updated_at = NOW()
    `;
    let queryParams = [title, summary, content, category_id, is_featured ? 1 : 0];

    if (req.file) {
      updateQuery += `, image_url = ? `;
      queryParams.push('/uploads/' + req.file.filename);
    } else if (image_url && image_url.trim()) {
      updateQuery += `, image_url = ? `;
      queryParams.push(image_url.trim());
    }

    updateQuery += ` WHERE id = ?`;
    queryParams.push(articleId);

    await pool.query(updateQuery, queryParams);
    logger.info('Article updated', { articleId, title, editor: req.session.user.username });
    req.flash('success', 'Cập nhật bài viết thành công!');
    res.redirect('/admin/posts');
  } catch (err) {
    logger.error('Error updating article', { error: err.message });
    req.flash('error', 'Lỗi khi cập nhật bài: ' + err.message);
    res.redirect('/admin/posts/edit/' + req.params.id);
  }
});

// Xóa bài viết
app.post('/admin/posts/delete/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
    logger.info('Article deleted', { articleId: req.params.id, admin: req.session.user.username });
    req.flash('success', 'Đã xóa bài viết thành công!');
    res.redirect('/admin/posts');
  } catch (err) {
    logger.error('Error deleting article', { error: err.message });
    req.flash('error', 'Không thể xóa bài viết!');
    res.redirect('/admin/posts');
  }
});

// Quản lý danh mục
app.get('/admin/categories', requireAdmin, async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, COUNT(a.id) as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    res.render('admin/categories', {
      title: 'Quản Lý Danh Mục',
      categories
    });
  } catch (err) {
    res.status(500).render('error', { title: 'Lỗi', message: 'Không thể tải danh mục.' });
  }
});

app.post('/admin/categories/new', requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = slugify(name);
    await pool.query('INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)', [name, slug, description || '']);
    logger.info('Category created', { name, slug });
    req.flash('success', 'Thêm danh mục mới thành công!');
    res.redirect('/admin/categories');
  } catch (err) {
    logger.error('Error adding category', { error: err.message });
    req.flash('error', 'Lỗi thêm danh mục: ' + err.message);
    res.redirect('/admin/categories');
  }
});

app.post('/admin/categories/delete/:id', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
    req.flash('success', 'Đã xóa danh mục!');
    res.redirect('/admin/categories');
  } catch (err) {
    req.flash('error', 'Không thể xóa danh mục đang có bài viết!');
    res.redirect('/admin/categories');
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Không tìm thấy trang',
    message: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.'
  });
});

// Start Server
async function start() {
  await initDBConnection();
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`News Portal Application running on http://0.0.0.0:${PORT}`);
  });
}

start();
