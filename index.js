const puppeteer = require('puppeteer-core')
const chromium = require("@sparticuz/chromium")
const express = require('express')
const https = require("https")
const http = require("http")
const app = express()
let browser = null
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
        //params check
        if (!url) {
            throw new Error('no url found');
        }
        if (!selector) {
            throw new Error('no selector found');
        }
        let imgShieldUrl = 'https://img.shields.io/badge/undefined-' + color;
        const openBrowser = async () => {
            if (!browser) {
                browser = await puppeteer.launch({
                    args: chromium.args,
                    executablePath:
                        process.env.CHROME_EXECUTABLE_PATH || (await chromium.executablePath),
                    headless: true,
                    ignoreDefaultArgs: ["--disable-extensions"],
                    ignoreHTTPSErrors: true,
                });
                browser.on('disconnected', () => {
                    console.log('browser disconnected');
                    browser = null;
                })
            }
            return browser;
        };
        const page = await openBrowser.newPage();
        //set request interception
        await page.setRequestInterception(true);
        page.on("request", (req) => {
            if (
                req.resourceType() === "stylesheet" ||
                req.resourceType() === "font" ||
                req.resourceType() === "image"
            ) {
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

// app.listen(port, () => {
//     console.log(`app listening on port ${port}`)
// })
module.exports = app;
