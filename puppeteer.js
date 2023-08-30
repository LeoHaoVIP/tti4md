const puppeteerCore = require('puppeteer-core')
const puppeteer = require('puppeteer')
const chromium = require("@sparticuz/chromium")
//根据环境创建 Browser 对象
let browser = process.env.IS_REMOTE_FUCNTION ?
    puppeteerCore.launch({
        executablePath:
            process.env.CHROME_EXECUTABLE_PATH || (chromium.executablePath),
        headless: true,
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
    }) :
    puppeteer.launch({
        headless: true,
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
exports.browser = browser;
