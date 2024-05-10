const url = require("url");
const util = require("./util");
const fixture = require("./fixture");

module.exports = middlewareFactory;

function middlewareFactory(base) {
  base = base || "/e2e";
  while (base.length && base[base.length - 1] === "/")
    base = base.slice(0, base.length - 1);
  const fixture_regexp = new RegExp(
    `^${base}/fixtures/([a-zA-Z0-9_-]+)(/(index.html)?)?$`,
  );
  const static_regexp = new RegExp(`^${base}/fixtures/([a-zA-Z0-9_-]+)(/.*)$`);

  return function (req, res, next) {
    let match;
    let basicUrl = req.url;
    const idx = basicUrl.indexOf("?");
    if (idx >= 0) {
      basicUrl = basicUrl.slice(0, idx);
    }
    if ((match = fixture_regexp.exec(basicUrl))) {
      if (util.testExists(match[1])) {
        try {
          const { query } = url.parse(req.url, true);
          res.write(fixture.generate(match[1], query));
          res.end();
        } catch (e) {
          return next(e);
        }
      } else {
        return next(`Fixture ${match[1]} not found.`);
      }
    } else if ((match = static_regexp.exec(basicUrl))) {
      const rewritten = util.rewriteTestFile(match[1], match[2]);
      if (rewritten !== false) {
        req.url = rewritten;
      }
      next();
    } else {
      return next();
    }
  };
}
