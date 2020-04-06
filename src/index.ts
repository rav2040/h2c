import type { ClientHttp2Stream, IncomingHttpHeaders } from 'http2';
import { connect } from 'http2';

const HTTP2_HEADER_METHOD         = ':method';
const HTTP2_HEADER_PATH           = ':path';
const HTTP2_HEADER_CONTENT_TYPE   = 'content-type';

type RequestMethod = 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE';

type Result = {
  headers: IncomingHttpHeaders,
  body: any,
};

const validRequestMethods = new Set([
  'CONNECT',
  'DELETE',
  'GET',
  'HEAD',
  'OPTIONS',
  'PATCH',
  'POST',
  'PUT',
  'TRACE',
]);

function getHeaders(req: ClientHttp2Stream): Promise<IncomingHttpHeaders> {
  return new Promise(resolve => {
    req.on('response', (headers) => resolve(headers));
  });
}

async function getBody(req: ClientHttp2Stream): Promise<Buffer> {
  const buf: Buffer[] = [];

  for await (const chunk of req) {
    buf.push(chunk);
  }

  return Buffer.concat(buf);
}

function onEndListener(req: ClientHttp2Stream): Promise<void> {
  return new Promise(resolve => {
    req.on('end', () => resolve());
  });
}

/**
 * Performs an HTTP request using the provided method and URL, returning the received response headers and body.
 */

export async function h2c(method: RequestMethod, url: string) {
  if (!validRequestMethods.has(method)) {
    throw TypeError(`${method} is not a valid request method.`);
  }

  const { origin, pathname, search } = new URL(url);

  const client = connect(origin);
  const req = client.request({
    [HTTP2_HEADER_METHOD]: method.toUpperCase(),
    [HTTP2_HEADER_PATH]: pathname + search,
  });

  const [headers, body] = await Promise.all([
    getHeaders(req),
    getBody(req),
    onEndListener(req),
  ]);

  // Close the open handle as it's no longer needed.
  client.close();

  let result: Result = { headers, body };

  if (body.length === 0) {
    // There is no body.
    result.body = null;
  }

  else if (headers[HTTP2_HEADER_CONTENT_TYPE]?.startsWith('text')) {
    // The body should be a string.
    result.body = body.toString();
  }

  else if ((headers[HTTP2_HEADER_CONTENT_TYPE] === 'application/json')) {
    // The body should be an object.
    result.body = JSON.parse(body.toString());
  }

  else {
    // Keep the body as a buffer.
    result.body = body;
  }

  return result;
};
