import { Pool, type QueryResult, type QueryResultRow } from 'pg'

// Server-only Postgres pool. Must never be imported from a client component:
// DATABASE_URL has no NEXT_PUBLIC_ prefix and must stay off the bundle.

const globalForPg = globalThis as unknown as { jerboaPool?: Pool }

export function getPool(): Pool {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. For the local jerboa database use ' +
        'postgresql:///jerboa?host=/var/run/postgresql',
    )
  }

  if (!globalForPg.jerboaPool) {
    globalForPg.jerboaPool = new Pool({
      connectionString: url,
      max: 8,
    })
  }

  return globalForPg.jerboaPool
}

export function query<T extends QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, values)
}
