# ======= FRONTEND DEV MODE =======
FROM node:20-alpine

WORKDIR /app

# Copy package.json + lockfile trước
COPY package*.json ./

# Cài deps
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# Chạy Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
