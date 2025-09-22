---
published: false
---

# Music Production Cheatsheet — Quick Reference

**Quick Links**
- 🎛 [Music Production Cheatsheet](../CHEATSHEET.md)
- 🧭 [Design Rules Cheatsheet](./design-cheatsheet.md)
- 📄 [Download PDF](./cheatsheet.pdf)

---

## Session & Gain Staging

* Average around **−18 dBFS ≈ 0 VU**; keep track peaks **−6 to −3 dB** pre-master.
* Do clip-gain before compression; avoid redlining plugin inputs.
* **dB ↔ linear**: `linear = 10 ** (dB/20)` • `dB = 20 * log10(linear)`
```python 
import math
def db_to_linear(db): return 10 ** (db/20)
def linear_to_db(x):  return 20 * math.log10(x)
```

## Tempo / Delay / Reverb

* **Note time (ms)**: `ms = (60000 / BPM) * fraction` (dotted = `1.5×`, triplet = `2/3×`).
* **Common fractions**: whole 1 • half 0.5 • quarter 0.25 • eighth 0.125 • 16th 0.0625 • dotted-8th 0.375 • 8th-triplet **1/12 ≈ 0.0833**.
* **Predelay from distance**: `predelay_ms ≈ (distance_m / 343) * 1000`.
* **Haas width**: start **8–20 ms**; keep inter-channel delay **< \~35–40 ms**.
```python
NOTE = {"1":1,"1/2":0.5,"1/4":0.25,"1/8":0.125,"1/16":0.0625,"1/4d":0.375,"1/8d":0.1875,"1/8t":1/12}
def note_ms(bpm, k): return (60000.0/bpm) * NOTE[k]
```

## EQ Ranges (starting points)

* **Sub** 20–60 Hz — feel
* **Bass** 60–250 Hz — weight / mud
* **Low-mids** 250–500 Hz — boxy
* **Mids** 500–2 kHz — body / presence
* **High-mids** 2–6 kHz — clarity / harsh
* **Highs** 6–12 kHz — air / sparkle
  *Cut narrow for problems; boost wide for tone. High-pass what doesn’t need lows.*

---

## Compression (starters)

* **Attack**: slow = more transient; fast = tighter.
* **Release**: fast = lively; slow = smooth.
* **Ratios**: vocals **3–5:1** • bass **4–8:1** • drum bus **2–4:1**.
* **Parallel**: blend **10–30%** squashed into dry.

---

## Stereo & Phase

* Keep **<150–200 Hz mono** on the master.
* Mid/Side: cut low-mid in sides; add gentle air to sides if needed.
* Always check mono compatibility.

---

## Loudness & Mastering

* Use **ITU-R BS.1770 / EBU R128** meters (LUFS, true-peak).
* Streaming context: aim around **−14 LUFS integrated** (playback normalization varies).
* Leave **≤ −1 dBTP** true-peak headroom (codec safety).
```python
# LUFS gain suggestion (reference only)
def lufs_gain_db(measured, target=-14.0): return target - measured
```

---

## Sample Rate / Bit Depth

* **44.1 kHz** music • **48 kHz** video; Nyquist = `sample_rate / 2`.
* Work at **24-bit**; dither **once** at final export when reducing bit depth.

---

## MIDI Essentials

* **CC**: 1 Mod • 7 Volume • 10 Pan • 11 Expression • 64 Sustain (0–127).
* Program Change selects patch; Pitch Bend is typically 14-bit.
```python
# MIDI ↔ Frequency
import math
def midi_to_freq(n, a4=440): return a4 * (2 ** ((n-69)/12))
def freq_to_midi(f, a4=440):  return round(69 + 12*math.log2(f/a4))
```

---

## Arrangement / Harmony (quick refs)

* Pop: intro → verse → pre → chorus → verse → chorus → bridge → chorus.
* Major progressions: **I–V–vi–IV**, **I–vi–IV–V**, **ii–V–I**.

---

## Vocals (start)

* HPF: male **70–100 Hz**, female **90–120 Hz**.
* Tame **200–400 Hz** if boxy; compress **\~3–5 dB GR**.
* De-ess **5–8 kHz** if needed; gentle shelf **8–12 kHz** for air.

---

## Drums (start)

* **Kick**: +50–80 Hz body • −200–300 Hz box • +2–4 kHz click.
* **Snare**: 150–250 Hz body • 5–7 kHz crack • tame \~800 Hz.
* **Bus**: slow attack, fast release, **2–4 dB GR** glue.

---

## Bass & Guitar

* **Bass**: control 60–120 Hz; +700–1k for note definition; sidechain to kick.
* **Electric gtr**: high-pass; notch harsh **2–4 kHz**; double + pan for width.

---

## Sidechain Ducking (quick recipe)

1. Compressor on **bass**, external sidechain = **kick**.
2. Attack **10–30 ms**, release **80–150 ms**, ratio **3–6:1**, threshold for **\~2–4 dB GR**.

---

## Export Checklist

* WAV **24-bit**, **44.1/48 kHz**.
* True-peak ceiling **≈ −1 dBTP**; check inter-sample peaks.
* Platform variants if needed; embed metadata/ISRC.

---

## Handy Converters

* **Semitones → speed**: `2 ** (n/12)`
* **BPM stretch**: `old_bpm / new_bpm`
* **Bars → seconds (4/4)**: `(bars * 4 * 60) / BPM`
