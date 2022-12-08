#!/usr/bin/env node

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const distPath = process.argv[2];
const port = process.argv[3] || 4300;

if (!distPath) {
    console.log(
        '### ERROR: distPath required\n' +
            'Usage: node static_server.js distPath [port: default 4300]\n' +
            'Example: node static_server.js dist/sb-admin-pro 3000',
    );
    process.exit(1);
}

http.createServer(function(req, res) {
    console.log(`${req.method} ${req.url}`);

    const parsedUrl = url.parse(req.url);
    const sanitizePath = path
        .normalize(parsedUrl.pathname)
        .replace(/^(\.\.[\/\\])+/, '');
    let pathname = path.join(process.cwd(), distPath, sanitizePath);

    fs.exists(pathname, function(exist) {
        if (!exist) {
            pathname = path.join(process.cwd(), distPath, 'index.html');
        }

        // if is a directory, then look for index.html
        if (fs.statSync(pathname).isDirectory()) {
            pathname += '/index.html';
        }

        // read file from file system
        fs.readFile(pathname, function(err, data) {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            } else {
                res.setHeader(
                    'Content-type',
                    mime.contentType(path.extname(pathname)) || 'text/plain',
                );
                res.end(data);
            }
        });
    });
}).listen(parseInt(port));

console.log(`Server listening at:

http://localhost:${port}
`);
