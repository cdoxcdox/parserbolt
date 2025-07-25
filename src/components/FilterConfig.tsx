import React, { useState } from 'react';
import { Shield, Brain, Filter, Save } from 'lucide-react';
import { FilterSettings } from '../types';

export function FilterConfig() {
  const [settings, setSettings] = useState<FilterSettings>({
    spamKeywords: ['реклама', 'скидка', 'промокод', 'купить', 'заработок'],
    allowedKeywords: ['новости', 'технологии', 'обновление'],
    minTextLength: 50,
    maxTextLength: 4000,
    filterMedia: false,
    similarityThreshold: 0.8,
    useAI: true,
    aiProvider: 'openrouter'
  });

  const [newSpamKeyword, setNewSpamKeyword] = useState('');
  const [newAllowedKeyword, setNewAllowedKeyword] = useState('');

  const addKeyword = (type: 'spam' | 'allowed', keyword: string) => {
    if (!keyword.trim()) return;
    
    if (type === 'spam') {
      setSettings({
        ...settings,
        spamKeywords: [...settings.spamKeywords, keyword.trim()]
      });
      setNewSpamKeyword('');
    } else {
      setSettings({
        ...settings,
        allowedKeywords: [...settings.allowedKeywords, keyword.trim()]
      });
      setNewAllowedKeyword('');
    }
  };

  const removeKeyword = (type: 'spam' | 'allowed', index: number) => {
    if (type === 'spam') {
      setSettings({
        ...settings,
        spamKeywords: settings.spamKeywords.filter((_, i) => i !== index)
      });
    } else {
      setSettings({
        ...settings,
        allowedKeywords: settings.allowedKeywords.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Настройка фильтров</h2>
        <p className="text-gray-300">Настройте фильтры для блокировки спама и дубликатов</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Spam Keywords */}
        <div className="space-y-6">
          <div className="p-6 bg-red-500/10 rounded-xl border border-red-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-400" />
              Ключевые слова спама
            </h3>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSpamKeyword}
                onChange={(e) => setNewSpamKeyword(e.target.value)}
                placeholder="Добавить слово"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                onKeyPress={(e) => e.key === 'Enter' && addKeyword('spam', newSpamKeyword)}
              />
              <button
                onClick={() => addKeyword('spam', newSpamKeyword)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Добавить
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.spamKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword('spam', index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Allowed Keywords */}
          <div className="p-6 bg-green-500/10 rounded-xl border border-green-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-green-400" />
              Разрешенные слова
            </h3>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newAllowedKeyword}
                onChange={(e) => setNewAllowedKeyword(e.target.value)}
                placeholder="Добавить слово"
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                onKeyPress={(e) => e.key === 'Enter' && addKeyword('allowed', newAllowedKeyword)}
              />
              <button
                onClick={() => addKeyword('allowed', newAllowedKeyword)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Добавить
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {settings.allowedKeywords.map((keyword, index) => (
                <span
                  key={index}
                  className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    onClick={() => removeKeyword('allowed', index)}
                    className="text-green-400 hover:text-green-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          {/* Text Length */}
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Длина текста</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Минимальная длина: {settings.minTextLength} символов
                </label>
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={settings.minTextLength}
                  onChange={(e) => setSettings({...settings, minTextLength: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Максимальная длина: {settings.maxTextLength} символов
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  value={settings.maxTextLength}
                  onChange={(e) => setSettings({...settings, maxTextLength: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* AI Settings */}
          <div className="p-6 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              ИИ фильтрация
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.useAI}
                  onChange={(e) => setSettings({...settings, useAI: e.target.checked})}
                  className="w-5 h-5 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <span className="text-white">Использовать ИИ для фильтрации</span>
              </label>

              {settings.useAI && (
                <>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">ИИ провайдер</label>
                    <select
                      value={settings.aiProvider}
                      onChange={(e) => setSettings({...settings, aiProvider: e.target.value as any})}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="openrouter">OpenRouter (бесплатно)</option>
                      <option value="together">Together AI</option>
                      <option value="huggingface">Hugging Face</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Порог схожести: {Math.round(settings.similarityThreshold * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={settings.similarityThreshold}
                      onChange={(e) => setSettings({...settings, similarityThreshold: parseFloat(e.target.value)})}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Media Filter */}
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Медиа контент</h3>
            
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={settings.filterMedia}
                onChange={(e) => setSettings({...settings, filterMedia: e.target.checked})}
                className="w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-white">Фильтровать сообщения только с медиа</span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200">
          <Save className="w-5 h-5" />
          Сохранить настройки
        </button>
      </div>
    </div>
  );
}