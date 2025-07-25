#!/bin/bash

# Telegram Channel Parser - One-Click VPS Deployment Script
# This script will install and configure everything needed to run the parser

set -e

echo "🚀 Starting Telegram Channel Parser deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
else
    print_success "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose is already installed"
fi

# Create application directory
APP_DIR="$HOME/telegram-parser"
print_status "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR
cd $APP_DIR

# Create necessary directories
mkdir -p data logs sessions

# Download application files (in real deployment, this would be from a git repository)
print_status "Setting up application files..."

# Create .env file
print_status "Creating environment configuration..."
cat > .env << EOF
# Telegram API credentials (get from https://my.telegram.org)
TELEGRAM_API_ID=
TELEGRAM_API_HASH=
TELEGRAM_SESSION=

# AI API keys (optional, for advanced filtering)
OPENROUTER_API_KEY=
TOGETHER_API_KEY=
HUGGINGFACE_API_KEY=

# Database
DB_PASSWORD=$(openssl rand -base64 32)

# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
EOF

# Set proper permissions
chmod 600 .env

# Configure firewall
print_status "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Create systemd service for auto-start
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/telegram-parser.service > /dev/null << EOF
[Unit]
Description=Telegram Channel Parser
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable telegram-parser

# Create management scripts
print_status "Creating management scripts..."

# Start script
cat > start.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
docker-compose up -d
echo "✅ Telegram Parser started successfully!"
echo "🌐 Web interface: http://$(curl -s ifconfig.me)"
echo "📊 Check status: ./status.sh"
EOF

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
docker-compose down
echo "🛑 Telegram Parser stopped"
EOF

# Status script
cat > status.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "📊 Telegram Parser Status:"
echo "=========================="
docker-compose ps
echo ""
echo "📈 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo ""
echo "🌐 Web Interface: http://$(curl -s ifconfig.me)"
EOF

# Update script
cat > update.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🔄 Updating Telegram Parser..."
docker-compose pull
docker-compose up -d
echo "✅ Update completed!"
EOF

# Logs script
cat > logs.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
if [ "$1" = "-f" ]; then
    docker-compose logs -f
else
    docker-compose logs --tail=100
fi
EOF

# Backup script
cat > backup.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r data logs .env $BACKUP_DIR/
tar -czf "${BACKUP_DIR}.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR
echo "✅ Backup created: ${BACKUP_DIR}.tar.gz"
EOF

# Make scripts executable
chmod +x *.sh

# Create nginx configuration for SSL (optional)
print_status "Creating SSL configuration template..."
cat > nginx-ssl.conf << 'EOF'
# SSL Configuration Template
# Copy this to /etc/nginx/sites-available/telegram-parser after getting SSL certificate

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
EOF

print_success "Deployment completed successfully! 🎉"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Configure Telegram API credentials:"
echo "   nano .env"
echo ""
echo "2. Get your Telegram API credentials from: https://my.telegram.org"
echo ""
echo "3. Start the application:"
echo "   ./start.sh"
echo ""
echo "4. Access the web interface:"
echo "   http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
echo ""
echo "📚 Available Commands:"
echo "   ./start.sh    - Start the parser"
echo "   ./stop.sh     - Stop the parser"
echo "   ./status.sh   - Check status"
echo "   ./logs.sh     - View logs"
echo "   ./logs.sh -f  - Follow logs"
echo "   ./update.sh   - Update application"
echo "   ./backup.sh   - Create backup"
echo ""
echo "🔧 Configuration files:"
echo "   .env                 - Environment variables"
echo "   docker-compose.yml   - Docker configuration"
echo "   nginx-ssl.conf       - SSL configuration template"
echo ""
print_warning "Remember to:"
print_warning "- Configure your Telegram API credentials in .env file"
print_warning "- Set up SSL certificate for production use"
print_warning "- Configure your firewall rules"
print_warning "- Set up regular backups"
echo ""
print_success "Happy parsing! 🤖"
EOF

chmod +x deploy.sh