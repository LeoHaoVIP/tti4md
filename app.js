const express = require('express')
const https = require("https")
const http = require("http")
const app = express()
const port = 4000
const cheerio = require('cheerio')
const warningSVG = '<svg width="288" height="20" role="img" aria-label="WARNING: MESSAGE"><title>WARNING: MESSAGE</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="288" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="65" height="20" fill="#555"/><rect x="65" width="223" height="20" fill="#dfb317"/><rect width="288" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110"><text aria-hidden="true" x="335" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="550">WARNING</text><text x="335" y="140" transform="scale(.1)" fill="#fff" textLength="550">WARNING</text><text aria-hidden="true" x="1755" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="2130">MESSAGE</text><text x="1755" y="140" transform="scale(.1)" fill="#fff" textLength="2130">MESSAGE</text></g></svg>'
/**
 * URL encode is needed.
 * Online tools: https://www.urlencoder.net/
 */
app.get('/api', (request, respond) => {
    const params = request.query
    const url = params.url
    const selector = params.selector
    const start = params.start ? params.start : 0
    const end = params.end
    const label = params.label
    const color = params.color ? params.color : 'brightgreen'
    let imgShieldUrl = 'https://img.shields.io/static/v1?label=' + label + '&message=undefined&color=' + color
    respond.set('Content-Type', 'text/html');
    try {
        const httpServer = url.toLowerCase().startsWith('https') ? https : http
        const req = httpServer.get(url, (res) => {
            const chunks = []
            let size = 0
            //receive data
            res.on('data', function (chunk) {
                try {
                    chunks.push(chunk)
                    size += chunk.length
                } catch (e) {
                    warningSVG.replaceAll('MESSAGE', e.message)
                    respond.send(warningSVG)
                }
            })
            //combine data
            res.on('end', function () {
                try {
                    let message;
                    const data = Buffer.concat(chunks, size);
                    let html = data.toString();
                    const $ = cheerio.load(html)
                    const element = selector ? $(selector).html() : html
                    if (element) {
                        message = end ? element.substring(start, end) : element.substring(start)
                    }
                    imgShieldUrl = 'https://img.shields.io/static/v1?label=' + label + '&message=' + message + '&color=' + color
                    download(imgShieldUrl, (data) => {
                        respond.send(data);
                    })
                } catch (e) {
                    respond.send(warningSVG.replaceAll('MESSAGE', e.message))
                }
            })
        })
        req.on('error', (e) => {
            respond.send(warningSVG.replaceAll('MESSAGE', e.message))
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
    const httpServer = url.toLowerCase().startsWith('https') ? https : http
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
