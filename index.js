const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const cryptoJS = require('crypto-js');
const port = 3000;
const SUCCESS_COLOR = 'brightgreen'
const TRUE_STRING = 'true'
const FALSE_STRING = 'false'
const ERROR_COLOR = 'red'
const cache = new Map();
const puppeteerArgs = [
    `--no-sandbox`,
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',
    '--no-first-run',
    '--no-sandbox',
    '--no-zygote',
    '--single-process',
    '--blink-settings=imagesEnabled=false'
];
/**
 * selector encode is needed.
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
    const label = params.label
    const color = params.color ? params.color : SUCCESS_COLOR
    const refresh = params.refresh ? params.refresh : FALSE_STRING
    const paramString = url + selector + start + end + color;
    try {
        console.log('started')
        //params check
        if (!url) {
            throw new Error('no url found');
        }
        if (!selector) {
            throw new Error('no selector found');
        }
        //hash value of params
        const paramHash = cryptoJS.MD5(paramString).toString();
        //remove cache if refresh=true
        if (refresh === TRUE_STRING) {
            cache.delete(paramHash);
        }
        //use cached value if exist
        let cachedValue = cache.get(paramHash);
        if (cachedValue) {
            respond.redirect(cachedValue);
            console.log('using cached value: ' + cachedValue);
            return;
        }
        //create Browser
        browser = await puppeteer.launch({
            headless: 1,
            ignoreDefaultArgs: ['--disable-extensions'],
            ignoreHTTPSErrors: true,
            args: puppeteerArgs
        });
        const page = await browser.newPage();
        //set request interception
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });
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
        //open url
        await page.goto(url);
        //wait for element
        await page.waitForSelector(selector);
        //get element
        let element = await page.$eval(selector, el => el.innerHTML);
        let message;
        //truncate
        if (element) {
            message = end ? element.substring(start, end) : element.substring(start)
        }
        //handle invalid character
        if (message.indexOf('/') >= 0 || message.indexOf('-') >= 0) {
            throw new Error('invalid character found');
        }
        imgShieldUrl = 'https://img.shields.io/badge/' + (label ?  label+'-' : '') + message + '-' + color;
        //add to cache
        cache.set(paramHash, imgShieldUrl);
        respond.redirect(imgShieldUrl);
        console.log('success')
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
