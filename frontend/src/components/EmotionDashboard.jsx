import React, { useState } from 'react';

const MOOD_OPTIONS = [
  { value: 1, emoji: '😢', label: '非常差', color: '#ef4444' },
  { value: 2, emoji: '😞', label: '较差', color: '#f97316' },
  { value: 3, emoji: '😐', label: '一般', color: '#eab308' },
  { value: 4, emoji: '🙂', label: '不错', color: '#84cc16' },
  { value: 5, emoji: '😊', label: '很好', color: '#22c55e' },
];

const EMOTIONS = [
  '平静', '快乐', '感恩', '兴奋', '自信',
  '焦虑', '悲伤', '愤怒', '恐惧', '孤独',
  '内疚', '疲惫', '压力', '困惑', '希望',
];

export default function EmotionDashboard() {
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedEmotions, setSelectedEmotions] = useState([]);
  const [note, setNote] = useState('');
  const [recorded, setRecorded] = useState(false);

  const demoHistory = [
    { date: '12/01', mood: 4, emotions: ['平静', '感恩'] },
    { date: '12/02', mood: 3, emotions: ['焦虑', '压力'] },
    { date: '12/03', mood: 2, emotions: ['悲伤', '疲惫'] },
    { date: '12/04', mood: 4, emotions: ['快乐', '自信'] },
    { date: '12/05', mood: 5, emotions: ['快乐', '希望'] },
    { date: '12/06', mood: 3, emotions: ['困惑', '焦虑'] },
    { date: '12/07', mood: 4, emotions: ['平静', '感恩'] },
  ];

  const toggleEmotion = (e) => {
    setSelectedEmotions((prev) =>
      prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]
    );
  };

  const handleRecord = () => {
    if (!selectedMood) return;
    setRecorded(true);
    setTimeout(() => {
      setSelectedMood(null);
      setSelectedEmotions([]);
      setNote('');
      setRecorded(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success */}
      {recorded && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
          <span className="mr-2">✅</span> 情绪记录已保存！继续保持记录的好习惯。
        </div>
      )}

      {/* Record Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 今日情绪记录</h3>

        {/* Mood Rating */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">您今天的心情如何？</p>
          <div className="flex justify-center space-x-4">
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setSelectedMood(m.value)}
                className={`flex flex-col items-center p-3 rounded-xl transition-all ${
                  selectedMood === m.value
                    ? 'bg-primary-50 ring-2 ring-primary-500 scale-110'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-3xl mb-1">{m.emoji}</span>
                <span className="text-xs text-gray-500">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emotions */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">选择您当前的情绪标签（可多选）</p>
          <div className="flex flex-wrap gap-2">
            {EMOTIONS.map((e) => (
              <button
                key={e}
                onClick={() => toggleEmotion(e)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  selectedEmotions.includes(e)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">写点什么吧（选填）</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="今天发生了什么？您的感受如何？"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <button
          onClick={handleRecord}
          disabled={!selectedMood}
          className="w-full py-2.5 gradient-primary text-white rounded-lg font-medium disabled:opacity-50"
        >
          记录情绪
        </button>
      </div>

      {/* History Trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 近期情绪趋势</h3>
        <div className="flex items-end justify-between h-32 px-2">
          {demoHistory.map((d, i) => {
            const moodInfo = MOOD_OPTIONS.find((m) => m.value === d.mood);
            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <span className="text-xs text-gray-500 mb-1">{d.mood}/5</span>
                <div
                  className="w-8 rounded-t-md transition-all"
                  style={{
                    height: `${(d.mood / 5) * 80}px`,
                    backgroundColor: moodInfo?.color || '#gray',
                    minHeight: '8px',
                  }}
                />
                <span className="text-xs text-gray-400 mt-1">{d.date}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Emotion Stats */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🏷️ 情绪分布</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Emotion frequency bars */}
          <div className="space-y-3">
            {[
              { name: '平静', count: 12, color: '#3b82f6', bgColor: 'bg-blue-100' },
              { name: '焦虑', count: 8, color: '#f97316', bgColor: 'bg-orange-100' },
              { name: '感恩', count: 7, color: '#22c55e', bgColor: 'bg-green-100' },
              { name: '快乐', count: 6, color: '#eab308', bgColor: 'bg-yellow-100' },
              { name: '压力', count: 5, color: '#ef4444', bgColor: 'bg-red-100' },
              { name: '希望', count: 4, color: '#a855f7', bgColor: 'bg-purple-100' },
            ].map((e) => {
              const maxCount = 12;
              const widthPct = (e.count / maxCount) * 100;
              return (
                <div key={e.name} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-10 text-right">{e.name}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%`, backgroundColor: e.color }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-6">{e.count}</span>
                </div>
              );
            })}
          </div>
          {/* Mood trend sparkline */}
          <div className="flex flex-col items-center justify-center">
            <p className="text-sm font-medium text-gray-700 mb-3">本周情绪走势</p>
            <svg viewBox="0 0 200 80" className="w-full max-w-[200px]">
              {/* Grid lines */}
              {[1, 2, 3, 4, 5].map((v) => (
                <line
                  key={v}
                  x1="0" y1={80 - (v / 5) * 70}
                  x2="200" y2={80 - (v / 5) * 70}
                  stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4,4"
                />
              ))}
              {/* Line chart */}
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={demoHistory
                  .map((d, i) => {
                    const x = (i / (demoHistory.length - 1)) * 190 + 5;
                    const y = 80 - (d.mood / 5) * 70;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
              {/* Data points */}
              {demoHistory.map((d, i) => {
                const x = (i / (demoHistory.length - 1)) * 190 + 5;
                const y = 80 - (d.mood / 5) * 70;
                const moodInfo = MOOD_OPTIONS.find((m) => m.value === d.mood);
                return (
                  <circle
                    key={i}
                    cx={x} cy={y} r="4"
                    fill={moodInfo?.color || '#gray'}
                    stroke="white" strokeWidth="2"
                  />
                );
              })}
            </svg>
            <div className="flex justify-between w-full max-w-[200px] mt-1 px-1">
              {demoHistory.map((d, i) => (
                <span key={i} className="text-[10px] text-gray-400">{d.date}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
