import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next", "standalone");
const server = path.join(standalone, "server.js");

if (!fs.existsSync(server)) {
  console.error("Missing standalone build. Run: npm run build:docker");
  process.exit(1);
}

process.env.HOSTNAME = process.env.HOSTNAME || "0.0.0.0";
process.env.PORT = process.env.PORT || "3000";
process.env.NODE_ENV = process.env.NODE_ENV || "production";

console.log(`Starting Next.js on ${process.env.HOSTNAME}:${process.env.PORT}`);

const child = spawn(process.execPath, [server], {
  cwd: standalone,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) {
    console.error(`Server stopped by signal: ${signal}`);
    process.exit(1);
  }
  process.exit(code ?? 1);
});
