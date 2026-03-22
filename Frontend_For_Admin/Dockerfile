# Admin Frontend 使用靜態文件服務
FROM nginx:alpine

# 複製靜態文件
COPY . /usr/share/nginx/html

# 複製 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
