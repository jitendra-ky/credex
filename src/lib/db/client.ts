/**
 * Database Client
 * Single Responsibility: Establish and manage Neon Postgres connection via Drizzle ORM
 * Singleton pattern: One database connection per application lifecycle
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

// Validate DATABASE_URL environment variable
const validateDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return databaseUrl;
};

// Create connection pool
const createPool = (): Pool => {
  return new Pool({
    connectionString: validateDatabaseUrl(),
    // Connection pooling configuration for serverless environments
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000, // Increased from 2000ms to accommodate remote database latency
  });
};

// Singleton database client
let db: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create the database client
 * Ensures single connection pool throughout application lifecycle
 * Only initializes when first called.
 */
export const getDb = (): ReturnType<typeof drizzle> => {
  if (!db) {
    const pool = createPool();
    db = drizzle(pool);
  }
  return db;
};
