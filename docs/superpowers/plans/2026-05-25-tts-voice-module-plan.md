# TTS Voice Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add text-to-speech narration to chapter reading pages with Edge TTS (primary, online) and Kokoro (fallback, offline) via Python microservices on D drive.

**Architecture:** Vue 3 AudioPlayer component → Express TTS controller → dual Python Flask services (Edge TTS on port 5001, Kokoro on port 5002) → MP3 cached to D:/tts-services/audio-cache/ → served back to frontend `<audio>` element.

**Tech Stack:** Python 3.10+ (Flask, edge-tts, onnxruntime), Express (axios, crypto, fs), Vue 3 (composition API, element-plus)

---

## File Structure

```
NEW FILES:
  D:/tts-services/edge-tts-service/server.py          - Flask wrapper for edge-tts library
  D:/tts-services/edge-tts-service/requirements.txt    - edge-tts, flask
  D:/tts-services/kokoro-service/server.py             - Flask wrapper for Kokoro ONNX inference
  D:/tts-services/kokoro-service/requirements.txt      - onnxruntime, numpy, scipy, flask, soundfile
  D:/tts-services/start-services.bat                   - One-click launcher for both services
  backend/src/controllers/ttsController.js             - TTS orchestration controller
  backend/src/services/ttsCacheService.js              - MP3 cache management (LRU eviction, size cap)
  frontend/src/components/AudioPlayer.vue              - Full audio player with voice/seek/speed
  frontend/src/stores/ttsStore.js                      - Pinia store for voice preferences, audio state
  frontend/src/api/tts.js                              - API helper for TTS endpoints

MODIFIED FILES:
  backend/src/routes/index.js                          - Add /api/tts/* routes
  backend/.env                                         - Add TTS env vars
  frontend/src/views/PublicRead.vue                    - Integrate AudioPlayer into public reading
```

---

### Task 1: Edge TTS Python Service

**Files:**
- Create: `D:/tts-services/edge-tts-service/server.py`
- Create: `D:/tts-services/edge-tts-service/requirements.txt`

- [ ] **Step 1: Write requirements.txt**

Create `D:/tts-services/edge-tts-service/requirements.txt`:

```
flask==3.0.0
edge-tts==6.1.9
```

- [ ] **Step 2: Write the Flask server**

Create `D:/tts-services/edge-tts-service/server.py`:

```python
"""Edge TTS microservice — wraps Microsoft's free TTS API via edge-tts library."""
import io
import os
import sys
import tempfile
import asyncio
from flask import Flask, request, jsonify, send_file

app = Flask(__name__)

DEFAULT_VOICE = os.environ.get("EDGE_TTS_DEFAULT_VOICE", "zh-CN-XiaoxiaoNeural")
DEFAULT_RATE = os.environ.get("EDGE_TTS_DEFAULT_RATE", "+0%")

async def _synthesize(text: str, voice: str, rate: str, output_path: str):
    import edge_tts
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(output_path)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "engine": "edge-tts"})

@app.route("/synthesize", methods=["POST"])
def synthesize():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    if len(text) > 5000:
        return jsonify({"error": "text exceeds 5000 characters"}), 400

    voice = body.get("voice", DEFAULT_VOICE)
    rate = body.get("rate", DEFAULT_RATE)

    # Write to a temp MP3 file
    fd, tmp_path = tempfile.mkstemp(suffix=".mp3")
    os.close(fd)

    try:
        asyncio.run(_synthesize(text, voice, rate, tmp_path))
        return send_file(tmp_path, mimetype="audio/mpeg", as_attachment=False)
    except Exception as e:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
        return jsonify({"error": str(e)}), 502
    finally:
        # Clean up in background after send
        if os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

@app.route("/voices", methods=["GET"])
def list_voices():
    """Return the short-name of Chinese voices we recommend."""
    voices = [
        {"id": "zh-CN-XiaoxiaoNeural", "name": "晓晓 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaoyiNeural", "name": "晓伊 (女)", "engine": "edge"},
        {"id": "zh-CN-YunjianNeural", "name": "云健 (男)", "engine": "edge"},
        {"id": "zh-CN-YunxiNeural", "name": "云希 (男)", "engine": "edge"},
        {"id": "zh-CN-YunxiaNeural", "name": "云夏 (男)", "engine": "edge"},
        {"id": "zh-CN-YunyangNeural", "name": "云扬 (男)", "engine": "edge"},
        {"id": "zh-CN-XiaohanNeural", "name": "晓涵 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaomengNeural", "name": "晓梦 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaomoNeural", "name": "晓墨 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaoqiuNeural", "name": "晓秋 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaoruiNeural", "name": "晓睿 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaoshuangNeural", "name": "晓双 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaoxuanNeural", "name": "晓萱 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaoyanNeural", "name": "晓颜 (女)", "engine": "edge"},
        {"id": "zh-CN-XiaozhenNeural", "name": "晓臻 (女)", "engine": "edge"},
    ]
    return jsonify(voices)


if __name__ == "__main__":
    port = int(os.environ.get("EDGE_TTS_PORT", 5001))
    print(f"[edge-tts] Starting on port {port}")
    app.run(host="127.0.0.1", port=port, debug=False)
```

- [ ] **Step 3: Set up Python venv and install dependencies**

```bash
cd /d/tts-services/edge-tts-service
python -m venv venv
source venv/Scripts/activate  # Git Bash on Windows
pip install -r requirements.txt
```

- [ ] **Step 4: Test the service**

```bash
# Start the service
source venv/Scripts/activate && python server.py &
sleep 2

# Health check
curl http://127.0.0.1:5001/health
# Expected: {"engine":"edge-tts","status":"ok"}

# List voices
curl http://127.0.0.1:5001/voices
# Expected: JSON array of voice objects
```

- [ ] **Step 5: Commit (not applicable for D drive — note in progress)**

---

### Task 2: Kokoro Python Service

**Files:**
- Create: `D:/tts-services/kokoro-service/server.py`
- Create: `D:/tts-services/kokoro-service/requirements.txt`

- [ ] **Step 1: Write requirements.txt**

Create `D:/tts-services/kokoro-service/requirements.txt`:

```
flask==3.0.0
onnxruntime==1.17.0
numpy==1.26.3
scipy==1.12.0
soundfile==0.12.1
kokoro>=0.3.0
```

- [ ] **Step 2: Write the Flask server**

Create `D:/tts-services/kokoro-service/server.py`:

```python
"""Kokoro TTS microservice — offline ONNX inference fallback."""
import io
import os
import sys
import tempfile
from flask import Flask, request, jsonify, send_file
import numpy as np
import soundfile as sf

app = Flask(__name__)

DEFAULT_VOICE = os.environ.get("KOKORO_DEFAULT_VOICE", "af_heart")
DEFAULT_LANG = os.environ.get("KOKORO_DEFAULT_LANG", "z")

# Lazy-loaded Kokoro pipeline
_pipeline = None

def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        from kokoro import KPipeline
        _pipeline = KPipeline(lang_code=DEFAULT_LANG)
    return _pipeline

def _synthesize_to_bytes(text: str, voice: str) -> io.BytesIO:
    pipeline = _get_pipeline()
    generator = pipeline(text, voice=voice, speed=1.0, split_pattern=r"(?<=[。！？\n])")

    all_audio = []
    sample_rate = 24000
    for _, _, audio in generator:
        if audio is not None:
            all_audio.append(audio)

    if not all_audio:
        raise RuntimeError("Kokoro produced no audio output")

    combined = np.concatenate(all_audio)

    buf = io.BytesIO()
    sf.write(buf, combined, sample_rate, format="WAV")
    buf.seek(0)
    return buf

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "engine": "kokoro"})

@app.route("/synthesize", methods=["POST"])
def synthesize():
    body = request.get_json(silent=True) or {}
    text = (body.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400
    if len(text) > 5000:
        return jsonify({"error": "text exceeds 5000 characters"}), 400

    voice = body.get("voice", DEFAULT_VOICE)

    try:
        buf = _synthesize_to_bytes(text, voice)
        return send_file(buf, mimetype="audio/wav", as_attachment=False,
                         download_name="synthesized.wav")
    except Exception as e:
        return jsonify({"error": str(e)}), 502

@app.route("/voices", methods=["GET"])
def list_voices():
    voices = [
        {"id": "af_heart", "name": "心 (女)", "engine": "kokoro"},
        {"id": "af_bella", "name": "贝拉 (女)", "engine": "kokoro"},
        {"id": "af_sarah", "name": "莎拉 (女)", "engine": "kokoro"},
        {"id": "af_nicole", "name": "妮可 (女)", "engine": "kokoro"},
        {"id": "af_sky", "name": "天空 (女)", "engine": "kokoro"},
        {"id": "am_adam", "name": "亚当 (男)", "engine": "kokoro"},
        {"id": "am_michael", "name": "迈克尔 (男)", "engine": "kokoro"},
        {"id": "bf_emma", "name": "艾玛 (英-女)", "engine": "kokoro"},
        {"id": "bm_george", "name": "乔治 (英-男)", "engine": "kokoro"},
    ]
    return jsonify(voices)


if __name__ == "__main__":
    port = int(os.environ.get("KOKORO_TTS_PORT", 5002))
    print(f"[kokoro] Starting on port {port}")
    app.run(host="127.0.0.1", port=port, debug=False)
```

- [ ] **Step 3: Set up Python venv and install dependencies**

```bash
cd /d/tts-services/kokoro-service
python -m venv venv
source venv/Scripts/activate
pip install -r requirements.txt
```

- [ ] **Step 4: Test the service**

```bash
source venv/Scripts/activate && python server.py &
sleep 3

curl http://127.0.0.1:5002/health
# Expected: {"engine":"kokoro","status":"ok"}

curl http://127.0.0.1:5002/voices
# Expected: JSON array of voice objects
```

---

### Task 3: One-Click Service Launcher

**Files:**
- Create: `D:/tts-services/start-services.bat`

- [ ] **Step 1: Write start-services.bat**

Create `D:/tts-services/start-services.bat`:

```bat
@echo off
echo ========================================
echo Starting TTS Services...
echo ========================================

echo.
echo [1/2] Starting Edge TTS Service (port 5001)...
start "Edge-TTS" cmd /k "cd /d D:\tts-services\edge-tts-service && venv\Scripts\python.exe server.py"

echo [2/2] Starting Kokoro TTS Service (port 5002)...
start "Kokoro-TTS" cmd /k "cd /d D:\tts-services\kokoro-service && venv\Scripts\python.exe server.py"

echo.
echo Both services started in separate windows.
echo Edge TTS: http://127.0.0.1:5001
echo Kokoro:   http://127.0.0.1:5002
echo.
pause
```

---

### Task 4: Express TTS Cache Service

**Files:**
- Create: `backend/src/services/ttsCacheService.js`

- [ ] **Step 1: Write ttsCacheService.js**

Create `backend/src/services/ttsCacheService.js`:

```javascript
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

class TTSCacheService {
  constructor(cacheDir, maxSizeBytes = 500 * 1024 * 1024, maxAgeDays = 30) {
    this.cacheDir = cacheDir;
    this.maxSizeBytes = maxSizeBytes;
    this.maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /** md5 hash for a given chapterId + voice combination */
  cacheKey(chapterId, voice) {
    return crypto.createHash('md5').update(`${chapterId}:${voice}`).digest('hex');
  }

  /** Return absolute path to cached mp3, or null */
  getPath(key) {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    if (fs.existsSync(filePath)) {
      // Touch atime for LRU
      fs.utimesSync(filePath, new Date(), new Date());
      return filePath;
    }
    return null;
  }

  /** Write mp3 bytes to cache. Returns the file path. */
  save(key, buffer) {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    fs.writeFileSync(filePath, buffer);
    this._enforceSizeLimit();
    return filePath;
  }

  /** Remove all entries older than maxAgeDays */
  cleanupStale() {
    const now = Date.now();
    const files = fs.readdirSync(this.cacheDir);
    for (const name of files) {
      const filePath = path.join(this.cacheDir, name);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > this.maxAgeMs) {
          fs.unlinkSync(filePath);
        }
      } catch { /* skip permission errors */ }
    }
  }

  /** Invalidate cache for a specific key */
  invalidate(key) {
    const filePath = path.join(this.cacheDir, `${key}.mp3`);
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ok */ }
  }

  /** Total size of all cached files in bytes */
  totalSize() {
    let total = 0;
    const files = fs.readdirSync(this.cacheDir);
    for (const name of files) {
      try {
        total += fs.statSync(path.join(this.cacheDir, name)).size;
      } catch { /* skip */ }
    }
    return total;
  }

  /** Delete oldest files until total size is under maxSizeBytes */
  _enforceSizeLimit() {
    let total = this.totalSize();
    if (total <= this.maxSizeBytes) return;

    const files = fs.readdirSync(this.cacheDir)
      .map(name => {
        const p = path.join(this.cacheDir, name);
        try { return { path: p, atime: fs.statSync(p).atimeMs }; }
        catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => a.atime - b.atime);

    for (const entry of files) {
      if (total <= this.maxSizeBytes * 0.8) break; // Clear to 80% so we're not thrashing
      try {
        const size = fs.statSync(entry.path).size;
        fs.unlinkSync(entry.path);
        total -= size;
      } catch { /* skip */ }
    }
  }
}

// Default: 500 MB cache, 30 day retention
const cacheDir = process.env.TTS_CACHE_DIR || 'D:/tts-services/audio-cache';
const maxMB = parseInt(process.env.TTS_CACHE_MAX_MB, 10) || 500;
const maxAge = parseInt(process.env.TTS_CACHE_MAX_AGE_DAYS, 10) || 30;

const ttsCache = new TTSCacheService(cacheDir, maxMB * 1024 * 1024, maxAge);

// Periodic stale cleanup every hour
setInterval(() => ttsCache.cleanupStale(), 60 * 60 * 1000);

export default ttsCache;
```

---

### Task 5: Express TTS Controller

**Files:**
- Create: `backend/src/controllers/ttsController.js`

- [ ] **Step 1: Write ttsController.js**

Create `backend/src/controllers/ttsController.js`:

```javascript
import ttsCache from '../services/ttsCacheService.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const EDGE_URL = process.env.TTS_EDGE_SERVICE_URL || 'http://127.0.0.1:5001';
const KOKORO_URL = process.env.TTS_KOKORO_SERVICE_URL || 'http://127.0.0.1:5002';
const DEFAULT_VOICE = process.env.TTS_DEFAULT_VOICE || 'zh-CN-XiaoxiaoNeural';
const EDGE_TIMEOUT = parseInt(process.env.TTS_EDGE_TIMEOUT_MS, 10) || 10000;

/** Split long text into chunks at sentence boundaries */
function chunkText(text, maxLen = 2500) {
  if (text.length <= maxLen) return [text];
  const sentences = text.split(/(?<=[。！？\n])/);
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if (current.length + s.length > maxLen && current.length > 0) {
      chunks.push(current);
      current = s;
    } else {
      current += s;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** POST /api/tts/synthesize */
export async function synthesize(req, res) {
  try {
    const { chapterId, text, voice } = req.body;
    if (!chapterId || !text) {
      return res.status(400).json({ success: false, message: 'chapterId和text必填' });
    }

    const v = voice || DEFAULT_VOICE;
    const key = ttsCache.cacheKey(chapterId, v);

    // Cache hit
    const cached = ttsCache.getPath(key);
    if (cached) {
      return res.json({
        success: true,
        url: `/api/tts/audio/${key}.mp3`,
        cached: true,
        engine: v.startsWith('zh-CN') ? 'edge' : 'kokoro'
      });
    }

    let audioBuffer = null;
    let usedEngine = 'edge';

    // Try Edge TTS first
    try {
      const chunks = chunkText(text);
      const buffers = [];
      for (const chunk of chunks) {
        const resp = await axios.post(`${EDGE_URL}/synthesize`, {
          text: chunk,
          voice: v
        }, {
          responseType: 'arraybuffer',
          timeout: EDGE_TIMEOUT
        });
        buffers.push(Buffer.from(resp.data));
      }
      audioBuffer = Buffer.concat(buffers);
      usedEngine = 'edge';
    } catch (edgeErr) {
      console.warn('[TTS] Edge TTS failed, falling back to Kokoro:', edgeErr.message);

      // Fall back to Kokoro
      try {
        const kokoroVoice = 'af_heart'; // default Kokoro voice for fallback
        const chunks = chunkText(text);
        const buffers = [];
        for (const chunk of chunks) {
          const resp = await axios.post(`${KOKORO_URL}/synthesize`, {
            text: chunk,
            voice: kokoroVoice
          }, {
            responseType: 'arraybuffer',
            timeout: 30000
          });
          buffers.push(Buffer.from(resp.data));
        }
        audioBuffer = Buffer.concat(buffers);
        usedEngine = 'kokoro';
      } catch (kokoroErr) {
        console.error('[TTS] Both engines failed:', kokoroErr.message);
        return res.status(502).json({
          success: false,
          message: '语音合成暂时不可用，请稍后重试'
        });
      }
    }

    // Save to cache
    ttsCache.save(key, audioBuffer);

    res.json({
      success: true,
      url: `/api/tts/audio/${key}.mp3`,
      cached: false,
      engine: usedEngine
    });
  } catch (error) {
    console.error('[TTS] Synthesize error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
}

/** GET /api/tts/voices */
export async function getVoices(req, res) {
  try {
    const [edgeResp, kokoroResp] = await Promise.allSettled([
      axios.get(`${EDGE_URL}/voices`, { timeout: 5000 }),
      axios.get(`${KOKORO_URL}/voices`, { timeout: 5000 })
    ]);

    const voices = [];
    if (edgeResp.status === 'fulfilled') voices.push(...edgeResp.value.data);
    if (kokoroResp.status === 'fulfilled') voices.push(...kokoroResp.value.data);

    res.json({ success: true, voices });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/** POST /api/tts/preview */
export async function preview(req, res) {
  try {
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'text必填' });
    }

    const previewText = text.slice(0, 200); // Max 200 chars for preview
    const v = voice || DEFAULT_VOICE;

    const isEdge = v.startsWith('zh-CN');
    const serviceUrl = isEdge ? EDGE_URL : KOKORO_URL;

    const resp = await axios.post(`${serviceUrl}/synthesize`, {
      text: previewText,
      voice: v
    }, {
      responseType: 'arraybuffer',
      timeout: isEdge ? EDGE_TIMEOUT : 30000
    });

    const buf = Buffer.from(resp.data);
    res.set('Content-Type', 'audio/mpeg');
    res.send(buf);
  } catch (error) {
    res.status(502).json({ success: false, message: '预览语音合成失败' });
  }
}

/** GET /api/tts/audio/:key.mp3 — serve cached file */
export async function serveAudio(req, res) {
  const filePath = path.join(ttsCache.cacheDir, `${req.params.key}.mp3`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: '音频文件不存在' });
  }
  res.sendFile(filePath);
}
```

---

### Task 6: Express TTS Routes

**Files:**
- Modify: `backend/src/routes/index.js` — add TTS routes
- Modify: `backend/.env` — add TTS env vars

- [ ] **Step 1: Add TTS env vars to .env**

Append to `backend/.env`:

```
# TTS 语音合成配置
TTS_CACHE_DIR=D:/tts-services/audio-cache
TTS_CACHE_MAX_MB=500
TTS_CACHE_MAX_AGE_DAYS=30
TTS_EDGE_SERVICE_URL=http://127.0.0.1:5001
TTS_KOKORO_SERVICE_URL=http://127.0.0.1:5002
TTS_DEFAULT_VOICE=zh-CN-XiaoxiaoNeural
TTS_EDGE_TIMEOUT_MS=10000
```

- [ ] **Step 2: Add TTS routes to routes/index.js**

Add import at top of `backend/src/routes/index.js`:

```javascript
import * as ttsController from '../controllers/ttsController.js';
```

Append these routes before `export default router;`:

```javascript
// TTS 语音合成路由
router.post('/tts/synthesize', ttsController.synthesize);
router.get('/tts/voices', ttsController.getVoices);
router.post('/tts/preview', ttsController.preview);
router.get('/tts/audio/:key.mp3', ttsController.serveAudio);
```

- [ ] **Step 3: Verify routes load without errors**

```bash
cd backend && node -e "import('./src/routes/index.js').then(() => console.log('OK')).catch(e => console.error(e))"
# Expected: OK
```

---

### Task 7: Frontend TTS API Helper

**Files:**
- Create: `frontend/src/api/tts.js`

- [ ] **Step 1: Write tts.js API helper**

Create `frontend/src/api/tts.js`:

```javascript
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export async function synthesizeTTS({ chapterId, text, voice }) {
  const resp = await fetch(`${API_BASE}/tts/synthesize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chapterId, text, voice }),
  });
  if (!resp.ok) throw new Error('TTS synthesis failed');
  return resp.json();
  // returns: { success, url, cached, engine }
}

export async function getVoices() {
  const resp = await fetch(`${API_BASE}/tts/voices`);
  if (!resp.ok) throw new Error('Failed to fetch voices');
  const data = await resp.json();
  return data.voices;
  // returns: [{ id, name, engine }]
}

export async function previewVoice({ text, voice }) {
  const resp = await fetch(`${API_BASE}/tts/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice }),
  });
  if (!resp.ok) throw new Error('Preview failed');
  return resp.blob();
}

export function getAudioUrl(key) {
  return `${API_BASE}/tts/audio/${key}.mp3`;
}
```

---

### Task 8: Frontend Pinia TTS Store

**Files:**
- Create: `frontend/src/stores/ttsStore.js`

- [ ] **Step 1: Write ttsStore.js**

Create `frontend/src/stores/ttsStore.js`:

```javascript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { synthesizeTTS, getVoices, getAudioUrl } from '../api/tts';

export const useTTSStore = defineStore('tts', () => {
  const voices = ref([]);
  const selectedVoice = ref(localStorage.getItem('tts-voice') || 'zh-CN-XiaoxiaoNeural');
  const playbackRate = ref(parseFloat(localStorage.getItem('tts-rate') || '1.0'));

  // Per-chapter audio state
  const audioUrl = ref(null);
  const engine = ref(null);
  const isCached = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  function setVoice(voiceId) {
    selectedVoice.value = voiceId;
    localStorage.setItem('tts-voice', voiceId);
  }

  function setPlaybackRate(rate) {
    playbackRate.value = rate;
    localStorage.setItem('tts-rate', String(rate));
  }

  async function loadVoices() {
    if (voices.value.length > 0) return;
    try {
      voices.value = await getVoices();
    } catch (e) {
      console.warn('Failed to load TTS voices:', e.message);
    }
  }

  async function synthesize(chapterId, text) {
    isLoading.value = true;
    error.value = null;
    audioUrl.value = null;

    try {
      const result = await synthesizeTTS({
        chapterId,
        text,
        voice: selectedVoice.value,
      });
      audioUrl.value = getAudioUrl(result.url.split('/').pop());
      engine.value = result.engine;
      isCached.value = result.cached;
    } catch (e) {
      error.value = e.message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function reset() {
    audioUrl.value = null;
    engine.value = null;
    isCached.value = false;
    error.value = null;
  }

  return {
    voices,
    selectedVoice,
    playbackRate,
    audioUrl,
    engine,
    isCached,
    isLoading,
    error,
    setVoice,
    setPlaybackRate,
    loadVoices,
    synthesize,
    reset,
  };
});
```

---

### Task 9: AudioPlayer Vue Component

**Files:**
- Create: `frontend/src/components/AudioPlayer.vue`

- [ ] **Step 1: Write AudioPlayer.vue**

Create `frontend/src/components/AudioPlayer.vue`:

```vue
<template>
  <div class="audio-player" v-if="visible">
    <!-- Loading state -->
    <div class="player-loading" v-if="store.isLoading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>语音合成中...</span>
    </div>

    <!-- Player controls (shown when audio is ready) -->
    <div class="player-controls" v-else-if="store.audioUrl">
      <audio
        ref="audioEl"
        :src="store.audioUrl"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoaded"
        @ended="onEnded"
        @error="onError"
      />

      <!-- Play/Pause button -->
      <el-button
        :icon="isPlaying ? VideoPause : VideoPlay"
        circle
        @click="togglePlay"
      />

      <!-- Progress bar -->
      <div class="timeline" @click="seek">
        <div class="timeline-track">
          <div class="timeline-fill" :style="{ width: progress + '%' }" />
        </div>
        <span class="time">{{ formatTime(currentTime) }}</span>
        <span class="time">/</span>
        <span class="time">{{ formatTime(duration) }}</span>
      </div>

      <!-- Speed control -->
      <el-select
        :model-value="store.playbackRate"
        @update:model-value="onSpeedChange"
        size="small"
        class="speed-select"
      >
        <el-option label="0.75x" :value="0.75" />
        <el-option label="1x" :value="1.0" />
        <el-option label="1.25x" :value="1.25" />
        <el-option label="1.5x" :value="1.5" />
      </el-select>

      <!-- Engine badge -->
      <el-tag size="small" :type="store.engine === 'edge' ? 'success' : 'warning'">
        {{ store.engine === 'edge' ? 'Edge' : 'Kokoro' }}
      </el-tag>
    </div>

    <!-- Error state -->
    <div class="player-error" v-if="store.error">
      <span>语音合成失败：{{ store.error }}</span>
      <el-button size="small" @click="$emit('retry')">重试</el-button>
    </div>

    <!-- Idle: show play button to trigger synthesis -->
    <div class="player-idle" v-if="!store.audioUrl && !store.isLoading && !store.error">
      <el-button type="primary" :icon="Headset" circle @click="$emit('play')" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { VideoPlay, VideoPause, Headset, Loading } from '@element-plus/icons-vue';
import { useTTSStore } from '../stores/ttsStore';

const props = defineProps({
  chapterId: { type: [String, Number], required: true },
  chapterText: { type: String, required: true },
  visible: { type: Boolean, default: true },
});

const emit = defineEmits(['play', 'retry']);

const store = useTTSStore();
const audioEl = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);

const progress = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

function togglePlay() {
  const a = audioEl.value;
  if (!a) return;
  if (a.paused) {
    a.playbackRate = store.playbackRate;
    a.play();
    isPlaying.value = true;
  } else {
    a.pause();
    isPlaying.value = false;
  }
}

function onTimeUpdate() {
  if (audioEl.value) currentTime.value = audioEl.value.currentTime;
}

function onLoaded() {
  if (audioEl.value) duration.value = audioEl.value.duration;
}

function onEnded() {
  isPlaying.value = false;
}

function onError() {
  store.error = '音频播放失败';
}

function seek(e) {
  const rect = e.target.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  if (audioEl.value && duration.value) {
    audioEl.value.currentTime = ratio * duration.value;
  }
}

function onSpeedChange(rate) {
  store.setPlaybackRate(rate);
  if (audioEl.value) audioEl.value.playbackRate = rate;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Stop audio when leaving component
onBeforeUnmount(() => {
  if (audioEl.value) {
    audioEl.value.pause();
    audioEl.value.src = '';
  }
});
</script>

<style scoped>
.audio-player {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  margin-top: 12px;
}
.player-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}
.timeline {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.timeline-track {
  flex: 1;
  height: 4px;
  background: var(--el-border-color);
  border-radius: 2px;
  overflow: hidden;
}
.timeline-fill {
  height: 100%;
  background: var(--el-color-primary);
  transition: width 0.1s linear;
}
.speed-select {
  width: 90px;
}
.time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  min-width: 28px;
}
.player-idle, .player-loading, .player-error {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
```

---

### Task 10: Integrate AudioPlayer into PublicRead View

**Files:**
- Modify: `frontend/src/views/PublicRead.vue`

- [ ] **Step 1: Add AudioPlayer import and template insertion**

In `frontend/src/views/PublicRead.vue`, add the import at top of `<script setup>`:

```javascript
import AudioPlayer from '../components/AudioPlayer.vue';
import { useTTSStore } from '../stores/ttsStore';
```

In the `<script setup>`, add:

```javascript
const ttsStore = useTTSStore();

async function handleTTSPlay() {
  try {
    await ttsStore.synthesize(
      activeChapter.value.id,
      activeChapterFullContent.value
    );
  } catch (e) {
    // error already set in store
  }
}

function handleTTSRetry() {
  ttsStore.reset();
}
```

- [ ] **Step 2: Insert AudioPlayer in the template**

After the chapter-content `<div class="content-text">` block, insert:

```html
<AudioPlayer
  v-if="activeChapter"
  :chapter-id="activeChapter.id"
  :chapter-text="activeChapterFullContent"
  @play="handleTTSPlay"
  @retry="handleTTSRetry"
/>
```

- [ ] **Step 3: Verify the page compiles**

```bash
cd frontend && npx vite build --mode development 2>&1 | tail -5
# Expected: build completes without error
```

---

### Task 11: End-to-End Integration Test

**Files:**
- No new files — manual verification

- [ ] **Step 1: Start all services**

```bash
# Terminal 1: Start Python services
cmd /c D:/tts-services/start-services.bat

# Terminal 2: Start backend
cd backend && npm run dev

# Terminal 3: Start frontend
cd frontend && npm run dev
```

- [ ] **Step 2: Test Edge TTS synthesis via curl**

```bash
curl -X POST http://127.0.0.1:5001/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"你好，这是一段测试语音。","voice":"zh-CN-XiaoxiaoNeural"}' \
  -o test-edge.mp3
# Expected: test-edge.mp3 created with audible Chinese speech
```

- [ ] **Step 3: Test Kokoro synthesis via curl**

```bash
curl -X POST http://127.0.0.1:5002/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"你好，这是一段测试语音。","voice":"af_heart"}' \
  -o test-kokoro.wav
# Expected: test-kokoro.wav created with audible Chinese speech
```

- [ ] **Step 4: Test Express TTS endpoint**

```bash
curl -X POST http://127.0.0.1:8080/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -H "x-guest-mode: true" \
  -d '{"chapterId":"test-ch-1","text":"你好世界，这是小说朗读测试。","voice":"zh-CN-XiaoxiaoNeural"}'
# Expected: { "success": true, "url": "/api/tts/audio/<key>.mp3", "cached": false, "engine": "edge" }
```

- [ ] **Step 5: Test voices endpoint**

```bash
curl http://127.0.0.1:8080/api/tts/voices \
  -H "x-guest-mode: true"
# Expected: JSON array with Edge + Kokoro voices merged
```

- [ ] **Step 6: Open the reading page in browser**

Navigate to a public reading page with chapter content:
1. Open `http://localhost:5173/bookshelf` → click into a novel → click a chapter
2. Click the headset button in AudioPlayer
3. Verify: loading spinner → audio plays → timeline updates → speed control works
4. Click pause → verify pausing
5. Change speed to 1.5x → verify speed changes

- [ ] **Step 7: Test fallback logic**

```bash
# Stop Edge TTS service, then retry synthesis
# Expected: falls back to Kokoro, engine badge shows "Kokoro"
```

- [ ] **Step 8: Test cache hit**

```bash
# Synthesize same chapterId again
curl -X POST http://127.0.0.1:8080/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -H "x-guest-mode: true" \
  -d '{"chapterId":"test-ch-1","text":"你好世界，这是小说朗读测试。","voice":"zh-CN-XiaoxiaoNeural"}'
# Expected: { "success": true, "cached": true }
```

---

### Task 12: Commit

- [ ] **Step 1: Stage and commit all backend + frontend changes**

```bash
git add backend/src/controllers/ttsController.js \
        backend/src/services/ttsCacheService.js \
        backend/src/routes/index.js \
        backend/.env \
        frontend/src/api/tts.js \
        frontend/src/stores/ttsStore.js \
        frontend/src/components/AudioPlayer.vue \
        frontend/src/views/PublicRead.vue

git commit -m "feat: add TTS voice narration module with Edge TTS + Kokoro dual engine

- Python microservices: Edge TTS (online) on port 5001, Kokoro (offline) on port 5002
- Express TTS controller with dual-engine synthesis + fallback + MP3 caching
- Vue 3 AudioPlayer component with play/pause, seek, speed control, engine badge
- Integrated into PublicRead chapter reading page
- LRU cache eviction with configurable size and age limits

Co-Authored-By: Claude Code <noreply@anthropic.com>"
```
