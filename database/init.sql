-- ========================================================
-- DE 19: WEBSITE TIN TUC / CONG THONG TIN
-- DATABASE INITIALIZATION SCRIPT (MySQL 8.0)
-- ========================================================

CREATE DATABASE IF NOT EXISTS news_portal_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE news_portal_db;

-- 1. BANG NGUOI DUNG (USERS)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BANG CHUYEN MUC (CATEGORIES)
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BANG BAI VIET (ARTICLES)
CREATE TABLE IF NOT EXISTS articles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  summary TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  image_url VARCHAR(500) DEFAULT '/images/default-news.jpg',
  category_id INT NOT NULL,
  views INT DEFAULT 0,
  is_featured TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. HARDENING: TAO USER DUNG CHO MYSQL EXPORTER (MONITORING)
CREATE USER IF NOT EXISTS 'mysqld_exporter'@'%' IDENTIFIED BY 'ExporterSecure@2026' WITH MAX_USER_CONNECTIONS 3;
GRANT PROCESS, REPLICATION CLIENT, SELECT ON *.* TO 'mysqld_exporter'@'%';
FLUSH PRIVILEGES;

-- ========================================================
-- DỮ LIỆU MẪU (SEED DATA)
-- ========================================================

-- Insert Admin Account (Password: Admin@2026)
INSERT INTO users (username, password_hash, full_name, role) VALUES 
('admin', '$2a$10$1LqV79BMS1E4vr95MBVe.OxEd4hWV7tvPvYe.WSYN.LaghjQqB7d.', 'Quản Trị Viên Hệ Thống', 'admin')
ON DUPLICATE KEY UPDATE full_name='Quản Trị Viên Hệ Thống';

-- Insert Categories
INSERT INTO categories (id, name, slug, description) VALUES
(1, 'Thời Sự', 'thoi-su', 'Tin tức chính trị, xã hội, sự kiện nổi bật trong nước và quốc tế'),
(2, 'Công Nghệ & AI', 'cong-nghe', 'Xu hướng trí tuệ nhân tạo, chuyển đổi số, phần mềm và an toàn thông tin'),
(3, 'Kinh Tế', 'kinh-te', 'Tài chính, thị trường chứng khoán, bất động sản và doanh nghiệp'),
(4, 'Đời Sống & Văn Hóa', 'doi-song', 'Văn hóa, du lịch, đời sống đô thị và phong cách sống'),
(5, 'Giáo Dục', 'giao-duc', 'Tin tức tuyển sinh, công nghệ giáo dục, đào tạo đại học và học thuật')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Sample Articles
INSERT INTO articles (title, slug, summary, content, image_url, category_id, views, is_featured, created_at) VALUES
(
  'Việt Nam Đẩy Mạnh Chuyển Đổi Số Quốc Gia Và Ứng Dụng Hạ Tầng Đám Mây Hiện Đại',
  'viet-nam-day-manh-chuyen-doi-so-quoc-gia-va-ung-dung-dam-may-1001',
  'Chính phủ tiếp tục ưu tiên phát triển hạ tầng số, an toàn thông tin và triển khai các hệ thống dịch vụ công hiện đại trên toàn quốc.',
  'Tại hội nghị Chuyển đổi số quốc gia vừa diễn ra, các chuyên gia công nghệ đã thảo luận sâu rộng về việc chuẩn hóa hạ tầng dữ liệu và ứng dụng kiến trúc Microservices, Containerization để tối ưu hóa hiệu năng phục vụ người dân.\n\nViệc làm chủ công nghệ nguồn, áp dụng quy trình kiểm thử và tự động hóa triển khai (DevOps/CI-CD) được xem là chìa khóa để bảo vệ chủ quyền dữ liệu số quốc gia. Hệ thống cổng thông tin công dân và báo điện tử được nâng cấp để đảm bảo tính sẵn sàng cao, chịu tải hàng triệu lượt truy cập đồng thời.',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80',
  1, 1420, 1, NOW() - INTERVAL 2 DAY
),
(
  'Trí Tuệ Nhân Tạo Sinh Thành (GenAI) Cách Mạng Hóa Ngành Phát Triển Phần Mềm',
  'genai-cach-mang-hoa-nganh-phat-trien-phan-mem-1002',
  'Các công cụ hỗ trợ lập trình bằng AI đang thay đổi căn bản cách các kỹ sư công nghệ thiết kế, kiểm thử và vận hành hệ thống phần mềm.',
  'Làn sóng trí tuệ nhân tạo sinh thành tiếp tục bùng nổ mạnh mẽ trong năm 2026. Thay vì chỉ tự động sinh code cơ bản, AI ngày nay tham gia sâu vào việc rà soát lỗ hổng bảo mật, tối ưu hóa các tệp cấu hình triển khai Docker Compose, Kubernetes và hỗ trợ giám sát hệ thống phân tán theo thời gian thực.\n\nCác doanh nghiệp công nghệ hàng đầu tại Việt Nam đang tích cực đào tạo đội ngũ nhân lực làm chủ các kỹ năng mới, kết hợp tư duy hệ thống vững chắc với năng lực khai thác các mô hình ngôn ngữ lớn để tăng gấp đôi năng suất phát triển sản phẩm.',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1000&q=80',
  2, 2890, 1, NOW() - INTERVAL 1 DAY
),
(
  'Xu Hướng Triển Khai Giám Sát Toàn Diện Với Prometheus, Grafana Và Loki',
  'xu-huong-trien-khai-giam-sat-toan-dien-prometheus-grafana-loki-1003',
  'Mô hình giám sát thống nhất giữa Metrics và Logs đang trở thành tiêu chuẩn vàng trong quản trị hệ thống hiện đại.',
  'Trong bối cảnh các ứng dụng ngày càng phân tán, việc phát hiện sự cố chỉ thông qua log truyền thống là chưa đủ. Sự kết hợp giữa bộ ba Prometheus (thu thập chỉ số định lượng), Grafana (trực quan hóa biểu đồ trực quan) và Loki (quản lý log tập trung nhẹ tải) mang lại khả năng quan sát (Observability) toàn diện.\n\nNhờ ngôn ngữ truy vấn LogQL linh hoạt, các kỹ sư DevOps có thể lọc chính xác các lỗi HTTP 5xx, lần theo vết lỗi ngay từ biểu đồ metrics sang dòng log chi tiết chỉ trong vài cú click chuột.',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
  2, 1945, 1, NOW() - INTERVAL 12 HOUR
),
(
  'Thị Trường Công Nghệ Và Kinh Tế Số Việt Nam Dự Báo Đạt 50 Tỷ USD',
  'thi-truong-cong-nghe-va-kinh-te-so-viet-nam-du-bao-50-ty-usd-1004',
  'Các ngành kinh tế trực tuyến, thương mại điện tử và dịch vụ số tiếp tục duy trì mức tăng trưởng ấn tượng.',
  'Báo cáo mới nhất từ các tổ chức kinh tế quốc tế chỉ ra rằng Việt Nam tiếp tục là một trong những nền kinh tế số tăng trưởng nhanh nhất khu vực Đông Nam Á. Sự đầu tư mạnh mẽ vào các trung tâm dữ liệu tiêu chuẩn quốc tế (Tier 3, Tier 4) và hạ tầng mạng tốc độ cao đã tạo đòn bẩy cho hàng nghìn doanh nghiệp bứt phá.',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80',
  3, 870, 0, NOW() - INTERVAL 1 DAY
),
(
  'Đổi Mới Phương Pháp Giảng Dạy Đại Học Gắn Liền Thực Hành DevOps Thực Chiến',
  'doi-moi-phuong-phap-giang-day-dai-hoc-devops-thuc-chien-1005',
  'Các trường đại học công nghệ tích hợp dự án thực tế về Docker, Nginx, bảo mật Linux và hệ thống giám sát vào chương trình đào tạo.',
  'Sinh viên ngành Khoa học máy tính và Kỹ thuật phần mềm ngày nay không chỉ học lý thuyết lập trình mà còn được trực tiếp thực hành thiết kế, triển khai và củng cố bảo mật (hardening) cho các hệ thống phần mềm hoàn chỉnh.\n\nThông qua các bài tập lớn mô phỏng môi trường sản xuất thực tế, sinh viên rèn luyện tư duy tự động hóa, làm việc nhóm qua Git/GitHub và thành thạo các công cụ giám sát chuẩn doanh nghiệp.',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=80',
  5, 1150, 0, NOW() - INTERVAL 3 DAY
),
(
  'Nâng Cao An Toàn Thông Tin: Củng Cố Bảo Mật Máy Chủ Web Và Docker Container',
  'nang-cao-an-toan-thong-tin-cung-co-bao-mat-web-docker-1006',
  'Hướng dẫn các biện pháp Hardening cốt lõi: Non-root user, phân tách Network, bảo vệ Nginx và kiểm soát quyền truy cập.',
  'Bảo mật không phải là một tính năng phụ mà phải được tích hợp ngay từ khâu thiết kế (Security by Design). Việc chạy container dưới quyền root tiềm ẩn nguy cơ leo thang đặc quyền nghiêm trọng. Các chuyên gia an ninh mạng khuyến nghị phân tách rõ ràng các phân vùng mạng (network isolation), thiết lập security headers trên Reverse Proxy và thường xuyên rà soát mã nguồn.',
  'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80',
  2, 2300, 1, NOW() - INTERVAL 6 HOUR
)
ON DUPLICATE KEY UPDATE title=VALUES(title);
