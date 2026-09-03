import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const playgroundRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  turbopack: {
    root: resolve(playgroundRoot, ".."),
  },
};

export default nextConfig;
