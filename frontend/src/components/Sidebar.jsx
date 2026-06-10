import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/chat', label: 'AI 咨询', icon: '💬', description: '智能心理对话' },
  { path: '/emotions', label: '情绪追踪', icon: '📊', description: '情绪趋势分析' },
  { path: '/assessment', label: '心理评估', icon: '📋', description: '标准化量表' },
  { path: '/knowledge', label: '知识库', icon: '📚', description: '心理健康资料' },
  { path: '/analytics', label: '数据分析', icon: '📈', description: '治疗进度统计' },
  { path: '/crisis', label: '危机支持', icon: '🆘', description: '紧急帮助资源' },
  { path: '/profile', label: '个人档案', icon: '👤', description: '账户设置' },
];

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg">
            M
          </div>
          {isOpen && (
            <div>
              <h1 className="font-bold text-gray-800 text-lg">MedPsy</h1>
              <p className="text-xs text-gray-500">心理健康平台</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {isOpen && (
                <div className="min-w-0">
                  <p className={`font-medium text-sm ${isActive ? 'text-primary-700' : 'text-gray-700'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{item.description}</p>
                </div>
              )}
              {isActive && (
                <div className="ml-auto w-1.5 h-8 bg-primary-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle button */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-lg">{isOpen ? '◀' : '▶'}</span>
          {isOpen && <span className="ml-2 text-sm">收起菜单</span>}
        </button>
      </div>
    </aside>
  );
}
