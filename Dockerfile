# 容器构建命令示例
# docker build -t tti4md:latest ./
# docker run -d --name tti4md -p 4000:3000 tti4md:latest
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
