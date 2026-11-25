import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const packageRoot = "/usr/share/soulsteads-website";
const dpkgDeb = process.env.DPKG_DEB || "dpkg-deb";

function filesUnder(directory) {
  const files = [];
  const visit = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) visit(path);
      else files.push(relative(directory, path));
    }
  };
  visit(directory);
  return files.sort();
}

test("Debian website package installs only the site payload and required notices", {
  skip: spawnSync(dpkgDeb, ["--version"]).status !== 0 && "requires dpkg-deb",
}, () => {
  const work = mkdtempSync(join(tmpdir(), "soulsteads-website-deb-"));
  try {
    const output = join(work, "out");
    const build = spawnSync("bash", ["scripts/build-deb.sh", output], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, DPKG_DEB: dpkgDeb },
    });
    assert.equal(build.status, 0, build.stderr);

    const packages = readdirSync(output).filter((name) => name.endsWith(".deb"));
    assert.equal(packages.length, 1, `expected one package, got: ${packages.join(", ")}`);
    assert.match(packages[0], /^soulsteads-website_0\+git\d{8}\.g[0-9a-f]{12}_all\.deb$/);

    const extract = join(work, "extract");
    execFileSync(dpkgDeb, ["-x", join(output, packages[0]), extract]);
    const listing = execFileSync(dpkgDeb, ["--contents", join(output, packages[0])], { encoding: "utf8" });
    assert.match(listing.split("\n")[0], /^drwxr-xr-x\s+root\/root\s+.* \.\/$/);
    assert.deepEqual(filesUnder(join(extract, packageRoot)), [
      ".nojekyll",
      "404.html",
      "assets/agent-connections-compact.svg",
      "assets/agent-connections.svg",
      "assets/lineup-map.svg",
      "assets/site.js",
      "assets/social.png",
      "assets/social.svg",
      "assets/soulsteads-logo.png",
      "assets/style.css",
      "index.html",
      "llms.txt",
      "robots.txt",
      "sitemap.xml",
    ]);
    assert.ok(existsSync(join(extract, "usr/share/doc/soulsteads-website/LICENSE")));
    assert.ok(existsSync(join(extract, "usr/share/doc/soulsteads-website/NOTICE")));
    assert.ok(!existsSync(join(extract, packageRoot, ".git")));
    assert.ok(!existsSync(join(extract, packageRoot, "tests")));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
