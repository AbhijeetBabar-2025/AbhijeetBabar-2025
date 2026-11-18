#!/usr/bin/env node
// Finds new public projects worth showing and adds them to the README.
// Run with --baseline to record every current repo without featuring any.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = join(ROOT, "data", "profile-check.json");
const README = join(ROOT, "README.md");
const OWNER = "AbhijeetBabar-2025";
const SOURCES = [`users/${OWNER}/repos?type=owner`, "orgs/Kranti-kari-tech/repos?type=public"];
const START = "<!-- profile-check:start -->";
const END = "<!-- profile-check:end -->";
const MIN_DESCRIPTION = 20;
const MAX_DESCRIPTION = 120;
const MAX_AGE_DAYS = 180;
const MAX_SHOWN = 4;

export function cleanDescription(text) {
  const clean = (text ?? "").replace(/[\[\]<>`|*_#\\]/g, "").replace(/https?:\/\/\S+/g, "").replace(/\s+/g, " ").trim();
  return clean.length > MAX_DESCRIPTION ? `${clean.slice(0, MAX_DESCRIPTION - 3).trimEnd()}...` : clean;
}

export function selectNew(repos, seen, now = new Date()) {
  const oldest = now.getTime() - MAX_AGE_DAYS * 86_400_000;
  return repos
    .filter((repo) => !repo.private && !repo.fork && !repo.archived && !repo.disabled)
    .filter((repo) => repo.full_name !== `${OWNER}/${OWNER}` && !seen.includes(repo.full_name))
    .filter((repo) => cleanDescription(repo.description).length >= MIN_DESCRIPTION)
    .filter((repo) => new Date(repo.pushed_at).getTime() >= oldest)
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .map((repo) => ({ fullName: repo.full_name, name: repo.name, url: repo.html_url, description: cleanDescription(repo.description) }));
}

export function renderSection(recent) {
  if (!recent.length) return "";
  const items = recent.map((repo) => `- [${repo.name}](${repo.url}): ${repo.description}`).join("\n");
  return `## New on the workbench\n\nI add new public projects here when I spot them.\n\n${items}`;
}

export function replaceSection(readme, section) {
  const start = readme.indexOf(START);
  const end = readme.indexOf(END);
  if (start === -1 || end < start) throw new Error(`README.md is missing the ${START} and ${END} markers. Restore them and rerun.`);
  const body = section ? `\n${section}\n` : "\n";
  return `${readme.slice(0, start + START.length)}${body}${readme.slice(end)}`;
}

async function fetchRepos(source) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "profile-readme-check" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const repos = [];
  for (let page = 1; ; page++) {
    const response = await fetch(`https://api.github.com/${source}&per_page=100&page=${page}`, { headers });
    if (!response.ok) throw new Error(`GitHub returned ${response.status} for ${source}. Nothing was changed. Rerun the check.`);
    const batch = await response.json();
    repos.push(...batch);
    if (batch.length < 100) return repos;
  }
}

async function main() {
  const baseline = process.argv.includes("--baseline");
  const state = baseline ? { seen: [], recent: [] } : JSON.parse(await readFile(STATE, "utf8"));
  const repos = (await Promise.all(SOURCES.map(fetchRepos))).flat();
  const found = baseline ? [] : selectNew(repos, state.seen);
  const seen = baseline ? repos.map((repo) => repo.full_name) : [...state.seen, ...found.map((repo) => repo.fullName)];
  const recent = [...found, ...state.recent].slice(0, MAX_SHOWN);
  const readme = await readFile(README, "utf8");
  await writeFile(README, replaceSection(readme, renderSection(recent)));
  await writeFile(STATE, `${JSON.stringify({ seen: [...new Set(seen)].sort(), recent }, null, 2)}\n`);
  console.log(found.length ? `Added: ${found.map((repo) => repo.fullName).join(", ")}` : "Nothing new to add.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
