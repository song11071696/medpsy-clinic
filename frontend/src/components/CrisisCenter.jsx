import React, { useState } from 'react';

const HOTLINES = [
  { name: '全国心理援助热线', number: '400-161-9995', hours: '24小时', type: '免费' },
  { name: '北京心理危机研究与干预中心', number: '010-82951332', hours: '24小时', type: '免费' },
  { name: '生命热线', number: '400-821-1215', hours: '每天 8:00-22:00', type: '免费' },
  { name: '希望24热线', number: '400-161-9995', hours: '24小时', type: '免费' },
  { name: '青少年心理热线', number: '12355', hours: '工作日 9:00-17:00', type: '免费' },
];

const SAFETY_STEPS = [
  { icon: '🏠', title: '远离危险', desc: '确保您当前所处的环境是安全的' },
  { icon: '👥', title: '联系他人', desc: '联系信任的朋友、家人或拨打热线' },
  { icon: '📞', title: '拨打求助电话', desc: '拨打以上危机热线或 120 急救电话' },
  { icon: '🏥', title: '前往医院', desc: '前往最近的医院急诊科寻求帮助' },
];

export default function CrisisCenter() {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Emergency Banner */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <span className="text-3xl">🆘</span>
          <div>
            <h2 className="text-xl font-bold text-red-800 mb-2">如果您正处于危机中</h2>
            <p className="text-red-700 mb-4">
              如果您或您认识的人正处于危险中或有自我伤害的想法，请立即寻求帮助。
              <strong>您不是一个人。</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="tel:120"
                className="inline-flex items-center px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                📞 拨打 120 急救
              </a>
              <a
                href="tel:4001619995"
                className="inline-flex items-center px-5 py-2.5 bg-white text-red-600 border border-red-300 rounded-lg font-medium hover:bg-red-50 transition-colors"
              >
                📞 拨打心理热线
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Plan */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🛡️ 安全步骤</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SAFETY_STEPS.map((step, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-gray-50">
              <span className="text-2xl flex-shrink-0">{step.icon}</span>
              <div>
                <p className="font-medium text-gray-800">{step.title}</p>
                <p className="text-sm text-gray-500">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hotlines */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📞 危机热线</h3>
        <div className="space-y-3">
          {HOTLINES.map((h, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-gray-50 transition-all"
            >
              <div>
                <p className="font-medium text-gray-800">{h.name}</p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-gray-400">⏰ {h.hours}</span>
                  <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
                    {h.type}
                  </span>
                </div>
              </div>
              <a
                href={`tel:${h.number}`}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                {h.number}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Self-report */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🔔 危机报告</h3>
        <p className="text-sm text-gray-500 mb-4">
          如果您希望获得专业人员的帮助，请填写以下信息。我们会尽快安排专业人员与您联系。
        </p>

        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="w-full py-3 border-2 border-dashed border-primary-300 text-primary-600 rounded-xl font-medium hover:bg-primary-50 transition-colors"
          >
            请求专业帮助
          </button>
        ) : (
          <div className="space-y-4">
            <textarea
              placeholder="请简要描述您的情况（选填）..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => { alert('已提交，专业人员将尽快联系您。'); setShowConfirm(false); }}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
              >
                提交请求
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resources */}
      <div className="bg-blue-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 需要记住的事</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li>• 您的感受是有效的，您值得被帮助</li>
          <li>• 危机是暂时的，困难会过去的</li>
          <li>• 寻求帮助是勇气的表现，不是软弱</li>
          <li>• 专业的支持可以帮助您度过难关</li>
          <li>• 您不必独自面对这一切</li>
        </ul>
      </div>
    </div>
  );
}
