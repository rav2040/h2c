# h2c

![Node.js CI](https://github.com/rav2040/h2c/workflows/Node.js%20CI/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/rav2040/h2c/badge.svg?targetFile=package.json)](https://snyk.io/test/github/rav2040/h2c?targetFile=package.json)

A basic HTTP/2 client for making web requests in Node.js. It does *not* support HTTP/1.1 or older.

## Installation
```
$ npm install -g h2c
```

## Usage
```
$ h2c http://localhost:3000/hello
 HTTP/2  200 OK
content-type: text/plain; charset=UTF-8
content-length: 13
date: Wed, 03 Jun 2020 07:00:40 GMT

Hello, world!
```
