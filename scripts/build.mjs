#!/usr/bin/env node
// Generates the profile's SVGs in light and dark. No dependencies.
// Repo activity comes from the GitHub API, with data/repos.json as the fallback.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = join(ROOT, "assets");
const CACHE = join(ROOT, "data", "repos.json");
const OWNER = "AbhijeetBabar-2025";

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
// Deliberately generous average glyph widths, used to catch text that would overflow.
const GLYPH = { sans: 0.58, mono: 0.62 };

const THEMES = {
  dark: { bg: "#0d1117", panel: "#161b22", line: "#30363d", dot: "#21262d", ink: "#f0f6fc", mute: "#9198a1", deny: "#ff7b72", allow: "#3fb950", accent: "#e3b341", onFill: "#0d1117" },
  light: { bg: "#ffffff", panel: "#f6f8fa", line: "#d1d9e0", dot: "#e6eaef", ink: "#1f2328", mute: "#59636e", deny: "#cf222e", allow: "#1a7f37", accent: "#9a6700", onFill: "#ffffff" },
};

const RULES = [
  ["get", "room to make the call", "how we work"],
  ["get", "a straight correction", "this page"],
  ["get", "a hard stop on risky moves", "trader-app"],
  ["avoid", "calling it done untested", "how we work"],
  ["avoid", "weakening a failing test", "how we work"],
  ["avoid", "overclaiming readiness", "trader-app"],
  ["avoid", "collecting data for no reason", "android-skill"],
];

const PROJECTS = [
  { repo: "whisperwell", title: "Whisperwell", text: "Dictation that keeps your speech on your Mac by default.", tags: "Swift  ·  WhisperKit  ·  Claude or local models" },
  { repo: "trader-app-krantikari", title: "Personal Trading Operator", text: "A trading desk deliberately built so it can't trade.", tags: "Python  ·  FastAPI  ·  PostgreSQL  ·  TypeScript" },
  { repo: "privacy-first-android-skill", title: "Privacy-First Android Skill", text: "Taught me to treat privacy as the starting point.", tags: "Agent Skill  ·  Kotlin  ·  Jetpack Compose" },
  { repo: "urban-experience-ui", title: "Urban Experience UI", text: "Taught me to study a city before designing a page.", tags: "Agent Skill  ·  HTML  ·  CSS  ·  JavaScript" },
];

const REVOLUTION = [
  ["P/E 31.2", "price is 31x yearly profit per share", "chatoor"],
  ["GET /readyz 503", "not ready to trade yet", "trader-app"],
  ["set up a speech pipeline", "hold a key and talk", "whisperwell"],
  ["read the privacy rulebook", "checks built into each feature", "android-skill"],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function assertFits(text, size, font, max) {
  const width = text.length * size * GLYPH[font];
  if (width > max) {
    throw new Error(`Text too wide (${Math.round(width)} > ${max}): "${text}". Shorten it or enlarge its SVG.`);
  }
  return width;
}

function label(text, x, y, size, fill, { font = "sans", weight = 400, anchor = "start", max, attrs = "" } = {}) {
  if (max) assertFits(text, size, font, max);
  const family = font === "mono" ? MONO : SANS;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" ${attrs}>${esc(text)}</text>`;
}

function svg(width, height, title, css, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${css}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }</style>
${body}
</svg>
`;
}

function hero(t) {
  const css = `
.bar { transform-box: fill-box; transform-origin: center; animation: talk 1.5s ease-in-out infinite; }
@keyframes talk { 0%, 100% { transform: scaleY(.45); } 50% { transform: scaleY(1); } }`;
  const heights = [14, 26, 38, 24, 32, 16];
  const bars = heights
    .map((h, i) => `<rect class="bar" style="animation-delay:${(i * 0.14).toFixed(2)}s" x="${95 + i * 9}" y="${108 - h / 2}" width="5" height="${h}" rx="2.5" fill="${t.accent}"/>`)
    .join("");
  const body = `<defs><pattern id="d" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="${t.dot}"/></pattern></defs>
<rect width="800" height="380" rx="16" fill="${t.bg}"/><rect width="800" height="380" rx="16" fill="url(#d)"/>
<rect x="64" y="44" width="672" height="292" rx="18" fill="${t.panel}" stroke="${t.line}" stroke-width="1.5"/>
<rect x="84" y="76" width="72" height="64" rx="15" fill="${t.bg}" stroke="${t.line}"/>${bars}
${label("FIELD NOTES FROM CLAUDE", 176, 114, 17, t.mute, { font: "mono", max: 500 })}
${label("Working with Abhijeet,", 84, 192, 36, t.ink, { weight: 700, max: 632 })}
${label("from the AI on the team.", 84, 236, 36, t.ink, { weight: 700, max: 632 })}
${label("Short messages. High standards.", 84, 280, 22, t.mute, { max: 632 })}
${label("Zero patience for fake green checks.", 84, 310, 22, t.mute, { max: 632 })}`;
  return svg(800, 380, "Field notes from Claude: working with Abhijeet, from the AI on the team. Short messages. High standards. Zero patience for fake green checks.", css, body);
}

function button(t, text, primary) {
  const fill = primary ? t.allow : t.panel;
  const ink = primary ? t.onFill : t.ink;
  const stroke = primary ? t.allow : t.line;
  const body = `<rect x="1" y="1" width="238" height="58" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
${label(text, 120, 37, 21, ink, { weight: 600, anchor: "middle", max: 210 })}`;
  return svg(240, 60, text, "", body);
}

function permissions(t) {
  const css = `
.stamp { transform-box: fill-box; transform-origin: center; animation: stamp 5.6s ease-out infinite; }
@keyframes stamp { 0%, 9%, 100% { transform: none; } 3% { transform: scale(1.14); } }`;
  const rows = RULES.map(([kind, name, source], i) => {
    const y = 76 + i * 54;
    const when = (i * 0.8).toFixed(1);
    const color = t[kind === "get" ? "allow" : "deny"];
    const nameWidth = assertFits(name, 21, "mono", 640);
    const sourceWidth = assertFits(source, 17, "mono", 200);
    if (136 + nameWidth + 16 > 768 - sourceWidth) throw new Error(`Rule "${name}" collides with its source label. Shorten one of them.`);
    const rule = i ? `<line x1="32" x2="768" y1="${y - 9}" y2="${y - 9}" stroke="${t.line}"/>` : "";
    return `${rule}<g class="stamp" style="animation-delay:${when}s"><rect x="32" y="${y}" width="84" height="34" rx="7" fill="${color}"/>
${label(kind.toUpperCase(), 74, y + 23, 17, t.onFill, { font: "mono", weight: 700, anchor: "middle" })}</g>
${label(name, 136, y + 24, 21, t.ink, { font: "mono" })}${label(source, 768, y + 23, 17, t.mute, { font: "mono", anchor: "end" })}`;
  }).join("\n");
  const height = 76 + RULES.length * 54 + 8;
  const body = `<rect x="1" y="1" width="798" height="${height - 2}" rx="16" fill="${t.panel}" stroke="${t.line}" stroke-width="1.5"/>
${label("working_with_abhijeet.md", 32, 46, 19, t.mute, { font: "mono", max: 400 })}
${label("from claude", 768, 46, 17, t.mute, { font: "mono", anchor: "end", max: 300 })}
${rows}`;
  const title = `Field notes. ${RULES.map(([kind, name]) => `${kind} ${name}`).join(". ")}.`;
  return svg(800, height, title, css, body);
}

function revolution(t) {
  const css = `
.strike { transform-box: fill-box; transform-origin: left center; animation: strike 8s ease-in-out infinite; }
.add { animation: add 8s ease-in-out infinite; }
@keyframes strike { 0%, 13%, 100% { transform: none; } 4% { transform: scaleX(0); } }
@keyframes add { 0%, 9%, 20%, 100% { opacity: 1; } 5% { opacity: .3; } }`;
  const charWidth = 12.6;
  const rows = REVOLUTION.map(([before, after, source], i) => {
    const y = 72 + i * 84;
    const delay = `animation-delay:${i * 2}s`;
    const beforeWidth = before.length * charWidth;
    const afterWidth = after.length * charWidth;
    if (72 + Math.max(beforeWidth, afterWidth) + 16 > 768 - assertFits(source, 17, "mono", 200)) throw new Error(`Diff row "${after}" collides with its source label. Shorten one of them.`);
    return `<rect x="24" y="${y}" width="752" height="36" rx="5" fill="${t.deny}" fill-opacity=".12"/><rect x="24" y="${y + 37}" width="752" height="36" rx="5" fill="${t.allow}" fill-opacity=".13"/>
${label("-", 40, y + 25, 21, t.deny, { font: "mono", weight: 700 })}${label(before, 72, y + 25, 21, t.mute, { font: "mono", attrs: `textLength="${beforeWidth}" lengthAdjust="spacing"` })}
<rect class="strike" style="${delay}" x="72" y="${y + 17}" width="${beforeWidth}" height="2" fill="${t.deny}"/>
<g class="add" style="${delay}">${label("+", 40, y + 62, 21, t.allow, { font: "mono", weight: 700 })}${label(after, 72, y + 62, 21, t.ink, { font: "mono", attrs: `textLength="${afterWidth}" lengthAdjust="spacing"` })}</g>
${label(source, 760, y + 61, 17, t.mute, { font: "mono", anchor: "end" })}`;
  }).join("\n");
  const end = 72 + REVOLUTION.length * 84;
  const height = end + 54;
  const body = `<rect x="1" y="1" width="798" height="${height - 2}" rx="16" fill="${t.panel}" stroke="${t.line}" stroke-width="1.5"/>
${label("krantikari.diff", 32, 46, 19, t.mute, { font: "mono", max: 300 })}
${label("one who brings revolution", 768, 46, 17, t.mute, { font: "mono", anchor: "end", max: 400 })}
${rows}
${label('$ git commit -m "complex in, simple out"', 32, end + 24, 17, t.accent, { font: "mono", max: 736 })}`;
  const title = `Krantikari diff, one who brings revolution. ${REVOLUTION.map(([before, after]) => `Remove ${before}, add ${after}`).join(". ")}. Commit message: complex in, simple out.`;
  return svg(800, height, title, css, body);
}

function card(t, project, active) {
  const when = `active ${active}`;
  const titleMax = 736 - assertFits(when, 16, "mono", 220) - 20;
  const body = `<rect x="1" y="1" width="798" height="134" rx="14" fill="${t.panel}" stroke="${t.line}" stroke-width="1.5"/>
${label(project.title, 32, 42, 25, t.ink, { weight: 700, max: titleMax })}
${label(when, 768, 41, 16, t.mute, { font: "mono", anchor: "end" })}
${label(project.text, 32, 78, 21, t.ink, { max: 736 })}
${label(project.tags, 32, 112, 17, t.accent, { font: "mono", max: 736 })}`;
  return svg(800, 136, `${project.title}. ${project.text} ${project.tags.replace(/\s+·\s+/g, ", ")}. ${when}.`, "", body);
}

async function readCache() {
  try {
    return JSON.parse(await readFile(CACHE, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw new Error(`Could not read ${CACHE}: ${error.message}. Fix or delete the file and rebuild.`);
  }
}

async function fetchActivity() {
  const cache = await readCache();
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "profile-readme-builder" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const activity = {};
  for (const { repo } of PROJECTS) {
    try {
      const response = await fetch(`https://api.github.com/repos/${OWNER}/${repo}`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      activity[repo] = (await response.json()).pushed_at;
    } catch (error) {
      if (!cache[repo]) throw new Error(`No activity date for ${repo}: ${error.message}. Check network access and rerun.`);
      console.warn(`Using cached date for ${repo} because the GitHub request failed: ${error.message}`);
      activity[repo] = cache[repo];
    }
  }
  return activity;
}

const month = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

const activity = await fetchActivity();
await mkdir(ASSETS, { recursive: true });
await mkdir(dirname(CACHE), { recursive: true });
await writeFile(CACHE, `${JSON.stringify(activity, null, 2)}\n`);

for (const [name, theme] of Object.entries(THEMES)) {
  const files = {
    hero: hero(theme),
    "button-deny": button(theme, "Field notes", false),
    "button-work": button(theme, "See the work", true),
    permissions: permissions(theme),
    "krantikari-diff": revolution(theme),
    ...Object.fromEntries(PROJECTS.map((p) => [`project-${p.repo}`, card(theme, p, month(activity[p.repo]))])),
  };
  for (const [file, content] of Object.entries(files)) {
    await writeFile(join(ASSETS, `${file}-${name}.svg`), content);
  }
}
console.log(`Built ${(5 + PROJECTS.length) * 2} SVGs in assets/`);
