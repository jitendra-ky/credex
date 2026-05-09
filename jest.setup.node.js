import dotenv from 'dotenv';
import path from 'path';

// Load .env file for Node.js test environment (API routes, database tests)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
