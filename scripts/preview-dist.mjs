import { resolve } from "node:path";
import { serveStatic } from "./static-server.mjs";

const args = process.argv.slice(2);
const root = resolve(args[0] && !args[0].startsWith("--") ? args[0] : "dist");
const port = args.includes("--port") ? Number(args[args.indexOf("--port") + 1]) : 4321;

const { server } = await serveStatic(root, { port });
console.log(`serving ${root} on http://127.0.0.1:${port}`);

process.on("SIGTERM", () => server.closeAllConnections());
