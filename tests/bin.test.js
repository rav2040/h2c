const assert = require('assert').strict;
const { promisify } = require('util');
const { exec } = require('child_process');
const { createServer, constants } = require('http2');

const promiseExec = promisify(exec);

const {
  HTTP2_HEADER_STATUS,
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_CONTENT_TYPE,
} = constants;

const server = createServer();

server.on('stream', async (stream, headers) => {
  const method = headers[HTTP2_HEADER_METHOD];
  const path = headers[HTTP2_HEADER_PATH];

  if (method === 'GET') {
    if (path === '/foo') {
      stream.respond({ [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain' });
      stream.end('Hello, world!');
    }

    else if (path === '/bar') {
      stream.respond({ [HTTP2_HEADER_CONTENT_TYPE]: 'application/json' });
      stream.end(JSON.stringify({ hello: 'world' }));
    }

    else if (path === '/baz') {
      stream.respond();
      stream.end('Hello, world!');
    }

    else if (path === '/foo?bar=baz') {
      stream.respond({ [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain' });
      stream.end('Hello, world!');
    }

    else {
      stream.respond({ [HTTP2_HEADER_STATUS]: 404 }, { endStream: true });
    }
  }

  if (method === 'POST' && path === '/foo') {
    const chunks = [];

    for await(const chunk of stream) {
      chunks.push(chunk);
    }

    stream.respond({ [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain' });

    if (chunks[0].toString('UTF-8') === 'abc') {
      stream.end('success');
    }

    else {
      stream.end('failure');
    }
  }
});

async function text() {
  const { stderr, stdout } = await promiseExec('node ./lib/index.js http://localhost:3001/foo', {
    encoding: 'utf-8',
  });

  assert.equal(stderr.length, 0);
  assert.equal(/200 OK/.test(stdout), true);
  assert.equal(/content-type: text\/plain/.test(stdout), true);
  assert.equal(/Hello, world!/.test(stdout), true);
}

async function json() {
  const { stderr, stdout } = await promiseExec('node ./lib/index.js http://localhost:3001/bar', {
    encoding: 'utf-8',
  });

  assert.equal(stderr.length, 0);
  assert.equal(/200 OK/.test(stdout), true);
  assert.equal(/content-type: application\/json/.test(stdout), true);
  assert.equal(/{\n {2}"hello": "world"\n}/.test(stdout), true);
}

async function raw() {
  const { stderr, stdout } = await promiseExec('node ./lib/index.js http://localhost:3001/baz', {
    encoding: 'utf-8',
  });

  assert.equal(stderr.length, 0);
  assert.equal(/200 OK/.test(stdout), true);
  assert.equal(/Hello, world!/.test(stdout), true);
}

async function queryString() {
  const { stderr, stdout } = await promiseExec('node ./lib/index.js http://localhost:3001/foo?bar=baz', {
    encoding: 'utf-8',
  });

  assert.equal(stderr.length, 0);
  assert.equal(/200 OK/.test(stdout), true);
  assert.equal(/content-type: text\/plain/.test(stdout), true);
  assert.equal(/Hello, world!/.test(stdout), true);
}

server.listen(3001, async () => {
  try {
    await Promise.all([
      text(),
      json(),
      raw(),
      queryString(),
    ]);
  }

  catch (err) {
    console.error(err);
  }

  finally {
    server.close();
  }
});
