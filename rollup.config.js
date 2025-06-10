import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import versionInjector from "rollup-plugin-version-injector";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, "package.json"), "utf-8"),
);

const basePlugins = [resolve(), commonjs(), versionInjector()];

const baseInput = "src/index.js";

export default [
  // UMD build - minified and unminified
  {
    input: baseInput,
    output: [
      {
        name: "angular",
        file: pkg.browser.replace(/\.js$/, ".min.js"),
        format: "umd",
        plugins: [terser()],
      },
      {
        name: "angular",
        file: pkg.browser,
        format: "umd",
      },
    ],
    plugins: basePlugins,
  },

  // ESM build
  {
    input: baseInput,
    external: ["ms"],
    output: [
      {
        file: pkg.module,
        format: "es",
      },
    ],
    plugins: [versionInjector()],
  },
];
