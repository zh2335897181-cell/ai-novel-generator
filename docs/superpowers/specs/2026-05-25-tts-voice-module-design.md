# TTS Voice Module Design Spec

**Date**: 2026-05-25
**Status**: Draft

## Overview

Add text-to-speech narration to the NovelForge reading experience. Readers click "play" on a chapter and hear natural-sounding Chinese narration via a primary Edge TTS engine (online, free) with a Kokoro fallback (offline, free). Audio is generated server-side, cached as MP3 on D drive, and delivered via a simple REST + static-file pipeline.

## Architecture

```
Vue 3 Reading Page
    │ click [▶ Play]
    ▼
Express (backend/src)
    │ POST /api/tts/synthesize { chapterId, text }
    ▼
TTS Controller
    │
    ├─ try  ▶ Edge TTS Python service (port 5001) — online, Microsoft free API
    │          └─ fails/times out
    └─ then ▶ Kokoro Python service (port 5002)   — offline, local ONNX inference
    │
    ▼
Audio written to D:/tts-services/audio-cache/<chapterId>.mp3
    │
    ▼
Express returns { url: "/api/tts/audio/<chapterId>.mp3" }
    │
    ▼
Frontend <audio> element plays the URL
```

## D-Drive Layout

```
D:/tts-services/
├── edge-tts-service/
│   ├── venv/                 # Python 3.10+ virtualenv (~200 MB)
│   ├── requirements.txt      # edge-tts, flask
│   └── server.py             # Lightweight Flask HTTP wrapper
├── kokoro-service/
│   ├── venv/                 # Python 3.10+ virtualenv (~200 MB)
│   ├── models/               # Kokoro weights + ONNX files (~150 MB)
│   ├── requirements.txt      # onnxruntime, numpy, scipy, etc.
│   └── server.py             # Lightweight Flask HTTP wrapper
├── audio-cache/
│   └── <chapterId>.mp3       # Generated audio (max N files, LRU eviction)
└── start-services.bat        # One-click launcher for both Python services
```

**Estimated disk usage**:
- Kokoro environment + models: ~1.8–2 GB (one-time)
- Audio cache: configurable cap (default 500 MB), LRU eviction
- Edge TTS service: ~200 MB python environment + no model downloads

## Detailed Design

### 1. Edge TTS Python Service (Primary — Online)

- **Framework**: Flask, single endpoint `POST /synthesize`
- **Library**: `edge-tts` (MIT license, uses Microsoft Edge's free TTS API)
- **Input**: `{ "text": "...", "voice": "zh-CN-XiaoxiaoNeural" }` (configurable)
- **Output**: MP3 bytes streamed back to caller
- **Voices**: Microsoft provides dozens of natural-sounding Chinese voices (Xiaoxiao, Yunyang, etc.) — the library maps them by short name
- **Error handling**: If network fails or Microsoft API is unreachable (timeout 10s), Express caller falls back to Kokoro

### 2. Kokoro Python Service (Fallback — Offline)

- **Framework**: Flask, single endpoint `POST /synthesize`
- **Inference**: ONNX Runtime (CPU), no GPU required
- **Model**: Kokoro v0.19 (MIT license), Chinese voice pack
- **Input**: `{ "text": "...", "voice": "af_heart" }` (Kokoro preset voice names)
- **Output**: MP3 bytes
- **Performance**: ~2–5 seconds per paragraph on CPU; acceptable for a fallback

### 3. Express Backend Integration

`POST /api/tts/synthesize`
- **Input**: `{ "chapterId": "uuid", "text": "章节内容..." }`
- **Logic**:
  1. Hash text to a cache key, check `D:/tts-services/audio-cache/<key>.mp3`
  2. Cache hit → return `{ url, cached: true }`
  3. Cache miss → POST to Edge TTS service
  4. Edge TTS fails → POST to Kokoro service
  5. Write MP3 bytes to cache directory
  6. Enforce cache cap (rename or delete oldest files when over limit)
  7. Return `{ url: "/api/tts/audio/<key>.mp3", cached: false }`

`GET /api/tts/audio/:key.mp3`
- Serve the cached file statically (express.static on the cache directory)

`GET /api/tts/voices`
- Return available voices (merged list from both engines)

`POST /api/tts/preview`
- Short (1–2 sentence) synthesis for voice selection UI without caching

### 4. Frontend (Vue 3 Reading Page)

**Component tree**:
```
AudioPlayer.vue (new)
├── VoiceSelector.vue (dropdown: voice list from /api/tts/voices)
├── PlayButton.vue (toggle play/pause)
├── Timeline.vue (seekable progress bar, current time / duration)
├── SpeedControl.vue (0.75x / 1x / 1.25x / 1.5x)
```

**State machine**:
```
idle → loading (waiting for /synthesize) → playing ↔ paused → idle
                                                    ↳ stopped
```

**Features**:
- Click chapter "Play" → POST /synthesize with chapter text → get audio URL → play
- Speed control via `<audio>.playbackRate`
- Seek via `<audio>.currentTime`
- Show loading spinner while synthesizing
- Show badge/tag for current engine (Edge / Kokoro)
- Remember last voice choice in localStorage

### 5. Caching Strategy

- **Cache key**: `md5(chapterId + voice + speed)` — speed variation handled client-side via playbackRate, so cache key only uses chapterId + voice
- **Limit**: Configurable via env `TTS_CACHE_MAX_MB` (default 500 MB)
- **Eviction**: LRU — delete least-recently-accessed files when total size exceeds limit
- **Cleanup**: A scheduled task every hour deletes files older than `TTS_CACHE_MAX_AGE_DAYS` (default 30 days)

### 6. Configuration (new env vars)

```
TTS_CACHE_DIR=D:/tts-services/audio-cache
TTS_CACHE_MAX_MB=500
TTS_CACHE_MAX_AGE_DAYS=30
TTS_EDGE_SERVICE_URL=http://127.0.0.1:5001
TTS_KOKORO_SERVICE_URL=http://127.0.0.1:5002
TTS_DEFAULT_VOICE=zh-CN-XiaoxiaoNeural
TTS_EDGE_TIMEOUT_MS=10000
```

## Implementation Scope

### In scope
- Edge TTS + Kokoro dual-engine TTS synthesis
- MP3 caching with LRU eviction
- REST API: synthesize, audio serving, voice list, preview
- Vue 3 AudioPlayer component with play/pause, seek, speed control
- One-click service launcher for Python processes
- Integration into existing chapter reading page

### Out of scope (for now)
- Streaming audio (entire chapter synthesized before playback)
- Voice cloning / custom voice upload
- Background music mixing
- Per-paragraph highlight sync (word-level sync requires alignment data)
- Mobile native audio controls (uses browser `<audio>`)
- User-uploaded voice packs

## Edge Cases & Error Handling

| Scenario | Behavior |
|---|---|
| Edge TTS times out (>10s) | Fall back to Kokoro, log warning |
| Both engines fail | Return HTTP 502 with message "语音合成暂时不可用" |
| Cache directory full | Evict oldest files, retry; if still fails after eviction, return 507 Insufficient Storage |
| Text too long (>5000 chars) | Split into chunks, synthesize sequentially, concatenate MP3 |
| Python service crashes | Express detects connection refused, tries fallback, logs error |
| Chapter text changed after caching | Invalidate cache entry on chapter update (hook into existing chapter save flow) |
| User has no audio permission | Browser handles this natively; show tooltip "请允许浏览器播放音频" if autoplay blocked |

## Rollout Plan

1. **Phase 1**: Deploy Python services on D drive, wire up Express TTS controller, return audio URL → test with curl
2. **Phase 2**: Build AudioPlayer.vue component, integrate into reading page
3. **Phase 3**: Add voice selector, speed control, engine badge
4. **Phase 4**: Cache management, error recovery, polish
