import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

const TEST_DB_PATH = path.resolve(__dirname, "test.db");
const TEST_DATABASE_URL = `file:${TEST_DB_PATH}`;

export default async function globalSetup() {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "pipe"
  });

  return () => {
    if (existsSync(TEST_DB_PATH)) unlinkSync(TEST_DB_PATH);
  };
}
