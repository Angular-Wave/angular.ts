const fs = require("fs");
const path = require("path");

const packageJsonPath = path.resolve(__dirname, "../package.json");

const outputPath = path.resolve(
  __dirname,
  "../docs/layouts/sortcodes/version.html",
);

try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  const version = packageJson.version || "unknown";

  const htmlContent = `<p>Version: ${version}</p>\n`;

  fs.writeFileSync(outputPath, htmlContent);

  console.log(`✅ Version HTML file generated at ${outputPath}`);
} catch (error) {
  console.error("❌ Error generating version HTML:", error);
  process.exit(1);
}
