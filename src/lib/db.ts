import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Construct DATABASE_URL dynamically if separate env variables are provided
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD ? encodeURIComponent(process.env.DB_PASSWORD) : '';
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT || '3306';
  const dbName = process.env.DB_NAME;

  if (user && host && dbName) {
    return `mysql://${user}:${password}@${host}:${port}/${dbName}?connection_limit=3&connect_timeout=30`;
  }
  return undefined;
};

const dbUrl = getDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
    ...(dbUrl ? {
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    } : {}),
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db