import { AuditStorageAdapter } from "./types";
import { FilesystemAdapter } from "./filesystem";
import { PostgresAdapter } from "./postgres";

let cachedAdapter: AuditStorageAdapter | null = null;

/**
 * Detect which storage backend to use based on environment
 * @returns 'filesystem' for local development, 'postgres' for production
 */
function detectStorageType(): "filesystem" | "postgres" {
  // Allow explicit override for testing
  if (process.env.FORCE_FILE_STORAGE === "true") {
    return "filesystem";
  }

  // Use Postgres if in production with database URL
  // Neon uses DATABASE_URL, but also check POSTGRES_URL for backward compatibility
  const hasDatabaseUrl = Boolean(
    process.env.DATABASE_URL || process.env.POSTGRES_URL
  );
  const isProduction = process.env.NODE_ENV === "production";

  return hasDatabaseUrl && isProduction ? "postgres" : "filesystem";
}

/**
 * Get the appropriate audit storage adapter based on environment
 * Uses singleton pattern to cache the adapter instance
 * @returns AuditStorageAdapter instance (FilesystemAdapter or PostgresAdapter)
 */
export function getAdapter(): AuditStorageAdapter {
  if (cachedAdapter) {
    return cachedAdapter;
  }

  const storageType = detectStorageType();

  if (storageType === "postgres") {
    console.log("📊 Using Postgres adapter for audit storage");
    cachedAdapter = new PostgresAdapter();
  } else {
    console.log("📁 Using filesystem adapter for audit storage");
    cachedAdapter = new FilesystemAdapter();
  }

  return cachedAdapter;
}

/**
 * Reset the cached adapter (useful for testing)
 */
export function resetAdapter(): void {
  cachedAdapter = null;
}
