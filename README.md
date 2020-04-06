# h2c

![Node.js CI](https://github.com/rav2040/h2c/workflows/Node.js%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/rav2040/h2c/badge.svg?branch=master)](https://coveralls.io/github/rav2040/h2c?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/rav2040/h2c/badge.svg?targetFile=package.json)](https://snyk.io/test/github/rav2040/h2c?targetFile=package.json)

A basic HTTP/2 client for making web requests in Node.js. It does *not* support HTTP/1.1 or older.

## Installation
```sh
npm install h2c
```

## Usage
```js
const { h2c } = require('h2c');

async function main() {
  const { headers, body } = await h2c('GET', 'https://localhost/hello');

  console.log(headers[':status'])   // 200
  console.log(body);                // Hello, world!
}

main();
```

## API
### `h2c(method, url)`

Takes two arguments:
* `method`, which should be a valid HTTP request method (not case sensitive):  
* `url`, which includes the full pathname of the resource to be retrieved.

Returns an object with the following two properties:
* `headers`  
  An object containing the incoming HTTP/2 headers.
* `body`  
  Depends on the value of the incoming `content-type` header. Can be a string, object, buffer, or `null`.
