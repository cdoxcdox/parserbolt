-- Create database schema for Telegram Parser

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500),
    is_source BOOLEAN DEFAULT true,
    is_excluded BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    messages_count INTEGER DEFAULT 0,
    last_checked TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Filter settings table
CREATE TABLE IF NOT EXISTS filter_settings (
    id SERIAL PRIMARY KEY,
    spam_keywords JSONB DEFAULT '[]',
    allowed_keywords JSONB DEFAULT '[]',
    min_text_length INTEGER DEFAULT 50,
    max_text_length INTEGER DEFAULT 4000,
    filter_media BOOLEAN DEFAULT false,
    similarity_threshold DECIMAL(3,2) DEFAULT 0.80,
    use_ai BOOLEAN DEFAULT true,
    ai_provider VARCHAR(50) DEFAULT 'openrouter',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Parser settings table
CREATE TABLE IF NOT EXISTS parser_settings (
    id SERIAL PRIMARY KEY,
    check_interval INTEGER DEFAULT 5,
    antispam_delay_min INTEGER DEFAULT 30,
    antispam_delay_max INTEGER DEFAULT 120,
    max_messages_per_hour INTEGER DEFAULT 20,
    target_channel VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Message logs table
CREATE TABLE IF NOT EXISTS message_logs (
    id SERIAL PRIMARY KEY,
    message_id BIGINT,
    channel_id INTEGER REFERENCES channels(id),
    content TEXT,
    action VARCHAR(50), -- 'forwarded', 'spam_filtered', 'duplicate_filtered', 'error'
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Processed messages table (for duplicate detection)
CREATE TABLE IF NOT EXISTS processed_messages (
    id SERIAL PRIMARY KEY,
    message_id BIGINT UNIQUE,
    channel_username VARCHAR(255),
    content_hash VARCHAR(64),
    processed_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_channels_username ON channels(username);
CREATE INDEX IF NOT EXISTS idx_channels_active ON channels(is_active, is_source, is_excluded);
CREATE INDEX IF NOT EXISTS idx_message_logs_timestamp ON message_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_message_logs_action ON message_logs(action);
CREATE INDEX IF NOT EXISTS idx_processed_messages_id ON processed_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_processed_messages_hash ON processed_messages(content_hash);

-- Insert default filter settings
INSERT INTO filter_settings (spam_keywords, allowed_keywords) 
VALUES (
    '["реклама", "скидка", "промокод", "купить", "заработок"]',
    '["новости", "технологии", "обновление"]'
) ON CONFLICT DO NOTHING;

-- Insert default parser settings
INSERT INTO parser_settings (target_channel) 
VALUES ('@mytargetchannel') 
ON CONFLICT DO NOTHING;