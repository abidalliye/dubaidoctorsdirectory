import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { zipFunctions } from "@netlify/zip-it-and-ship-it";

const toml = readFileSync("netlify.toml", "utf8");
const externalNodeModules = JSON.parse(
  toml.match(/external_node_modules\s*=\s*(\[[^\]]*\])/)[1],
);
const bundles = await zipFunctions(
  "netlify/functions",
  ".netlify/functions-packaged",
  {
    basePath: resolve("."),
    repositoryRoot: resolve("."),
    config: {
      "*": { nodeBundler: "esbuild", nodeVersion: "22", externalNodeModules },
    },
  },
);
for (const bundle of bundles)
  console.log(`Packaged ${bundle.name}: ${bundle.path}`);
