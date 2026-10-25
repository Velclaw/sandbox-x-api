import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const config = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));
const compiler = JSON.parse(readFileSync(new URL("tsconfig.json", root), "utf8"));
const documentation = readFileSync(new URL("index.html", root));
const artifacts = {
  "index.js": 'export { slugify } from "./string.js";\n',
  "index.d.ts": 'export { slugify } from "./string.js";\n',
  "index.js.map": '{"version":3,"sources":["../src/index.ts"],"mappings":""}\n',
  "string.js": 'export const slugify = (value) => value;\n'
};

function buildFixture(t, { buildStatus = 0, createOutput = true } = {}) {
  // The space in the path also exercises execution from a quoted working directory.
  const directory = mkdtempSync(join(tmpdir(), "ocode-vercel build-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bin = join(directory, "bin");
  const log = join(directory, "commands.jsonl");
  const output = join(directory, config.outputDirectory);
  mkdirSync(bin);
  writeFileSync(log, "");
  writeFileSync(join(directory, "index.html"), documentation);

  // Replace only Bun's library build; execute the configured shell command and copy with real Node.
  writeFileSync(join(bin, "bun"), `#!${process.execPath}
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
fs.appendFileSync(process.env.MOCK_COMMAND_LOG, JSON.stringify(args) + "\\n");
if (JSON.stringify(args) !== JSON.stringify(["run", "build"])) process.exit(99);
if (Number(process.env.MOCK_BUILD_STATUS)) process.exit(Number(process.env.MOCK_BUILD_STATUS));
if (process.env.MOCK_CREATE_OUTPUT === "true") {
  const output = ${JSON.stringify(compiler.compilerOptions.outDir)};
  fs.mkdirSync(output, { recursive: true });
  for (const [name, contents] of Object.entries(${JSON.stringify(artifacts)})) {
    fs.writeFileSync(path.join(output, name), contents);
  }
}
`, { mode: 0o755 });

  return {
    directory,
    output,
    run() {
      const result = spawnSync("sh", ["-c", config.buildCommand], {
        cwd: directory,
        encoding: "utf8",
        timeout: 5000,
        env: {
          PATH: `${bin}${delimiter}${process.env.PATH}`,
          MOCK_COMMAND_LOG: log,
          MOCK_BUILD_STATUS: String(buildStatus),
          MOCK_CREATE_OUTPUT: String(createOutput)
        }
      });
      assert.ifError(result.error);
      assert.equal(result.signal, null, "The build command must finish without being killed");
      const calls = readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
      assert.deepEqual(calls, [["run", "build"]], "Run the existing library build exactly once");
      return result;
    }
  };
}

function assertArtifacts(output) {
  for (const [name, contents] of Object.entries(artifacts)) {
    assert.equal(readFileSync(join(output, name), "utf8"), contents, `Preserve library artifact: ${name}`);
  }
}

test("Vercel publishes the TypeScript build output directory", () => {
  assert.equal(config.outputDirectory, "dist");
  assert.equal(config.outputDirectory, compiler.compilerOptions.outDir);
  assert.equal(typeof config.buildCommand, "string");
  assert.ok(config.buildCommand.trim(), "Vercel must have an explicit build command");
});

test("Vercel builds from a clean directory and copies the documentation byte for byte alongside library artifacts", (t) => {
  const fixture = buildFixture(t);
  assert.equal(existsSync(fixture.output), false);

  const result = fixture.run();

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readFileSync(join(fixture.output, "index.html")), documentation);
  assert.deepEqual(readFileSync(join(fixture.directory, "index.html")), documentation, "Keep the source documentation");
  assertArtifacts(fixture.output);
});

test("Vercel replaces a stale published documentation page", (t) => {
  const fixture = buildFixture(t);
  mkdirSync(fixture.output);
  writeFileSync(join(fixture.output, "index.html"), "stale documentation");

  const result = fixture.run();

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readFileSync(join(fixture.output, "index.html")), documentation);
  assertArtifacts(fixture.output);
});

test("Vercel copies an empty source page without retaining stale content", (t) => {
  const fixture = buildFixture(t);
  writeFileSync(join(fixture.directory, "index.html"), "");
  mkdirSync(fixture.output);
  writeFileSync(join(fixture.output, "index.html"), "stale documentation");

  const result = fixture.run();

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readFileSync(join(fixture.output, "index.html")).length, 0);
  assertArtifacts(fixture.output);
});

test("Vercel propagates a failed library build without copying documentation", (t) => {
  const fixture = buildFixture(t, { buildStatus: 23 });

  const result = fixture.run();

  assert.equal(result.status, 23, result.stderr);
  assert.equal(existsSync(fixture.output), false);
  assert.deepEqual(readFileSync(join(fixture.directory, "index.html")), documentation);
});

test("Vercel leaves existing output untouched when the library build fails", (t) => {
  const fixture = buildFixture(t, { buildStatus: 23 });
  mkdirSync(fixture.output);
  writeFileSync(join(fixture.output, "index.html"), "previous documentation");
  writeFileSync(join(fixture.output, "index.js"), "previous library");

  const result = fixture.run();

  assert.equal(result.status, 23, result.stderr);
  assert.equal(readFileSync(join(fixture.output, "index.html"), "utf8"), "previous documentation");
  assert.equal(readFileSync(join(fixture.output, "index.js"), "utf8"), "previous library");
});

test("Vercel fails when the source documentation is missing while preserving built artifacts", (t) => {
  const fixture = buildFixture(t);
  rmSync(join(fixture.directory, "index.html"));

  const result = fixture.run();

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ENOENT/);
  assert.equal(existsSync(join(fixture.output, "index.html")), false);
  assertArtifacts(fixture.output);
});

test("Vercel fails if a successful library build does not produce its output directory", (t) => {
  const fixture = buildFixture(t, { createOutput: false });

  const result = fixture.run();

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ENOENT/);
  assert.equal(existsSync(fixture.output), false);
  assert.deepEqual(readFileSync(join(fixture.directory, "index.html")), documentation);
});
