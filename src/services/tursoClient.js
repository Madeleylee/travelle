// src/database/tursoClient.js
import { createClient } from "@libsql/client/web";

export const turso = createClient({
    url: import.meta.env.VITE_TURSO_DB_URL,
    authToken: import.meta.env.VITE_TURSO_DB_TOKEN
});

export default turso;