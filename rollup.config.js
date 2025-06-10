import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import pkg from "./package.json" assert { type: "json" };
import terser from "@rollup/plugin-terser";
import versionInjector from "rollup-plugin-version-injector";

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
