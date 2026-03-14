# 構建階段
FROM node:20-alpine AS builder

WORKDIR /app

# 複製 package.json
COPY package*.json ./
RUN npm install

# 複製原始碼
COPY . .

# 構建
RUN npm run build

# 生產階段
FROM nginx:alpine

# 複製構建結果
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
