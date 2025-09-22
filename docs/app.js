// JS renderer: loads CHEATSHEET.md, renders with Marked, builds TOC, adds copy buttons.

const CONTENT_MD_PATH = "./CHEATSHEET.md"; // relative to /docs/
const contentEl = document.getElementById("content");
const tocEl = document.getElementById("toc");
const openMain = document.getElementById("js-open-main");

// Design choices: single column, high contrast, predictable hierarchy.
// Keep scripts tiny and fast; no heavy frameworks.

async function loadMarkdown() {
  try {
    const res = await fetch(CONTENT_MD_PATH, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch cheatsheet");
    const md = await res.text();
    renderMarkdown(md);
  } catch (err) {
    contentEl.innerHTML = `<p class="loading">Error loading cheatsheet. Open it directly: <a href="index.md">index.md</a></p>`;
    console.error(err);
  }
}

function renderMarkdown(md) {
  // Configure Marked for tidy output
  marked.setOptions({
    breaks: false,
    gfm: true
  });
  const html = marked.parse(md);
  contentEl.innerHTML = html;

  // Enhance: add copy buttons to code blocks
  enhanceCodeBlocks();

  // Build a compact TOC from h2/h3
  buildTOC();

  // Smooth scroll on quicklink
  openMain?.addEventListener("click", (e) => {
    e.preventDefault();
    contentEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // If there's a #hash, scroll there after render
  if (location.hash) {
    const target = document.querySelector(decodeURIComponent(location.hash));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  }
}

function buildTOC() {
  const headings = [...contentEl.querySelectorAll("h2, h3")];
  if (!headings.length) {
    tocEl.style.display = "none";
    return;
  }
  const ul = document.createElement("ul");
  headings.forEach(h => {
    // Ensure an id exists
    if (!h.id) h.id = h.textContent.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
    const li = document.createElement("li");
    if (h.tagName.toLowerCase() === "h3") li.style.paddingLeft = "12px";
    const a = document.createElement("a");
    a.href = `#${h.id}`;
    a.textContent = h.textContent;
    li.appendChild(a);
    ul.appendChild(li);
  });
  tocEl.innerHTML = "<h3>On this page</h3>";
  tocEl.appendChild(ul);
}

function enhanceCodeBlocks() {
  const blocks = contentEl.querySelectorAll("pre > code");
  blocks.forEach(code => {
    const pre = code.parentElement;
    const bar = document.createElement("div");
    bar.className = "copybar";
    const btn = document.createElement("button");
    btn.className = "copybtn";
    btn.textContent = "Copy";
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      } catch (e) {
        btn.textContent = "Failed";
        setTimeout(() => (btn.textContent = "Copy"), 1200);
      }
    });
    pre.before(bar);
    bar.appendChild(btn);
  });
}

// Kick off
loadMarkdown();
