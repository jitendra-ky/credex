const dotenv = require('dotenv');
const path = require('path');

// Load .env for tests that depend on server-side configuration.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
