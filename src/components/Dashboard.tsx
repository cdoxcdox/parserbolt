import React, { useState, useEffect } from 'react';
import { Settings, Users, MessageSquare, BarChart3, Shield, Zap } from 'lucide-react';
import { ChannelManager } from './ChannelManager';
import { FilterConfig } from './FilterConfig';
import { ParserConfig } from './ParserConfig';
import { StatisticsPanel } from './StatisticsPanel';
import { LogsPanel } from './LogsPanel';
import { Statistics } from '../types';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('channels');
  const [stats, setStats] = useState<Statistics>({
    totalChecked: 1247,
    totalForwarded: 892,
    spamFiltered: 234,
    duplicatesFiltered: 121,
    errorsCount: 3,
    lastRun: new Date()
  });

  const tabs = [
    { id: 'channels', label: 'Каналы', icon: Users },
    { id: 'filters', label: 'Фильтры', icon: Shield },
    { id: 'parser', label: 'Парсер', icon: Settings },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'logs', label: 'Логи', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Telegram Parser</h1>
              <p className="text-gray-300">Автоматическая пересылка сообщений из каналов</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-white">{stats.totalForwarded}</div>
              <div className="text-sm text-gray-300">Переслано</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-white">{stats.spamFiltered}</div>
              <div className="text-sm text-gray-300">Спам заблокирован</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-white">{stats.duplicatesFiltered}</div>
              <div className="text-sm text-gray-300">Дубликаты</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-white">{stats.totalChecked}</div>
              <div className="text-sm text-gray-300">Проверено</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl font-bold text-green-400">{stats.errorsCount}</div>
              <div className="text-sm text-gray-300">Ошибки</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {activeTab === 'channels' && <ChannelManager />}
          {activeTab === 'filters' && <FilterConfig />}
          {activeTab === 'parser' && <ParserConfig />}
          {activeTab === 'stats' && <StatisticsPanel statistics={stats} />}
          {activeTab === 'logs' && <LogsPanel />}
        </div>
      </div>
    </div>
  );
}