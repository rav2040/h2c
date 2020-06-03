# h2c

![Node.js CI](https://github.com/rav2040/h2c/workflows/Node.js%20CI/badge.svg)
[![Known Vulnerabilities](https://snyk.io/test/github/rav2040/h2c/badge.svg?targetFile=package.json)](https://snyk.io/test/github/rav2040/h2c?targetFile=package.json)

A basic HTTP/2 command-line client for making web requests with Node.js. HTTP/1.1 and earlier are *not* supported.

## Installation
Install globally to be able to use the `h2c` command from anywhere.
```sh
$ npm install h2c --global
```

## Usage
Providing an absolute URI as the only argument will submit a GET request.
```sh
$ h2c http://localhost:3000/hello
```

The response headers and response body are then printed to `stdout`.
```
 HTTP/2  200 OK
content-type: text/plain; charset=UTF-8
content-length: 13
date: Wed, 03 Jun 2020 07:00:40 GMT

Hello, world!
```

## Options

#### -m, --method
Set the request method. Defaults to GET.
```sh
$ h2c -m HEAD http://localhost:3000/
```

#### `-h, --header`
Set a request header. Can be used multiple times to add multiple headers.
```sh
$ h2c -h 'accept: application/json' -h 'accept-language: en-US,en;q=0.5' http://localhost:3000/
```

#### `d, --data`
Add data to the request body. Only applies to POST, PUT, and PATCH requests.
```sh
$ h2c -m POST -d '{"foo":42}' -h 'content-type: application/json' http://localhost:3000/
```

