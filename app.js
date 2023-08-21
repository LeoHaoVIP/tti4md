const puppeteer = require('puppeteer');
const express = require('express')
const https = require("https")
const http = require("http")
const app = express()
const port = 4000
const warningSVG = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="288" height="20" role="img" aria-label="WARNING: MESSAGE"><title>WARNING: MESSAGE</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="288" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="65" height="20" fill="#555"/><rect x="65" width="223" height="20" fill="#dfb317"/><rect width="288" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="335" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="550">WARNING</text><text x="335" y="140" transform="scale(.1)" fill="#fff" textLength="550">WARNING</text><text aria-hidden="true" x="1755" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="2130">MESSAGE</text><text x="1755" y="140" transform="scale(.1)" fill="#fff" textLength="2130">MESSAGE</text></g></svg>'

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
    const label = params.label
    const color = params.color ? params.color : 'brightgreen'
    let imgShieldUrl = 'https://img.shields.io/badge/undefined-' + color;
    if (label) {
        imgShieldUrl = imgShieldUrl + '&label=' + label;
    }
    respond.set('Content-Type', 'image/svg+xml;charset=utf-8')
    try {
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
        if (label) {
            imgShieldUrl = imgShieldUrl + '&label=' + label;
        }
        download(imgShieldUrl, (data) => {
            respond.send(data);
        })
    } catch (e) {
        respond.send(warningSVG.replaceAll('MESSAGE', e.message))
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

const server = http.createServer(app)
server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
