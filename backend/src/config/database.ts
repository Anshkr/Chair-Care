import { Pool, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

// Determine SSL config based on DATABASE_URL or environment
// Neon requires SSL. If url contains sslmode=require or is remote neon host, use SSL.
const isNeonOrRemote =
  env.DATABASE_URL.includes('neon.tech') ||
  env.DATABASE_URL.includes('sslmode=require') ||
  env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isNeonOrRemote
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
  max: 20, // Max connection pool clients
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => {
  console.error('❌ [Database Pool Error]:', err.message);
});

export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development' && duration > 200) {
      console.log(`⏱️ [Slow DB Query] (${duration}ms): ${text.slice(0, 100)}...`);
    }
    return res;
  } catch (error: any) {
    console.error('❌ [DB Query Failed]:', {
      message: error.message,
      query: text.slice(0, 100),
    });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log(`✅ [PostgreSQL / Neon Connected] Database: ${result.rows[0].db_name}, Time: ${result.rows[0].current_time}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ [Database Offline / Mock Mode Active]: ${error.message}`);
    return false;
  }
};

export default pool;
