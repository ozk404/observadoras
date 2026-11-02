// Compose supplies a unique database hostname when app joins a proxy network.
// Keep credentials, database, TLS options and other URL parameters unchanged.
export function databaseUrl(connectionString: string | undefined, hostname?: string) {
  if (!hostname) return connectionString;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const url = new URL(connectionString);
  url.hostname = hostname;
  url.port = "5432";
  return url.toString();
}
