// JS renderer and UI: theme/accent toggles, search, collapsibles, copy buttons

const CONTENT_MD_PATH = "CHEATSHEET.md"; // same folder as index.html

const contentEl = document.getElementById("content");
const tocEl = document.getElementById("toc");
const openMain = document.getElementById("js-open-main");
const themeToggle = document.getElementById("themeToggle");
const accentToggle = document.getElementById("accentToggle");
const searchInput = document.getElementById("siteSearch");
const searchCountEl = document.getElementById("searchCount");
const resetPrefsBtn = document.getElementById("resetPrefs");

const PASTEL_POOL = [
  "#2ee6a5", // mint
  "#b39df3", // pastel purple
  "#9ad1f7", // sky
  "#ffcf86", // peach
  "#a4e0cf", // aqua
  "#f0a6ca", // pink
  "#c4d7f2", // light cornflower
  "#bde5c8", // sage
  "#ffd6e0", // blush
  "#d7c9ff"  // lavender
];
const LONG_SECTION_THRESHOLD = 6; // elements beyond heading

function initTheme() {
  const root = document.documentElement;
  let theme = localStorage.getItem("theme");
  if (!theme) { theme = 'light'; }
  root.setAttribute('data-theme', theme);
  updateThemeButton(theme);

  let accent = localStorage.getItem("accent") || 'random';
  applyAccent(accent);
}

function updateThemeButton(theme){
  if (!themeToggle) return;
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
  themeToggle.textContent = theme === 'dark' ? 'Dark' : 'Light';
}

function applyAccent(mode){
  const root = document.documentElement;
  root.setAttribute('data-accent', mode === 'random' ? 'mint' : mode); // set some value for CSS
  if (mode === 'random') {
    const pick = PASTEL_POOL[Math.floor(Math.random()*PASTEL_POOL.length)];
    root.style.setProperty('--accent', pick);
  } else {
    root.style.removeProperty('--accent'); // let CSS var take over
  }
  if (accentToggle) accentToggle.textContent = mode === 'mint' ? 'Mint' : (mode === 'purple' ? 'Purple' : 'Random');
}

function wireToolbar(){
  if (themeToggle){
    themeToggle.addEventListener('click', () => {
      const root = document.documentElement;
      const cur = root.getAttribute('data-theme') || 'dark';
      const next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeButton(next);
    });
  }
  if (accentToggle){
    accentToggle.addEventListener('click', () => {
      const cur = localStorage.getItem('accent') || 'random';
      const order = ['mint', 'purple', 'random'];
      const next = order[(order.indexOf(cur)+1)%order.length];
      localStorage.setItem('accent', next);
      applyAccent(next);
    });
  }
  document.addEventListener('keydown', (e) => {
    // Search focus
    if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      searchInput?.focus();
    }
    // Toggle theme
    if (e.key.toLowerCase() === 't' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
      themeToggle?.click();
    }
    // Cycle accent
    if (e.key.toLowerCase() === 'a' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){
      accentToggle?.click();
    }
    // Escape clears search
    if (e.key === 'Escape' && document.activeElement === searchInput){
      searchInput.value = '';
      applySearch('');
      searchInput.blur();
    }
  });

  if (resetPrefsBtn){
    resetPrefsBtn.addEventListener('click', () => {
      // Reset theme/accent
      localStorage.removeItem('theme');
      localStorage.removeItem('accent');
      document.documentElement.setAttribute('data-theme', 'light');
      updateThemeButton('light');
      applyAccent('random');
      localStorage.setItem('accent', 'random');
      // Reset sections state
      Object.keys(localStorage).forEach(k => { if (k.startsWith('section:')) localStorage.removeItem(k); });
      // Re-apply collapsible defaults
      const secs = document.querySelectorAll('details.section');
      secs.forEach(sec => {
        const bodyCount = sec.querySelectorAll(':scope > .body > *').length;
        sec.open = bodyCount <= LONG_SECTION_THRESHOLD;
      });
      // Clear search
      if (searchInput){ searchInput.value = ''; applySearch(''); }
    });
  }
}

async function loadMarkdown() {
  try {
    const res = await fetch(`${CONTENT_MD_PATH}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch cheatsheet");
    const md = await res.text();
    renderMarkdown(md);
  } catch (err) {
    contentEl.innerHTML = `<p class="loading">Error loading cheatsheet. Open it directly: <a href="CHEATSHEET.md">CHEATSHEET.md</a></p>`;
    console.error(err);
  }
}

function renderMarkdown(md) {
  marked.setOptions({ gfm: true, breaks: false });
  contentEl.innerHTML = marked.parse(md);
  // Build collapsibles from h2 sections
  buildCollapsibles();
  enhanceCodeBlocks();
  buildTOC();
  // search wiring after content is ready
  initSearch();
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
      try { await navigator.clipboard.writeText(code.innerText);
        btn.textContent = "Copied!"; setTimeout(() => btn.textContent = "Copy", 1200);
      } catch { btn.textContent = "Failed"; setTimeout(() => btn.textContent = "Copy", 1200); }
    });
    pre.before(bar); bar.appendChild(btn);
  });
}

function buildCollapsibles(){
  // Wrap each h2 section in <details class="section">
  const rootNodes = Array.from(contentEl.childNodes);
  let i = 0;
  while (i < rootNodes.length){
    const node = rootNodes[i];
    if (node.nodeType === 1 && node.tagName === 'H2'){
      const h2 = node;
      if (!h2.id) h2.id = h2.textContent.toLowerCase().replace(/\s+/g,'-').replace(/[^\w\-]/g,'');
      const details = document.createElement('details');
      details.className = 'section';
      const summary = document.createElement('summary');
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = h2.textContent;
      summary.appendChild(label);
      details.appendChild(summary);
      const body = document.createElement('div');
      body.className = 'body';
      // Move following siblings until next H2 into body
      let count = 0;
      let j = h2.nextSibling;
      const toMove = [];
      while (j && !(j.nodeType === 1 && j.tagName === 'H2')){
        toMove.push(j);
        if (j.nodeType === 1) count++;
        j = j.nextSibling;
      }
      toMove.forEach(n => body.appendChild(n));
      details.appendChild(body);
      // Replace h2 with details
      h2.replaceWith(details);
      // Open/close heuristic and persistence
      const key = `section:${h2.id}`;
      const saved = localStorage.getItem(key);
      if (saved === 'open') details.open = true;
      else if (saved === 'closed') details.open = false;
      else details.open = count <= LONG_SECTION_THRESHOLD; // default open only if short
      details.addEventListener('toggle', () => {
        localStorage.setItem(key, details.open ? 'open' : 'closed');
      });
      // Anchor support: set id on details for hashes
      details.id = h2.id;
    }
    i++;
  }
}

// --- Search ---
let searchIndex = [];
function initSearch(){
  if (!searchInput) return;
  // Build simple index of text nodes grouped by section
  searchIndex = [];
  const sections = contentEl.querySelectorAll('details.section');
  sections.forEach(sec => {
    const id = sec.id;
    const text = sec.innerText.toLowerCase();
    searchIndex.push({ id, node: sec, text });
  });
  const onInput = debounce((e) => {
    applySearch(e.target.value);
  }, 80);
  searchInput.addEventListener('input', onInput);
  // initialize count
  updateSearchCount(searchInput.value || '', searchIndex);
}

function applySearch(q){
  clearHighlights();
  const query = (q || '').trim().toLowerCase();
  if (!query){
    // show all
    searchIndex.forEach(item => item.node.style.display = '');
    updateSearchCount('', searchIndex);
    return;
  }
  searchIndex.forEach(item => {
    const hit = item.text.includes(query);
    item.node.style.display = hit ? '' : 'none';
    if (hit){
      highlightMatches(item.node, query);
    }
  });
  updateSearchCount(query, searchIndex);
}

function updateSearchCount(query, index){
  if (!searchCountEl) return;
  const total = index.length;
  const visible = index.filter(i => i.node.style.display !== 'none').length;
  if (!query){
    searchCountEl.textContent = `${total} sections`;
  } else {
    searchCountEl.textContent = `${visible}/${total}`;
  }
}

function highlightMatches(container, query){
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node){
      const s = node.nodeValue.trim();
      if (!s) return NodeFilter.FILTER_REJECT;
      // don't highlight inside code blocks summary buttons etc.
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('code, pre, button, input, summary')) return NodeFilter.FILTER_REJECT;
      return s.toLowerCase().includes(query) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(textNode => {
    const span = document.createElement('span');
    const parts = textNode.nodeValue.split(new RegExp(`(${escapeRegExp(query)})`, 'ig'));
    parts.forEach(p => {
      if (!p) return;
      if (p.toLowerCase() === query){
        const m = document.createElement('mark');
        m.textContent = p;
        span.appendChild(m);
      } else {
        span.appendChild(document.createTextNode(p));
      }
    });
    textNode.parentNode.replaceChild(span, textNode);
  });
}

function clearHighlights(){
  contentEl.querySelectorAll('mark').forEach(m => {
    const parent = m.parentNode;
    parent.replaceChild(document.createTextNode(m.textContent), m);
    parent.normalize();
  });
}

function escapeRegExp(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function debounce(fn, ms){
  let t; return function(...args){ clearTimeout(t); t = setTimeout(() => fn.apply(this,args), ms); };
}

// Init
initTheme();
wireToolbar();
loadMarkdown();
