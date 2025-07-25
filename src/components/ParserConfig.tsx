import React, { useState } from 'react';
import { Play, Pause, Settings, Clock, Shield, Zap } from 'lucide-react';
import { ParserSettings } from '../types';

export function ParserConfig() {
  const [settings, setSettings] = useState<ParserSettings>({
    checkInterval: 5,
    antispamDelay: {
      min: 30,
      max: 120
    },
    maxMessagesPerHour: 20,
    targetChannel: '@mytargetchannel',
    isActive: false
  });

  const [isRunning, setIsRunning] = useState(false);

  const toggleParser = () => {
    setIsRunning(!isRunning);
    setSettings({...settings, isActive: !isRunning});
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Настройки парсера</h2>
            <p className="text-gray-300">Управление работой парсера и интервалами проверки</p>
          </div>
          
          <button
            onClick={toggleParser}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-200
              ${isRunning
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white'
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
              }
            `}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isRunning ? 'Остановить парсер' : 'Запустить парсер'}
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`
        mb-8 p-6 rounded-xl border
        ${isRunning 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-gray-500/10 border-gray-500/30'
        }
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-3 h-3 rounded-full
            ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}
          `} />
          <span className="text-white font-medium">
            Статус: {isRunning ? 'Парсер запущен' : 'Парсер остановлен'}
          </span>
          {isRunning && (
            <span className="text-gray-300 text-sm">
              Следующая проверка через {settings.checkInterval} мин
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timing Settings */}
        <div className="space-y-6">
          <div className="p-6 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Интервалы проверки
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Интервал проверки: {settings.checkInterval} минут
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={settings.checkInterval}
                  onChange={(e) => setSettings({...settings, checkInterval: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1 мин</span>
                  <span>60 мин</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Максимум сообщений в час: {settings.maxMessagesPerHour}
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={settings.maxMessagesPerHour}
                  onChange={(e) => setSettings({...settings, maxMessagesPerHour: parseInt(e.target.value)})}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Target Channel */}
          <div className="p-6 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Целевой канал
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Канал для пересылки</label>
                <input
                  type="text"
                  value={settings.targetChannel}
                  onChange={(e) => setSettings({...settings, targetChannel: e.target.value})}
                  placeholder="@mychannel"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <button className="w-full px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors">
                Проверить доступ к каналу
              </button>
            </div>
          </div>
        </div>

        {/* Antispam Settings */}
        <div className="space-y-6">
          <div className="p-6 bg-orange-500/10 rounded-xl border border-orange-500/20">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-400" />
              Антифлуд защита
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Минимальная задержка: {settings.antispamDelay.min} сек
                </label>
                <input
                  type="range"
                  min="5"
                  max="300"
                  value={settings.antispamDelay.min}
                  onChange={(e) => setSettings({
                    ...settings, 
                    antispamDelay: {...settings.antispamDelay, min: parseInt(e.target.value)}
                  })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">
                  Максимальная задержка: {settings.antispamDelay.max} сек
                </label>
                <input
                  type="range"
                  min="30"
                  max="600"
                  value={settings.antispamDelay.max}
                  onChange={(e) => setSettings({
                    ...settings, 
                    antispamDelay: {...settings.antispamDelay, max: parseInt(e.target.value)}
                  })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <p className="text-sm text-gray-300">
                  Случайная задержка между {settings.antispamDelay.min} и {settings.antispamDelay.max} секундами
                  поможет избежать блокировки за флуд.
                </p>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="p-6 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-400" />
              Дополнительные настройки
            </h3>
            
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-white">Сохранять оригинальное форматирование</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-white">Пересылать медиа файлы</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-white">Добавлять подпись источника</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-5 h-5 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
                <span className="text-white">Логировать все действия</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-center">
        <button className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-semibold">
          <Settings className="w-5 h-5" />
          Сохранить настройки
        </button>
      </div>
    </div>
  );
}