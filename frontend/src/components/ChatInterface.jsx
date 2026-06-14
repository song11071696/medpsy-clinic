import React, { useState, useRef, useEffect } from 'react';
import SourceCitationCard from './SourceCitationCard';

const API_BASE = '/api';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: '您好！我是 MedPsy AI 心理咨询助手。很高兴为您服务。您可以向我倾诉任何心理困扰，我会尽力提供专业的支持和建议。\n\n请注意，AI 辅助咨询不能替代专业心理医生的诊断和治疗。如有紧急情况，请拨打危机热线。',
      timestamp: new Date(),
      sources: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const queryText = input.trim();
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // 安全修复：添加认证token到请求头
      const token = localStorage.getItem('token');
      const requestHeaders = { 'Content-Type': 'application/json' };
      if (token) requestHeaders['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE}/consult`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({ query: queryText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          errData.message || `服务器错误 (${response.status})`
        );
      }

      const data = await response.json();

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.data?.answer || '抱歉，我暂时无法生成回复，请稍后再试。',
        timestamp: new Date(),
        sources: data.data?.sources || [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('[Chat] Error:', err);
      setError(err.message);

      // Add error message as assistant reply so user sees feedback
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `⚠️ 抱歉，发生了错误。请稍后重试或联系支持人员。`,
        timestamp: new Date(),
        sources: [],
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickPrompts = [
    '我最近感到很焦虑',
    '如何改善睡眠质量？',
    '我感到有些抑郁',
    '如何管理压力？',
  ];

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-3">💡 快速开始</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => { setInput(prompt); }}
                className="text-left p-3 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-sm transition-all text-sm text-gray-600"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-sm'
                  : msg.isError
                    ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <span className={`text-xs font-medium ${msg.isError ? 'text-red-600' : 'text-primary-600'}`}>
                    {msg.isError ? '系统提示' : 'AI 咨询师'}
                  </span>
                </div>
              )}
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line.split(/(\*\*.*?\*\*)/).map((part, j) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={j}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                    {i < msg.content.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
              {/* Source Citation Cards */}
              <SourceCitationCard sources={msg.sources} />
              <div
                className={`text-xs mt-2 ${
                  msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🤖</span>
                <span className="text-xs text-gray-500">AI 正在分析您的问题</span>
                <div className="flex space-x-1 ml-1">
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1 ml-7">正在检索知识库...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white rounded-t-xl p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入您的问题或感受..."
              rows={1}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 gradient-primary text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          ⚠️ AI 辅助咨询仅供参考，如有紧急情况请拨打 400-161-9995 或前往最近的医疗机构
        </p>
      </div>
    </div>
  );
}
