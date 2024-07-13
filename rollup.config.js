import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json' assert { type: 'json' };
import terser from '@rollup/plugin-terser';
import versionInjector from 'rollup-plugin-version-injector';

const SHARED_PLUGINS = [
  terser(), 
  versionInjector()
]

export default [
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'angular',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      resolve(), 
      commonjs()
    ].concat(SHARED_PLUGINS)
  },

  // ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.js',
    external: ['ms'],
    output: { file: pkg.main, format: 'es' },
    plugins: SHARED_PLUGINS,
  },
];
