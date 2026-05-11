const dotenv = require('dotenv');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');

// Polyfill TextEncoder/TextDecoder for pg crypto utilities
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Load .env for tests that depend on server-side configuration.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
