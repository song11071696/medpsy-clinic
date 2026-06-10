import React from 'react';

const CATEGORY_ICONS = {
  anxiety: '😰',
  depression: '😞',
  sleep: '😴',
  stress: '😤',
  trauma: '💔',
  relationship: '🤝',
  addiction: '🔄',
  general: '🧠',
};

const CATEGORY_COLORS = {
  anxiety: 'bg-orange-50 border-orange-200 text-orange-800',
  depression: 'bg-blue-50 border-blue-200 text-blue-800',
  sleep: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  stress: 'bg-red-50 border-red-200 text-red-800',
  trauma: 'bg-purple-50 border-purple-200 text-purple-800',
  relationship: 'bg-green-50 border-green-200 text-green-800',
  addiction: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  general: 'bg-gray-50 border-gray-200 text-gray-800',
};

export default function SourceCitationCard({ sources = [] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-medium text-gray-500">📚 参考来源</span>
      </div>
      <div className="space-y-2">
        {sources.map((src, i) => {
          const title = typeof src === 'string' ? src : src.title || src;
          const category = typeof src === 'object' ? src.category : null;
          const metadata = typeof src === 'object' ? src.metadata : null;
          const icon = CATEGORY_ICONS[category] || '📖';
          const colorClass = CATEGORY_COLORS[category] || 'bg-gray-50 border-gray-200 text-gray-700';

          return (
            <div
              key={i}
              className={`flex items-start gap-2 p-2 rounded-lg border ${colorClass} transition-colors`}
            >
              <span className="text-sm flex-shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{title}</div>
                {metadata && (
                  <div className="flex items-center gap-2 mt-1">
                    {metadata.version && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/60 text-gray-500">
                        {metadata.version}
                      </span>
                    )}
                    {metadata.source && (
                      <span className="text-[10px] text-gray-400 truncate" title={metadata.source}>
                        来源: {metadata.source.length > 30 ? metadata.source.substring(0, 30) + '...' : metadata.source}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
