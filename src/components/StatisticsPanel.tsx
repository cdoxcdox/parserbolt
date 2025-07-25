import React from 'react';
import { BarChart3, TrendingUp, Shield, Copy, AlertCircle, CheckCircle } from 'lucide-react';
import { Statistics } from '../types';

interface StatisticsPanelProps {
  statistics: Statistics;
}

export function StatisticsPanel({ statistics }: StatisticsPanelProps) {
  const successRate = Math.round((statistics.totalForwarded / statistics.totalChecked) * 100);
  const spamRate = Math.round((statistics.spamFiltered / statistics.totalChecked) * 100);
  const duplicateRate = Math.round((statistics.duplicatesFiltered / statistics.totalChecked) * 100);

  const chartData = [
    { label: 'Переслано', value: statistics.totalForwarded, color: 'bg-green-500' },
    { label: 'Спам', value: statistics.spamFiltered, color: 'bg-red-500' },
    { label: 'Дубликаты', value: statistics.duplicatesFiltered, color: 'bg-yellow-500' },
    { label: 'Ошибки', value: statistics.errorsCount, color: 'bg-orange-500' }
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Статистика работы</h2>
        <p className="text-gray-300">Детальная аналитика работы парсера</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">{statistics.totalForwarded}</div>
              <div className="text-sm text-green-300">Переслано сообщений</div>
            </div>
          </div>
          <div className="text-xs text-gray-300">
            Успешность: {successRate}%
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl border border-red-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-red-400" />
            <div>
              <div className="text-2xl font-bold text-white">{statistics.spamFiltered}</div>
              <div className="text-sm text-red-300">Спам заблокирован</div>
            </div>
          </div>
          <div className="text-xs text-gray-300">
            {spamRate}% от общего числа
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl border border-yellow-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Copy className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-2xl font-bold text-white">{statistics.duplicatesFiltered}</div>
              <div className="text-sm text-yellow-300">Дубликаты</div>
            </div>
          </div>
          <div className="text-xs text-gray-300">
            {duplicateRate}% от общего числа
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl border border-orange-500/30">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-8 h-8 text-orange-400" />
            <div>
              <div className="text-2xl font-bold text-white">{statistics.errorsCount}</div>
              <div className="text-sm text-orange-300">Ошибки</div>
            </div>
          </div>
          <div className="text-xs text-gray-300">
            Требуют внимания
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Распределение сообщений
          </h3>
          
          <div className="space-y-4">
            {chartData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">{item.label}</span>
                  <span className="text-white font-medium">{item.value}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${(item.value / statistics.totalChecked) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="p-6 bg-white/5 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Показатели эффективности
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Эффективность фильтрации</span>
                <span className="text-white font-medium">{successRate}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Качество контента</span>
                <span className="text-white font-medium">{100 - spamRate - duplicateRate}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                  style={{ width: `${100 - spamRate - duplicateRate}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-300">Надежность системы</span>
                <span className="text-white font-medium">{100 - Math.round((statistics.errorsCount / statistics.totalChecked) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500"
                  style={{ width: `${100 - Math.round((statistics.errorsCount / statistics.totalChecked) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {statistics.lastRun && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-300">
                Последний запуск: {statistics.lastRun.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Последняя активность</h3>
        
        <div className="space-y-3">
          {[
            { time: '14:32', action: 'Переслано сообщение из @technews', status: 'success' },
            { time: '14:30', action: 'Заблокирован спам из @cryptorussia', status: 'blocked' },
            { time: '14:28', action: 'Найден дубликат сообщения', status: 'duplicate' },
            { time: '14:25', action: 'Переслано сообщение с видео', status: 'success' },
            { time: '14:23', action: 'Ошибка подключения к каналу', status: 'error' }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className={`
                w-2 h-2 rounded-full
                ${item.status === 'success' ? 'bg-green-400' : 
                  item.status === 'blocked' ? 'bg-red-400' :
                  item.status === 'duplicate' ? 'bg-yellow-400' : 'bg-orange-400'}
              `} />
              <span className="text-sm text-gray-400 w-12">{item.time}</span>
              <span className="text-sm text-white flex-1">{item.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}