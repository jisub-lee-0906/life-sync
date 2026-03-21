import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@localhost:5432/lifesync";

export const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

export const queryClient = postgres(connectionString, {
  connect_timeout: 5,
  idle_timeout: 0,
  max: 1,
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
