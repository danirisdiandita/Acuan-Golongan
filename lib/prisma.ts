import { SERVER_CONFIG } from "../constants/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connString = SERVER_CONFIG.DATABASE_URL;

// Direct initialization as seen in reference
const adapter = connString ? new PrismaPg({ connectionString: connString }) : null;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  (adapter ? new PrismaClient({ adapter }) : new PrismaClient());

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
