# Sử dụng Node.js bản nhẹ (Alpine)
FROM node:4-alpine

# Tạo thư mục làm việc
WORKDIR /app

# Copy file package để cài thư viện trước (tối ưu cache)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ code vào
COPY . .

# Build TypeScript sang JavaScript (đảm bảo bạn có script "build" trong package.json)
RUN npm run build

# Mở port (ví dụ app chạy port 3000)
EXPOSE 8000

# Chạy ứng dụng (đảm bảo script "start" chạy file trong thư mục dist, vd: node dist/index.js)
CMD ["npm", "start"]