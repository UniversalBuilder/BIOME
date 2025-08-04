// Add TextEncoder and TextDecoder polyfill for MSW
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.Headers = Headers;
global.Request = Request;
global.Response = Response;
