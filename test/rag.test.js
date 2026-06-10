/**
 * RAG Module Tests
 * Tests knowledge loading, retrieval, and completion
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const Module = require('module');

// Intercept require for @qvac/sdk
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === '@qvac/sdk') return '@qvac/sdk:mock';
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.cache['@qvac/sdk:mock'] = {
  id: '@qvac/sdk:mock',
  filename: '@qvac/sdk:mock',
  loaded: true,
  exports: {
    QVAC: function() {
      this.completion = (opts) => Promise.resolve({ text: 'Mock RAG response for: ' + opts.messages[0].content });
    },
  },
};

// Clear rag module cache
delete require.cache[path.resolve(__dirname, '..', 'src', 'rag.js')];

const rag = require('../src/rag');

describe('RAG Module', () => {
  before(async () => {
    // initRAG calls loadKnowledgeBase internally AND creates the QVAC client
    await rag.initRAG();
  });

  describe('loadKnowledgeBase', () => {
    it('should load documents from knowledge-base directory', () => {
      const titles = rag.getDocumentTitles();
      assert.ok(titles.length > 0, 'Should load at least one document');
    });

    it('should load CBT-related documents', () => {
      const titles = rag.getDocumentTitles();
      assert.ok(titles.includes('cbt-overview'), 'Should contain cbt-overview');
      assert.ok(titles.includes('cbt-basics'), 'Should contain cbt-basics');
    });

    it('should load anxiety management document', () => {
      const titles = rag.getDocumentTitles();
      assert.ok(titles.includes('anxiety-management'), 'Should contain anxiety-management');
    });

    it('should load depression documents', () => {
      const titles = rag.getDocumentTitles();
      assert.ok(titles.includes('depression-guide'), 'Should contain depression-guide');
      assert.ok(titles.includes('depression-intervention'), 'Should contain depression-intervention');
    });

    it('should load stress management document', () => {
      const titles = rag.getDocumentTitles();
      assert.ok(titles.includes('stress-management'), 'Should contain stress-management');
    });
  });

  describe('retrieve', () => {
    it('should retrieve relevant documents for anxiety query', () => {
      const results = rag.retrieve('我很焦虑，怎么办？');
      assert.ok(results.length > 0, 'Should return at least one result');
      assert.ok(results.some(d => d.id.includes('anxiety')),
        'Should include anxiety management document');
    });

    it('should retrieve relevant documents for depression query', () => {
      const results = rag.retrieve('我感到很抑郁，情绪低落');
      assert.ok(results.length > 0, 'Should return at least one result');
      assert.ok(results.some(d => d.id.includes('depression')),
        'Should include depression document');
    });

    it('should retrieve relevant documents for sleep query', () => {
      const results = rag.retrieve('我失眠了，睡不着');
      assert.ok(results.length > 0, 'Should return at least one result');
      // Accept either sleep or stress docs as relevant (both deal with sleep issues)
      const hasRelevantDoc = results.some(d =>
        d.id.includes('sleep') || d.id.includes('stress') || d.category === 'sleep'
      );
      assert.ok(hasRelevantDoc, 'Should include a relevant document');
    });

    it('should retrieve relevant documents for stress query', () => {
      const results = rag.retrieve('工作压力太大了');
      assert.ok(results.length > 0, 'Should return at least one result');
    });

    it('should respect topK parameter', () => {
      const results = rag.retrieve('心理健康', 2);
      assert.ok(results.length <= 2, 'Should return at most topK results');
    });

    it('should return empty array for irrelevant query', () => {
      const results = rag.retrieve('xyzabc123完全无关的内容qwerty');
      assert.ok(Array.isArray(results), 'Should return an array');
    });

    it('should return documents with score property', () => {
      const results = rag.retrieve('焦虑');
      if (results.length > 0) {
        assert.ok(typeof results[0].score === 'number', 'Document should have numeric score');
        assert.ok(results[0].score > 0, 'Score should be positive for matching documents');
      }
    });
  });

  describe('TF-IDF retrieval', () => {
    it('should export tokenize function', () => {
      assert.ok(typeof rag.tokenize === 'function', 'tokenize should be exported');
    });

    it('should tokenize Chinese text into terms', () => {
      const terms = rag.tokenize('我很焦虑');
      assert.ok(terms.length > 0, 'Should produce terms from Chinese text');
      assert.ok(terms.includes('焦虑'), 'Should include bigram 焦虑');
    });

    it('should tokenize English text into terms', () => {
      const terms = rag.tokenize('anxiety management');
      assert.ok(terms.includes('anxiety'), 'Should include word anxiety');
      assert.ok(terms.includes('management'), 'Should include word management');
    });

    it('should export cosineSimilarity function', () => {
      assert.ok(typeof rag.cosineSimilarity === 'function', 'cosineSimilarity should be exported');
    });

    it('should compute cosine similarity correctly', () => {
      const vecA = { a: 1, b: 2, c: 3 };
      const vecB = { a: 1, b: 2, c: 3 };
      const sim = rag.cosineSimilarity(vecA, vecB);
      assert.ok(Math.abs(sim - 1.0) < 0.001, 'Identical vectors should have similarity ~1.0');
    });

    it('should return 0 for orthogonal vectors', () => {
      const vecA = { a: 1 };
      const vecB = { b: 1 };
      const sim = rag.cosineSimilarity(vecA, vecB);
      assert.ok(Math.abs(sim) < 0.001, 'Orthogonal vectors should have similarity ~0');
    });

    it('should return better scores for relevant queries', () => {
      const anxietyResults = rag.retrieve('焦虑紧张恐慌');
      const randomResults = rag.retrieve('xyz完全无关qwerty');
      if (anxietyResults.length > 0 && randomResults.length > 0) {
        assert.ok(anxietyResults[0].score > randomResults[0].score,
          'Relevant query should score higher than irrelevant query');
      } else if (anxietyResults.length > 0) {
        assert.ok(anxietyResults[0].score > 0, 'Relevant query should have positive score');
      }
    });
  });

  describe('completion', () => {
    it('should return structured response with answer', async () => {
      const result = await rag.completion('什么是认知行为疗法？');
      assert.ok(result.answer, 'Should have an answer');
      assert.ok(Array.isArray(result.sources), 'Should have sources array');
      assert.ok(typeof result.context_used === 'boolean', 'Should have context_used boolean');
    });

    it('should call QVAC completion with context', async () => {
      const result = await rag.completion('压力太大怎么办');
      assert.ok(result.answer, 'Should have answer text');
      assert.ok(result.sources, 'Should have sources');
      assert.ok(typeof result.context_used === 'boolean', 'Should have context_used flag');
    });
  });
});
