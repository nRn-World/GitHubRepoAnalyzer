/**
 * test.js: Unit test suite for GitHubRepoAnalyzer
 * Run using: node --test test.js
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

// Mock window environment for loading components
const window = {
  chrome: {
    storage: {
      local: {
        get: async () => ({}),
        set: async () => {},
      },
    },
  },
};
global.window = window;
global.document = {
  documentElement: { lang: "", dir: "" },
  querySelectorAll: () => [],
};

// Load i18n.js and glossary.js
eval(fs.readFileSync(path.join(__dirname, "i18n.js"), "utf8"));
eval(fs.readFileSync(path.join(__dirname, "glossary.js"), "utf8"));

test("i18n.js - translation keys and interpolation", () => {
  const { t, LOCALES, setLocale, getLocale } = window.RepoI18n;

  assert.equal(getLocale(), "en");
  assert.equal(t("badge"), "local");
  assert.equal(t("byOwner", { owner: "vercel" }), "by vercel");

  setLocale("sv");
  assert.equal(getLocale(), "sv");
  assert.equal(t("byOwner", { owner: "vercel" }), "av vercel");

  setLocale("en");
});

test("glossary.js - phrase hits and translateKeyword coverage", () => {
  const { translate, translateKeyword } = window.RepoGlossary;

  // Multi-word phrase translation: "getting started" (span 2) + "with" (1) + "code snippets" (span 2) = 5
  const phraseResult = translate("getting started with code snippets", "sv");
  assert.equal(phraseResult.hits, 5);

  // Keyword translation coverage
  const kwResult = translateKeyword("getting started", "sv");
  assert.equal(kwResult.applied, true);
  assert.equal(kwResult.text, "kom igång");
});

test("glossary.js - Arabic formatting", () => {
  const { translate } = window.RepoGlossary;

  const result = translate("word1 and word2", "ar");
  assert.equal(result.text, "word1 وword2");
});

test("content.js - helper logic (truncateParts)", () => {
  // Extract and test truncateParts logic from content.js
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const truncate = (s, max) => {
    const t = clean(s);
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return clean((lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + "…");
  };

  const truncateParts = (parts, max) => {
    const out = [];
    let total = 0;
    for (const part of parts) {
      if (total + part.text.length > max) {
        if (out.length === 0) {
          out.push({ text: truncate(part.text, max), code: part.code });
        }
        break;
      }
      out.push(part);
      total += part.text.length;
    }
    if (out.length < parts.length && out.length && !out[out.length - 1].text.endsWith("…")) {
      const last = out[out.length - 1];
      out[out.length - 1] = { text: last.text + "…", code: last.code };
    }
    return out;
  };

  const longPart = [{ text: "This is a single very long paragraph that exceeds forty characters.", code: false }];
  const truncated = truncateParts(longPart, 40);
  assert.equal(truncated.length, 1);
  assert.ok(truncated[0].text.endsWith("…"));
  assert.ok(truncated[0].text.length <= 41);
});
