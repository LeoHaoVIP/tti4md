# 容器构建命令示例
# docker run -d --name meeting-frontend -p 4000:80 -e BACKEND_IP="www.leohao.cn" -e BACKEND_PORT="5000" -e COTURN_IP="120.26.96.136" -e COTURN_PORT="3478" -e COTURN_USERNAME="kurento" -e COTURN_PASSWORD="kurento" meeting-frontend:latest
FROM node:16.18.0-slim
MAINTAINER	WenhaoZhao<zhaowenhao2867@outlook.com>

# 构建参数 - 后端服务地址、COTURN 服务器地址、COTURN 服务器身份验证信息
ENV RESOURCES_PATH /usr/local/tti4md

WORKDIR $RESOURCES_PATH
# 复制资源文件
COPY . $RESOURCES_PATH

#健康监测
HEALTHCHECK --interval=5m --timeout=10s --start-period=3m --retries=3 \
  CMD curl -sS --insecure https://127.0.0.1:3000

# 容器启动命令
ENTRYPOINT ["sh", "./entrypoint.sh"]

EXPOSE 3000
