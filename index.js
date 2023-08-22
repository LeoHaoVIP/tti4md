const puppeteer = require('puppeteer');
const express = require('express')
const https = require("https")
const http = require("http")
const app = express()
//中间件配置
//适应Post请求
app.use(express.json())
//适应get请求
app.use(express.urlencoded({extended: false}))
/**
 * URL encode is needed.
 * Online tools: https://www.urlencoder.net/
 */
app.get('/api', async (request, respond) => {
    const params = request.query
    const url = params.url
    const selector = params.selector
    const start = params.start ? params.start : 0
    const end = params.end
    const color = params.color ? params.color : 'brightgreen'
    try {
        //参数校验
        if (!url) {
            throw new Error('no url found')
        }
        if (!selector) {
            throw new Error('no selector found')
        }
        let imgShieldUrl = 'https://img.shields.io/badge/undefined-' + color;
        let browser = await puppeteer.launch({
            headless: true,
            ignoreHTTPSErrors: true,
            args: [
                `--no-sandbox`,
            ]
        });
        const page = await browser.newPage();
        await page.goto(url);
        //等待 selector
        await page.waitForSelector(selector);
        //解析 selector
        let element = await page.$eval(selector, el => el.innerHTML);
        let message;
        if (element) {
            message = end ? element.substring(start, end) : element.substring(start)
        }
        //处理特殊字符
        if (message.indexOf('/') >= 0 || message.indexOf('-') >= 0) {
            throw new Error('invalid character found');
        }
        imgShieldUrl = 'https://img.shields.io/badge/' + message + '-' + color;
        download(imgShieldUrl, (data) => {
            respond.set('Content-Type', 'image/svg+xml;charset=utf-8')
            respond.send(data);
        })
    } catch (e) {
        console.log(e)
        respond.set('Content-Type', 'application/json')
        respond.send({
            msg: e.message
        })
    }
})

/**
 * Download online file
 * @param url
 * @param callback
 */
function download(url, callback) {
    const httpServer = url.startsWith('https') ? https : http
    const req = httpServer.get(url, (res) => {
        const chunks = []
        let size = 0
        res.on('data', function (chunk) {  //数据传输
            try {
                chunks.push(chunk)
                size += chunk.length
            } catch (e) {
                callback()
                console.log(e.message)
            }
        })
        res.on('end', function () {  //数据传输完成
            try {
                const data = Buffer.concat(chunks, size);
                callback(data)
            } catch (e) {
                callback()
                console.log(e.message)
            }
        })
    })
    req.on('error', (e) => {
        callback()
        console.log(e.message)
    })
}

// app.listen(port, () => {
//     console.log(`app listening on port ${port}`)
// })
module.exports = app;
