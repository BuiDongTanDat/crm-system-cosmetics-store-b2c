# Hướng dẫn Triển khai (Deployment Guide)

Tài liệu này hướng dẫn chi tiết các bước triển khai ứng dụng CRM lên VPS (Ubuntu 22.04 LTS) sử dụng Docker Compose và Nginx.

## 1. Chuẩn bị VPS

SSH vào VPS của bạn:
```bash
ssh root@<YOUR_VPS_IP>
```

Cập nhật hệ thống:
```bash
apt update && apt upgrade -y
```

Cài đặt Docker & Docker Compose:
```bash
curl -fsSL https://get.docker.com | sh
```

Kiểm tra cài đặt:
```bash
docker --version
docker compose version
```

## 2. Cấu trúc thư mục trên VPS

Tạo thư mục dự án trên VPS:
```bash
mkdir -p /opt/crm/nginx
mkdir -p /opt/crm/backend
mkdir -p /opt/crm/ai-service
mkdir -p /opt/crm/frontend/dist
```

## 3. Upload Code & Config

Từ máy cá nhân của bạn, thực hiện các bước sau:

### 3.1 Build Frontend
Di chuyển vào thư mục Frontend và build:
```powershell
cd Frontend
npm run build
```
*(Kết quả build sẽ nằm trong thư mục `Frontend/dist`)*

### 3.2 Upload file lên VPS
Sử dụng `scp` để đẩy file từ máy local lên VPS (thay `<IP>` bằng IP của VPS):

**Upload cấu hình Docker & Nginx:**
```powershell
# Tại thư mục gốc dự án (d:\IT_Project)
scp docker-compose.prod.yaml root@<IP>:/opt/crm/docker-compose.yaml
scp nginx/default.conf root@<IP>:/opt/crm/nginx/default.conf
```

**Upload Backend & AI Service Code:**
*(Lưu ý: Để tiết kiệm thời gian, bạn có thể zip code lại trước khi upload hoặc dùng git clone trên VPS. Cách dưới đây là copy file trực tiếp)*

```powershell
# Copy Backend Environment
scp Backend/.env.prod root@<IP>:/opt/crm/backend/.env.prod

# Copy AI Service Environment
scp ai-service/.env.prod root@<IP>:/opt/crm/ai-service/.env.prod
```

> **Làm thế nào để đưa code Backend/AI lên?**
> Cách tốt nhất là bạn push code lên GitHub/GitLab, sau đó SSH vào VPS và clone về.
> Nếu không dùng Git, bạn cần copy cả thư mục Backend và ai-service (trừ node_modules, venv) lên VPS:
> `scp -r Backend root@<IP>:/opt/crm/`
> `scp -r ai-service root@<IP>:/opt/crm/`

**Upload Frontend Build:**
```powershell
scp -r Frontend/dist/* root@<IP>:/opt/crm/frontend/dist/
```

## 4. Cấu hình DNS

Trỏ domain của bạn (ví dụ: `crm.example.com`) về IP của VPS.

| Type | Name | Value |
|Ref | :--- | :--- |
| A | crm | <YOUR_VPS_IP> |

## 5. Chạy ứng dụng

SSH vào VPS và khởi động:

```bash
cd /opt/crm
docker compose up -d --build
```

Kiểm tra logs nếu cần:
```bash
docker compose logs -f
```

## 6. Thiết lập HTTPS (SSL Let's Encrypt)

Cài đặt Certbot:
```bash
apt install certbot python3-certbot-nginx -y
```

Lấy chứng chỉ SSL:
```bash
# Thay crm.example.com bằng domain thật của bạn
certbot --nginx -d crm.example.com
```
*Làm theo hướng dẫn trên màn hình để hoàn tất.*

Sau khi cài xong SSL, Certbot sẽ tự động sửa file nginx config trên VPS. Bạn cần reload nginx (hoặc restart container nginx):
```bash
docker compose restart nginx
```

## 7. Hoàn tất
Truy cập: `https://crm.example.com`

---
**Lưu ý:**
- File `.env.prod` chứa thông tin nhạy cảm, hãy cập nhật mật khẩu DB và các secret key trên VPS.
- Đảm bảo Security Group (Firewall) của VPS mở port 80, 443 và 22.
