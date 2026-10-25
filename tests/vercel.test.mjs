import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const config = JSON.parse(readFileSync(new URL("vercel.json", root), "utf8"));
const { compilerOptions } = JSON.parse(readFileSync(new URL("tsconfig.json", root), "utf8"));
const homepage = readFileSync(new URL("index.html", root));
const artifacts = {
  "index.js": "export const built = true;\n",
  "index.d.ts": "export declare const built: boolean;\n",
  "index.js.map": '{"version":3,"sources":["../src/index.ts"],"mappings":""}\n'
};

function buildFixture(t, { html = homepage, buildStatus = 0 } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "ocode-vercel-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const bin = join(directory, "bin");
  const log = join(directory, "build-calls.jsonl");
  const output = join(directory, compilerOptions.outDir);
  const source = join(directory, "index.html");
  mkdirSync(bin);
  writeFileSync(log, "");
  if (html !== null) writeFileSync(source, html);

  // Replace only the library build; execute the configured shell command and real file copy.
  writeFileSync(join(bin, "bun"), `#!${process.execPath}
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(process.argv.slice(2)) + "\\n");
if (Number(process.env.MOCK_BUILD_STATUS)) process.exit(Number(process.env.MOCK_BUILD_STATUS));
fs.mkdirSync(${JSON.stringify(output)}, { recursive: true });
for (const [name, contents] of Object.entries(${JSON.stringify(artifacts)})) {
  fs.writeFileSync(require("node:path").join(${JSON.stringify(output)}, name), contents);
}
`, { mode: 0o755 });

  return {
    output,
    source,
    run() {
      const result = spawnSync("/bin/sh", ["-c", config.buildCommand], {
        cwd: directory,
        encoding: "utf8",
        timeout: 5000,
        env: {
          PATH: `${bin}${delimiter}${dirname(process.execPath)}${delimiter}${process.env.PATH}`,
          MOCK_BUILD_STATUS: String(buildStatus)
        }
      });
      assert.ifError(result.error);
      assert.equal(result.signal, null, "The build command must finish without being killed");
      const calls = readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
      assert.deepEqual(calls.at(-1), ["run", "build"], "Run the existing library build script");
      return { ...result, calls };
    }
  };
}

function assertArtifacts(output) {
  for (const [name, contents] of Object.entries(artifacts)) {
    assert.equal(readFileSync(join(output, name), "utf8"), contents, `Preserve ${name}`);
  }
}

test("Vercel publishes the TypeScript compiler's output directory", () => {
  assert.equal(config.outputDirectory, compilerOptions.outDir);
  assert.equal(typeof config.buildCommand, "string");
  assert.ok(config.buildCommand.trim(), "Vercel must have an explicit build command");
});

test("Vercel builds before copying the documentation into a fresh output directory", (t) => {
  const fixture = buildFixture(t);
  assert.equal(existsSync(fixture.output), false);
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.calls, [["run", "build"]]);
  assert.deepEqual(readFileSync(join(fixture.output, "index.html")), homepage);
  assert.deepEqual(readFileSync(fixture.source), homepage, "Keep the source documentation intact");
  assertArtifacts(fixture.output);
});

test("Vercel replaces stale documentation and supports repeated builds", (t) => {
  const fixture = buildFixture(t);
  mkdirSync(fixture.output);
  writeFileSync(join(fixture.output, "index.html"), "stale documentation");
  const first = fixture.run();
  assert.equal(first.status, 0, first.stderr);
  assert.deepEqual(readFileSync(join(fixture.output, "index.html")), homepage);

  const updated = "<!doctype html><title>Updated documentation</title>\n";
  writeFileSync(fixture.source, updated);
  const second = fixture.run();
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(second.calls, [["run", "build"], ["run", "build"]]);
  assert.equal(readFileSync(join(fixture.output, "index.html"), "utf8"), updated);
  assertArtifacts(fixture.output);
});

test("Vercel copies documentation byte for byte, including empty and UTF-8 files", async (t) => {
  for (const [name, html] of [
    ["empty file", Buffer.alloc(0)],
    ["UTF-8 without a final newline", Buffer.from("<!doctype html><p>Hướng dẫn — 🚀</p>")]
  ]) {
    await t.test(name, (t) => {
      const fixture = buildFixture(t, { html });
      const result = fixture.run();
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(readFileSync(join(fixture.output, "index.html")), html);
      assertArtifacts(fixture.output);
    });
  }
});

test("Vercel propagates build failure and skips copying documentation", async (t) => {
  for (const existingOutput of [false, true]) {
    await t.test(existingOutput ? "existing output" : "fresh output", (t) => {
      const fixture = buildFixture(t, { buildStatus: 17 });
      if (existingOutput) {
        mkdirSync(fixture.output);
        writeFileSync(join(fixture.output, "index.html"), "previous deployment");
      }
      const result = fixture.run();
      assert.equal(result.status, 17, result.stderr);
      assert.deepEqual(result.calls, [["run", "build"]]);
      if (existingOutput) {
        assert.equal(readFileSync(join(fixture.output, "index.html"), "utf8"), "previous deployment");
      } else {
        assert.equal(existsSync(fixture.output), false, "A failed build must not publish documentation");
      }
      assert.deepEqual(readFileSync(fixture.source), homepage);
    });
  }
});

test("Vercel fails when the source documentation is missing and preserves build artifacts", (t) => {
  const fixture = buildFixture(t, { html: null });
  const result = fixture.run();
  assert.notEqual(result.status, 0, "A missing documentation page must fail the deployment build");
  assert.equal(existsSync(join(fixture.output, "index.html")), false);
  assertArtifacts(fixture.output);
});

test("Vercel propagates copy failure when the destination is a directory", (t) => {
  const fixture = buildFixture(t);
  mkdirSync(join(fixture.output, "index.html"), { recursive: true });
  const result = fixture.run();
  assert.notEqual(result.status, 0, "A documentation copy error must fail the deployment build");
  assert.deepEqual(readFileSync(fixture.source), homepage);
  assertArtifacts(fixture.output);
});
