import assert from "node:assert/strict";
import test from "node:test";
import { cleanDescription, renderSection, replaceSection, selectNew } from "./check-profile.mjs";

const now = new Date("2026-12-01T00:00:00Z");
const repo = (overrides) => ({
  full_name: "AbhijeetBabar-2025/tool",
  name: "tool",
  html_url: "https://github.com/AbhijeetBabar-2025/tool",
  description: "Turns a difficult report into plain words",
  pushed_at: "2026-11-20T00:00:00Z",
  private: false,
  fork: false,
  archived: false,
  disabled: false,
  ...overrides,
});

test("selects a new, described, recently active project", () => {
  assert.deepEqual(selectNew([repo()], [], now).map((item) => item.name), ["tool"]);
});

test("skips forks, private, archived, seen, stale and undescribed repos", () => {
  const skipped = [
    repo({ fork: true }),
    repo({ private: true }),
    repo({ archived: true }),
    repo({ full_name: "AbhijeetBabar-2025/seen" }),
    repo({ pushed_at: "2026-01-01T00:00:00Z" }),
    repo({ description: "short" }),
    repo({ full_name: "AbhijeetBabar-2025/AbhijeetBabar-2025" }),
  ];
  assert.deepEqual(selectNew(skipped, ["AbhijeetBabar-2025/seen"], now), []);
});

test("removes markup and links from descriptions", () => {
  assert.equal(cleanDescription("A <b>[safe]</b> tool | see https://example.com now"), "A bsafe/b tool see now");
});

test("replaces only the marked section and can empty it", () => {
  const readme = "before\n<!-- profile-check:start -->\nold\n<!-- profile-check:end -->\nafter\n";
  const section = renderSection([{ name: "tool", url: "https://example.com/tool", description: "Plain words" }]);
  const updated = replaceSection(readme, section);
  assert.match(updated, /before\n<!-- profile-check:start -->\n## New on the workbench/);
  assert.match(updated, /\[tool\]\(https:\/\/example.com\/tool\): Plain words\n<!-- profile-check:end -->\nafter/);
  assert.doesNotMatch(updated, /old/);
  assert.equal(replaceSection(updated, ""), "before\n<!-- profile-check:start -->\n<!-- profile-check:end -->\nafter\n");
});

test("fails clearly when the markers are missing", () => {
  assert.throws(() => replaceSection("no markers", ""), /missing the/);
});
