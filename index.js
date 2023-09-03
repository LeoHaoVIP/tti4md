const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const port = 3000;
const SUCCESS_COLOR = 'brightgreen'
const ERROR_COLOR = 'red'
/**
 * URL encode is needed.
 * Online tools: https://www.urlencoder.net/
 */
let browser = null;
let imgShieldUrl;
app.get('/api', async (request, respond) => {
    const params = request.query
    const url = params.url
    const selector = params.selector
    const start = params.start ? params.start : 0
    const end = params.end
    const color = params.color ? params.color : SUCCESS_COLOR
    try {
        //params check
        if (!url) {
            throw new Error('no url found');
        }
        if (!selector) {
            throw new Error('no selector found');
        }
        //create Browser
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ['--disable-extensions'],
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
        //remove iframe
        await page.evaluate(async () => {
            let iframes = document.getElementsByTagName('iframe');
            for (let i = 3; i < iframes.length - 1; i++) {
                let iframe = iframes[i];
                if (iframe.name.includes('frameBody')) {
                    iframe.src = 'about:blank';
                    try {
                        iframe.contentWindow.document.write('');
                        iframe.contentWindow.document.clear();
                    } catch (e) {
                    }
                    iframe.parentNode.removeChild(iframe);
                }
            }
        })
        page.on('request', (req) => {
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
        respond.redirect(imgShieldUrl);
    } catch (e) {
        console.log(e)
        imgShieldUrl = 'https://img.shields.io/badge/' + e.message + '-' + ERROR_COLOR;
        respond.redirect(imgShieldUrl);
    } finally {
        if (browser != null) {
            browser.close();
        }
    }
})

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
})
module.exports = app;
