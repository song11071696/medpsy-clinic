/**
 * MedPsy Clinic - Knowledge Base Routes
 * RAG-based knowledge retrieval for psychology resources
 */

const express = require('express');
const router = express.Router();

// Sample knowledge base (in production, backed by vector DB)
const knowledgeBase = [
  {
    id: 'kb-001',
    title: '焦虑症的识别与应对',
    category: 'anxiety',
    content: '焦虑症是最常见的心理健康问题之一。核心症状包括过度担忧、坐立不安、注意力难以集中等。认知行为疗法(CBT)被证实对焦虑症有显著疗效。日常应对策略包括深呼吸、正念冥想和规律运动。',
    tags: ['焦虑', 'CBT', '应对策略'],
    source: '中国心理卫生杂志',
    updatedAt: '2025-01-15',
  },
  {
    id: 'kb-002',
    title: '抑郁症的早期识别',
    category: 'depression',
    content: '抑郁症的主要表现包括持续的悲伤情绪、兴趣丧失、精力减退、睡眠障碍等。PHQ-9量表是常用的筛查工具。治疗通常包括药物治疗和心理治疗的综合方案。及早识别和干预对预后至关重要。',
    tags: ['抑郁', 'PHQ-9', '早期干预'],
    source: '中华精神科杂志',
    updatedAt: '2025-02-10',
  },
  {
    id: 'kb-003',
    title: '认知行为疗法基础',
    category: 'therapy',
    content: '认知行为疗法(CBT)是一种循证心理治疗方法，核心理念是思维、情感和行为之间的相互影响。基本技术包括认知重构、行为实验、暴露疗法等。CBT通常为12-20次结构化会谈，适用于多种心理障碍。',
    tags: ['CBT', '心理治疗', '循证'],
    source: 'Beck Institute',
    updatedAt: '2025-03-01',
  },
  {
    id: 'kb-004',
    title: '危机干预指南',
    category: 'crisis',
    content: '心理危机干预需要快速评估风险等级。关键评估要素包括自杀意念的具体性、计划的可行性、保护因素的存在。安全计划包括：识别预警信号、内部应对策略、社交支持联系人、专业求助渠道。紧急情况请拨打24小时心理援助热线：400-161-9995。',
    tags: ['危机', '自杀预防', '安全计划'],
    source: 'WHO Guidelines',
    updatedAt: '2025-04-20',
  },
  {
    id: 'kb-005',
    title: '正念减压训练',
    category: 'mindfulness',
    content: '正念减压(MBSR)由Jon Kabat-Zinn创立，为期8周的标准化课程。核心技术包括身体扫描、坐禅、正念瑜伽。研究显示MBSR能有效降低压力、焦虑和抑郁水平。建议每天练习20-45分钟以获得最佳效果。',
    tags: ['正念', 'MBSR', '减压'],
    source: 'UMass Medical School',
    updatedAt: '2025-05-05',
  },
];

/**
 * GET /list - List all knowledge documents
 */
router.get('/list', (req, res) => {
  const { category, page = 1, limit = 10 } = req.query;
  let results = knowledgeBase;
  if (category) {
    results = results.filter((doc) => doc.category === category);
  }
  const start = (page - 1) * limit;
  const paged = results.slice(start, start + Number(limit));
  res.json({
    total: results.length,
    page: Number(page),
    limit: Number(limit),
    documents: paged.map(({ id, title, category, tags, source, updatedAt }) => ({
      id, title, category, tags, source, updatedAt,
    })),
  });
});

/**
 * GET /search - Full-text search across knowledge base
 */
router.get('/search', (req, res) => {
  const { q, category } = req.query;
  if (!q || q.trim().length === 0) {
    return res.status(400).json({ error: 'Search query (q) is required' });
  }

  const query = q.toLowerCase().trim();
  let results = knowledgeBase.filter((doc) => {
    const searchable = [doc.title, doc.content, ...doc.tags].join(' ').toLowerCase();
    return searchable.includes(query);
  });

  if (category) {
    results = results.filter((doc) => doc.category === category);
  }

  // Simple relevance scoring
  const scored = results.map((doc) => {
    const text = [doc.title, doc.content, ...doc.tags].join(' ').toLowerCase();
    const matches = text.split(query).length - 1;
    return { ...doc, relevanceScore: matches };
  });
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  res.json({
    query: q,
    resultCount: scored.length,
    results: scored.map(({ id, title, category, tags, content, relevanceScore }) => ({
      id, title, category, tags, excerpt: content.substring(0, 200) + '...', relevanceScore,
    })),
  });
});

/**
 * GET /document/:id - Get a specific document
 */
router.get('/document/:id', (req, res) => {
  const doc = knowledgeBase.find((d) => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json(doc);
});

/**
 * GET /categories - List available categories
 */
router.get('/categories', (req, res) => {
  const cats = [...new Set(knowledgeBase.map((d) => d.category))];
  res.json({
    categories: cats.map((c) => ({
      name: c,
      count: knowledgeBase.filter((d) => d.category === c).length,
    })),
  });
});

module.exports = router;
