# ========= BACKEND (Node.js, JavaScript thuần) =========
FROM node:20-alpine

# Cài ffmpeg và curl trên Alpine
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 5000

CMD  npm run dev

