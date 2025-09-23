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


// ---- Calculators Overlay ----
(function initCalculators() {
  function findCalcTrigger() {
    return (
      document.querySelector('[data-open-calcs]') ||
      document.querySelector('a[href="calculators/"]')
    );
  }

  const trigger = findCalcTrigger();
  if (!trigger) return;

  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    openCalculatorsOverlay();
  });

  function bpmToMs(bpm, fraction, mode) {
    // quarter note ms = 60000 / bpm
    const base = 60000 / bpm;
    let mult = 1;
    if (mode === 'straight') mult = 1;
    if (mode === 'dotted') mult = 1.5;
    if (mode === 'triplet') mult = 2 / 3;
    return base * fraction * mult;
  }

  function msToSamples(ms, sampleRate) {
    return Math.round((ms / 1000) * sampleRate);
  }

  function openCalculatorsOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'calc-overlay';
    overlay.innerHTML = `
      <div class="calc-modal" role="dialog" aria-modal="true" aria-label="Audio Calculators">
        <div class="calc-header">
          <h3 class="calc-title">Calculators — Delay (BPM → ms)</h3>
          <button class="calc-close" type="button" aria-label="Close">✕</button>
        </div>
        <div class="calc-body">
          <div class="calc-row">
            <div class="calc-field">
              <label class="calc-label" for="calc-bpm">BPM</label>
              <input id="calc-bpm" class="calc-input" type="number" min="1" max="400" step="0.1" value="120" />
            </div>

            <div class="calc-field">
              <label class="calc-label">Note Type</label>
              <div class="calc-tabs" role="tablist" aria-label="Note feel">
                <button class="calc-tab" role="tab" data-mode="straight" aria-selected="true">Straight</button>
                <button class="calc-tab" role="tab" data-mode="dotted">Dotted</button>
                <button class="calc-tab" role="tab" data-mode="triplet">Triplet</button>
              </div>
            </div>

            <div class="calc-field">
              <label class="calc-label">Tap Tempo</label>
              <div style="display:flex; gap:8px;">
                <button class="calc-button" type="button" id="calc-tap">Tap</button>
                <button class="calc-button" type="button" id="calc-reset">Reset</button>
              </div>
              <div id="calc-tap-readout" class="calc-label" aria-live="polite"></div>
            </div>
          </div>

          <div class="calc-row">
            <div class="calc-field">
              <label class="calc-label">Sample Rates</label>
              <select id="calc-sr" class="calc-select">
                <option value="44100">44.1 kHz</option>
                <option value="48000" selected>48 kHz</option>
              </select>
            </div>
            <div class="calc-field">
              <label class="calc-label">Copy Format</label>
              <select id="calc-copyfmt" class="calc-select">
                <option value="ms">Milliseconds</option>
                <option value="samples">Samples</option>
              </select>
            </div>
            <div class="calc-field">
              <label class="calc-label">&nbsp;</label>
              <button class="calc-button" type="button" id="calc-copy-all">Copy Table</button>
            </div>
          </div>

          <table class="calc-table" aria-label="Delay times">
            <thead>
              <tr>
                <th>Note</th>
                <th>ms</th>
                <th>Samples (SR)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="calc-tbody"></tbody>
          </table>
        </div>
        <div class="calc-footer">
          <span>Tip: Press <strong>Space</strong> to Tap; <strong>Esc</strong> to close.</span>
          <div>
            <button class="calc-close" type="button">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const modal = overlay.querySelector('.calc-modal');
    const closeBtns = overlay.querySelectorAll('.calc-close');
    const bpmEl = overlay.querySelector('#calc-bpm');
    const srEl = overlay.querySelector('#calc-sr');
    const copyFmtEl = overlay.querySelector('#calc-copyfmt');
    const tbody = overlay.querySelector('#calc-tbody');
    const tabs = overlay.querySelectorAll('.calc-tab');
    const tapBtn = overlay.querySelector('#calc-tap');
    const resetTapBtn = overlay.querySelector('#calc-reset');
    const tapReadout = overlay.querySelector('#calc-tap-readout');
    const copyAllBtn = overlay.querySelector('#calc-copy-all');

    let mode = 'straight';
    let tapTimes = [];

    const FRACTIONS = [
      { label: 'Whole (1/1)', fraction: 4 },
      { label: 'Half (1/2)', fraction: 2 },
      { label: 'Quarter (1/4)', fraction: 1 },
      { label: 'Eighth (1/8)', fraction: 1/2 },
      { label: '16th (1/16)', fraction: 1/4 },
      { label: '32nd (1/32)', fraction: 1/8 },
      { label: '64th (1/64)', fraction: 1/16 },
    ];

    function activeBpm() {
      const v = parseFloat(bpmEl.value);
      return isFinite(v) && v > 0 ? v : 120;
    }

    function updateTable() {
      const bpm = activeBpm();
      const sr = parseInt(srEl.value, 10);
      const rows = FRACTIONS.map(n => {
        const ms = bpmToMs(bpm, n.fraction, mode);
        const samples = msToSamples(ms, sr);
        return { ...n, ms, samples };
      });

      tbody.innerHTML = rows.map(r => `
        <tr>
          <td>${r.label}</td>
          <td>${r.ms.toFixed(2)}</td>
          <td>${r.samples.toLocaleString()}</td>
          <td>
            <div class="calc-actions">
              <button class="calc-mini" data-copy="ms" data-ms="${r.ms.toFixed(2)}">Copy ms</button>
              <button class="calc-mini" data-copy="samples" data-samples="${r.samples}">Copy samples</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    function setMode(newMode) {
      mode = newMode;
      tabs.forEach(t => t.setAttribute('aria-selected', String(t.dataset.mode === mode)));
      updateTable();
    }

    tabs.forEach(t => {
      t.addEventListener('click', () => setMode(t.dataset.mode));
    });

    bpmEl.addEventListener('input', updateTable);
    srEl.addEventListener('change', updateTable);
    copyAllBtn.addEventListener('click', async () => {
      const fmt = copyFmtEl.value;
      const sr = parseInt(srEl.value, 10);
      const bpm = activeBpm();
      let text = `BPM ${bpm} — ${mode}\nSample Rate: ${sr}\n\n`;
      FRACTIONS.forEach(n => {
        const ms = bpmToMs(bpm, n.fraction, mode);
        const samples = msToSamples(ms, sr);
        text += `${n.label}: ${ms.toFixed(2)} ms  |  ${samples} samples\n`;
      });
      try {
        await navigator.clipboard.writeText(text);
        copyAllBtn.textContent = 'Copied!';
        setTimeout(() => (copyAllBtn.textContent = 'Copy Table'), 1000);
      } catch {}
    });

    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
    
      // If a copy button was clicked, handle and stop here
      if (btn?.dataset.copy === 'ms') {
        try {
          await navigator.clipboard.writeText(btn.dataset.ms);
          btn.textContent = '✓';
          setTimeout(() => (btn.textContent = 'Copy ms'), 700);
        } catch {}
        e.stopPropagation();
        return;
      }
      if (btn?.dataset.copy === 'samples') {
        try {
          await navigator.clipboard.writeText(btn.dataset.samples);
          btn.textContent = '✓';
          setTimeout(() => (btn.textContent = 'Copy samples'), 700);
        } catch {}
        e.stopPropagation();
        return;
      }
    
      // Otherwise, treat it as a row click → return & close
      const tr = e.target.closest('.calc-row-item');
      if (!tr) return;
    
      const detail = {
        type: 'delay',
        note: tr.dataset.note,
        bpm: activeBpm(),
        mode,
        ms: parseFloat(tr.dataset.ms),
        samples: parseInt(tr.dataset.samples, 10),
        sampleRate: parseInt(srEl.value, 10),
      };
      window.dispatchEvent(new CustomEvent('calc:return', { detail }));
      close();
    });
    

    // Tap tempo
    function registerTap() {
      const now = performance.now();
      tapTimes.push(now);
      // keep recent taps (last ~8s)
      tapTimes = tapTimes.filter(t => now - t < 8000);
      if (tapTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) intervals.push(tapTimes[i] - tapTimes[i - 1]);
        const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = Math.max(1, Math.min(400, 60000 / avg));
        bpmEl.value = bpm.toFixed(2);
        tapReadout.textContent = `~ ${bpm.toFixed(2)} BPM (${intervals.length} taps)`;
        updateTable();
      } else {
        tapReadout.textContent = 'Tap again…';
      }
    }

    tapBtn.addEventListener('click', registerTap);
    
    resetTapBtn.addEventListener('click', () => { tapTimes = []; tapReadout.textContent = ''; });

    function onKey(e) {
      if (e.key === 'Escape') { close(); }
      // Space to tap (avoid when focused on inputs)
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      if (e.key === ' ' && tag !== 'input' && tag !== 'textarea') {
        e.preventDefault();
        registerTap();
      }
    }

    function close() {
      window.removeEventListener('keydown', onKey);
      overlay.remove();
    }

    closeBtns.forEach(b => b.addEventListener('click', close));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    window.addEventListener('keydown', onKey);

    // init
    setMode('straight');
    updateTable();
    // focus BPM for quick typing
    bpmEl.focus();
    bpmEl.select();
  }
})();
// Example: listen to calculator return
window.addEventListener('calc:return', (e) => {
  const v = e.detail; // {type:'delay', note, bpm, mode, ms, samples, sampleRate}
  console.log('Calculator returned:', v);
  // Example: put the ms into a visible toast or a hidden input, etc.
  // document.querySelector('#some-input')?.value = v.ms;
});
