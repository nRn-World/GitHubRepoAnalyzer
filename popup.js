/**
 * popup.js: UI orchestration.
 *
 * Flow:
 *   1. Restore the saved UI language (English until the user picks another),
 *      translate the popup, then check the active tab's URL. Non-repo pages
 *      get an error state.
 *   2. On click, inject content.js into the tab (chrome.scripting) and read
 *      the analysis result straight from the injection's return value.
 *      No messaging involved, so the freshest content-script code always
 *      runs; even right after an extension update, with no page reload.
 *   3. If the language changes mid-session, re-render the current view so
 *      labels, empty states and messages switch immediately.
 */

const { t, loadLocale, setLocale, fillLanguageSelect, applyTranslations } =
  window.RepoI18n;
const { translateKeyword: glossaryTranslateKeyword } = window.RepoGlossary;

const GITHUB_REPO_URL = /^https?:\/\/(www\.)?github\.com\/[^/]+\/[^/]+/i;

const el = (id) => document.getElementById(id);

const states = {
  error: el("error-state"),
  ready: el("ready-state"),
  loading: el("loading-state"),
  result: el("result-state"),
};

const analyzeBtn = el("analyze-btn");
const analyzeAgainBtn = el("analyze-again-btn");

let lastIssue = null;

/** The data behind the current render, for the "ask your AI" prompt. */
let lastRendered = null;

/** Deep analysis (description, topics, key points, facts) starts collapsed.
 *  The short view answers "what is this"; the rest is opt-in. */
let deepOpen = false;

/** Short badge codes, so a screenshot identifies the failing branch even
 *  when the status line itself is scrolled out of view. */
const ISSUE_BADGE = {
  "no-api": "API",
  "no-model": "MOD",
  "needs-model": "MOD?",
  "detect-failed": "DET",
  "meta-failed": "OM",
  "partial": "DEL",
};

/**
 * Badge = "LOKAL ·1c": locale plus the tail of the build stamp.
 *
 * This lives in the header because the result list scrolls; a diagnosis line
 * at the bottom of a scrolling list is invisible in a screenshot, which is
 * exactly how several failed runs went unreported. The full stamp stays in the
 * tooltip; the letter is what distinguishes one build from the next. When a
 * translation branch failed, the badge also carries its code (·MOD = no
 * model, ·API = no Translator, ·DET = undetectable language, ·OM = About
 * text left behind, ·DEL = partial).
 */
function syncBadge() {
  const badge = el("badge");
  if (!badge) return;
  const code = lastIssue ? ISSUE_BADGE[lastIssue] || "?" : "";
  badge.textContent = `${t("badge")} ·${BUILD.slice(-2)}${code ? ` ·${code}` : ""}`;
  badge.title = `build ${BUILD}${lastIssue ? ` · issue: ${lastIssue}` : ""}`;
  // Amber when translation did not happen, so a screenshot proves there is
  // something to read further down even if the status line is scrolled away.
  badge.classList.toggle("popup__badge--warn", Boolean(lastIssue));
}

/** Show exactly one UI state. */
function showState(name) {
  for (const [key, node] of Object.entries(states)) {
    node.hidden = key !== name;
  }
}

/** Swap the loading label (e.g. "Reading the page…" → "Translating…"). */
function setLoadingText(text) {
  const node = el("loading-text");
  if (node) node.textContent = text;
}

/**
 * Inject content.js and run the analysis in two steps.
 *
 * Chrome does not allow `files` and `func` in the same executeScript call,
 * so we first inject the scraper file, then run a tiny serialized function
 * that calls it and returns the result. Because the file is re-injected on
 * every analyze (it overwrites its export unconditionally), an extension
 * update always replaces the scraper; no stale code, no page reload needed.
 */
async function analyzeTab(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  });

  const injectionResults = await chrome.scripting.executeScript({
    target: { tabId },
    // Wait for the client-rendered parts of the page before scraping, so the
    // first click returns exactly what a later click would.
    func: async () => {
      const api = window.__ghRepoSummarizer;
      await api.waitReady();
      return api.analyze();
    },
  });

  const mainFrame = injectionResults?.find((r) => r.frameId === 0);
  if (!mainFrame) {
    throw new Error("No analysis result returned from the page.");
  }
  return mainFrame.result;
}

/* ------------------------------------------------------------------ *
 * Rendering
 * ------------------------------------------------------------------ */

function setText(node, text, { emptyMessage } = {}) {
  const value = (text || "").trim();
  if (value) {
    node.textContent = value;
    node.classList.remove("is-empty");
  } else {
    node.textContent = emptyMessage || "";
    node.classList.add("is-empty");
  }
}

/* ------------------------------------------------------------------ *
 * State kept for re-rendering when the language changes
 * ------------------------------------------------------------------ */

let currentView = { type: "ready" };
let lastData = null;

/** Ready translation routes, keyed by "source|target". Failures are not cached. */
const translatorCache = new Map();

/**
 * Bumped whenever the translation logic changes, so a screenshot of the popup
 * proves which build is actually running (an extension must be reloaded from
 * chrome://extensions, and a stale build is otherwise indistinguishable from
 * a real bug). Shown in the header badge tooltip and in the DevTools report.
 */
const BUILD = "2026-10-01l";

/**
 * Everything we know about why text did or did not get translated.
 * Readable from the popup's DevTools console as
 * `await window.repoSummarizer.report()`.
 */
const diagnostics = {
  build: BUILD,
  chrome: null,
  target: null,
  apiPresent: false,
  detectorPresent: false,
  detection: null,
  blocks: [],
  note: null,
  issue: null,
  pair: null,
};

window.repoSummarizer = {
  report: () => JSON.stringify(diagnostics, null, 2),
  reset: () => {
    diagnostics.blocks.length = 0;
    diagnostics.note = null;
  },
};

/**
 * Keyword-only glossary pass, for short labels such as the About line or the
 * tagline. Running prose is never touched: a term dictionary cannot fix word
 * order or grammar, so half-translated sentences are worse than none.
 */
function translateKeyword(text) {
  const result = glossaryTranslateKeyword(text, window.RepoI18n.getLocale());
  return result.applied ? result.text : text;
}

/* ------------------------------------------------------------------ *
 * Optional full translation via Chrome's built-in, on-device translator.
 *
 * Not every Chrome build exposes it, so everything is feature-detected and
 * falls back to the author's original text. Nothing leaves the device.
 * ------------------------------------------------------------------ */

/** Translation of the README prose is always on, into the selected language. */
const shouldTranslateProse = () => window.RepoI18n.getLocale() !== "en";

const translatorSupported = () =>
  typeof self !== "undefined" && typeof self.Translator !== "undefined";

const detectorSupported = () =>
  typeof self !== "undefined" && typeof self.LanguageDetector !== "undefined";

/** "und" is "undetermined"; a region suffix carries no information here. */
const normalizeTag = (tag) => {
  if (typeof tag !== "string") return null;
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return base && base !== "und" ? base : null;
};

/**
 * Best guess at a chunk's language, so translation doesn't assume English.
 * Returns null when Chrome has no detector, so callers can apply their own
 * fallback rather than silently treating unknown text as English.
 *
 * detect() resolves to an ARRAY of {detectedLanguage, confidence} objects,
 * ranked most-likely first (per developer.chrome.com/docs/ai/language-detection).
 * Reading a single .detected field off that array yields undefined; which is
 * how every build before 2026-10-01e ended on the detect-failed branch no
 * matter what language the page was in.
 */
async function detectSource(text) {
  try {
    if (detectorSupported()) {
      const detector = await self.LanguageDetector.create();
      const results = await detector.detect(text);
      // Defensive: accept the documented array, or a single object, or nothing.
      const list = Array.isArray(results) ? results : results?.detectedLanguage ? [results] : [];
      const best = list[0] || null;
      const detected = normalizeTag(best?.detectedLanguage);
      const confidence =
        typeof best?.confidence === "number" ? best.confidence : null;
      diagnostics.detection = {
        top: detected,
        confidence,
        ranked: list.slice(0, 3).map((r) => `${r.detectedLanguage} ${typeof r.confidence === "number" ? r.confidence.toFixed(2) : "?"}`),
      };
      if (!detected) return null;
      // Chrome's own guidance: low confidence on short text means unknown.
      if (confidence !== null && confidence < 0.5) return null;
      return detected;
    }
  } catch (err) {
    console.warn("[repo-summarizer] language detection failed", err);
    diagnostics.detection = { error: String(err && err.message ? err.message : err) };
  }
  return null;
}

/**
 * How long to wait for a language model that Chrome is still downloading.
 *
 * Deliberately short. An extension popup is destroyed the moment it loses
 * focus, so a long wait cannot complete anyway: the user clicks the page, the
 * popup dies mid-download, and the next click starts from zero. Waiting a few
 * seconds and then telling the user to click again is the only thing that can
 * actually finish the download; Chrome keeps fetching in the background once
 * the request has been made.
 */
const MODEL_WAIT_MS = 4000;
const MODEL_POLL_MS = 400;

/* ------------------------------------------------------------------ *
 * What is this project FOR? (deterministic, no AI)
 *
 * The author's own words say a lot, but rarely "what am I looking at and
 * why does it exist" in one sentence. This classifier reads structure
 * (README headings, topics, languages, the description) and maps it to a
 * project type plus the concrete capabilities the README documents. Every
 * string is pre-translated in i18n.js, so the result reads natively in
 * whatever language the popup is set to. No network, no model, no guessing
 * beyond keyword evidence.
 * ------------------------------------------------------------------ */

/** Keyword evidence per project type; first match in order wins ties by score. */
const TYPE_SIGNALS = [
  {
    type: "learning",
    weight: 3,
    re: /\b(100[ -]?days?|100\s*дней|tutorial|kurs|course|curriculum|lesson|exercises?|l\u00e4roplan|day\s*\d+|день\s*\d+|изучи|изучить|курс)/i,
    headings: /\b(day\s*\d+|день\s*\d+|exercises?|lessons?|syllabus|curriculum|assignment)/i,
  },
  {
    type: "game",
    weight: 3,
    re: /\b(game|gaming|arcade|platformer|roguelike|puzzle game|sudoku|chess|tetris|snake|minecraft)/i,
    headings: /\b(gameplay|controls|levels?|highscore|high score)/i,
  },
  {
    type: "cli",
    weight: 2,
    re: /\b(cli|command[ -]?line|terminal tool|shell script|zsh|bash tool)/i,
    headings: /\b(usage|flags|options)/i,
  },
  {
    type: "ai-ml",
    weight: 3,
    re: /\b(machine learning|deep learning|neural|llm|gpt|transformer|tensorflow|pytorch|scikit|computer vision|nlp|ai agent|dataset)/i,
    headings: /\b(model (training|architecture)|training|dataset)/i,
  },
  {
    type: "library",
    weight: 2,
    re: /\b(library|sdk|package|module|api client|wrapper|npm|pip install)/i,
    headings: /\b(api reference|installation|getting started|docs)/i,
  },
  {
    type: "website",
    weight: 2,
    re: /\b(website|web ?site|landing page|portfolio|blog|e-?commerce|web ?app|dashboard|interactive)/i,
    headings: /\b(features|screenshots?|demo|pages?)/i,
  },
  {
    type: "tool",
    weight: 2,
    re: /\b(tool|utility|extension|plugin|addon|add-?on|automation|booster|manager)/i,
    headings: /\b(features|installation|configuration)/i,
  },
];

/**
 * Map README headings/topics to capability claims, so the "I korthet" line
 * says what the reader can DO, not just what the thing is called.
 */
const CAPABILITY_SIGNALS = [
  { key: "play", re: /\b(play|gameplay|levels?|score|arcade)/i },
  { key: "learn", re: /\b(learn|tutorial|course|exercises?|day\s*\d+|study)/i },
  { key: "install", re: /\b(installation|getting started|quick ?start|setup)/i },
  { key: "customize", re: /\b(customi[sz]|configur|theme|settings|options)/i },
  { key: "demo", re: /\b(demo|screenshots?|live preview|try it)/i },
  { key: "extend", re: /\b(api|plugin|extension|integrat|sdk|contribut)/i },
  { key: "selfhost", re: /\b(self[ -]?host|deploy|docker|hosting|run locally)/i },
];

/**
 * Classify the project from evidence the page already gave us.
 * Returns the type key and the capability keys the README backs up.
 */
function classifyProject(data = {}) {
  const headings = (data.headings || []).join(" \n ");
  const topics = (data.topics || []).join(" ");
  const desc = `${data.description || ""} ${data.tagline || ""}`;
  const summary = (data.summary || [])
    .map((parts) => (Array.isArray(parts) ? parts.map((p) => p.text).join("") : ""))
    .join(" ");
  const haystack = `${headings}\n${topics}\n${desc}\n${summary}`;

  let best = { type: null, score: 0 };
  for (const signal of TYPE_SIGNALS) {
    let score = 0;
    const body = (haystack.match(signal.re) || []).length;
    if (body) score += signal.weight * Math.min(body, 3);
    if (signal.headings && signal.headings.test(headings)) score += signal.weight;
    if (signal.headings && signal.headings.test(topics)) score += signal.weight;
    if (score > best.score) best = { type: signal.type, score };
  }

  const capabilities = CAPABILITY_SIGNALS.filter((s) => s.re.test(haystack)).map((s) => s.key);
  return { type: best.score >= 3 ? best.type : null, capabilities };
}

/**
 * The text behind the "ask your AI" button: a plain question, the repo link,
 * and everything the popup already figured out. Reads the rendered DOM so the
 * copied text is exactly what the reader is looking at; including the
 * translation they see, not the original wording.
 */
function buildAiPrompt() {
  const url = lastRendered?.owner && lastRendered?.name
    ? `https://github.com/${lastRendered.owner}/${lastRendered.name}`
    : "";

  const short = el("repo-short")?.textContent?.trim() || "";
  const whatItIs = [el("repo-tagline")?.textContent, el("repo-summary")?.textContent]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join("\n");

  return t("aiPrompt", { url, short, what: whatItIs }).trim();
}

/**
 * Build the human "I korthet" sentence: what this project is, what it is
 * for, and what the README documents you can do; in the reader's language.
 * Every fragment is pre-translated; nothing here runs through a translator.
 */
function buildShortVersion(data, classification) {
  if (!classification) return null;
  const { type, capabilities } = classification;
  if (!type) return null;

  const who = t(`type_${type.replace("-", "_")}`);        // "Ett spel", "Ett bibliotek"…
  const purpose = t(`purpose_${type.replace("-", "_")}`); // what it is for
  const caps = capabilities.slice(0, 2).map((key) => t(`cap_${key}`));
  const langs = (data.facts?.languages || []).slice(0, 3);

  const parts = [`${who} ${purpose.replace(/\.$/, "")}.`];
  if (caps.length) {
    parts.push(t("shortCapabilities", { list: caps.join(", ") }));
  }
  if (langs.length) {
    parts.push(t("shortLanguages", { list: langs.join(", ") }));
  }
  return parts.join(" ");
}

/** Why translation did not happen, for the visible status line. */
const translationIssue = {
  none: null,
  noApi: "no-api",
  noModel: "no-model",
  needsModel: "needs-model",
  detectFailed: "detect-failed",
  metaFailed: "meta-failed",
  partial: "partial",
  // Mutable record of the current run.
  value: null,
  pair: null,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Ask Chrome whether a model exists for this pair. Never throws. */
async function probeAvailability(source, target) {
  try {
    return await self.Translator.availability({
      sourceLanguage: source,
      targetLanguage: target,
    });
  } catch (err) {
    console.warn("[repo-summarizer] availability() threw for", source, "→", target, err);
    return "unavailable";
  }
}

/**
 * Create one translator, or null when Chrome has no model for that pair.
 *
 * A pair that is "downloadable" or "downloading" is NOT a dead end: Chrome is
 * fetching the model on first use. Bailing out there is what made a first-ever
 * run look broken; the popup silently showed the original text while the
 * download was still in flight. So we poll until the model is ready, and only
 * give up when the wait times out.
 */
async function createTranslator(source, target) {
  let availability = await probeAvailability(source, target);

  if (availability === "unavailable") return { translator: null, availability };

  const deadline = Date.now() + MODEL_WAIT_MS;
  while (availability !== "available" && Date.now() < deadline) {
    setLoadingText(t("downloadingModel"));
    await sleep(MODEL_POLL_MS);
    availability = await probeAvailability(source, target);
  }

  if (availability !== "available") {
    console.warn("[repo-summarizer] model still not ready for", source, "→", target);
    // "downloadable"/"downloading" means Chrome is fetching it in the
    // background; asking for it again is what eventually gets it working.
    return { translator: null, availability };
  }

  try {
    const translator = await self.Translator.create({
      sourceLanguage: source,
      targetLanguage: target,
    });
    return { translator, availability };
  } catch (err) {
    console.warn("[repo-summarizer] create() failed for", source, "→", target, err);
    return { translator: null, availability: "create-failed" };
  }
}

/**
 * Build a translate() function for source→target.
 *
 * Chrome's bundled model is English-centric: Bulgarian→Swedish can report
 * "unavailable" even though both languages are individually supported. So when
 * the direct pair is missing we route through English (source→en→target),
 * which always has models on both sides. That is why a Bulgarian README still
 * comes back in Swedish instead of its original wording.
 *
 * Returns null when even the pivot is unavailable.
 */
async function buildRoute(source, target) {
  const direct = await createTranslator(source, target);
  if (direct.translator) {
    return {
      source,
      via: null,
      translate: (text) => direct.translator.translate(text),
    };
  }

  if (source === "en" || target === "en") {
    return { source, issue: direct.availability, route: null };
  }

  const toEnglish = await createTranslator(source, "en");
  const fromEnglish = toEnglish.translator
    ? await createTranslator("en", target)
    : { translator: null, availability: toEnglish.availability };

  if (!toEnglish.translator || !fromEnglish.translator) {
    // Prefer the more actionable signal: a pending download beats a hard
    // "unavailable", because retrying is exactly what fixes it.
    const pending =
      toEnglish.availability === "downloadable" ||
      toEnglish.availability === "downloading" ||
      fromEnglish.availability === "downloadable" ||
      fromEnglish.availability === "downloading";
    return { source, issue: pending ? "downloadable" : "unavailable", route: null };
  }

  return {
    source,
    via: "en",
    async translate(text) {
      return fromEnglish.translator.translate(await toEnglish.translator.translate(text));
    },
  };
}

/** "bg→sv" or "bg→en→sv", for the diagnostics report. */
const describeRoute = (route) =>
  route.via ? `${route.source}→${route.via}→${window.RepoI18n.getLocale()}` : `${route.source}→${window.RepoI18n.getLocale()}`;

/**
 * Get (and cache) a translation route for a chunk of text.
 *
 * Detection runs per chunk, not once for the page: a repository can easily
 * have a Swedish README and an English About description, and translating
 * both as one language would leave one of them untouched.
 *
 * Returns null when the text is already in the target language or when the
 * API isn't available.
 */
async function getTranslator(text, fallbackSource = null) {
  const target = window.RepoI18n.getLocale();
  if (!text || !translatorSupported()) return null;

  const detected = await detectSource(text);
  const source = detected || fallbackSource;
  if (!source) {
    // No detector and no fallback: refusing to guess keeps us from feeding
    // Bulgarian text to an en→sv translator as if it were English.
    translationIssue.value = translationIssue.detectFailed;
    return null;
  }
  if (source === target) {
    // The detector claims the text is already in the reader's language. When
    // it is visibly not, that is a detection failure, not a no-op, so say so
    // instead of silently returning the author's wording.
    translationIssue.pair = `${source}→${target}`;
    translationIssue.value = translationIssue.detectFailed;
    return null;
  }

  const key = `${source}|${target}`;
  const cached = translatorCache.get(key);
  if (cached) return cached.translate ? cached : null;

  const built = await buildRoute(source, target);
  if (!built.translate) {
    translationIssue.pair = `${source}→${target}`;
    translationIssue.value =
      built.issue === "downloadable" || built.issue === "downloading"
        ? translationIssue.needsModel
        : translationIssue.noModel;
    return null;
  }

  translatorCache.set(key, built);
  return built;
}

/** Accept either [[{text,code}]] or [{text,code}] and always yield segments. */
const asParts = (item) => {
  if (Array.isArray(item)) return item.filter((p) => p && typeof p.text === "string");
  if (item && typeof item.text === "string") return [item];
  return [];
};

/**
 * Copy the analysis and translate the author's prose into the selected
 * language. Returns a shallow copy with translated text; on any failure the
 * original wording is kept, so the popup is never blank.
 */
async function applyFullTranslation(data) {
  const copy = { ...data };
  copy.summary = (data.summary || []).map(asParts);
  copy.points = (data.points || []).map(asParts);

  diagnostics.target = window.RepoI18n.getLocale();
  diagnostics.apiPresent = translatorSupported();
  diagnostics.detectorPresent = detectorSupported();
  diagnostics.detection = null;
  diagnostics.blocks.length = 0;
  translationIssue.value = null;
  translationIssue.pair = null;
  copy.route = "";

  if (!shouldTranslateProse() || !translatorSupported()) {
    if (!translatorSupported()) {
      translationIssue.value = translationIssue.noApi;
      copy.issue = translationIssue.noApi;
    }
    diagnostics.note = !shouldTranslateProse()
      ? "locale is en, nothing to translate"
      : "Translator API missing in this context";
    diagnostics.issue = copy.issue || null;
    return copy;
  }

  let bodyTranslator = null;
  let metaTranslator = null;

  try {
    const bodyText = [...copy.summary, ...copy.points]
      .map((parts) => parts.map((p) => p.text).join(""))
      .join("\n");
    const metaText = [data.description, data.tagline].filter(Boolean).join("\n");

    // Two separate detections: a repo can mix languages. The README is the
    // long, reliable sample, so a short About line that the detector cannot
    // classify falls back to the language the README turned out to be in.
    bodyTranslator = await getTranslator(bodyText);
    metaTranslator = await getTranslator(metaText, bodyTranslator?.source);

    diagnostics.blocks.push({
      block: "readme",
      source: bodyTranslator?.source ?? null,
      route: bodyTranslator ? describeRoute(bodyTranslator) : "none",
      translated: Boolean(bodyTranslator),
    });
    diagnostics.blocks.push({
      block: "about",
      source: metaTranslator?.source ?? null,
      route: metaTranslator ? describeRoute(metaTranslator) : "none",
      translated: Boolean(metaTranslator),
    });

    if (bodyTranslator) {
      let ok = 0;
      let failed = 0;

      const translateParts = async (parts) => {
        const out = [];
        for (const part of parts) {
          if (part.code) {
            out.push(part); // code is never translated
            continue;
          }
          const text = part.text.trim();
          if (!text) continue;
          // One segment at a time, one failure at a time: a single short or
          // malformed string must not throw away the sentences that did
          // translate, which is how a partial result looks identical to no
          // result at all.
          try {
            const translated = await bodyTranslator.translate(text);
            if (translated) {
              ok += 1;
              out.push({ text: translated, code: false });
              continue;
            }
          } catch (err) {
            console.warn("[repo-summarizer] segment failed", err);
          }
          failed += 1;
          out.push({ text: part.text, code: false });
        }
        return out;
      };

      copy.summary = await Promise.all(copy.summary.map(translateParts));
      copy.points = await Promise.all(copy.points.map(translateParts));
      copy.proseTranslated = ok > 0;
      copy.proseFailed = failed;
    }

    // The About description and tagline are author-written too, so they get
    // the same treatment; otherwise they stay in the page's language while
    // everything around them is translated.
    if (metaTranslator) {
      let metaOk = 0;
      const translatePlain = async (text) => {
        if (!text) return text;
        try {
          const translated = await metaTranslator.translate(text);
          if (translated) {
            metaOk += 1;
            return translated;
          }
        } catch (err) {
          console.warn("[repo-summarizer] meta field failed", err);
        }
        return text;
      };
      copy.description = await translatePlain(data.description);
      copy.tagline = await translatePlain(data.tagline);
      copy.metaTranslated = metaOk > 0;
    }
  } catch (err) {
    /* keep the author's original words if anything goes wrong */
    diagnostics.note = String(err && err.message ? err.message : err);
    if (!translationIssue.value) translationIssue.value = translationIssue.noModel;
    console.warn("[repo-summarizer] translation aborted", err);
  }

  diagnostics.issue = translationIssue.value;
  diagnostics.pair = translationIssue.pair;

  // Only surface a problem when something actually needed translating.
  const neededTranslation = shouldTranslateProse();
  copy.pair = translationIssue.pair;
  if (bodyTranslator) copy.route = describeRoute(bodyTranslator);

  if (!neededTranslation) {
    copy.issue = null;
  } else if (!copy.proseTranslated) {
    // The prose is still in the author's words: say why, and name the pair.
    copy.issue = translationIssue.value;
  } else if (!copy.metaTranslated) {
    // Bullets came back translated but the About line did not. Reporting the
    // generic "no model" message here would be a lie, and this mix is exactly
    // what looked like a bug in an earlier English repo.
    copy.issue = translationIssue.metaFailed;
  } else if (copy.proseFailed) {
    // Most of it worked; say so, instead of letting the reader assume the
    // remaining foreign sentences are part of the summary.
    copy.issue = translationIssue.partial;
  } else {
    copy.issue = null;
  }

  return copy;
}

/**
 * Append one segment list: plain text nodes plus styled <code> for the parts
 * content.js marked as code (never translated). Does not clear the node.
 */
function appendParts(node, parts) {
  const list = Array.isArray(parts)
    ? parts
    : parts && typeof parts.text === "string"
      ? [parts]
      : [];
  for (const part of list) {
    if (!part || typeof part.text !== "string") continue;
    const raw = part.text.trim();
    if (!raw) continue;
    if (part.code) {
      const code = document.createElement("code");
      code.textContent = raw;
      node.appendChild(code);
    } else {
      // Author's words, as written; unless the full translator ran above.
      node.appendChild(document.createTextNode(raw));
    }
  }
}

/** Render a list of segment lists (content.js shape: [[{text, code}]]) into one node. */
function renderSegmentLists(node, lists) {
  node.textContent = "";
  const arr = Array.isArray(lists) ? lists : [];
  arr.forEach((list, index) => {
    if (index > 0) node.appendChild(document.createTextNode(" "));
    appendParts(node, list);
  });
}

/** Re-render whatever is on screen using the active language. */
async function refreshCurrentView() {
  applyTranslations();
  syncBadge();
  if (currentView.type === "result" && lastData) {
    renderResult(await applyFullTranslation(lastData));
  } else if (currentView.type === "error") {
    showError(currentView.detail);
  }
}

function renderResult(data) {

  lastRendered = data;

  // Name; fall back to "owner/name" from the URL if scraping missed it.
  const fallbackName = data.owner && data.name ? `${data.owner}/${data.name}` : data.name || "Unknown repository";
  setText(el("repo-name"), data.name || fallbackName);
  el("repo-name").title = fallbackName;

  setText(el("repo-owner"), data.owner ? t("byOwner", { owner: data.owner }) : "");
  el("repo-owner").hidden = !data.owner;

  // "I korthet": what the project is FOR, in the reader's language, from
  // deterministic classification. Only shown when the evidence is strong.
  const shortEl = el("repo-short");
  const shortBlock = el("short-block");
  const shortText = buildShortVersion(data, classifyProject(data));
  if (shortText) {
    shortEl.textContent = shortText;
    shortBlock.hidden = false;
  } else {
    shortEl.textContent = "";
    shortBlock.hidden = true;
  }

  // The deep section keeps its open/closed state across re-renders (a
  // language switch must not collapse it under the reader).
  const deepBlock = el("deep-block");
  const deepBtn = el("deep-btn");
  if (deepBlock && deepBtn) {
    deepBlock.hidden = !deepOpen;
    deepBtn.textContent = deepOpen ? t("deepHide") : t("deepBtn");
  }

  setText(el("repo-description"), data.metaTranslated ? data.description : translateKeyword(data.description), {
    emptyMessage: t("emptyDescription"),
  });

  // README digest: a short summary plus a few key points.
  const taglineEl = el("repo-tagline");
  const summaryEl = el("repo-summary");
  const readmeEl = el("repo-readme");
  const pointsEl = el("repo-points");
  const pointsBlock = el("points-block");
  pointsEl.textContent = "";

  if (data.tagline) {
    taglineEl.textContent = data.metaTranslated ? data.tagline : translateKeyword(data.tagline);
    taglineEl.hidden = false;
  } else {
    taglineEl.textContent = "";
    taglineEl.hidden = true;
  }

  renderSegmentLists(summaryEl, data.summary || []);
  summaryEl.hidden = !data.summary || !data.summary.length;

  const points = Array.isArray(data.points) ? data.points : [];
  for (const point of points) {
    const li = document.createElement("li");
    appendParts(li, point);
    pointsEl.appendChild(li);
  }
  pointsBlock.hidden = points.length === 0;

  if (summaryEl.hidden && points.length === 0) {
    setText(readmeEl, null, { emptyMessage: t("emptyReadme") });
    readmeEl.hidden = false;
  } else {
    readmeEl.hidden = true;
  }

  // Facts: stars / languages / license
  const factsEl = el("repo-facts");
  const factsBlock = el("facts-block");
  factsEl.textContent = "";
  const facts = data.facts || {};
  const factChips = [];
  if (facts.stars) factChips.push(t("starsLabel", { count: facts.stars }));
  if (facts.license) factChips.push(facts.license);
  for (const lang of facts.languages || []) factChips.push(lang);

  if (factChips.length) {
    for (const chipText of factChips) {
      const chip = document.createElement("span");
      chip.className = "fact";
      chip.textContent = chipText;
      factsEl.appendChild(chip);
    }
    factsBlock.hidden = false;
  } else {
    factsBlock.hidden = true;
  }

  // Topics
  const topicsBlock = el("topics-block");
  const chips = el("repo-topics");
  chips.textContent = "";
  if (data.topics && data.topics.length > 0) {
    topicsBlock.hidden = false;
    for (const topic of data.topics) {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = topic;
      chips.appendChild(chip);
    }
  } else {
    topicsBlock.hidden = false;
    const empty = document.createElement("span");
    empty.className = "is-empty";
    empty.textContent = t("emptyTopics");
    chips.appendChild(empty);
  }

  // Translation diagnostics. A summary tool that silently shows untranslated
  // text looks broken, so both the raw stamp and the reason are always shown
  // shown above the fold, where a screenshot catches them.
  lastIssue = data.issue || null;
  syncBadge();

  const diagEl = el("translation-diag");
  if (diagEl) {
    const locale = window.RepoI18n.getLocale();
    diagEl.textContent = "";
    diagEl.append(
      document.createTextNode(`${BUILD} · ${locale} · `),
    );
    const route = document.createElement("code");
    route.textContent = data.route || data.pair || (locale === "en" ? "not needed" : "no route");
    diagEl.appendChild(route);
    diagEl.title = `build ${BUILD} · target ${locale}`;
  }

  const statusEl = el("translation-status");
  if (statusEl) {
    const issue = data.issue ?? null;
    if (!issue) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.removeAttribute("data-severity");
    } else {
      const pair = data.pair || "?";
      // The pair only rides along in messages that have a placeholder for it;
      // the diag line above already carries the route, so repeating it (or
      // printing a bare "?") is just noise.
      const message =
        issue === translationIssue.noApi
          ? t("statusNoApi")
          : issue === translationIssue.detectFailed
            ? t("statusDetectFailed")
            : issue === translationIssue.metaFailed
              ? t("statusMetaFailed")
              : issue === translationIssue.partial
                ? t("statusPartial")
              : t(issue === translationIssue.needsModel ? "statusNeedsModel" : "statusNoModel", { pair });
      statusEl.textContent = message;
      statusEl.dataset.severity =
        issue === translationIssue.needsModel ? "info" : "warn";
      statusEl.hidden = false;
    }
  }

  showState("result");
  currentView = { type: "result" };
}

function showError(detail) {
  if (detail) el("error-detail").textContent = detail;
  analyzeBtn.disabled = true;
  showState("error");
  currentView = { type: "error", detail };
}

/* ------------------------------------------------------------------ *
 * Wiring
 * ------------------------------------------------------------------ */

async function init() {
  // 1. Language first: English unless the user picked something else.
  await loadLocale();
  fillLanguageSelect(el("lang-select"));
  applyTranslations();
  syncBadge();

  // Chrome's version decides whether the built-in translator can exist at
  // all (138+, desktop only), so it belongs in every diagnosis report.
  diagnostics.chrome = navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] || null;

  // One click instead of "open DevTools and type": the whole diagnostics
  // report lands on the clipboard, ready to paste into a bug report.
  // Guarded: a missing button must never break init; that is how the whole
  // popup, language selector included, would appear "completely dead".
  // Deep analysis toggle: the short view stays the default, details are
  // opt-in. Guarded like everything else here; a missing button must never
  // break init.
  const deepBtn = el("deep-btn");
  if (deepBtn) {
    deepBtn.addEventListener("click", () => {
      deepOpen = !deepOpen;
      const deepBlock = el("deep-block");
      if (deepBlock) deepBlock.hidden = !deepOpen;
      deepBtn.textContent = deepOpen ? t("deepHide") : t("deepBtn");
    });
  }

  // "Ask your AI"; copies a ready-to-paste question plus everything this
  // popup knows about the project. The reader drops it into any chat and gets
  // an answer that already has the context. Text comes from the DOM, so it is
  // always exactly what is on screen, in the language on screen.
  const aiBtn = el("copy-ai-btn");
  if (aiBtn) {
    aiBtn.addEventListener("click", async () => {
      const label = aiBtn.textContent;
      try {
        await navigator.clipboard.writeText(buildAiPrompt());
        aiBtn.textContent = t("copyAiDone");
        aiBtn.classList.add("btn--done");
      } catch (err) {
        console.warn("[repo-summarizer] clipboard write failed", err);
        aiBtn.textContent = t("copyAiFailed");
      }
      setTimeout(() => {
        aiBtn.textContent = label;
        aiBtn.classList.remove("btn--done");
      }, 1800);
    });
  }

  // Switching language re-renders the current view immediately.
  el("lang-select").addEventListener("change", async (event) => {
    await setLocale(event.target.value);
    await refreshCurrentView();
  });

  // 2. Then decide which UI state the active tab deserves.
  let tab;
  try {
    [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  } catch {
    showError(t("errorNoTab"));
    return;
  }

  const url = tab?.url || "";
  if (!GITHUB_REPO_URL.test(url)) {
    // Friendly error; the Analyze button is never shown on non-repo pages.
    showError(t("errorDetailNotRepo"));
    return;
  }

  analyzeBtn.addEventListener("click", async () => {
    showState("loading");
    try {
      const result = await analyzeTab(tab.id);

      if (!result || result.ok !== true) {
        if (result?.reason === "not-a-repo") {
          showError(t("errorDetailUrl"));
        } else {
          showError(t("errorGeneric"));
        }
        return;
      }

      lastData = result.data;

      // Translation runs on-device and can take a moment the first time
      // (Chrome may fetch a language model), so say so instead of looking frozen.
      if (shouldTranslateProse() && translatorSupported()) {
        setLoadingText(t("translating"));
      }
      renderResult(await applyFullTranslation(result.data));
    } catch (err) {
      showError(t("errorInject", { message: err.message }));
    }
  });

  analyzeAgainBtn.addEventListener("click", () => {
    showState("ready");
    analyzeBtn.click();
  });
}

init();
