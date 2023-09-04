<h3 align="center">动态网页文本转图片工具</h3>
<h3 align="center">tti4md: A dynamic text-to-image tool for markdown</h3>

---

## 目标和应用场景

概括：tti4md 是一款用于动态提取网页元素信息并展示为图片的工具

有时我们希望在网页或 README 文档中以图片的形式展示动态信息（数值、文本等），例如我们可以通过 [img.shields.io](https://img.shields.io) 提供的接口动态获取指定 NPM 包的使用量以及最新版本号。

| NPM 包名                  | 下载量                                                       | 最新版本号                                                   |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| hexo-theme-yoga           | ![downloads](https://img.shields.io/npm/dt/hexo-theme-yoga)  | ![version](https://img.shields.io/npm/v/hexo-theme-yoga)     |
| kurento-utils-universal   | ![downloads](https://img.shields.io/npm/dt/kurento-utils-universal) | ![version](https://img.shields.io/npm/v/kurento-utils-universal) |
| hexo-blog-encrypt-another | ![downloads](https://img.shields.io/npm/dt/hexo-blog-encrypt-another) | ![version](https://img.shields.io/npm/v/hexo-blog-encrypt-another) |

除此之外，[img.shields.io](https://img.shields.io) 还提供了解析 API 接口响应数据的能力，支持处理 [JSON](https://shields.io/badges/dynamic-json-badge)、[XML](https://shields.io/badges/dynamic-xml-badge)、[YAML](https://shields.io/badges/dynamic-yaml-badge) 等数据格式。例如，[接口](https://api.bilibili.com/x/web-interface/nav)将返回格式为 JSON 的数据，内容如下：

```json
{
    "code": -101,
    "message": "账号未登录",
    "ttl": 1,
    "data": {
        "isLogin": false,
        "wbi_img": {
            "img_url": "https://i0.hdslb.com/bfs/wbi/7cd084941338484aae1ad9425b84077c.png",
            "sub_url": "https://i0.hdslb.com/bfs/wbi/4932caff0ff746eab6f01bf08b70ac45.png"
        }
    }
}
```

此时可以动态获取`message` 字段的内容：![](https://img.shields.io/badge/dynamic/yaml?url=https%3A%2F%2Fapi.bilibili.com%2Fx%2Fweb-interface%2Fnav&query=%24.message&label=message)

然而，很多网站或服务并未提供公开稳定可用的 API 信息查询接口，无法通过以上方式处理响应数据。针对该问题，tti4md 基于 Puppeteer 和 img.shields.io 实现了网页内容的动态解析，支持使用者通过传递 url 和 selector 的方式获取指定元素内容。

## 安装说明

> Use `sudo ` if required

### Docker 启动

```shell
git clone https://github.com/LeoHaoVIP/tti4md.git
cd ./tti4md
docker build -t tti4md:latest ./
docker run -d --name tti4md -p 3000:3000 tti4md:latest
```

### 本地启动

```shell
git clone https://github.com/LeoHaoVIP/tti4md.git
cd ./tti4md
npm install
npm run serve
```

## 接口文档

> 说明：selector 字段需要经过 URL Encode 处理，在线转码工具：https://www.urlencoder.io/

接口路径：`/api`

| 参数名   | 参数含义             | 数据类型 | 是否可选                         | 备注                                                         |
| -------- | -------------------- | -------- | -------------------------------- | ------------------------------------------------------------ |
| url      | 待解析的网页地址     | String   | required                         | both `http` and `https ` are supported                       |
| label    | 结果标签             | String   | optional \|default: null         | 无 label 的消息样式：![](https://img.shields.io/badge/message-brightgreen)<br />有 label 的消息样式：![](https://img.shields.io/badge/label-message-brightgreen) |
| selector | 元素选择器           | String   | required                         | **URL-Encode is required.** <br /><img src="https://storage.leohao.cn/img/2023/09/04/64f54fe769619.png" alt="selector 获取方式" style="zoom: 10%;" /> |
| start    | 目标文本截取初始位置 | String   | optional \| default: 0           | start from 0                                                 |
| end      | 目标文本截取结束位置 | String   | optional \| default: null        | start from 0                                                 |
| color    | 消息文本颜色         | String   | optional \| default: brightgreen | Hex, rgb, rgba, hsl, hsla and css named colors are all supported |
| refresh  | 强制刷新标志         | String   | optional \| default: false       | 成功解析的结果将缓存到服务器本地，对于更新频率较高的动态文本，请将 refresh 设置为 true |

### 演示示例

| 名称                | URL                                          | selector                                                     | 效果                                                         |
| ------------------- | -------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Bilibili 视频点赞量 | https://www.bilibili.com/video/BV1424y1m7nN/ | %23arc_toolbar_report%20%3E%20div.video-toolbar-left%20%3E%20div%3Anth-child%281%29%20%3E%20div%20%3E%20span | ![](https://tti4md.leohao.cn/api?url=https://www.bilibili.com/video/BV1424y1m7nN&label=likes&selector=%23arc_toolbar_report%20%3E%20div.video-toolbar-left%20%3E%20div%3Anth-child%281%29%20%3E%20div%20%3E%20span) |
| 百度搜索TOP热点     | https://www.baidu.com/                       | %23hotsearch-content-wrapper%20%3E%20li%3Anth-child%281%29%20%3E%20a%20%3E%20span.title-content-title | ![](https://tti4md.leohao.cn/api?url=https://www.baidu.com/&label=baiduHot&selector=%23hotsearch-content-wrapper%20%3E%20li%3Anth-child%281%29%20%3E%20a%20%3E%20span.title-content-title) |
