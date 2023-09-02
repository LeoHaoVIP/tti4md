const express = require('express');
const https = require("https");
const http = require("http");
const puppeteerCore = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer");
const app = express();
const port = 3000;
const useRemoteFunction = process.env.IS_REMOTE_FUCNTION;
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
    let browser = null;
    try {
        //params check
        if (!url) {
            throw new Error('no url found');
        }
        if (!selector) {
            throw new Error('no selector found');
        }
        let imgShieldUrl = 'https://img.shields.io/badge/undefined-' + color;
        //根据环境创建 Browser 对象
        browser = useRemoteFunction ?
            await puppeteerCore.launch({
                executablePath: await chromium.executablePath,
                headless: true,
                ignoreDefaultArgs: ["--disable-extensions"],
                ignoreHTTPSErrors: true,
                args: chromium.args
            }) :
            await puppeteer.launch({
                headless: false,
                ignoreDefaultArgs: ["--disable-extensions"],
                ignoreHTTPSErrors: true,
                args: [
                    `--no-sandbox`,
                    '--disable-gpu',
                    '--disable-dev-shm-usage',
                    '--disable-setuid-sandbox',
                    '--no-first-run',
                    '--no-sandbox',
                    '--no-zygote',
                    '--single-process',
                    '--blink-settings=imagesEnabled=false'
                ]
            });
        const page = await browser.newPage();
        //set request interception
        await page.setRequestInterception(true);
        //通过 page.evaluate 在浏览器里执行删除无用的 iframe 代码
        await page.evaluate(async () => {
            let iframes = document.getElementsByTagName('iframe');
            for (let i = 3; i < iframes.length - 1; i++) {
                let iframe = iframes[i];
                if (iframe.name.includes("frameBody")) {
                    iframe.src = 'about:blank';
                    try {
                        iframe.contentWindow.document.write('');
                        iframe.contentWindow.document.clear();
                    } catch (e) {
                    }
                    //把iframe从页面移除
                    iframe.parentNode.removeChild(iframe);
                }
            }
        })
        page.on("request", (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });
        await page.goto(url);
        //wait for element
        await page.waitForSelector(selector);
        //get element
        let element = await page.$eval(selector, el => el.innerHTML);
        let message;
        if (element) {
            message = end ? element.substring(start, end) : element.substring(start)
        }
        //handle invalid character
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
    } finally {
        if (browser != null) {
            browser.close();
        }
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
        res.on('data', function (chunk) {
            try {
                chunks.push(chunk)
                size += chunk.length
            } catch (e) {
                callback()
                console.log(e.message)
            }
        })
        res.on('end', function () {
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

/**
 * vercel 等平台会自动创建监听端口
 */
if (!useRemoteFunction) {
    app.listen(port, () => {
        console.log(`app listening on port ${port}`)
    })
}
module.exports = app;
