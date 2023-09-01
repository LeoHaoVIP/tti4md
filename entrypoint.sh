#!/bin/bash
#设置npm镜像源
npm config set registry https://registry.npm.taobao.org

#安装依赖
npm install
#启动服务
npm run serve
