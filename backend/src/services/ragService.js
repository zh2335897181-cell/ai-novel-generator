import axios from 'axios';
import pool from '../config/database.js';

const CHUNK_MAX = 900;
const CHUNK_OVERLAP = 120;
const TOP_K = 6;
const MAX_CHUNKS_LOAD = 400;

/**
 * 将长文切成重叠片段（按段落优先，其次硬切）
 */
export function chunkText(text, maxLen = CHUNK_MAX, overlap = CHUNK_OVERLAP) {
  const t = (text || '').trim();
  if (!t) return [];
  const parts = [];
  const paras = t.split(/\n\s*\n+/);
  let buf = '';
  const flush = () => {
    if (!buf.trim()) return;
    let start = 0;
    const body = buf.trim();
    while (start < body.length) {
      const end = Math.min(start + maxLen, body.length);
      let slice = body.slice(start, end);
      if (end < body.length) {
        const cut = slice.lastIndexOf('。');
        if (cut > maxLen * 0.5) slice = slice.slice(0, cut + 1);
      }
      parts.push(slice.trim());
      start += Math.max(1, slice.length - overlap);
    }
    buf = '';
  };
  for (const p of paras) {
    if ((buf + p).length <= maxLen) {
      buf += (buf ? '\n' : '') + p;
    } else {
      flush();
      buf = p;
    }
  }
  flush();
  return parts.length ? parts : [t.slice(0, maxLen)];
}

function cosineSimilarity(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return -1;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

function tokenizeForLexical(s) {
  const t = (s || '').replace(/\s+/g, '');
  const words = (s || '').split(/[\s\u3000，。！？、；：""''（）【】\n\r]+/).filter((w) => w.length >= 2);
  const chars = [...new Set(t.split(''))].filter((c) => c.trim());
  return { words: new Set(words), chars: new Set(chars), raw: t };
}

function lexicalScore(query, text) {
  const q = tokenizeForLexical(query);
  const doc = tokenizeForLexical(text);
  let score = 0;
  for (const w of q.words) {
    if (text.includes(w)) score += 3;
  }
  for (const c of q.chars) {
    if (doc.raw.includes(c)) score += 0.02;
  }
  return score;
}

async function fetchEmbedding(text, config) {
  const apiKey =
    config?.embeddingApiKey ||
    process.env.AI_EMBEDDING_API_KEY ||
    process.env.AI_API_KEY;
  const baseURL =
    config?.embeddingBaseURL ||
    process.env.AI_EMBEDDING_BASE_URL ||
    process.env.AI_BASE_URL ||
    'https://api.openai.com/v1';
  const model =
    config?.embeddingModel || process.env.AI_EMBEDDING_MODEL || '';

  if (!apiKey || !model) return null;

  try {
    const { data } = await axios.post(
      `${baseURL.replace(/\/$/, '')}/embeddings`,
      { model, input: text.slice(0, 8000) },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    const vec = data?.data?.[0]?.embedding;
    return Array.isArray(vec) ? vec : null;
  } catch (e) {
    console.warn('[RAG] embedding 请求失败，将使用词法检索:', e.response?.data || e.message);
    return null;
  }
}

async function fetchEmbeddingsBatch(inputs, config) {
  const apiKey =
    config?.embeddingApiKey ||
    process.env.AI_EMBEDDING_API_KEY ||
    process.env.AI_API_KEY;
  const baseURL =
    config?.embeddingBaseURL ||
    process.env.AI_EMBEDDING_BASE_URL ||
    process.env.AI_BASE_URL ||
    'https://api.openai.com/v1';
  const model =
    config?.embeddingModel || process.env.AI_EMBEDDING_MODEL || '';
  if (!apiKey || !model || !inputs.length) return [];

  try {
    const { data } = await axios.post(
      `${baseURL.replace(/\/$/, '')}/embeddings`,
      { model, input: inputs.map((t) => t.slice(0, 8000)) },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );
    const out = data?.data || [];
    return out.sort((a, b) => a.index - b.index).map((x) => x.embedding);
  } catch (e) {
    console.warn('[RAG] batch embedding 失败:', e.response?.data || e.message);
    return [];
  }
}

/**
 * 把单章写入 rag_chunk（含可选向量）
 */
export async function indexStoryChapter(
  novelId,
  storyContentId,
  chapterNumber,
  chapterTitle,
  content,
  aiConfig
) {
  const chunks = chunkText(content);
  if (!chunks.length) return;

  const embeddings = await fetchEmbeddingsBatch(chunks, aiConfig);
  const conn = await pool.getConnection();
  try {
    await conn.query('DELETE FROM rag_chunk WHERE novel_id = ? AND source_type = ? AND source_id = ?', [
      novelId,
      'story',
      storyContentId
    ]);
    for (let i = 0; i < chunks.length; i++) {
      const emb = embeddings[i] || null;
      const prefix = chapterTitle
        ? `第${chapterNumber}章 ${chapterTitle}\n`
        : `第${chapterNumber}章\n`;
      const text_content = prefix + chunks[i];
      await conn.query(
        `INSERT INTO rag_chunk (novel_id, source_type, source_id, chapter_number, chunk_index, text_content, embedding)
         VALUES (?, 'story', ?, ?, ?, ?, ?)`,
        [
          novelId,
          storyContentId,
          chapterNumber,
          i,
          text_content,
          emb ? JSON.stringify(emb) : null
        ]
      );
    }
  } finally {
    conn.release();
  }
}

export async function indexSummaryChunk(novelId, summaryText, aiConfig) {
  if (!summaryText || !summaryText.trim()) return;
  const conn = await pool.getConnection();
  try {
    await conn.query('DELETE FROM rag_chunk WHERE novel_id = ? AND source_type = ?', [novelId, 'summary']);
    const emb = await fetchEmbedding(summaryText.slice(0, 4000), aiConfig);
    await conn.query(
      `INSERT INTO rag_chunk (novel_id, source_type, source_id, chapter_number, chunk_index, text_content, embedding)
       VALUES (?, 'summary', NULL, NULL, 0, ?, ?)`,
      [novelId, `【剧情摘要】\n${summaryText}`, emb ? JSON.stringify(emb) : null]
    );
  } finally {
    conn.release();
  }
}

/**
 * 若 rag_chunk 为空，从已有 story_content 回填
 */
export async function backfillChunksFromDb(novelId, aiConfig) {
  const conn = await pool.getConnection();
  try {
    const [[{ cnt }]] = await conn.query(
      'SELECT COUNT(*) AS cnt FROM rag_chunk WHERE novel_id = ?',
      [novelId]
    );
    if (cnt > 0) return;

    const [rows] = await conn.query(
      'SELECT id, chapter_number, chapter_title, content FROM story_content WHERE novel_id = ? ORDER BY chapter_number',
      [novelId]
    );
    for (const row of rows) {
      await indexStoryChapter(
        novelId,
        row.id,
        row.chapter_number,
        row.chapter_title || '',
        row.content || '',
        aiConfig
      );
    }
    const [sum] = await conn.query('SELECT summary FROM story_summary WHERE novel_id = ?', [novelId]);
    if (sum[0]?.summary) {
      await indexSummaryChunk(novelId, sum[0].summary, aiConfig);
    }
  } catch (e) {
    console.warn('[RAG] 历史章节回填失败（请确认已执行 database/add_rag_chunk.sql）:', e.message);
  } finally {
    conn.release();
  }
}

/**
 * 检索与 userQuery 最相关的片段，拼成注入 Prompt 的文本
 */
export async function retrieveContextForGeneration(novelId, userQuery, aiConfig) {
  const conn = await pool.getConnection();
  try {
    await backfillChunksFromDb(novelId, aiConfig);

    const [rows] = await conn.query(
      `SELECT id, text_content, embedding, chapter_number, source_type
       FROM rag_chunk WHERE novel_id = ?
       ORDER BY id DESC
       LIMIT ?`,
      [novelId, MAX_CHUNKS_LOAD]
    );

    if (!rows.length) return '';

    const queryVec = await fetchEmbedding(userQuery || '续写', aiConfig);
    const scored = [];

    for (const row of rows) {
      let score = 0;
      let emb = null;
      try {
        emb = row.embedding ? JSON.parse(row.embedding) : null;
      } catch {
        emb = null;
      }
      if (queryVec && emb && queryVec.length === emb.length) {
        score = cosineSimilarity(queryVec, emb);
      } else {
        score = lexicalScore(userQuery, row.text_content);
      }
      scored.push({ row, score });
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, TOP_K);

    return top
      .map((x, i) => `【片段${i + 1}】\n${x.row.text_content}`)
      .join('\n\n---\n\n');
  } catch (e) {
    console.warn('[RAG] 检索失败:', e.message);
    return '';
  } finally {
    conn.release();
  }
}

export default {
  chunkText,
  indexStoryChapter,
  indexSummaryChunk,
  backfillChunksFromDb,
  retrieveContextForGeneration
};
