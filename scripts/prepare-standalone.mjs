import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next", "standalone");
const server = path.join(standalone, "server.js");

if (!fs.existsSync(server)) {
  console.error("Missing .next/standalone/server.js — run `next build` first.");
  process.exit(1);
}

fs.cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});
fs.cpSync(path.join(root, "public"), path.join(standalone, "public"), {
  recursive: true,
});

console.log("Standalone bundle prepared.");
