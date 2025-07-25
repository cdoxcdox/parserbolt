import React, { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { Channel } from '../types';

export function ChannelManager() {
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: '1',
      username: '@technews',
      title: 'Tech News Russia',
      isSource: true,
      isExcluded: false,
      lastChecked: new Date(),
      messagesCount: 1247,
      status: 'active'
    },
    {
      id: '2',
      username: '@cryptorussia',
      title: 'Crypto Russia',
      isSource: true,
      isExcluded: false,
      lastChecked: new Date(),
      messagesCount: 892,
      status: 'active'
    },
    {
      id: '3',
      username: '@spamchannel',
      title: 'Spam Channel',
      isSource: false,
      isExcluded: true,
      messagesCount: 0,
      status: 'inactive'
    }
  ]);
  const [newChannel, setNewChannel] = useState('');
  const [targetChannel, setTargetChannel] = useState('@mytargetchannel');

  const addChannel = () => {
    if (!newChannel.trim()) return;
    
    const channel: Channel = {
      id: Date.now().toString(),
      username: newChannel.startsWith('@') ? newChannel : '@' + newChannel,
      title: 'Loading...',
      isSource: true,
      isExcluded: false,
      messagesCount: 0,
      status: 'active'
    };
    
    setChannels([...channels, channel]);
    setNewChannel('');
  };

  const toggleChannelStatus = (id: string, type: 'source' | 'excluded') => {
    setChannels(channels.map(channel => {
      if (channel.id === id) {
        if (type === 'source') {
          return { ...channel, isSource: !channel.isSource };
        } else {
          return { ...channel, isExcluded: !channel.isExcluded };
        }
      }
      return channel;
    }));
  };

  const removeChannel = (id: string) => {
    setChannels(channels.filter(channel => channel.id !== id));
  };

  const getStatusIcon = (status: Channel['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'inactive':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Управление каналами</h2>
        <p className="text-gray-300">Настройте источники и целевой канал для пересылки сообщений</p>
      </div>

      {/* Target Channel */}
      <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl border border-purple-500/30">
        <h3 className="text-lg font-semibold text-white mb-4">Целевой канал</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={targetChannel}
            onChange={(e) => setTargetChannel(e.target.value)}
            placeholder="@mychannel"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200">
            Сохранить
          </button>
        </div>
      </div>

      {/* Add Channel */}
      <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Добавить канал</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={newChannel}
            onChange={(e) => setNewChannel(e.target.value)}
            placeholder="@channelname или ссылка"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addChannel()}
          />
          <button
            onClick={addChannel}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Добавить
          </button>
        </div>
      </div>

      {/* Channels List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Каналы ({channels.length})</h3>
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="p-6 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {getStatusIcon(channel.status)}
                  <h4 className="text-lg font-medium text-white">{channel.title}</h4>
                  <span className="text-blue-400">{channel.username}</span>
                  <a
                    href={`https://t.me/${channel.username.slice(1)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-300">
                  <span>Сообщений: {channel.messagesCount}</span>
                  {channel.lastChecked && (
                    <span>Последняя проверка: {channel.lastChecked.toLocaleTimeString()}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleChannelStatus(channel.id, 'source')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${channel.isSource
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }
                  `}
                >
                  {channel.isSource ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {channel.isSource ? 'Активен' : 'Отключен'}
                </button>

                <button
                  onClick={() => toggleChannelStatus(channel.id, 'excluded')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                    ${channel.isExcluded
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }
                  `}
                >
                  {channel.isExcluded ? 'Исключен' : 'Разрешен'}
                </button>

                <button
                  onClick={() => removeChannel(channel.id)}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}