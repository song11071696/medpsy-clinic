/**
 * RAG (Retrieval-Augmented Generation) module
 * Loads knowledge base documents and provides context-aware completions
 * Uses TF-IDF scoring for improved retrieval quality
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_BASE_DIR = path.join(__dirname, '..', 'data', 'knowledge-base');

let knowledgeDocuments = [];
let idfMap = {};       // term -> IDF score
let docTfIdfVectors = [];  // per-document TF-IDF vectors

/**
 * Tokenize Chinese/English text into terms.
 * For Chinese: split by common delimiters and extract 2-4 char n-grams.
 * For English: lowercase word split.
 */
// Chinese stop words to filter from TF-IDF index
const CHINESE_STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '它', '们', '那', '这个', '那个', '什么', '怎么',
  '如果', '但是', '因为', '所以', '可以', '不是', '但是', '而', '或', '对',
  '从', '为', '与', '以', '及', '等', '被', '比', '更', '还', '又', '再',
  '将', '把', '让', '用', '向', '给', '但', '虽然', '然而', '而且', '并',
  '的话', '吧', '啊', '嗯', '哦', '呢', '吗', '呀', '哈', '嘛', '啦',
]);

// English stop words
const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
  'should', 'may', 'might', 'must', 'can', 'could', 'to', 'of', 'in',
  'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'out',
  'up', 'down', 'and', 'but', 'or', 'nor', 'not', 'so', 'if', 'then',
  'that', 'this', 'these', 'those', 'it', 'its', 'i', 'me', 'my',
  'we', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'when',
  'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
  'than', 'too', 'very', 'just', 'about', 'also', 'here', 'there',
]);

function tokenize(text) {
  const terms = [];

  // Extract English words
  const englishWords = text.toLowerCase().match(/[a-z]{2,}/g) || [];
  // Filter English stop words
  terms.push(...englishWords.filter(w => !ENGLISH_STOP_WORDS.has(w)));

  // Extract Chinese characters as bigrams and trigrams
  const chineseChars = text.match(/[\u4e00-\u9fff]+/g) || [];
  for (const segment of chineseChars) {
    // Add bigrams for better context capture
    for (let i = 0; i < segment.length - 1; i++) {
      const bigram = segment.substring(i, i + 2);
      // Skip bigrams that are pure stop words
      if (!CHINESE_STOP_WORDS.has(bigram)) {
        terms.push(bigram);
      }
    }
    // Add trigrams
    for (let i = 0; i < segment.length - 2; i++) {
      const trigram = segment.substring(i, i + 3);
      terms.push(trigram);
    }
  }

  return terms;
}

/**
 * Compute term frequency (TF) for a list of terms
 */
function computeTF(terms) {
  const tf = {};
  const total = terms.length;
  for (const term of terms) {
    tf[term] = (tf[term] || 0) + 1;
  }
  // Normalize by document length
  for (const term in tf) {
    tf[term] = tf[term] / total;
  }
  return tf;
}

/**
 * Compute IDF across all documents
 */
function computeIDF(documents) {
  const N = documents.length;
  const docFreq = {}; // term -> number of documents containing term

  for (const doc of documents) {
    const uniqueTerms = new Set(doc.terms);
    for (const term of uniqueTerms) {
      docFreq[term] = (docFreq[term] || 0) + 1;
    }
  }

  const idf = {};
  for (const term in docFreq) {
    // Smoothed IDF: log(N / (1 + df)) + 1
    idf[term] = Math.log(N / (1 + docFreq[term])) + 1;
  }
  return idf;
}

/**
 * Compute TF-IDF vector for a document
 */
function computeTfIdf(tf, idf) {
  const tfidf = {};
  for (const term in tf) {
    tfidf[term] = tf[term] * (idf[term] || 0);
  }
  return tfidf;
}

/**
 * Compute cosine similarity between two TF-IDF vectors
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  // Collect all terms
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

  for (const term of allTerms) {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Extract category hint from document content
 */
function extractCategory(content) {
  const categoryPatterns = {
    'anxiety': /焦虑|anxiety|恐慌|panic/i,
    'depression': /抑郁|depression|情绪低落/i,
    'sleep': /失眠|sleep|insomnia|睡眠/i,
    'stress': /压力|stress|应激/i,
    'trauma': /创伤|trauma|ptsd/i,
    'relationship': /关系|relationship|人际/i,
    'addiction': /成瘾|addiction|依赖/i,
    'general': /心理健康|mental.?health|心理卫生/i,
  };

  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(content)) return category;
  }
  return 'general';
}

/**
 * Build TF-IDF index for all documents
 */
function buildIndex() {
  // Tokenize all documents
  for (const doc of knowledgeDocuments) {
    doc.terms = tokenize(doc.title + ' ' + doc.content);
    doc.tf = computeTF(doc.terms);
  }

  // Compute global IDF
  idfMap = computeIDF(knowledgeDocuments);

  // Compute TF-IDF vectors for each document
  docTfIdfVectors = knowledgeDocuments.map(doc =>
    computeTfIdf(doc.tf, idfMap)
  );

  console.log(`[RAG] TF-IDF index built: ${Object.keys(idfMap).length} unique terms across ${knowledgeDocuments.length} documents`);
}

/**
 * Initialize RAG system - load documents and build TF-IDF index
 */
async function initRAG() {
  // Load knowledge base documents
  await loadKnowledgeBase();
  console.log(`[RAG] Loaded ${knowledgeDocuments.length} knowledge base documents`);

  // Build TF-IDF index
  buildIndex();
}

/**
 * Load all .txt and .md files from knowledge-base directory
 */
async function loadKnowledgeBase() {
  knowledgeDocuments = [];

  try {
    const files = fs.readdirSync(KNOWLEDGE_BASE_DIR);

    for (const file of files) {
      const filePath = path.join(KNOWLEDGE_BASE_DIR, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile() && /\.(txt|md)$/i.test(file)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Parse YAML-like front matter for version/source metadata
        let version = 'v1.0';
        let source = 'MedPsy Clinic Knowledge Base';
        let lastUpdated = stat.mtime.toISOString().split('T')[0];
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        let docContent = content;
        if (frontMatterMatch) {
          const meta = frontMatterMatch[1];
          docContent = frontMatterMatch[2];
          const vMatch = meta.match(/version:\s*(.+)/);
          if (vMatch) version = vMatch[1].trim();
          const sMatch = meta.match(/source:\s*(.+)/);
          if (sMatch) source = sMatch[1].trim();
          const uMatch = meta.match(/last_updated:\s*(.+)/);
          if (uMatch) lastUpdated = uMatch[1].trim();
        }
        const doc = {
          id: file,
          title: path.basename(file, path.extname(file)),
          content: docContent,
          category: extractCategory(content),
          metadata: { version, source, lastUpdated },
        };
        knowledgeDocuments.push(doc);
      }
    }
  } catch (err) {
    console.error('[RAG] Error loading knowledge base:', err.message);
  }
}

/**
 * Retrieve relevant documents using TF-IDF cosine similarity
 */
function retrieve(query, topK = 3) {
  // Tokenize and compute TF-IDF for the query
  const queryTerms = tokenize(query);
  const queryTF = computeTF(queryTerms);
  const queryTfIdf = computeTfIdf(queryTF, idfMap);

  // Category boost: check if query matches a known category
  const queryCategory = extractCategory(query);

  // Score documents by cosine similarity + category bonus
  const scored = knowledgeDocuments.map((doc, index) => {
    let score = cosineSimilarity(queryTfIdf, docTfIdfVectors[index] || {});

    // Category match bonus (scaled to be meaningful but not dominant)
    if (doc.category === queryCategory) {
      score += 0.15;
    }

    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      category: doc.category,
      metadata: doc.metadata || {},
      score,
    };
  });

  // Sort by score descending and return top K
  return scored
    .filter(d => d.score > 0.01)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Generate completion with RAG context
 * NOTE: completion() is async and MUST be awaited
 */
async function completion(userQuery) {
  // Retrieve relevant documents using TF-IDF
  const relevantDocs = retrieve(userQuery, 3);

  // Build context from retrieved documents
  const context = relevantDocs
    .map(doc => `[${doc.title}]\n${doc.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `你是一位专业的心理健康咨询助手。请基于以下参考资料回答用户的问题。
如果参考资料中没有相关信息，请基于你的专业知识回答，但要注明这不是基于特定资料的回答。
始终建议用户在需要时寻求专业心理咨询师或精神科医生的帮助。

参考资料：
${context || '（暂无特定参考资料）'}`;

  // Dynamic import for @qvac/sdk (optional dependency)
  let qvacClient;
  try {
    const { QVAC } = require('@qvac/sdk');
    qvacClient = new QVAC({
      model: 'psy-assistant',
      temperature: 0.3,
    });
  } catch (err) {
    // Fallback: return context-based response when QVAC is not available
    console.warn('[RAG] QVAC SDK not available, returning context-only response');
    const fallbackAnswer = relevantDocs.length > 0
      ? `基于知识库中的参考信息：\n\n${relevantDocs.map(d => `**${d.title}**：${d.content.substring(0, 200)}...`).join('\n\n')}\n\n以上信息仅供参考，建议咨询专业心理咨询师获取个性化建议。`
      : '感谢您的分享。当前知识库中没有找到与您问题直接相关的资料。建议您咨询专业的心理咨询师获取更准确的帮助。';
    return {
      answer: fallbackAnswer,
      sources: relevantDocs.map(d => ({ title: d.title, category: d.category, metadata: d.metadata })),
      context_used: relevantDocs.length > 0,
    };
  }

  // IMPORTANT: completion() is async - must be awaited
  const response = await qvacClient.completion({
    system: systemPrompt,
    messages: [
      { role: 'user', content: userQuery }
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  return {
    answer: response.text,
    sources: relevantDocs.map(d => ({ title: d.title, category: d.category, metadata: d.metadata })),
    context_used: relevantDocs.length > 0,
  };
}

/**
 * Get all loaded document titles
 */
function getDocumentTitles() {
  return knowledgeDocuments.map(d => d.title);
}

module.exports = {
  initRAG,
  completion,
  retrieve,
  getDocumentTitles,
  loadKnowledgeBase,
  // Export internals for testing
  tokenize,
  computeTF,
  cosineSimilarity,
};
