module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  overrides: [
    {
      files: ['**.js'], 
      env: {
        node: true,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    "import/prefer-default-export": "off",
    "no-multy-assign": "off",
    "no-param-reassign": "off"
  },
  ignorePatterns: ["**/*.spec.js"],
};
