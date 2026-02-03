/**
 * ATOMIC-DOM Bootstrap
 *
 * Initializes the Object Server runtime with cycle detection and caching.
 * Fixes infinite loop issues with HTML includes.
 *
 * Loop Prevention:
 * - window.__atomic_bootstrap_started: Prevents multiple initializations
 * - seen Set: Detects circular include references
 * - depth limit (30): Prevents infinite recursion
 * - htmlCache: Prevents redundant fetches
 */

import { createDOMRenderer } from "/ATOMIC-DOM/dist/projection/dom.js";

const ROOT_OBJECT_URL = "/objects/ui/root.html";
const ROOT_CONTAINER = "#object-server";
const INCLUDE_REGEX = /<@HTML\((\"|')([^\"']+)\1\)\?>/g;
const htmlCache = new Map();

async function fetchHtml(url) {
  if (htmlCache.has(url)) return htmlCache.get(url);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTML not found: ${url}`);
  const text = await res.text();
  htmlCache.set(url, text);
  return text;
}

function toAbsoluteUrl(url, base) {
  return new URL(url, base || window.location.href).toString();
}

function getDir(url) {
  const idx = url.lastIndexOf("/");
  return idx === -1 ? url : url.slice(0, idx);
}

/**
 * Resolves HTML includes recursively with cycle detection
 *
 * @param {string} html - HTML content to process
 * @param {string} baseDir - Base directory for relative URLs
 * @param {number} depth - Current recursion depth
 * @param {Set} seen - Set of URLs already being processed (cycle detection)
 */
async function resolveIncludes(html, baseDir, depth = 0, seen = new Set()) {
  if (!html) return "";
  if (depth > 30) throw new Error("Include depth exceeded");
  const regex = new RegExp(INCLUDE_REGEX.source, "g");
  let result = "";
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(html)) !== null) {
    result += html.slice(lastIndex, match.index);
    const includePath = match[2].trim();
    const includeUrl = toAbsoluteUrl(includePath, baseDir + "/");
    if (seen.has(includeUrl)) {
      throw new Error(`Include cycle detected: ${includeUrl}`);
    }
    seen.add(includeUrl);
    const includeHtml = await fetchHtml(includeUrl);
    const rendered = await resolveIncludes(
      includeHtml,
      getDir(toAbsoluteUrl(includeUrl)),
      depth + 1,
      seen
    );
    seen.delete(includeUrl);
    result += rendered;
    lastIndex = match.index + match[0].length;
  }
  result += html.slice(lastIndex);
  return result;
}

function elementToDomNode(el) {
  const props = {};
  const attrs = {};
  let id = null;

  if (el.id) id = el.id;
  if (el.className) props.class = el.className;

  for (const attr of Array.from(el.attributes)) {
    if (attr.name === "id" || attr.name === "class") continue;
    attrs[attr.name] = attr.value;
  }
  if (Object.keys(attrs).length > 0) {
    props.attrs = attrs;
  }

  const children = [];
  const elementChildren = Array.from(el.children);
  if (elementChildren.length > 0) {
    for (const child of elementChildren) {
      children.push(elementToDomNode(child));
    }
  } else {
    const text = el.textContent ? el.textContent.trim() : "";
    if (text) props.text = text;
  }

  return {
    selector: el.tagName.toLowerCase(),
    id,
    props,
    children,
  };
}

function htmlToDomTree(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const root = {
    selector: "div",
    id: null,
    props: {},
    children: [],
  };
  for (const child of Array.from(doc.body.children)) {
    root.children.push(elementToDomNode(child));
  }
  return root;
}

/**
 * Bootstrap entry point - only runs once per page load
 */
async function start() {
  // Prevent multiple initializations (fixes reload loop)
  if (window.__atomic_bootstrap_started) return;
  window.__atomic_bootstrap_started = true;

  const container = document.querySelector(ROOT_CONTAINER);
  if (!container) throw new Error(`Container not found: ${ROOT_CONTAINER}`);
  container.textContent = "Loading UI...";

  const baseDir = getDir(toAbsoluteUrl(ROOT_OBJECT_URL));
  const rootHtml = await fetchHtml(ROOT_OBJECT_URL);
  const resolvedHtml = await resolveIncludes(rootHtml, baseDir, 0);
  const tree = htmlToDomTree(resolvedHtml);

  const renderer = createDOMRenderer();
  container.innerHTML = "";
  const result = renderer.render(tree);
  container.appendChild(result.element);

  // Initialize Nexus AI if available
  if (window.initNexusAI) {
    window.initNexusAI();
  }
}

// Start when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    start().catch(err => {
      const container = document.querySelector(ROOT_CONTAINER);
      if (container) {
        container.innerHTML = `<pre style="white-space:pre-wrap;color:#f87171">${err.message}</pre>`;
      }
      console.error("ATOMIC-DOM bootstrap failed:", err);
    });
  });
} else {
  start().catch(err => {
    const container = document.querySelector(ROOT_CONTAINER);
    if (container) {
      container.innerHTML = `<pre style="white-space:pre-wrap;color:#f87171">${err.message}</pre>`;
    }
    console.error("ATOMIC-DOM bootstrap failed:", err);
  });
}
