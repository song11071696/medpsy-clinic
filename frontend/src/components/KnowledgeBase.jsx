import React, { useState } from 'react';

const CATEGORIES = [
  { id: 'all', label: '全部', icon: '📂' },
  { id: 'anxiety', label: '焦虑症', icon: '😰' },
  { id: 'depression', label: '抑郁症', icon: '😞' },
  { id: 'sleep', label: '睡眠障碍', icon: '😴' },
  { id: 'stress', label: '压力管理', icon: '😤' },
  { id: 'relationship', label: '人际关系', icon: '🤝' },
  { id: 'self-esteem', label: '自尊自信', icon: '💪' },
  { id: 'mindfulness', label: '正念冥想', icon: '🧘' },
];

const DEMO_ARTICLES = [
  {
    id: '1',
    title: '理解焦虑：从认识到应对',
    category: 'anxiety',
    summary: '焦虑是人类正常的情绪反应，但当它过度时会影响生活质量。本文将帮助您理解焦虑的本质，并提供实用的应对策略。',
    content: '焦虑症是全球最常见的心理健康问题之一...',
    tags: ['焦虑', 'CBT', '放松技巧'],
    readTime: '8 分钟',
    date: '2025-12-01',
  },
  {
    id: '2',
    title: '认知行为疗法入门指南',
    category: 'depression',
    summary: 'CBT 是治疗抑郁症的有效方法之一，通过识别和改变消极思维模式来改善情绪。',
    content: '认知行为疗法（CBT）是一种循证心理治疗方法...',
    tags: ['CBT', '抑郁', '认知重构'],
    readTime: '12 分钟',
    date: '2025-11-28',
  },
  {
    id: '3',
    title: '改善睡眠的 10 个科学方法',
    category: 'sleep',
    summary: '良好的睡眠是心理健康的基石。了解科学支持的睡眠改善方法。',
    content: '睡眠卫生对身心健康至关重要...',
    tags: ['睡眠', '生活习惯', '健康'],
    readTime: '6 分钟',
    date: '2025-11-25',
  },
  {
    id: '4',
    title: '职场压力管理实用技巧',
    category: 'stress',
    summary: '学习如何在高压工作环境中保持心理健康，建立有效的压力应对机制。',
    content: '现代职场环境中的压力源多种多样...',
    tags: ['压力', '职场', '时间管理'],
    readTime: '10 分钟',
    date: '2025-11-20',
  },
  {
    id: '5',
    title: '正念冥想：活在当下的艺术',
    category: 'mindfulness',
    summary: '正念冥想是一种有效的心理健康实践，帮助您培养对当下的觉知和接纳。',
    content: '正念源于古老的冥想传统...',
    tags: ['正念', '冥想', '放松'],
    readTime: '7 分钟',
    date: '2025-11-15',
  },
  {
    id: '6',
    title: '建立健康的人际边界',
    category: 'relationship',
    summary: '了解如何在关系中设立健康的边界，保护自己的情感健康。',
    content: '人际边界是维护健康关系的关键...',
    tags: ['人际关系', '沟通', '边界'],
    readTime: '9 分钟',
    date: '2025-11-10',
  },
];

export default function KnowledgeBase() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const filtered = DEMO_ARTICLES.filter((a) => {
    const matchCat = selectedCategory === 'all' || a.category === selectedCategory;
    const matchSearch =
      !searchQuery ||
      a.title.includes(searchQuery) ||
      a.summary.includes(searchQuery) ||
      a.tags.some((t) => t.includes(searchQuery));
    return matchCat && matchSearch;
  });

  if (selectedArticle) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => setSelectedArticle(null)}
          className="mb-4 flex items-center text-sm text-primary-600 hover:text-primary-700"
        >
          ← 返回列表
        </button>
        <article className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
              {CATEGORIES.find((c) => c.id === selectedArticle.category)?.label}
            </span>
            <span className="text-xs text-gray-400">{selectedArticle.readTime}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{selectedArticle.title}</h1>
          <p className="text-gray-500 text-sm mb-6">发布于 {selectedArticle.date}</p>
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
            <p className="text-lg mb-4">{selectedArticle.summary}</p>
            <p>{selectedArticle.content}</p>
            <h3>更多内容即将上线...</h3>
            <p>我们的知识库正在持续完善中，更多专业心理健康资料将陆续发布。</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-gray-100">
            {selectedArticle.tags.map((tag) => (
              <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">
                #{tag}
              </span>
            ))}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索心理健康资料..."
            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((article) => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                {CATEGORIES.find((c) => c.id === article.category)?.icon}{' '}
                {CATEGORIES.find((c) => c.id === article.category)?.label}
              </span>
              <span className="text-xs text-gray-400">{article.readTime}</span>
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-2 group-hover:text-primary-600 transition-colors">
              {article.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{article.summary}</p>
            <div className="flex flex-wrap gap-1.5">
              {article.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📭</p>
          <p>未找到相关资料</p>
        </div>
      )}
    </div>
  );
}
