import React, { useState } from 'react';
import { Search, Download, Filter, AlertCircle, CheckCircle, XCircle, Copy } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  channel?: string;
  details?: string;
}

export function LogsPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');

  const logs: LogEntry[] = [
    {
      id: '1',
      timestamp: new Date('2024-01-15T14:32:15'),
      level: 'success',
      message: 'Сообщение успешно переслано',
      channel: '@technews',
      details: 'Переслано сообщение "Новые технологии в 2024 году"'
    },
    {
      id: '2',
      timestamp: new Date('2024-01-15T14:30:42'),
      level: 'warning',
      message: 'Заблокирован спам',
      channel: '@cryptorussia',
      details: 'Сообщение содержало ключевые слова: "реклама", "скидка"'
    },
    {
      id: '3',
      timestamp: new Date('2024-01-15T14:28:33'),
      level: 'info',
      message: 'Найден дубликат сообщения',
      channel: '@technews',
      details: 'Схожесть: 85% с сообщением от 13:45'
    },
    {
      id: '4',
      timestamp: new Date('2024-01-15T14:25:17'),
      level: 'success',
      message: 'Переслано сообщение с медиа',
      channel: '@technews',
      details: 'Переслано видео размером 15.2 MB'
    },
    {
      id: '5',
      timestamp: new Date('2024-01-15T14:23:08'),
      level: 'error',
      message: 'Ошибка подключения к каналу',
      channel: '@oldchannel',
      details: 'Канал не найден или недоступен'
    },
    {
      id: '6',
      timestamp: new Date('2024-01-15T14:20:55'),
      level: 'info',
      message: 'Запуск проверки каналов',
      details: 'Проверяем 15 активных каналов'
    }
  ];

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.channel?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterLevel === 'all' || log.level === filterLevel;
    return matchesSearch && matchesFilter;
  });

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Copy className="w-5 h-5 text-blue-400" />;
    }
  };

  const getLevelBg = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      default:
        return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const exportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp.toLocaleString()}] ${log.level.toUpperCase()}: ${log.message}` +
      (log.channel ? ` (${log.channel})` : '') +
      (log.details ? ` - ${log.details}` : '')
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram-parser-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Логи системы</h2>
        <p className="text-gray-300">Детальная информация о работе парсера</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по логам..."
            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все уровни</option>
            <option value="success">Успех</option>
            <option value="info">Информация</option>
            <option value="warning">Предупреждения</option>
            <option value="error">Ошибки</option>
          </select>

          <button
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            <Download className="w-5 h-5" />
            Экспорт
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="text-lg font-bold text-green-400">
            {logs.filter(log => log.level === 'success').length}
          </div>
          <div className="text-sm text-gray-300">Успешных операций</div>
        </div>
        <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="text-lg font-bold text-yellow-400">
            {logs.filter(log => log.level === 'warning').length}
          </div>
          <div className="text-sm text-gray-300">Предупреждений</div>
        </div>
        <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="text-lg font-bold text-red-400">
            {logs.filter(log => log.level === 'error').length}
          </div>
          <div className="text-sm text-gray-300">Ошибок</div>
        </div>
        <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
          <div className="text-lg font-bold text-blue-400">
            {filteredLogs.length}
          </div>
          <div className="text-sm text-gray-300">Отфильтровано</div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredLogs.map((log) => (
          <div
            key={log.id}
            className={`p-4 rounded-xl border ${getLevelBg(log.level)} hover:bg-white/5 transition-all duration-200`}
          >
            <div className="flex items-start gap-3">
              {getLevelIcon(log.level)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-white font-medium">{log.message}</span>
                  {log.channel && (
                    <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300">
                      {log.channel}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                {log.details && (
                  <p className="text-sm text-gray-300 mt-1">{log.details}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-12">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">Нет логов, соответствующих фильтрам</p>
        </div>
      )}
    </div>
  );
}