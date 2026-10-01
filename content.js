/**
 * content.js: DOM scraping logic for GitHub repository pages.
 *
 * Runs inside the active GitHub tab. It is injected on demand by popup.js
 * (via chrome.scripting.executeScript), which then calls
 * window.__ghRepoSummarizer.analyze() and reads the result directly from
 * the injection return value; no message listener involved.
 *
 * Architecture note: every injection OVERWRITES the window.__ghRepoSummarizer
 * export with the latest version of the code. That means updating the
 * extension never leaves a stale scraper running in an old tab; no page
 * refresh required.
 *
 * No network requests, no AI; everything is extracted from markup already
 * present on the page.
 *
 * Resilience strategy: GitHub ships hashed/renameable class names, so every
 * extraction tries a list of selectors ordered from most-stable to
 * most-generic, and falls back to structural heuristics if all fail.
 */

(() => {
  /* ------------------------------------------------------------------ *
   * Tuning constants
   * ------------------------------------------------------------------ */

  /** Minimum characters for a text blob to be considered "real prose". */
  const MIN_PARAGRAPH_LENGTH = 25;
  /** Minimum for the About description; it's often a short tagline. */
  const MIN_DESCRIPTION_LENGTH = 3;
  /** Paragraphs shorter than this, right after an image, are treated as captions. */
  const MAX_CAPTION_LENGTH = 140;
  /** How long a paragraph must be to count as "substance" in a section. */
  const MIN_SUBSTANTIVE_PARAGRAPH = 60;
  /** Short, punchy digest instead of a full table of contents. */
  const MAX_POINTS = 5;
  const MAX_SUMMARY_LENGTH = 420;

  /** Collapse whitespace and trim. */
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();

  /** Strip leading emoji/symbols so headings read cleanly ("🚀 Overview" → "Overview"). */
  const stripLeadingSymbols = (s) => (s || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();

  /** Truncate to a max length on a word boundary. */
  const truncate = (s, max) => {
    const t = clean(s);
    if (t.length <= max) return t;
    const cut = t.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return clean((lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut) + "…");
  };

  /** Inline elements whose text must never be translated. */
  const CODE_TAGS = new Set(["CODE", "PRE", "KBD", "SAMP", "VAR"]);

  /**
   * Split an element's text into translated vs. protected segments, so the
   * glossary never rewrites things like `npm install` or <kbd>Ctrl</kbd>.
   *
   * @param {Element} el
   * @returns {Array<{text: string, code: boolean}>}
   */
  const extractParts = (el) => {
    const parts = [];
    let buffer = "";

    const flush = () => {
      const text = clean(buffer);
      if (text) parts.push({ text, code: false });
      buffer = "";
    };

    const visit = (node) => {
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          buffer += child.textContent;
        } else if (child.nodeType !== Node.ELEMENT_NODE) {
          continue;
        } else if (CODE_TAGS.has(child.tagName)) {
          flush();
          const codeText = clean(child.textContent);
          if (codeText) parts.push({ text: codeText, code: true });
        } else if (child.tagName === "BR") {
          buffer += " ";
        } else if (child.tagName === "IMG" || child.tagName === "SVG") {
          continue; // images contribute no summary text
        } else {
          visit(child);
        }
      }
    };

    visit(el);
    flush();
    return parts;
  };

  /** Flatten segments back to plain text (for measuring/labelling). */
  const partsText = (parts) => clean(parts.map((p) => p.text).join(" "));

  /** Cap total length of a segment list, keeping whole segments. */
  const truncateParts = (parts, max) => {
    const out = [];
    let total = 0;
    for (const part of parts) {
      if (total + part.text.length > max) break;
      out.push(part);
      total += part.text.length;
    }
    if (out.length < parts.length && out.length) {
      const last = out[out.length - 1];
      out[out.length - 1] = { text: last.text + "…", code: last.code };
    }
    return out;
  };

  /**
   * Return the first selector from the list that matches anything.
   * @param {string[]} selectors
   * @returns {Element|null}
   */
  const firstMatch = (selectors) => {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel);
        if (el) return el;
      } catch {
        /* invalid selector on this GitHub variant; try the next one */
      }
    }
    return null;
  };

  /** All matches across a list of selectors, de-duplicated. */
  const allMatches = (selectors) => {
    const seen = new Set();
    const out = [];
    for (const sel of selectors) {
      let nodes;
      try {
        nodes = document.querySelectorAll(sel);
      } catch {
        continue;
      }
      for (const el of nodes) {
        if (!seen.has(el)) {
          seen.add(el);
          out.push(el);
        }
      }
    }
    return out;
  };

  /**
   * True if an element is effectively just a badge/shield image or an
   * image-only link (badges are `<img>` or `<a><img></a>`).
   * @param {Element} el
   */
  const isBadgeLike = (el) => {
    const text = clean(el.textContent);
    if (text.length > 0) return false; // has real text → not a pure badge
    return !!el.querySelector("img, image, svg, picture");
  };

  /** Does this element contain readable prose we'd want in a summary? */
  const isDescriptive = (el) => {
    const text = clean(el.textContent);
    return text.length >= MIN_PARAGRAPH_LENGTH && !isBadgeLike(el);
  };

  /** Looser bar for the About description. */
  const isUsableDescription = (el) => {
    const text = clean(el.textContent);
    return text.length >= MIN_DESCRIPTION_LENGTH && !isBadgeLike(el);
  };

  /* ------------------------------------------------------------------ *
   * Repo page detection
   * ------------------------------------------------------------------ */

  /**
   * Heuristic: hostname is github.com and the path has at least owner/repo
   * segments, confirmed softly by repo-only landmarks.
   * @returns {boolean}
   */
  const isRepoPage = () => {
    const host = location.hostname.toLowerCase();
    if (host !== "github.com" && !host.endsWith(".github.com")) return false;

    const segments = location.pathname.split("/").filter(Boolean);
    if (segments.length < 2) return false;

    const first = segments[0].toLowerCase();
    const nonRepoRoots = new Set([
      "features", "pricing", "security", "enterprise", "customer-stories",
      "topics", "trending", "collections", "sponsors", "marketplace",
      "settings", "notifications", "explore", "orgs", "account", "dashboard",
      "pulls", "issues", "search", "about", "site", "readme",
    ]);
    if (nonRepoRoots.has(first)) return false;

    const landmarks = [
      "#repository-container-header",
      "[data-testid='repository-container-header']",
      "strong[itemprop='name']",
      "#readme",
      "article.markdown-body",
    ];
    const confirmed = landmarks.some((sel) => document.querySelector(sel));

    const second = (segments[1] || "").toLowerCase();
    const repoSubroutes = new Set([
      "tree", "blob", "commits", "issues", "pulls", "actions", "projects",
      "wiki", "pulse", "graphs", "network", "branches", "releases", "tags",
    ]);
    return confirmed || repoSubroutes.has(second);
  };

  /* ------------------------------------------------------------------ *
   * Field extractors (each with layered fallbacks)
   * ------------------------------------------------------------------ */

  /** Owner + repo from the URL path, e.g. /vercel/next.js → {owner, repo}. */
  const repoFromPath = () => {
    const [owner = "", repo = ""] = location.pathname.split("/").filter(Boolean);
    return { owner: decodeURIComponent(owner), repo: decodeURIComponent(repo) };
  };

  const extractRepoName = () => {
    const el = firstMatch([
      "strong[itemprop='name'] a",
      "#repository-container-header strong[itemprop='name'] a",
      "[data-testid='repository-container-header'] strong[itemprop='name'] a",
    ]);
    if (el) return clean(el.textContent);

    const m = document.title.match(/([A-Za-z0-9._-]+\/[A-Za-z0-9._-]+)/);
    if (m) return m[1].split("/").pop();

    return repoFromPath().repo || null;
  };

  const extractOwner = () => {
    const el = firstMatch([
      "a[data-hovercard-type='user']",
      "a[data-hovercard-type='organization']",
      "#repository-container-header a[href^='/']",
    ]);
    if (el) {
      const seg = (el.getAttribute("href") || "").split("/").filter(Boolean)[0];
      if (seg) return decodeURIComponent(seg);
    }
    return repoFromPath().owner || null;
  };

  const extractDescription = () => {
    // 1. NEW React sidebar (Primer CSS modules): the About description
    //    paragraph. Attribute-contains survives the hashed class suffix.
    const el = firstMatch([
      "[class*='SidebarAbout-module__description']",
      // Older layouts: plain paragraph next to the repo title, or the
      // semantic `about` property GitHub emits.
      "#repository-container-header .f4.my-3",
      ".f4.my-3",
      "[itemprop='about']",
      ".Layout-sidebar .f4",
    ]);
    const text = el ? clean(el.textContent) : "";
    if (text) return text;

    for (const p of document.querySelectorAll(".BorderGrid-cell p")) {
      if (isUsableDescription(p)) return clean(p.textContent);
    }
    for (const p of document.querySelectorAll(".Layout-sidebar p")) {
      if (isUsableDescription(p)) return clean(p.textContent);
    }

    // Structural last resort: find the "About" heading and take the first
    // usable paragraph in its section, whatever the class names.
    const aboutHeading = [...document.querySelectorAll("h2, h3")].find(
      (h) => stripLeadingSymbols(h.textContent).toLowerCase() === "about"
    );
    if (aboutHeading) {
      const section = aboutHeading.closest("section, div");
      if (section) {
        for (const p of section.querySelectorAll("p")) {
          if (isUsableDescription(p)) return clean(p.textContent);
        }
      }
    }
    return null;
  };

  const extractTopics = () => {
    const nodes = allMatches([
      "a.topic-tag",
      "a[class*='topic-tag']",
      "[data-octo-click='topic_click'] a",
      ".js-topic a",
      ".Layout-sidebar a.topic-tag-link",
    ]);
    const topics = [];
    const seen = new Set();
    for (const n of nodes) {
      const t = clean(n.textContent).toLowerCase();
      if (t && t.length <= 40 && !seen.has(t)) {
        seen.add(t);
        topics.push(t);
      }
    }
    return topics;
  };

  /* ------------------------------------------------------------------ *
   * README digest
   * ------------------------------------------------------------------ */

  /** Section headings that never explain what the project *is*. */
  const META_SECTION_RE =
    /^(contributing|contribution|license|licence|getting started|installation|install|usage|how to use|roadmap|changelog|acknowledg\w*|sponsors?|credits?|table of contents|toc|faq|support|donat\w*|security|code of conduct|development|testing|deploy\w*|troubleshooting|api reference|project structure|folder structure)$/i;

  /**
   * Lines that are installation/usage instructions rather than an explanation
   * of the project. A quick summary should never read like a setup guide.
   */
  const INSTRUCTION_RE =
    /^\s*(install|setup|set\s+up|run|execute|clone|deploy|npm|pnpm|yarn|git|cd|pip|brew|docker|make|cargo|go\s+get|quick\s+start|getting\s+started|usage|prerequisites?)\b/i;

  /** Command-looking tokens anywhere in the line. */
  const COMMAND_RE = /\b(npm|yarn|pnpm|pip|git\s+clone|docker|brew|cargo|curl|wget)\b/i;

  /** Fraction of a segment list that is code. */
  const codeDensity = (parts) => {
    const total = parts.reduce((n, p) => n + p.text.length, 0);
    if (!total) return 1;
    const code = parts.filter((p) => p.code).reduce((n, p) => n + p.text.length, 0);
    return code / total;
  };

  /** True when a line is dominated by code or reads like a command. */
  const isNoiseLine = (parts, text) =>
    codeDensity(parts) > 0.2 || INSTRUCTION_RE.test(text) || COMMAND_RE.test(text);

  /** Headings that mostly wrap media galleries rather than prose. */
  const MEDIA_SECTION_RE =
    /^(screenshot|screenshots|preview|previews|demo|demos|showcase|video|videos|gallery|images?|media|badge|badges)$/i;

  /** Funding/support sections; never part of "what is this project". */
  const NOISE_SECTION_RE =
    /^(donat\w*|sponsor\w*|credit\w*|acknowledg\w*|fund\w*|backers?|star history|support|buy me a coffee|patreon|ko-?fi)$/i;

  /** Skip nodes whose content we already capture through their container. */
  const isNestedInHandledContainer = (node) => {
    const parent = node.parentElement;
    if (!parent) return false;
    if (node.matches("li")) return parent.closest("ul, ol") !== parent;
    if (node.matches("p")) {
      return !!node.closest("li") || !!node.closest("blockquote") || !!node.closest("td");
    }
    if (node.matches("ul, ol")) return !!node.closest("li");
    if (/^h[1-6]$/i.test(node.tagName)) return !!node.closest("td");
    return false;
  };

  /** Does this section carry enough text to explain the project? */
  const hasSubstance = (s) =>
    s.paragraphs.some((p) => partsText(p).length >= MIN_SUBSTANTIVE_PARAGRAPH) ||
    s.bullets.length >= 2;

  /**
   * Walk the README and group its content into labelled sections:
   * `{ heading, paragraphs, bullets }`. Skips badge rows, media blocks and
   * image captions; the leading <h1> becomes a tagline instead of a section.
   *
   * @param {Element} root
   * @returns {{tagline: string|null, sections: Array}}
   */
  const collectReadmeSections = (root) => {
    const sections = [];
    let current = null;
    let tagline = null;
    let sawMedia = false;

    const pushSection = () => {
      current = { heading: null, headingPlain: null, paragraphs: [], bullets: [] };
      sections.push(current);
      return current;
    };

    const nodes = root.querySelectorAll("h1,h2,h3,h4,h5,h6,p,ul,ol,blockquote");
    for (const node of nodes) {
      if (isNestedInHandledContainer(node)) continue;
      const tag = node.tagName.toLowerCase();

      if (/^h[1-6]$/.test(tag)) {
        const text = clean(node.textContent);
        if (!text) continue;
        sawMedia = false;
        const plain = stripLeadingSymbols(text);
        if (tag === "h1") {
          if (!tagline) tagline = plain;
          continue;
        }
        current = pushSection();
        current.heading = text;
        current.headingPlain = plain;
        continue;
      }

      if (tag === "ul" || tag === "ol") {
        sawMedia = false;
        const items = [...node.children]
          .filter((li) => li.tagName.toLowerCase() === "li")
          .map((li) => ({ parts: extractParts(li), text: clean(li.textContent) }))
          // Drop setup steps, commands and code-only lines; they say nothing
          // about what the project actually is.
          .filter((item) => item.text.length >= 12 && !isNoiseLine(item.parts, item.text));
        if (!items.length) continue;
        if (!current) pushSection();
        current.bullets.push(...items.map((item) => item.parts));
        continue;
      }

      // <p> / <blockquote>
      if (node.querySelector("img, picture, video, iframe, svg, markdown-accessiblity-table")) {
        sawMedia = true;
        continue;
      }
      const text = clean(node.textContent);
      if (!text || isBadgeLike(node)) continue;
      const parts = extractParts(node);

      // A short line right after an image is a caption, not an explanation.
      if (sawMedia && text.length < MAX_CAPTION_LENGTH) {
        sawMedia = false;
        continue;
      }
      sawMedia = false;
      if (text.length < MIN_PARAGRAPH_LENGTH) continue;

      if (isNoiseLine(parts, text)) continue;
      if (!current) pushSection();
      current.paragraphs.push(parts);
    }

    return { tagline, sections };
  };

  /**
   * Turn the collected sections into a short, human digest:
   *   summary; the single best explanation of what the project is
   *   points; a few short highlights, in the author's own words
   *
   * Deliberately short: a reader wants to know what this is in a few seconds,
   * not a full table of contents.
   */
  const selectDigest = (sections) => {
    const substantive = sections.filter(
      (s) => hasSubstance(s) && !MEDIA_SECTION_RE.test(s.headingPlain || "")
    );
    const pool = substantive.length ? substantive : sections.filter(hasSubstance);

    const primary = pool.filter((s) => !META_SECTION_RE.test(s.headingPlain || ""));
    const sources = primary.length ? primary : pool.filter(
      (s) => !NOISE_SECTION_RE.test(s.headingPlain || "")
    );

    // Summary: the longest prose paragraph that actually explains something,
    // preferring the earliest sections (that's where READMEs explain).
    let summaryParts = null;
    let bestScore = -1;
    for (const section of sources) {
      for (const parts of section.paragraphs) {
        const text = partsText(parts);
        // Prefer explanatory length, penalise code, and mildly prefer earlier
        // sections by subtracting a small positional bonus.
        const score = text.length - codeDensity(parts) * 200;
        if (score > bestScore && text.length >= MIN_SUBSTANTIVE_PARAGRAPH) {
          bestScore = score;
          summaryParts = parts;
        }
      }
      if (bestScore > 300) break; // the first good paragraph is good enough
    }

    // Points: short bullets from the same sections, de-duplicated.
    const points = [];
    const seen = new Set();
    for (const section of sources) {
      for (const parts of section.bullets) {
        const text = partsText(parts);
        if (text.length < 12 || text.length > 180) continue;
        const key = text.toLowerCase().slice(0, 40);
        if (seen.has(key)) continue;
        seen.add(key);
        points.push(truncateParts(parts, 160));
        if (points.length >= MAX_POINTS) break;
      }
      if (points.length >= MAX_POINTS) break;
    }

    return {
      summary: summaryParts ? truncateParts(summaryParts, MAX_SUMMARY_LENGTH) : [],
      points,
    };
  };

  const extractReadmeDigest = () => {
    const root = firstMatch([
      "#readme article",
      "#readme .markdown-body",
      "article.markdown-body",
      "div[data-testid='readme-panel'] article",
      "[class*='readme'] article",
    ]);
    if (!root) return { tagline: null, summary: [], points: [] };

    const { tagline, sections } = collectReadmeSections(root);
    const { summary, points } = selectDigest(sections);
    // Headings are a strong signal of what the project offers (Features,
    // Installation, Screenshots, Examples, Docs…). They cost nothing to
    // collect here and let the popup classify the project deterministically.
    const headings = sections
      .map((s) => (s.headingPlain || "").trim())
      .filter((h) => h && h.length <= 60);

    return { tagline: tagline ? truncate(tagline, 140) : null, summary, points, headings };
  };

  /* ------------------------------------------------------------------ *
   * Repo facts (stars / languages / license)
   * ------------------------------------------------------------------ */

  const extractFacts = () => {
    const starsEl = document.querySelector("#repo-stars-counter-star");
    const stars = starsEl
      ? clean(starsEl.getAttribute("title") || starsEl.textContent).replace(/[^0-9.,]/g, "") || null
      : null;

    const languages = [];
    for (const a of document.querySelectorAll('a[href*="?l="]')) {
      const name = clean(a.textContent).replace(/[\d.,]+\s*%$/, "").trim();
      if (name && name.length <= 24 && !languages.includes(name)) languages.push(name);
      if (languages.length >= 5) break;
    }

    const licenseEl = [...document.querySelectorAll("a")].find((a) =>
      /\/LICENSE(\.|\/|$)/i.test(a.getAttribute("href") || "")
    );
    const license = licenseEl ? clean(licenseEl.textContent) : null;

    return { stars, languages, license: license || null };
  };

  /* ------------------------------------------------------------------ *
   * Public entry point
   * ------------------------------------------------------------------ */

  /**
   * Extract the summary from the current page.
   * @returns {{ok: boolean, reason?: string, data?: object}}
   */
  const analyzePage = () => {
    if (!isRepoPage()) {
      return { ok: false, reason: "not-a-repo" };
    }

    const { owner } = repoFromPath();      const { tagline, summary, points, headings } = extractReadmeDigest();
    const description = extractDescription();

    return {
      ok: true,
      data: {
        owner,
        name: extractRepoName(),
        description,
        topics: extractTopics(),
        tagline,
        summary,
        points,
        headings,
        facts: extractFacts(),
      },
    };
  };

  /**
   * Wait until the page is actually ready to be scraped.
   *
   * GitHub renders parts of the repository page (the new React sidebar with
   * the About text, languages and topics) client-side, after the initial
   * paint. Scraping too early therefore returns an incomplete page; which
   * is why a first click could disagree with a second one a moment later.
   *
   * Resolves as soon as the landmarks are present, or after `timeoutMs`.
   * @param {number} [timeoutMs]
   * @returns {Promise<boolean>} true if the page looked ready
   */
  const waitReady = (timeoutMs = 3000) =>
    new Promise((resolve) => {
      const isReady = () =>
        document.readyState !== "loading" &&
        !!document.querySelector(
          "strong[itemprop='name'], #repository-container-header, [data-testid='repository-container-header']"
        );

      if (isReady()) {
        resolve(true);
        return;
      }

      const startedAt = Date.now();
      const timer = setInterval(() => {
        const ready = isReady();
        if (ready || Date.now() - startedAt >= timeoutMs) {
          clearInterval(timer);
          resolve(ready);
        }
      }, 100);
    });

  // Export for popup.js. Overwrite unconditionally so a re-injection after
  // an extension update always replaces any previously loaded version.
  window.__ghRepoSummarizer = { analyze: analyzePage, waitReady };
})();