const fs = require("fs");
const path = require("path");
const $ = require("cheerio");
const util = require("./util");

const root = path.resolve(__dirname, "..");
const fixtures = path.resolve(root, "fixtures");

const projectRoot = path.resolve(__dirname, "../../..");
const build = path.resolve(projectRoot, "build");

function rewriteAngularSrc(src, query) {
  if (query) {
    if (query.build) {
      return `${query.build}/${src}`;
    }
    if (query.cdn) {
      return `//ajax.googleapis.com/ajax/libs/angularjs/${query.cdn}/${src}`;
    }
  }
  return `/build/${src}`;
}

function generateFixture(test, query) {
  const indexFile = path.resolve(fixtures, test, "index.html");
  const text = fs.readFileSync(indexFile, "utf8");

  const $$ = $.load(text);

  let firstScript = null;
  let jquery = null;
  let angular = null;
  $$("script").each((i, script) => {
    const src = $(script).attr("src");
    if (src === "jquery.js" && jquery === null) jquery = script;
    else if (src === "angular.js" && angular === null) angular = script;
    if (firstScript === null) firstScript = script;
    if (src) {
      const s = util.stat(path.resolve(build, src));
      if (s && s.isFile()) {
        $(script).attr("src", rewriteAngularSrc(src, query));
      } else {
        $(script).attr("src", util.rewriteTestFile(test, src));
      }
    }
  });

  if (!("jquery" in query) || /^(0|no|false|off|n)$/i.test(query.jquery)) {
    if (jquery) {
      $(jquery).remove();
    }
  } else {
    if (!jquery) {
      jquery = $.load("<script></script>")("script")[0];
      if (firstScript) {
        $(firstScript).before(jquery);
      } else {
        const head = $$("head");
        if (head.length) {
          head.prepend(jquery);
        } else {
          $$.root().first().before(jquery);
        }
      }
    }
    if (!/^\d+\.\d+.*$/.test(query.jquery)) {
      $(jquery).attr("src", "/node_modules/jquery/dist/jquery.js");
    } else {
      $(jquery).attr(
        "src",
        `//ajax.googleapis.com/ajax/libs/jquery/${query.jquery}/jquery.js`,
      );
    }
  }

  return $$.html();
}

module.exports = {
  generate: generateFixture,
};
