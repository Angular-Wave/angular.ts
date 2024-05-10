const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const tests = path.resolve(root, "fixtures");

function stat(path) {
  try {
    return fs.statSync(path);
  } catch (e) {
    // Ignore ENOENT.
    if (e.code !== "ENOENT") {
      throw e;
    }
  }
}

function testExists(testname) {
  const s = stat(path.resolve(tests, testname));
  return s && s.isDirectory();
}

function rewriteTestFile(testname, testfile) {
  if (testfile.search(/^https?:\/\//) === 0) {
    return testfile;
  }

  let i = 0;
  while (testfile[i] === "/") ++i;
  testfile = testfile.slice(i);
  const s = stat(path.resolve(tests, testname, testfile));
  if (s && (s.isFile() || s.isDirectory())) {
    return ["/test/e2e/fixtures", testname, testfile].join("/");
  }
  return false;
}

module.exports = {
  stat,
  testExists,
  rewriteTestFile,
};
