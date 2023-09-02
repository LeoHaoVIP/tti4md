# 容器构建命令示例
# docker build -t tti4md:latest ./
# docker run -d --name tti4md -p 4000:3000 tti4md:latest
FROM node:alpine
MAINTAINER	WenhaoZhao<zhaowenhao2867@outlook.com>

#安装依赖
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont nodejs

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV RESOURCES_PATH /usr/local/tti4md

WORKDIR $RESOURCES_PATH
# 复制资源文件
COPY . $RESOURCES_PATH

RUN npm install -d

#健康监测
HEALTHCHECK --interval=5m --timeout=10s --start-period=3m --retries=3 \
  CMD curl -sS --insecure https://127.0.0.1:3000

# 容器启动命令
ENTRYPOINT ["sh", "./entrypoint.sh"]

EXPOSE 3000
