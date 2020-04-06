import { createServer } from 'http2';
import { h2c } from '../src';

const HTTP2_HEADER_STATUS = ':status';
const HTTP2_HEADER_PATH = ':path';
const HTTP2_HEADER_CONTENT_TYPE = 'content-type';

describe('Calling h2c()', () => {
  const server = createServer();

  server.on('stream', (stream, headers) => {
    if (headers[HTTP2_HEADER_PATH] === '/foo') {
      stream.respond({ [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain' });
      stream.end('Hello, world!');
    }

    else if (headers[HTTP2_HEADER_PATH] === '/bar') {
      stream.respond({ [HTTP2_HEADER_CONTENT_TYPE]: 'application/json' });
      stream.end(JSON.stringify({ hello: 'world' }));
    }

    else if (headers[HTTP2_HEADER_PATH] === '/baz') {
      stream.respond();
      stream.end('Hello, world!');
    }

    else if (headers[HTTP2_HEADER_PATH] === '/foo?bar=baz') {
      stream.respond({ [HTTP2_HEADER_CONTENT_TYPE]: 'text/plain' });
      stream.end('Hello, world!');
    }

    else {
      stream.respond({ [HTTP2_HEADER_STATUS]: 404 }, { endStream: true });
    }
  });

  server.listen(3000);

  afterAll(() => {
    server.close();
  });

  describe('with the url \'http://localhost:3000/foo\'', () => {
    test('returns a 200 status code and the string \'Hello, world!\'', async () => {
      const { headers, body } = await h2c('GET', 'http://localhost:3000/foo');
      expect(headers[HTTP2_HEADER_STATUS]).toBe(200);
      expect(headers[HTTP2_HEADER_CONTENT_TYPE]).toBe('text/plain');
      expect(body).toBe('Hello, world!');
    });
  });

  describe('with the url \'http://localhost:3000/bar\'', () => {
    test('returns a 200 status code and the object { hello: \'world\' }', async () => {
      const { headers, body } = await h2c('GET', 'http://localhost:3000/bar');
      expect(headers[HTTP2_HEADER_STATUS]).toBe(200);
      expect(headers[HTTP2_HEADER_CONTENT_TYPE]).toBe('application/json');
      expect(body).toEqual({ hello: 'world' });
    });
  });

  describe('with the url \'http://localhost:3000/baz\'', () => {
    test('returns a 200 status code and a buffer of the string \'Hello, world!\'', async () => {
      const { headers, body } = await h2c('GET', 'http://localhost:3000/baz');
      expect(headers[HTTP2_HEADER_STATUS]).toBe(200);
      expect(Buffer.isBuffer(body)).toBe(true);
      expect(body?.toString()).toBe('Hello, world!');
    });
  });

  describe('with the url \'http://localhost:3000/foo?bar=baz\'', () => {
    test('returns a 200 status code and the string \'Hello, world!\'', async () => {
      const { headers, body } = await h2c('GET', 'http://localhost:3000/foo?bar=baz');
      expect(headers[HTTP2_HEADER_STATUS]).toBe(200);
      expect(body).toBe('Hello, world!');
    });
  });

  describe('with the url \'http://localhost:3000/does_not_exist\'', () => {
    test('returns a 404 status code and null body', async () => {
      const { headers, body } = await h2c('GET', 'http://localhost:3000/does_not_exist');
      expect(headers[HTTP2_HEADER_STATUS]).toBe(404);
      expect(body).toBeNull();
    });
  });

  describe('with an invalid request method', () => {
    test('throws an error', async () => {
      //@ts-ignore
      await expect(h2c('FOO', 'http://localhost:3000/foo'))
        .rejects.toThrow('FOO is not a valid request method.');
    });
  });
});
