export const SERVER_CONFIG = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  DATABASE_ADAPTER: (process.env.DATABASE_ADAPTER as "neon" | "pg") || "pg",
  S3_ENDPOINT: process.env.S3_ENDPOINT || "127.0.0.1",
  S3_PORT: parseInt(process.env.S3_PORT || "9000"),
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY || "",
  S3_SECRET_KEY: process.env.S3_SECRET_KEY || "",
  S3_REGION: process.env.S3_REGION || "",
  S3_BUCKET: process.env.S3_BUCKET || "asdpgolongan",
  S3_USE_SSL: process.env.S3_USE_SSL || false,
} as const;
