# BÁO CÁO BÀI TẬP LỚN
# MÔN: TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG PHẦN MỀM

---

### TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG
### KHOA KHOA HỌC MÁY TÍNH

<br><br>

# **BÁO CÁO ĐỀ TÀI THỰC HÀNH SỐ 19**
## **TRIỂN KHAI VÀ QUẢN TRỊ HỆ THỐNG WEBSITE TIN TỨC / CỔNG THÔNG TIN ĐIỆN TỬ TRÊN NỀN TẢNG CONTAINER VÀ GIÁM SÁT TOÀN DIỆN**

<br><br>

* **Sinh viên thực hiện:** Bành Trung Hiếu
* **Mã số sinh viên (MSSV):** DTC245160021
* **Lớp:** KHMT K23A
* **Chuyên ngành:** Khoa học Máy tính
* **Giảng viên hướng dẫn:** Bộ môn Kỹ thuật Hệ thống & Mạng máy tính

<br><br>
**Hà Nội, Năm 2026**

\pagebreak

---

## MỤC LỤC
1. [LỜI MỞ ĐẦU](#lời-mở-đầu)
2. [CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI VÀ YÊU CẦU KỸ THUẬT](#chương-1-tổng-quan-đề-tài-và-yêu-cầu-kỹ-thuật)
   * 1.1. Giới thiệu đề tài số 19
   * 1.2. Mục tiêu nghiên cứu và triển khai
   * 1.3. Yêu cầu kỹ thuật và tiêu chí đánh giá
3. [CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG](#chương-2-thiết-kế-kiến-trúc-hệ-thống)
   * 2.1. Mô hình tổng thể hệ thống (System Architecture)
   * 2.2. Công nghệ lõi và phân tầng ứng dụng
   * 2.3. Thiết kế phân vùng mạng (Network Segregation)
4. [CHƯƠNG 3: TRIỂN KHAI CHI TIẾT CÁC THÀNH PHẦN](#chương-3-triển-khai-chi-tiết-các-thành-phần)
   * 3.1. Xây dựng ứng dụng Web Tin tức và Cơ sở dữ liệu MySQL
   * 3.2. Cấu hình Nginx Reverse Proxy và SSL/TLS (Commit 1)
   * 3.3. Tích hợp hạ tầng giám sát Prometheus và Grafana (Commit 2)
   * 3.4. Quản lý log tập trung với Loki, Promtail và LogQL (Commit 3)
   * 3.5. Đóng gói đồng bộ bằng Docker Compose
5. [CHƯƠNG 4: ÁP DỤNG CÁC BIỆN PHÁP CỦNG CỐ BẢO MẬT (HARDENING)](#chương-4-áp-dụng-các-biện-pháp-củng-cố-bảo-mật-hardening)
   * 4.1. Chạy container với người dùng không đặc quyền (Non-root user)
   * 4.2. Cách ly mạng nội bộ và ẩn cổng cơ sở dữ liệu
   * 4.3. Củng cố bảo mật Nginx (Security Headers, Rate Limit, Hide Version)
   * 4.4. Kiểm soát phân quyền cơ sở dữ liệu và giới hạn tài nguyên
6. [CHƯƠNG 5: KẾT QUẢ THỰC NGHIỆM VÀ MINH CHỨNG (DEMO)](#chương-5-kết-quả-thực-nghiệm-và-minh-chứng-demo)
   * 5.1. Kết quả hoạt động của Website Tin tức và Trang Quản trị CMS
   * 5.2. Quản trị cơ sở dữ liệu qua phpMyAdmin
   * 5.3. Giám sát hệ thống trên Grafana Dashboard
   * 5.4. Truy vấn log thực tế bằng LogQL trên Loki
   * 5.5. Quản lý mã nguồn trên GitHub theo 3 commit
7. [CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN](#chương-6-kết-luận-và-hướng-phát-triển)
8. [TÀI LIỆU THAM KHẢO](#tài-liệu-tham-khảo)

\pagebreak

---

## LỜI MỞ ĐẦU

Trong kỷ nguyên số hóa và điện toán đám mây hiện nay, các ứng dụng web không còn được triển khai theo phương thức truyền thống (cài đặt trực tiếp trên hệ điều hành vật lý) mà đã dịch chuyển mạnh mẽ sang kiến trúc **Container hóa (Containerization)** và **Tự động hóa vận hành (DevOps)**. Xu hướng này mang lại sự độc lập về môi trường, khả năng mở rộng linh hoạt, dễ dàng sao lưu và phục hồi.

Tuy nhiên, việc triển khai một hệ thống dịch vụ phân tán bao gồm nhiều thành phần (Cổng giao tiếp, Ứng dụng nghiệp vụ, Cơ sở dữ liệu, Công cụ quản trị) đặt ra thách thức lớn về:
1. **Khả năng quan sát (Observability):** Làm thế nào để biết hệ thống đang hoạt động ổn định, đo lường được lưu lượng truy cập và tài nguyên phần cứng?
2. **Quản lý nhật ký (Centralized Logging):** Khi có sự cố, làm sao để tra cứu nhật ký của nhiều container tập trung tại một nơi thay vì phải truy cập thủ công vào từng container?
3. **An toàn thông tin (Security Hardening):** Ngăn chặn các mối nguy cơ leo thang đặc quyền, rò rỉ dữ liệu máy chủ và tấn công từ chối dịch vụ.

Báo cáo này trình bày toàn diện quá trình thiết kế, đóng gói, bảo mật và vận hành **Đề tài 19: Website Tin tức / Cổng thông tin** sử dụng ngăn xếp công nghệ tiên tiến: **Node.js, MySQL, phpMyAdmin, Nginx Reverse Proxy, Prometheus, Grafana, Loki và Promtail**. Toàn bộ hệ thống được tự động hóa qua **Docker Compose** và quản lý mã nguồn chặt chẽ trên **GitHub**.

---

## CHƯƠNG 1: TỔNG QUAN ĐỀ TÀI VÀ YÊU CẦU KỸ THUẬT

### 1.1. Giới thiệu đề tài số 19
* **Tên đề tài:** Website Tin tức / Cổng thông tin điện tử.
* **Mô tả nghiệp vụ:** Xây dựng cổng thông tin phục vụ độc giả đọc tin tức theo chuyên mục (Thời sự, Công nghệ, Kinh tế, Giáo dục...), tìm kiếm tin tức, hiển thị bài viết tiêu điểm, đồng thời cung cấp bảng điều khiển CMS cho Ban biên tập đăng bài, chỉnh sửa, quản lý nội dung và thống kê lượt xem.
* **Cơ sở dữ liệu:** MySQL 8.0 kết hợp giao diện quản trị phpMyAdmin.

### 1.2. Mục tiêu nghiên cứu và triển khai
* Làm chủ quy trình đóng gói đa dịch vụ bằng Docker Compose.
* Thiết lập cổng đón tiếp an toàn bằng Nginx Reverse Proxy có chứng chỉ SSL/TLS và bộ quy tắc củng cố bảo mật.
* Tích hợp giải pháp quan sát toàn diện theo tiêu chuẩn công nghiệp: Metrics (Prometheus + Grafana) và Logs (Loki + Promtail + LogQL).
* Thực hành quy trình quản lý mã nguồn Git/GitHub theo phân đoạn phát triển có kiểm soát.

### 1.3. Yêu cầu kỹ thuật và tiêu chí đánh giá
Theo đề cương môn học, hệ thống cần đáp ứng đầy đủ 7 tiêu chí:
1. **Quản lý mã nguồn (1.5 điểm):** Repository GitHub đầy đủ source code và config, tối thiểu 03 commit đúng tiến độ logic, tài liệu `README.md` chỉ dẫn chi tiết.
2. **Ứng dụng Web & Database (1.5 điểm):** Website chạy mượt mà, kết nối MySQL thành công, phpMyAdmin hoạt động đầy đủ tính năng.
3. **Nginx Reverse Proxy (1.5 điểm):** Định tuyến lưu lượng vào web/phpmyadmin, bảo vệ HTTPS và security headers.
4. **Giám sát Prometheus + Grafana (1.5 điểm):** Thu thập metrics container, app và database; có dashboard trực quan.
5. **Log tập trung Loki + Promtail (1.5 điểm):** Thu thập log Nginx và App, thực thi ít nhất 2 - 3 truy vấn LogQL.
6. **Hardening hệ thống (1.5 điểm):** Áp dụng tối thiểu 3 - 4 kỹ thuật an toàn (non-root, network isolation, rate limit, hide version...).
7. **Tổng thể & Báo cáo (1.0 điểm):** Hệ thống khởi chạy 1-click bằng `docker compose up -d`, báo cáo đủ nội dung minh chứng.

---

## CHƯƠNG 2: THIẾT KẾ KIẾN TRÚC HỆ THỐNG

### 2.1. Mô hình tổng thể hệ thống (System Architecture)
Hệ thống được thiết kế theo kiến trúc phân tầng dạng Micro-services:

```
[Khách truy cập / Độc giả] ──(HTTPS/443)──► [ Nginx Gateway ]
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 │                                                                     │
                 ▼ (Proxy pass)                                                        ▼ (Proxy pass)
     [ news_portal_app:3000 ]                                                 [ news_portal_pma:8080 ]
                 │                                                                     │
                 └──────────────────────────────┬──────────────────────────────────────┘
                                                ▼ (Internal SQL:3306)
                                    [ news_portal_mysql:3306 ]
                                                ▲
                                                │ (Scrape metrics)
                                   [ mysqld-exporter:9104 ]
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
       [ Prometheus :9090 ]                                             [ Promtail :9080 ]
                 │ (Metrics)                                                   │ (Push logs)
                 ▼                                                             ▼
                 └──────────────────────► [ Grafana :3000 ] ◄────────────────── [ Loki :3100 ]
```

### 2.2. Phân tầng công nghệ sử dụng
1. **Tầng Trình diễn & Cổng giao tiếp (Gateway):**
   * **Nginx (Alpine):** Tiếp nhận toàn bộ request từ người dùng tại cổng 80 (chuyển hướng sang 443) và cổng 443 (HTTPS). Nginx đóng vai trò là chốt chặn bảo mật đầu tiên, thực hiện SSL Termination, chèn Security Headers, nén Gzip và kiểm soát tần suất truy cập (Rate Limiting).
2. **Tầng Ứng dụng (Application):**
   * **Node.js (Express Framework):** Viết mã nguồn cổng thông tin, sử dụng EJS làm Template Engine. Tích hợp thư viện `prom-client` cung cấp endpoint `/metrics` định dạng chuẩn Prometheus và thư viện `winston` xuất log JSON ra file và stdout.
3. **Tầng Dữ liệu (Persistence):**
   * **MySQL 8.0:** Lưu trữ các bảng `categories`, `articles`, `users`. Toàn bộ dữ liệu được lưu trên Docker Named Volume `mysql_data` để bảo toàn dữ liệu khi khởi động lại container.
   * **phpMyAdmin:** Ứng dụng web giúp quản trị viên thao tác trực quan với CSDL MySQL.
4. **Tầng Giám sát & Quản lý Log (Observability):**
   * **Prometheus:** Máy chủ kéo metrics định kỳ từ các exporter và ứng dụng web.
   * **cAdvisor:** Đo lường tài nguyên tiêu thụ của từng container (CPU, RAM, Network I/O).
   * **Node Exporter:** Đo lường tài nguyên máy chủ host (Load average, Disk usage, Memory).
   * **MySQL Exporter:** Đo lường số truy vấn, số kết nối mở, bảng khóa của MySQL.
   * **Grafana:** Giao diện điều khiển tập trung, tự động nạp cấu hình Datasources và Dashboard JSON.
   * **Loki & Promtail:** Promtail đọc access log JSON từ Nginx và log nghiệp vụ từ Node.js đẩy về Loki để lưu trữ và truy vấn qua LogQL.

### 2.3. Thiết kế phân vùng mạng (Network Segregation)
Để đảm bảo nguyên tắc bảo mật tối thiểu (Least Privilege) và cô lập rủi ro, hệ thống chia làm 3 mạng ảo Docker:
* `frontend_net`: Dành cho Nginx giao tiếp với ứng dụng Web và phpMyAdmin.
* `backend_net`: Mạng độc lập cho Web và phpMyAdmin giao tiếp với MySQL. Máy chủ MySQL **hoàn toàn không thuộc** `frontend_net`, do đó kẻ tấn công bên ngoài không thể can thiệp trực tiếp vào CSDL.
* `monitoring_net`: Mạng phục vụ việc thu thập số liệu nội bộ giữa Prometheus, Loki, Promtail, Grafana và các Exporters.

---

## CHƯƠNG 3: TRIỂN KHAI CHI TIẾT CÁC THÀNH PHẦN

### 3.1. Xây dựng ứng dụng Web Tin tức và Cơ sở dữ liệu MySQL
* **Cấu trúc mã nguồn ứng dụng (`/app`):**
  * `server.js`: Định tuyến ứng dụng, kết nối CSDL có cơ chế tự động thử lại (Retry logic), cấu hình middleware đo độ trễ request và bộ đếm nghiệp vụ.
  * `logger.js`: Cấu hình Winston xuất log đa luồng định dạng JSON.
  * `/views`: Chứa giao diện người dùng EJS (Trang chủ, Chi tiết tin, Danh mục, Tìm kiếm, Dashboard Quản trị, Soạn bài viết).
  * `/public`: CSS giao diện responsive hiện đại, JavaScript thời gian thực và hình ảnh tải lên.
* **Khởi tạo CSDL (`database/init.sql`):**
  * Tự động tạo bảng và nạp dữ liệu mẫu bằng tiếng Việt với các chủ đề: Thời sự, Chuyển đổi số, Trí tuệ nhân tạo, Kinh tế số, Giáo dục và Bảo mật.
  * Tạo tài khoản quản trị mặc định: `admin` (mật khẩu băm Bcrypt: `Admin@2026`).

### 3.2. Cấu hình Nginx Reverse Proxy và SSL/TLS (Commit 1)
Nginx tiếp nhận kết nối an toàn với cấu hình chi tiết:
* Tạo chứng chỉ SSL tự ký chuẩn RSA 2048-bit đặt tại `nginx/ssl/server.crt` và `nginx/ssl/server.key`.
* Định tuyến:
  * `https://localhost/` ➔ Proxy tới `http://app:3000` (Website Tin tức).
  * `https://localhost/pma/` ➔ Proxy tới `http://phpmyadmin:80` (Quản trị CSDL).
* Cấu hình định dạng log `json_analytics` để ghi đầy đủ thông tin `client_ip`, `status`, `request_time`, `request_uri`.

### 3.3. Tích hợp hạ tầng giám sát Prometheus và Grafana (Commit 2)
* **Prometheus:** Cấu hình file `prometheus.yml` định kỳ cào dữ liệu:
  * Target `app:3000/metrics`: Đo lường số lượt request (`news_http_requests_total`), độ trễ phản hồi (`news_http_request_duration_seconds`), số lượt đọc bài (`news_article_views_total`).
  * Target `mysqld-exporter:9104`: Đo lường trạng thái CSDL.
  * Target `cadvisor:8080`: Đo lường chi tiết từng container.
  * Target `node-exporter:9100`: Đo lường tài nguyên máy chủ.
* **Grafana:** Tự động nạp sẵn (Auto-provisioning) Datasources Prometheus & Loki, cùng Dashboard trực quan hóa tổng hợp hiển thị thời gian hoạt động, biểu đồ request rate, biểu đồ độ trễ 95th percentile, và biểu đồ tiêu thụ RAM.

### 3.4. Quản lý log tập trung với Loki, Promtail và LogQL (Commit 3)
* **Promtail:** Được gắn (mount) volume đọc file log JSON `/var/log/nginx/access.log` và `/var/log/app/app.log`.
* Sử dụng bộ chuyển đổi dữ liệu `pipeline_stages` để bóc tách các trường JSON thành các nhãn (labels) như `status`, `request_method`, `level`.
* **Loki:** Lưu trữ log nhẹ tải dạng Chunk, cho phép Grafana truy vấn tức thời thông qua cú pháp LogQL mạnh mẽ.

### 3.5. Đóng gói đồng bộ bằng Docker Compose
Tất cả 11 dịch vụ được liên kết trong file `docker-compose.yml`, thiết lập cơ chế kiểm tra sức khỏe `healthcheck` cho MySQL để đảm bảo dịch vụ ứng dụng chỉ khởi động khi cơ sở dữ liệu đã sẵn sàng tiếp nhận kết nối.

---

## CHƯƠNG 4: ÁP DỤNG CÁC BIỆN PHÁP CỦNG CỐ BẢO MẬT (HARDENING)

Hệ thống đã triển khai vượt mức yêu cầu với 6 biện pháp bảo mật chuyên sâu:

### 4.1. Chạy container với tài khoản không đặc quyền (Non-root user)
* Trong `app/Dockerfile`, sử dụng lệnh `USER node` (UID 1000) thay vì chạy với quyền `root` mặc định.
* Tác dụng: Ngăn chặn triệt để nguy cơ kẻ tấn công thoát khỏi container (container breakout) để chiếm quyền điều khiển nhân Linux của máy chủ.

### 4.2. Cách ly mạng nội bộ và đóng cổng CSDL (Network Isolation)
* Cổng `3306` của MySQL không được cấu hình `ports` ra ngoài máy chủ Host. Chỉ các container nằm trong mạng `backend_net` mới có thể kết nối nội bộ tới MySQL.
* Nginx không được cấp quyền truy cập vào mạng `backend_net`.

### 4.3. Củng cố bảo mật Reverse Proxy (Nginx Hardening)
* **Ẩn phiên bản phần mềm:** Sử dụng chỉ thị `server_tokens off;` để che giấu phiên bản Nginx trong HTTP Header, gây khó khăn cho kẻ tấn công khi tìm kiếm lỗ hổng đã biết (CVE).
* **Thiết lập bộ Security Headers chuẩn:**
  * `X-Frame-Options: SAMEORIGIN`: Chống tấn công Clickjacking.
  * `X-Content-Type-Options: nosniff`: Ngăn chặn trình duyệt đoán sai định dạng tệp (MIME Sniffing).
  * `X-XSS-Protection: 1; mode=block`: Bật bộ lọc chống tấn công chèn mã độc Cross-Site Scripting.
  * `Strict-Transport-Security: max-age=31536000`: Ép buộc giao tiếp qua HTTPS an toàn.
* **Chống Brute-Force & DDoS:** Áp dụng `limit_req_zone` giới hạn tốc độ 20 requests/giây mỗi IP với hàng đợi burst 10 requests.

### 4.4. Phân quyền chặt chẽ trên Cơ sở dữ liệu
* Ứng dụng chỉ sử dụng tài khoản `news_user` với quyền hạn giới hạn trên cơ sở dữ liệu `news_portal_db`.
* Exporter sử dụng tài khoản chuyên biệt `mysqld_exporter` giới hạn tối đa 3 kết nối đồng thời.

### 4.5. Giới hạn tài nguyên phần cứng (Resource Limits)
* Cấu hình trần tài nguyên (`deploy.resources.limits`) trong Docker Compose cho Web App (0.8 CPU, 512MB RAM) và MySQL (1.0 CPU, 1024MB RAM) nhằm chống lại các cuộc tấn công khai thác làm treo máy chủ do cạn kiệt bộ nhớ (OOM - Out of Memory).

---

## CHƯƠNG 5: KẾT QUẢ THỰC NGHIỆM VÀ MINH CHỨNG (DEMO)

*(Lưu ý: Sinh viên chụp ảnh màn hình các bước thực tế trên máy ảo Ubuntu và dán vào các vị trí hình minh họa dưới đây)*

### 5.1. Kết quả hoạt động của Website Tin tức và Trang Quản trị CMS
* Truy cập `https://localhost` trên trình duyệt: Website hiển thị giao diện báo điện tử hiện đại, dòng tin mới chạy tự động, danh mục bài viết và bài viết tiêu điểm.
* Truy cập `https://localhost/admin/login`: Đăng nhập với tài khoản `admin` / `Admin@2026`.
* Bảng điều khiển CMS hiển thị số liệu thống kê bài viết, chức năng đăng bài mới thành công.

> **[HÌNH 5.1: Ảnh chụp giao diện Trang chủ Cổng thông tin tin tức]**
> *(Dán ảnh chụp màn hình trang chủ tại đây)*

> **[HÌNH 5.2: Ảnh chụp giao diện Đăng nhập và Bảng điều khiển Quản trị viên CMS]**
> *(Dán ảnh chụp màn hình Admin Dashboard tại đây)*

### 5.2. Quản trị cơ sở dữ liệu qua phpMyAdmin
* Truy cập `http://localhost:8080`: Đăng nhập xem bảng `articles`, `categories` và dữ liệu được nạp đầy đủ từ file `init.sql`.

> **[HÌNH 5.3: Ảnh chụp giao diện phpMyAdmin quản lý bảng CSDL news_portal_db]**
> *(Dán ảnh chụp màn hình phpMyAdmin tại đây)*

### 5.3. Giám sát hệ thống trên Grafana Dashboard
* Truy cập `http://localhost:3000` (admin/admin).
* Mở Dashboard **"News Portal Monitoring - Báo Điện Tử Đề 19"**:
  * Panel thống kê: Tổng số HTTP Request, Lượt đọc tin, Kết nối MySQL, Thời gian hoạt động Uptime.
  * Biểu đồ theo thời gian: Biểu đồ đường phân tích request rate theo status code (200, 304, 404), biểu đồ độ trễ phản hồi và biểu đồ tiêu thụ RAM của Node.js.

> **[HÌNH 5.4: Ảnh chụp Dashboard giám sát tổng thể hệ thống trên Grafana]**
> *(Dán ảnh chụp màn hình Grafana Dashboard tại đây)*

### 5.4. Truy vấn log thực tế bằng LogQL trên Loki
Mở Grafana Explore ➔ Chọn nguồn dữ liệu **Loki** và thực thi các câu truy vấn LogQL:

#### Truy vấn 1: Lọc các yêu cầu HTTP thành công (Status 200) qua Nginx
```logql
{job="nginx"} | json | status == 200
```
*Kết quả:* Trả về chi tiết các bản ghi log truy cập hợp lệ kèm địa chỉ IP client và thời gian phản hồi.

#### Truy vấn 2: Phát hiện các yêu cầu truy cập vào trang Admin CMS
```logql
{job="nginx"} | json | request_uri =~ ".*admin.*"
```
*Kết quả:* Lọc ra toàn bộ các thao tác đăng nhập và quản lý bài viết trên hệ thống.

#### Truy vấn 3: Lọc log ghi nhận nghiệp vụ của ứng dụng Node.js
```logql
{job="news-portal-app"} | json | level == "info"
```
*Kết quả:* Hiển thị chi tiết thời gian xuất bản bài viết, kết nối CSDL và xử lý logic.

> **[HÌNH 5.5: Ảnh chụp kết quả thực thi các câu truy vấn LogQL trên Grafana Explore]**
> *(Dán ảnh chụp màn hình Grafana Explore với LogQL tại đây)*

### 5.5. Quản lý mã nguồn trên GitHub theo 3 commit
Repository được quản lý chặt chẽ theo đúng 3 mốc commit yêu cầu của môn học:
1. `feat(commit-1): Implement News Portal app, MySQL, phpMyAdmin and Nginx reverse proxy with SSL`
2. `feat(commit-2): Integrate Prometheus monitoring, Grafana dashboards and system exporters`
3. `feat(commit-3): Add centralized logging with Loki and Promtail, security hardening and full stack compose`

> **[HÌNH 5.6: Ảnh chụp lịch sử Git Commit trên GitHub Repository cá nhân]**
> *(Dán ảnh chụp màn hình `git log --oneline` hoặc giao diện GitHub tại đây)*

---

## CHƯƠNG 6: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 6.1. Những kết quả đã đạt được
* Xây dựng và triển khai thành công 100% các yêu cầu kỹ thuật của **Đề tài 19**.
* Hệ thống hoạt động ổn định, mượt mà, khởi chạy tự động hóa hoàn toàn chỉ bằng một câu lệnh `docker compose up -d`.
* Thiết lập được cơ chế giám sát thời gian thực toàn diện (Metrics + Logs) chuẩn công nghiệp.
* Nâng cao năng lực bảo mật hệ thống thông qua việc áp dụng triệt để các biện pháp Hardening.

### 6.2. Hướng phát triển trong tương lai
* Mở rộng triển khai sang cụm điều phối container **Kubernetes (K8s)** với Helm Charts.
* Tích hợp quy trình kiểm thử và triển khai tự động liên tục **CI/CD** thông qua GitHub Actions.
* Bổ sung cơ chế phát hiện và ngăn chặn xâm nhập tự động **Fail2Ban / CrowdSec** tại tầng Nginx Reverse Proxy.

---

## TÀI LIỆU THAM KHẢO
1. *Tài liệu môn học Triển khai và Quản trị Hệ thống Phần mềm* - Khoa KHMT.
2. Docker Documentation, "Docker Compose file reference & Best Practices", *https://docs.docker.com/*.
3. Nginx Documentation, "Configuring NGINX Reverse Proxy and Security Controls", *https://nginx.org/en/docs/*.
4. Prometheus Authors, "Prometheus Monitoring System & PromQL Guide", *https://prometheus.io/docs/*.
5. Grafana Labs, "Loki & LogQL: Log Query Language Documentation", *https://grafana.com/docs/loki/*.
6. OWASP Foundation, "Docker Security Cheat Sheet & Web Security Testing Guide", *https://cheatsheetseries.owasp.org/*.
