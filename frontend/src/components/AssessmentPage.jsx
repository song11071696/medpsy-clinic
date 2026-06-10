import React, { useState } from 'react';

const ASSESSMENTS = [
  {
    id: 'phq9',
    name: 'PHQ-9 抑郁筛查量表',
    description: '患者健康问卷-9，用于评估抑郁症状的严重程度',
    duration: '5-10 分钟',
    questions: [
      '做事时提不起劲或没有兴趣',
      '感到心情低落、沮丧或绝望',
      '入睡困难、睡不安稳或睡眠过多',
      '感觉疲倦或没有活力',
      '食欲不振或吃太多',
      '觉得自己很糟糕，或觉得自己很失败，或让自己或家人失望',
      '对事物专注有困难，例如阅读报纸或看电视',
      '动作或说话速度缓慢到别人可以觉察，或正好相反，烦躁或坐立不安',
      '有不如死掉或用某种方式伤害自己的念头',
    ],
    options: [
      { label: '完全没有', value: 0 },
      { label: '好几天', value: 1 },
      { label: '一半以上的天数', value: 2 },
      { label: '几乎每天', value: 3 },
    ],
  },
  {
    id: 'gad7',
    name: 'GAD-7 焦虑筛查量表',
    description: '广泛性焦虑障碍量表，用于评估焦虑症状',
    duration: '3-5 分钟',
    questions: [
      '感觉紧张、焦虑或急切',
      '不能够停止或控制担忧',
      '对各种各样的事情担忧过多',
      '很难放松下来',
      '由于不安而无法静坐',
      '变得容易烦恼或急躁',
      '感到似乎将有可怕的事情发生',
    ],
    options: [
      { label: '完全没有', value: 0 },
      { label: '好几天', value: 1 },
      { label: '一半以上的天数', value: 2 },
      { label: '几乎每天', value: 3 },
    ],
  },
];

export default function AssessmentPage() {
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const startAssessment = (a) => {
    setCurrentAssessment(a);
    setAnswers({});
    setSubmitted(false);
  };

  const handleAnswer = (qi, value) => {
    setAnswers({ ...answers, [qi]: value });
  };

  const getScore = () =>
    Object.values(answers).reduce((sum, v) => sum + v, 0);

  const getResultInterpretation = (score, id) => {
    if (id === 'phq9') {
      if (score <= 4) return { level: '无/极轻微', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 9) return { level: '轻度', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (score <= 14) return { level: '中度', color: 'text-orange-600', bg: 'bg-orange-50' };
      if (score <= 19) return { level: '中重度', color: 'text-red-500', bg: 'bg-red-50' };
      return { level: '重度', color: 'text-red-600', bg: 'bg-red-50' };
    }
    if (id === 'gad7') {
      if (score <= 4) return { level: '无/极轻微', color: 'text-green-600', bg: 'bg-green-50' };
      if (score <= 9) return { level: '轻度', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      if (score <= 14) return { level: '中度', color: 'text-orange-600', bg: 'bg-orange-50' };
      return { level: '重度', color: 'text-red-600', bg: 'bg-red-50' };
    }
    return { level: '未知', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const allAnswered = currentAssessment
    ? currentAssessment.questions.every((_, i) => answers[i] !== undefined)
    : false;

  // Results view
  if (submitted && currentAssessment) {
    const score = getScore();
    const result = getResultInterpretation(score, currentAssessment.id);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">评估结果</h2>
          <p className="text-gray-500 mb-6">{currentAssessment.name}</p>

          <div className={`${result.bg} rounded-xl p-6 mb-6`}>
            <p className="text-4xl font-bold mb-2">{score} 分</p>
            <p className={`text-lg font-semibold ${result.color}`}>{result.level}</p>
          </div>

          <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-2">⚠️ 重要提示</p>
            <p>此评估仅为筛查工具，不能替代专业诊断。如果您的评分较高，建议您寻求专业心理咨询师或精神科医生的帮助。</p>
          </div>

          <div className="flex justify-center space-x-3">
            <button
              onClick={() => { setCurrentAssessment(null); setSubmitted(false); }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              返回列表
            </button>
            <button
              onClick={() => startAssessment(currentAssessment)}
              className="px-4 py-2 gradient-primary text-white rounded-lg"
            >
              重新评估
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Taking assessment
  if (currentAssessment) {
    const progress = (Object.keys(answers).length / currentAssessment.questions.length) * 100;
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setCurrentAssessment(null)}
          className="mb-4 text-sm text-primary-600 hover:text-primary-700"
        >
          ← 返回列表
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">{currentAssessment.name}</h2>
          <p className="text-sm text-gray-500 mb-4">{currentAssessment.description}</p>

          {/* Progress */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mb-6 text-right">
            {Object.keys(answers).length}/{currentAssessment.questions.length} 已完成
          </p>

          {/* Questions */}
          <div className="space-y-6">
            {currentAssessment.questions.map((q, qi) => (
              <div key={qi} className="border-b border-gray-100 pb-6 last:border-0">
                <p className="text-sm font-medium text-gray-800 mb-3">
                  {qi + 1}. {q}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {currentAssessment.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(qi, opt.value)}
                      className={`p-2.5 rounded-lg text-sm font-medium transition-all ${
                        answers[qi] === opt.value
                          ? 'bg-primary-500 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setSubmitted(true)}
              disabled={!allAnswered}
              className="px-6 py-2.5 gradient-primary text-white rounded-lg font-medium disabled:opacity-50"
            >
              提交评估
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Assessment list
  return (
    <div className="max-w-3xl mx-auto">
      <p className="text-gray-500 mb-6">选择一个标准化心理评估量表开始测评</p>
      <div className="space-y-4">
        {ASSESSMENTS.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-primary-300 transition-all cursor-pointer"
            onClick={() => startAssessment(a)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{a.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                <div className="flex items-center space-x-3 mt-3">
                  <span className="text-xs text-gray-400">⏱ {a.duration}</span>
                  <span className="text-xs text-gray-400">📝 {a.questions.length} 题</span>
                </div>
              </div>
              <span className="text-3xl">📋</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
