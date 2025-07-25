export interface Channel {
  id: string;
  username: string;
  title: string;
  isSource: boolean;
  isExcluded: boolean;
  lastChecked?: Date;
  messagesCount: number;
  status: 'active' | 'inactive' | 'error';
}

export interface Message {
  id: string;
  channelId: string;
  content: string;
  mediaType?: 'photo' | 'video' | 'document';
  mediaUrl?: string;
  timestamp: Date;
  isForwarded: boolean;
  isSpam: boolean;
  isDuplicate: boolean;
  similarity?: number;
}

export interface FilterSettings {
  spamKeywords: string[];
  allowedKeywords: string[];
  minTextLength: number;
  maxTextLength: number;
  filterMedia: boolean;
  similarityThreshold: number;
  useAI: boolean;
  aiProvider: 'openrouter' | 'together' | 'huggingface';
}

export interface ParserSettings {
  checkInterval: number; // minutes
  antispamDelay: {
    min: number; // seconds
    max: number; // seconds
  };
  maxMessagesPerHour: number;
  targetChannel: string;
  isActive: boolean;
}

export interface Statistics {
  totalChecked: number;
  totalForwarded: number;
  spamFiltered: number;
  duplicatesFiltered: number;
  errorsCount: number;
  lastRun?: Date;
}