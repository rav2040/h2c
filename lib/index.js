#!/usr/bin/env node

const { connect, constants } = require('http2');
const { URL } = require('url');
const { program } = require('commander');
const chalk = require('chalk');

const {
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_ACCEPT,
  HTTP2_HEADER_USER_AGENT,
  HTTP2_HEADER_CONTENT_TYPE,
  HTTP2_HEADER_CONTENT_LENGTH,
} = constants;

const USER_AGENT = 'node-h2c';

const methodsWithBody = [
  'POST',
  'PUT',
  'PATCH',
];

function getHeaders(stream) {
  return new Promise(resolve => {
    stream.on('response', headers => resolve(headers));
  });
}

async function getBody(stream) {
  const buf = [];

  for await (const chunk of stream) {
    buf.push(chunk);
  }

  return Buffer.concat(buf);
}

async function h2c(method, url, options = {}) {
  const { pathname, search, origin } = new URL(url);

  const outgoingHeaders = options.headers || {};
  outgoingHeaders[HTTP2_HEADER_METHOD] = method.toUpperCase();
  outgoingHeaders[HTTP2_HEADER_PATH] = pathname + search;
  outgoingHeaders[HTTP2_HEADER_ACCEPT] = '*/*';
  outgoingHeaders[HTTP2_HEADER_USER_AGENT] = USER_AGENT;

  let payload;

  if (options.body && methodsWithBody.includes(method.toUpperCase())) {
    payload = options.body;

    outgoingHeaders[HTTP2_HEADER_CONTENT_LENGTH] = payload.length.toString();

    if (!outgoingHeaders[HTTP2_HEADER_CONTENT_TYPE]) {
      outgoingHeaders[HTTP2_HEADER_CONTENT_TYPE] = 'application/octet-stream';
    }
  }

  const client = connect(origin);

  const req = client.request(outgoingHeaders);

  if (payload) {
    req.write(payload);
  }

  await new Promise(resolve => {
    req.end(resolve);
  });

  const [headers, body] = await Promise.all([
    getHeaders(req),
    getBody(req),
  ]);

  client.close();

  const result = { headers, body };
  const contentType = headers[HTTP2_HEADER_CONTENT_TYPE];

  if (body.length === 0) {
    result.body = null;
  }

  else if (contentType && !contentType.startsWith('application/octet-stream')) {
    result.body = body.toString();
  }

  return result;
}

function getStatusText(code) {
  if (code === 200) {
    return 'OK';
  }

  for (const [key, value] of Object.entries(constants)) {
    if (value === code) {
      return key
        .replace('HTTP_STATUS_', '')
        .split('_')
        .map(word => {
          return word[0] + word.slice(1).toLocaleLowerCase();
        })
        .join(' ');
    }
  }
}

async function main() {
  program
    .option('-m, --method <method>', 'Request method.')
    .option('-d, --data <data>', 'Payload data.')
    .option('-h, --header <header>', 'Request header.', (value, previous) => {
      return previous.concat([value]);
    }, [])
    .parse(process.argv);

  const [url] = program.args;

  try {
    const options = {
      headers: {},
      body: program.data,
    };

    program.header.forEach(str => {
      const [key, value] = str.split(':').map(str => str.trim());
      options.headers[key] = value;
    });

    const method = program.method || options.headers[HTTP2_HEADER_METHOD] || 'GET';

    let { headers, body } = await h2c(method, url, options);

    const statusCode = headers[HTTP2_HEADER_STATUS];

    let statusText = statusCode.toString() + ' ' + getStatusText(statusCode);

    if (statusText.startsWith('2')) {
      statusText = chalk.greenBright(statusText);
    }

    else if (statusText.startsWith('3')) {
      statusText = chalk.blueBright(statusText);
    }

    else if (statusText.startsWith('4')) {
      statusText = chalk.yellow(statusText);
    }

    else if (statusText.startsWith('5')) {
      statusText = chalk.redBright(statusText);
    }

    else {
      statusText = chalk(statusText);
    }

    console.log(chalk.bgWhite(` ${chalk.black('HTTP/2')} `) + ` ${statusText}`);

    for (const header in headers) {
      if (header !== HTTP2_HEADER_STATUS) {
        console.log(`${chalk.blackBright(header + ':')} ${chalk.cyan(headers[header])}`);
      }
    }

    const contentType = headers[HTTP2_HEADER_CONTENT_TYPE];

    if (contentType && contentType.startsWith('application/json')) {
      body = JSON.parse(body);
      console.log('\n' + JSON.stringify(body, null, 2));
    }

    else if (body !== null) {
      if (Buffer.isBuffer(body)) {
        body = body.toString('utf-8');
      }

      console.log(`\n${body}`);
    }

    console.log('');
  }

  catch (err) {
    console.error(err);
  }
}

main();
