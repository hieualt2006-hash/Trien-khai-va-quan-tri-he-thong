# ĐỒ ÁN TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM (TKQT HTPM K23)
## ĐỀ 19: WEBSITE TIN TỨC / CỔNG THÔNG TIN ĐIỆN TỬ

* **Sinh viên thực hiện:** Bành Trung Hiếu
* **Mã số sinh viên (MSSV):** DTC245160021
* **Lớp:** KHMT K23A
* **Môn học:** Triển khai và Quản trị Hệ thống Phần mềm

---

## 📌 I. GIỚI THIỆU TỔNG QUAN

Dự án triển khai một hệ thống **Cổng thông tin tin tức điện tử** phân tán hoàn chỉnh theo quy chuẩn DevOps & Quản trị hệ thống hiện đại, bao gồm:
1. **Ứng dụng Web Tin tức:** Xây dựng bằng Node.js / Express, giao diện EJS đa phương tiện, hỗ trợ phân loại chuyên mục, tìm kiếm, bài viết nổi bật, trang quản trị CMS đăng/sửa/xóa bài, bảo mật xác thực phiên làm việc.
2. **Cơ sở dữ liệu:** MySQL 8.0 lưu trữ dữ liệu tập trung, tích hợp công cụ quản trị giao diện web **phpMyAdmin**.
3. **Cửa ngõ tiếp nhận (Reverse Proxy):** Nginx Gateway với chứng chỉ bảo mật HTTPS (SSL/TLS tự ký), bảo vệ bằng bộ Security Headers, Rate Limiting và ẩn phiên bản máy chủ.
4. **Hệ thống giám sát chỉ số (Metrics Monitoring):** Prometheus thu thập số liệu từ Web App (`/metrics`), cAdvisor (tài nguyên container), Node Exporter (hệ điều hành host) và MySQL Exporter. Trực quan hóa dữ liệu bằng Grafana Dashboard.
5. **Hệ thống quản lý Log tập trung (Centralized Logging):** Loki kết hợp Promtail thu thập log định dạng JSON từ Nginx và Web App, hỗ trợ truy vấn chuyên sâu bằng ngôn ngữ **LogQL**.
6. **Củng cố an toàn hệ thống (Hardening):** Phân tách mạng ảo Docker (Network Isolation), chạy container dưới quyền người dùng không đặc quyền (Non-root user), đóng cổng cơ sở dữ liệu với bên ngoài, giới hạn tài nguyên CPU/RAM.

---

## 🏗 II. KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE)

```
                            [ USER / CLIENT ]
                                    │
                                (Port 80/443)
                                    ▼
                     +-----------------------------+
                     |    NGINX REVERSE PROXY      |
                     |  (SSL, Security Headers)    |
                     +--------------┬--------------+
                                    │
            ┌───────────────────────┴───────────────────────┐
            │ [frontend_net]                                │ [frontend_net]
            ▼                                               ▼
+───────────────────────────+                 +───────────────────────────+
|     NEWS PORTAL APP       |                 |        PHPMYADMIN         |
|  (Node.js / Express :3000)|                 |      (Web GUI :8080)      |
+───────────┬───────────────+                 +─────────────┬─────────────+
            │                                               │
            │ [backend_net]                                 │ [backend_net]
            └───────────────────────┬───────────────────────┘
                                    ▼
                      +---------------------------+
                      |       MYSQL 8.0           |
                      |  (news_portal_db)         |
                      |  *Không expose port 3306* |
                      +─────────────┬─────────────+
                                    │
                       [monitoring_net] (qua Exporter)
                                    ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      HỆ THỐNG GIÁM SÁT & QUẢN LÝ LOG                   │
 │                                                                        │
 │   [Exporters]                 [Monitoring Core]         [Visualization]│
 │  • Node Exporter (:9100) ───►  PROMETHEUS (:9090) ───►     GRAFANA     │
 │  • cAdvisor (:8080)      ───►        ▲                      (:3000)    │
 │  • MySQL Exporter (:9104)───►        │                         ▲       │
 │  • App /metrics (:3000)  ───►        │                         │       │
 │                                      │                         │       │
 │   [Log Collection]                   │                         │       │
 │  • Promtail ────────────►     LOKI (:3100)  ───────────────────┘       │
 │    (Nginx + App logs)                                                  │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 🔌 III. DANH SÁCH DỊCH VỤ & CỔNG KẾT NỐI (PORT MAPPING)

| STT | Dịch Vụ | Container Name | Cổng Truy Cập (Host) | Mục Đích |
| :---: | :--- | :--- | :---: | :--- |
| **1** | Nginx Reverse Proxy | `news_portal_nginx` | `80`, `443` | Cửa ngõ chính tiếp nhận lưu lượng HTTP/HTTPS |
| **2** | Website Tin tức | `news_portal_app` | *Nội bộ 3000* | Ứng dụng đọc báo & Quản trị CMS |
| **3** | phpMyAdmin | `news_portal_pma` | `8080` (hoặc `/pma/`) | Quản lý cơ sở dữ liệu MySQL qua web |
| **4** | MySQL Database | `news_portal_mysql` | *Nội bộ 3306* | Lưu trữ bài viết, danh mục, tài khoản |
| **5** | Prometheus | `news_portal_prometheus`| `9090` | Thu thập và lưu trữ Metrics |
| **6** | Grafana | `news_portal_grafana` | `3000` | Dashboard trực quan hóa chỉ số & log |
| **7** | Loki | `news_portal_loki` | `3100` | Lưu trữ log tập trung |
| **8** | Promtail | `news_portal_promtail` | *Nội bộ 9080* | Thu thập và đẩy log từ container sang Loki |
| **9** | MySQL Exporter | `news_portal_mysqld_exporter` | *Nội bộ 9104* | Xuất chỉ số truy vấn/kết nối MySQL |
| **10**| cAdvisor | `news_portal_cadvisor` | *Nội bộ 8080* | Đo lường CPU, RAM, Network container |
| **11**| Node Exporter | `news_portal_node_exporter` | *Nội bộ 9100* | Đo lường tải của hệ điều hành máy chủ |

---

## 🔑 IV. THÔNG TIN ĐĂNG NHẬP MẶC ĐỊNH

* **Trang Quản trị CMS Web:**
  * Đường dẫn: `https://localhost/admin/login`
  * Tên đăng nhập: `admin`
  * Mật khẩu: `Admin@2026`
* **phpMyAdmin:**
  * Đường dẫn: `http://localhost:8080` (hoặc `https://localhost/pma/`)
  * Máy chủ (Server): `mysql`
  * Tài khoản: `news_user` (Mật khẩu: `NewsSecure@2026`) hoặc `root` (Mật khẩu: `RootSecurePass@2026`)
* **Grafana Dashboard:**
  * Đường dẫn: `http://localhost:3000`
  * Tài khoản: `admin` / Mật khẩu: `admin` (Đã cấu hình tự động nhận Prometheus & Loki)

---

## 🚀 V. HƯỚNG DẪN KHỞI CHẠY (QUICK START)

### 1. Chuẩn bị trên máy ảo Ubuntu Server
Đảm bảo máy ảo Ubuntu đã cài đặt **Docker** và **Docker Compose**:
```bash
# Kiểm tra Docker
docker --version
docker compose version
```

### 2. Tải mã nguồn về máy
```bash
# Clone hoặc giải nén thư mục dự án
cd "Website tin tức - Cổng thông tin"
```

### 3. Khởi động toàn bộ hệ thống
Chỉ với 01 câu lệnh duy nhất:
```bash
docker compose up -d --build
```

### 4. Kiểm tra trạng thái các container
```bash
docker compose ps
```
*Tất cả 11 containers phải ở trạng thái `running` (Up) hoặc `healthy`.*

### 5. Kiểm tra log khởi động
```bash
# Xem log của Nginx
docker compose logs -f nginx

# Xem log của ứng dụng Web
docker compose logs -f app
```

---

## 📊 VI. TRUY VẤN LOGQL VỚI LOKI TRÊN GRAFANA

Truy cập Grafana tại `http://localhost:3000` ➔ Menu **Explore** ➔ Chọn Datasource **Loki**:

### Query 1: Lọc toàn bộ log truy cập thành công qua Nginx (HTTP Status 200)
```logql
{job="nginx"} | json | status == 200
```

### Query 2: Phát hiện các yêu cầu truy cập khu vực Quản trị hoặc Tìm kiếm
```logql
{job="nginx"} | json | request_uri =~ ".*(admin|search).*"
```

### Query 3: Lọc log nghiệp vụ của ứng dụng Node.js (Các hành động đăng nhập / đăng bài)
```logql
{job="news-portal-app"} | json | level == "info" |~ "(published|logged|Article)"
```

### Query 4: Thống kê tần suất lỗi Client/Server (HTTP >= 400) theo thời gian (Metric Query)
```logql
sum by (status) (count_over_time({job="nginx"} | json | status >= 400 [1m]))
```

---

## 🛡 VII. CÁC BIỆN PHÁP HARDENING ĐÃ ÁP DỤNG

1. **Non-root Container:** Ứng dụng Node.js chạy dưới tài khoản unprivileged `node` (UID 1000), loại bỏ nguy cơ chiếm quyền root máy chủ nếu ứng dụng bị xâm nhập.
2. **Network Segregation (Cô lập mạng):** Chia tách 3 mạng nội bộ `frontend_net`, `backend_net`, `monitoring_net`. Máy chủ MySQL chỉ nằm trong `backend_net`, hoàn toàn không mở cổng ra ngoài Internet/Host.
3. **Nginx Security Hardening:**
   - Ẩn thông tin phiên bản máy chủ (`server_tokens off;`).
   - Kích hoạt HTTPS với TLS 1.2 / TLS 1.3 và bộ ciphers mã hóa an toàn.
   - Thêm các Security Headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Strict-Transport-Security`.
   - Cấu hình Rate Limiting (`limit_req_zone`) chống tấn công vét cạn (brute-force) và từ chối dịch vụ (DDoS).
4. **Phân quyền Cơ sở dữ liệu:** Tạo tài khoản riêng biệt `news_user` chỉ cấp quyền thao tác trên `news_portal_db`, tài khoản riêng `mysqld_exporter` với số kết nối giới hạn cho monitoring.
5. **Giới hạn tài nguyên (Resource Limits):** Thiết lập trần `cpus` và `memory` cho các container trong `docker-compose.yml` để chống cạn kiệt tài nguyên máy chủ.

---

## 📝 VIII. QUY TRÌNH COMMIT GITHUB (3 COMMITS THEO ĐỀ BÀI)

Theo tiêu chí đánh giá của giảng viên, bạn thực hiện commit theo 3 bước sau:

```bash
# Khởi tạo repository Git
git init
git checkout -b main

# -------------------------------------------------------------
# COMMIT 1: Ứng dụng Web Tin tức + MySQL + phpMyAdmin + Nginx Proxy
# -------------------------------------------------------------
git add app/ database/ nginx/
git commit -m "feat(commit-1): Implement News Portal app, MySQL, phpMyAdmin and Nginx reverse proxy with SSL"

# -------------------------------------------------------------
# COMMIT 2: Tích hợp Prometheus + Grafana + Exporters
# -------------------------------------------------------------
git add monitoring/
git commit -m "feat(commit-2): Integrate Prometheus monitoring, Grafana dashboards and system exporters"

# -------------------------------------------------------------
# COMMIT 3: Tích hợp Loki + Promtail + LogQL + Hardening & Docker Compose
# -------------------------------------------------------------
git add logging/ docker-compose.yml README.md BAO_CAO_TKQT_HTPM_DE19.md .gitignore
git commit -m "feat(commit-3): Add centralized logging with Loki and Promtail, security hardening and full stack compose"

# Đẩy lên GitHub cá nhân (đặt tên repo theo MSSV):
# git remote add origin https://github.com/<your_username>/DTC245160021_De19_WebsiteTinTuc.git
# git push -u origin main
```
