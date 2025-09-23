// JS renderer: loads CHEATSHEET.md in /docs, renders with Marked, builds TOC, adds copy buttons.

const CONTENT_MD_PATH = "CHEATSHEET.md"; // same folder as index.html

const contentEl = document.getElementById("content");
const tocEl = document.getElementById("toc");
const openMain = document.getElementById("js-open-main");

async function loadMarkdown() {
  try {
    const res = await fetch(`${CONTENT_MD_PATH}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch cheatsheet");
    const md = await res.text();
    renderMarkdown(md);
  } catch (err) {
    contentEl.innerHTML = `<p class="loading">Error loading cheatsheet. 
      <a href="CHEATSHEET.md">CHEATSHEET.md</a></p>`;
    console.error(err);
  }
}

function renderMarkdown(md) {
  marked.setOptions({ gfm: true, breaks: false });
  contentEl.innerHTML = marked.parse(md);
  enhanceCodeBlocks();
  buildTOC();
  openMain?.addEventListener("click", (e) => {
    e.preventDefault();
    contentEl.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  if (location.hash) {
    const target = document.querySelector(decodeURIComponent(location.hash));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  }
}

function buildTOC() {
  const headings = [...contentEl.querySelectorAll("h2, h3")];
  if (!headings.length) { tocEl.style.display = "none"; return; }
  const ul = document.createElement("ul");
  headings.forEach(h => {
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
        setTimeout(() => btn.textContent = "Copy", 1200);
      } catch {
        btn.textContent = "Failed";
        setTimeout(() => btn.textContent = "Copy", 1200);
      }
    });
    pre.before(bar);
    bar.appendChild(btn);
  });
}

loadMarkdown();
// Theme toggle
const themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    document.documentElement.classList.toggle("light");
    localStorage.setItem(
      "theme",
      document.documentElement.classList.contains("light") ? "light" : "dark"
    );
  });

  // Default: light mode, unless user saved "dark"
  const saved = localStorage.getItem("theme");
  if (saved === "dark") {
    document.documentElement.classList.remove("light");
  } else {
    document.documentElement.classList.add("light");
  }
}
