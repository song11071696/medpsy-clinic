import React, { useState } from 'react';

// Simple inline bar chart component (no chart.js dependency needed for demo)
function BarChart({ data, labels, color = '#3b82f6' }) {
  const max = Math.max(...data);
  return (
    <div className="flex items-end space-x-2 h-40">
      {data.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">{v}</div>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{ height: `${(v / max) * 100}%`, backgroundColor: color, minHeight: '4px' }}
          />
          <div className="text-xs text-gray-400 mt-1 truncate w-full text-center">{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data, labels, color = '#3b82f6' }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 120;
  const w = 400;
  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 20) - 10,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${w} ${h} L 0 ${h} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#areaGrad)" />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {labels.map((l, i) => (
          <span key={i} className="text-xs text-gray-400">{l}</span>
        ))}
      </div>
    </div>
  );
}

export default function DataAnalytics() {
  const [period, setPeriod] = useState('month');

  const sessionData = [12, 18, 15, 22, 28, 25, 30];
  const sessionLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

  const moodData = [6.2, 5.8, 6.5, 7.0, 6.8, 7.2, 7.5];
  const moodLabels = ['6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const stats = [
    { label: '总咨询次数', value: '156', change: '+12%', icon: '💬', color: 'bg-blue-50 text-blue-600' },
    { label: '活跃用户', value: '89', change: '+8%', icon: '👥', color: 'bg-green-50 text-green-600' },
    { label: '平均情绪评分', value: '7.2', change: '+0.5', icon: '😊', color: 'bg-yellow-50 text-yellow-600' },
    { label: '危机干预', value: '3', change: '-2', icon: '🚨', color: 'bg-red-50 text-red-600' },
  ];

  const recentActivities = [
    { user: '用户A', action: '完成焦虑评估', score: 'GAD-7: 12', time: '2小时前' },
    { user: '用户B', action: '心理咨询会话', score: '情绪改善', time: '3小时前' },
    { user: '用户C', action: '危机支持请求', score: '已转介', time: '5小时前' },
    { user: '用户D', action: '完成情绪记录', score: 'PHQ-9: 8', time: '6小时前' },
    { user: '用户E', action: '阅读知识文章', score: '3篇', time: '1天前' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">数据概览</h2>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                period === p ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              {{ week: '本周', month: '本月', year: '本年' }[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center ${s.color}`}>
                {s.icon}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                s.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
              }`}>
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Volume */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">📊 咨询量趋势</h3>
          <BarChart data={sessionData} labels={sessionLabels} color="#3b82f6" />
        </div>

        {/* Mood Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">😊 情绪评分趋势</h3>
          <LineChart data={moodData} labels={moodLabels} color="#22c55e" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">🕐 最近活动</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="pb-3 text-sm font-medium text-gray-500">用户</th>
                <th className="pb-3 text-sm font-medium text-gray-500">活动</th>
                <th className="pb-3 text-sm font-medium text-gray-500">结果</th>
                <th className="pb-3 text-sm font-medium text-gray-500">时间</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((a, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 text-sm font-medium text-gray-800">{a.user}</td>
                  <td className="py-3 text-sm text-gray-600">{a.action}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded text-xs font-medium">
                      {a.score}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-400">{a.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
