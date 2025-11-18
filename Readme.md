CRM System (Node.js + React + PostgreSQL + RabbitMQ + AI/LLM)
Chạy toàn bộ hệ thống bằng Docker Compose (dev mode: hot reload cho backend/frontend, healthcheck cho Postgres & RabbitMQ).

# 1) Yêu cầu
* Docker 
* Docker Compose
* (Tùy chọn) make, curl

# 2) Cấu hình môi trường
Tạo các file .env bên trong từng service như sau:

## Backend/.env

**Postgres**
* POSTGRES_USER=postgres
* POSTGRES_PASSWORD=postgres
* POSTGRES_DB=crm
* POSTGRES_HOST=db
* POSTGRES_PORT=5432

**Sequelize (nếu dùng URL)**
* DATABASE_URL=postgres://postgres:postgres@db:5432/crm

**RabbitMQ**
* RABBITMQ_URL=amqp://guest:guest@rabbit:5672

**App**
* PORT=5000
* NODE_ENV=development
* JWT_SECRET=change_me

**AI service (nếu backend cần gọi thẳng REST)**
* AI_SERVICE_URL=http://ai-service:8000
* ai-service/.env

**RabbitMQ để nhận job / trả kết quả**
* RABBITMQ_URL=amqp://guest:guest@rabbit:5672

**LLM**
* OPENAI_API_KEY=sk-...           
* MODEL_PATH=/app/model  

**App**
PORT=8000
* Frontend/.env

**Vite**
* VITE_API_URL=http://localhost:5000
* Lưu ý: db, backend, ai-service, rabbit là service name trong compose, dùng được như hostname giữa các container.

# 3) Chạy dự án
**Lần đầu hoặc khi đổi Dockerfile**
* docker compose build

**Chạy toàn bộ stack**
* docker compose up -d

**Đợi healthchecks xong (Postgres & RabbitMQ). Xem log nhanh:**
* docker compose logs -f db
* docker compose logs -f rabbit
* docker compose logs -f backend
* docker compose logs -f ai-service
* docker compose logs -f frontend

# 4) Migration & seed (Sequelize)
Sau khi db healthy và backend đã chạy:
* Vào container backend: docker exec -it crm_backend sh
* Trong container: npx sequelize db:migrate
* Tùy chọn: 
    * npx sequelize db:seed:all
    * exit

# 5) Các cổng & URL kiểm thử nhanh
* Frontend (Vite dev): http://localhost:5173
* Backend API (Express): http://localhost:5000
* (Tùy chọn) Healthcheck gợi ý: GET /healthz
* AI Service (FastAPI + Uvicorn): http://localhost:8000
* Tài liệu Swagger: http://localhost:8000/docs
* PostgreSQL: localhost:5432 (user/pass lấy trong Backend/.env)
* RabbitMQ Management UI: http://localhost:15672
 (guest/guest)
* pgAdmin (nếu bật): http://localhost:5050
 (admin@example.com
 / admin123)

# 6) Phát triển hằng ngày
**Hot reload:**
* Backend: npm run dev (được chạy sẵn trong container).
* Frontend: Vite dev server (npm run dev) với --host 0.0.0.0, đã cấu hình trong compose.
* Volumes: Đã mount thư mục ./Backend và ./Frontend vào container để tự reload khi sửa code.
* Windows/WSL: Đã bật CHOKIDAR_USEPOLLING và WATCHPACK_POLLING cho Vite để theo dõi file ổn định trong Docker.

# 7) Dừng & dọn dẹp
* Dừng container: **docker compose down**
* Dừng & xoá volume (xoá dữ liệu DB!): **docker compose down -v**

# 8) Troubleshooting nhanh
* Backend không kết nối DB
* Kiểm tra db healthy: docker compose ps (cột STATUS)
* Xem log Postgres: docker compose logs -f db
* Đảm bảo DATABASE_URL hoặc biến POSTGRES_* đúng.
* Frontend gọi API bị CORS/URL sai
* Kiểm tra Frontend/.env → VITE_API_URL=http://localhost:5000
* Đổi cổng nếu backend đổi.
* RabbitMQ không sẵn sàng
* Vào http://localhost:15672
 (guest/guest)
* Xem docker compose logs -f rabbit
* AI service không chạy
* Kiểm tra ai-service/.env (RabbitMQ URL, key)
* Mở http://localhost:8000/docs
xem swagger.
