# Hướng dẫn Triển khai Local (Cloudflare Tunnel)

Cách này giúp bạn chạy web trên máy tính cá nhân nhưng người khác vẫn truy cập được qua Internet (có HTTPS).

## 1. Chuẩn bị

1.  Đảm bảo bạn đã cài **Docker Desktop** trên Windows.
2.  Bật Docker Desktop lên.

## 2. Config IP (Quan trọng)

Vì bạn chạy local, Cloudflare Tunnel sẽ cấp cho bạn một domain ngẫu nhiên (ví dụ `https://super-cool-app.trycloudflare.com`).

Bạn cần sửa file `Backend/.env.prod` để BE chấp nhận domain này (hoặc chấp nhận tất cả).
Mở file `Backend/.env.prod` và sửa dòng `CORS_ORIGIN`:

```bash
# Cho phép tất cả domain truy cập (vì domain Cloudflare đổi liên tục mỗi lần chạy lại)
CORS_ORIGIN=*
```
## 3. Build & Chạy

Mở Terminal (PowerShell) tại thư mục dự án `d:\IT_Project`:

**Bước 1: Build Frontend**
```powershell
cd Frontend
npm run build
cd ..
```

**Bước 2: Khởi chạy Server**
```powershell
docker compose -f docker-compose.prod.yaml up -d --build
```
*(Chờ một lúc để nó tải image và build BE/AI)*
## 4. Lấy Link Public
Sau khi chạy xong, bạn cần xem logs của `tunnel` để lấy link.
```powershell
docker compose -f docker-compose.prod.yaml logs -f tunnel
```
Tìm trong đống logs dòng có chữ:
`+--------------------------------------------------------------------------------------------+`
`|  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |`
`|  https://xxxx-xxxx-xxxx-xxxx.trycloudflare.com                                             |`
`+--------------------------------------------------------------------------------------------+`
Copy cái link `https://...trycloudflare.com` đó gửi cho bạn bè/giáo viên.
## 5. Lưu ý
-   Link này sẽ **ĐỔI** mỗi khi bạn tắt đi bật lại container `tunnel`.
-   Máy tính của bạn phải **luôn bật** thì web mới vào được.
-   Khi tắt máy, nhớ Stop docker:
    ```powershell
    docker compose -f docker-compose.prod.yaml down
    ```
