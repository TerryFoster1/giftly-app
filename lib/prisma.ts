import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function assertProductionDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  const isVercel = Boolean(process.env.VERCEL);

  if (isVercel && !databaseUrl) {
    throw new Error("DATABASE_URL_REQUIRED");
  }

  if (isVercel && databaseUrl?.startsWith("file:")) {
    throw new Error("VERCEL_REQUIRES_POSTGRES_DATABASE_URL");
  }
}

assertProductionDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
