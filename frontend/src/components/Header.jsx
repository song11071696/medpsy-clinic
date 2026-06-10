import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../App';

const pageTitles = {
  '/chat': 'AI 咨询',
  '/emotions': '情绪追踪',
  '/assessment': '心理评估',
  '/knowledge': '知识库',
  '/analytics': '数据分析',
  '/crisis': '危机支持',
  '/profile': '个人档案',
};

export default function Header({ user, onLogout }) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || '心理健康平台';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notification */}
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold">
            {user?.username?.[0] || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-700">{user?.username || '用户'}</p>
            <p className="text-xs text-gray-400">{user?.role === 'patient' ? '来访者' : '咨询师'}</p>
          </div>
          <button
            onClick={onLogout}
            className="ml-2 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            退出
          </button>
        </div>
      </div>
    </header>
  );
}
