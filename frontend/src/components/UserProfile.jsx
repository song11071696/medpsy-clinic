import React, { useState } from 'react';

export default function UserProfilePage() {
  const [profile, setProfile] = useState({
    username: 'Demo 用户',
    email: 'demo@medpsy.com',
    phone: '138****8888',
    gender: '未设置',
    age: '',
    emergencyContact: '',
    emergencyPhone: '',
    concerns: [],
    therapyGoals: '',
    bio: '',
  });
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  const concerns = [
    '焦虑', '抑郁', '失眠', '压力', '人际关系',
    '自尊', '创伤', '成瘾', '职业发展', '情绪管理',
  ];

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    setSaved(false);
  };

  const toggleConcern = (c) => {
    const next = profile.concerns.includes(c)
      ? profile.concerns.filter((x) => x !== c)
      : [...profile.concerns, c];
    handleChange('concerns', next);
  };

  const handleSave = () => {
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Banner */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center">
          <span className="mr-2">✅</span> 个人档案已保存
        </div>
      )}

      {/* Avatar & Basic Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white text-2xl font-bold">
              {profile.username[0] || 'U'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{profile.username}</h2>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              editing
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            }`}
          >
            {editing ? '保存' : '编辑'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="用户名" value={profile.username} editing={editing}
            onChange={(v) => handleChange('username', v)} />
          <Field label="邮箱" value={profile.email} editing={editing}
            onChange={(v) => handleChange('email', v)} type="email" />
          <Field label="手机号" value={profile.phone} editing={editing}
            onChange={(v) => handleChange('phone', v)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
            {editing ? (
              <select
                value={profile.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option>未设置</option>
                <option>男</option>
                <option>女</option>
                <option>其他</option>
              </select>
            ) : (
              <p className="text-gray-800 py-2">{profile.gender}</p>
            )}
          </div>
          <Field label="年龄" value={profile.age} editing={editing}
            onChange={(v) => handleChange('age', v)} placeholder="选填" />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🚨 紧急联系人</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="联系人姓名" value={profile.emergencyContact} editing={editing}
            onChange={(v) => handleChange('emergencyContact', v)} placeholder="选填" />
          <Field label="联系电话" value={profile.emergencyPhone} editing={editing}
            onChange={(v) => handleChange('emergencyPhone', v)} placeholder="选填" />
        </div>
      </div>

      {/* Concerns */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📋 关注领域</h3>
        <p className="text-sm text-gray-500 mb-3">选择您希望获得帮助的领域（可多选）</p>
        <div className="flex flex-wrap gap-2">
          {concerns.map((c) => (
            <button
              key={c}
              onClick={() => editing && toggleConcern(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                profile.concerns.includes(c)
                  ? 'bg-primary-500 text-white'
                  : editing
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400'
              } ${!editing && !profile.concerns.includes(c) ? 'opacity-50' : ''}`}
              disabled={!editing}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Therapy Goals */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎯 治疗目标</h3>
        {editing ? (
          <textarea
            value={profile.therapyGoals}
            onChange={(e) => handleChange('therapyGoals', e.target.value)}
            placeholder="描述您希望通过咨询达到的目标..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
          />
        ) : (
          <p className="text-gray-600">{profile.therapyGoals || '暂未设置'}</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, editing, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        />
      ) : (
        <p className="text-gray-800 py-2">{value || placeholder || '未设置'}</p>
      )}
    </div>
  );
}
