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

# Configuration
REPO_URL="https://github.com/cdoxcdox/parserbolt.git"
APP_DIR="$HOME/telegram-parser"

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

# Detect OS
if [[ -f /etc/os-release ]]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    print_error "Cannot detect OS version"
    exit 1
fi

print_status "Detected OS: $OS $VER"

# Update system
print_status "Updating system packages..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    # Set non-interactive mode to avoid prompts
    export DEBIAN_FRONTEND=noninteractive
    
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    sudo yum update -y
    sudo yum install -y curl wget git unzip
else
    print_warning "Unsupported OS. Continuing anyway..."
fi

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        # Pre-configure docker.io to automatically restart daemon
        echo 'docker.io docker.io/restart-docker boolean true' | sudo debconf-set-selections
        
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt update
        
        # Install Docker with automatic yes to all prompts
        sudo DEBIAN_FRONTEND=noninteractive apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        
        # Ensure Docker service is started
        sudo systemctl start docker
        sudo systemctl enable docker
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    sudo usermod -aG docker $USER
    print_success "Docker installed successfully"
    
    # Wait for Docker to be ready
    print_status "Waiting for Docker to be ready..."
    sleep 5
    
    # Test Docker installation
    if sudo docker run --rm hello-world > /dev/null 2>&1; then
        print_success "Docker is working correctly"
    else
        print_warning "Docker test failed, but continuing..."
    fi
else
    print_success "Docker is already installed"
fi

# Install Docker Compose (standalone version for compatibility)
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    # Use fixed version to avoid API rate limits
    DOCKER_COMPOSE_VERSION="v2.24.5"
    print_status "Installing Docker Compose version $DOCKER_COMPOSE_VERSION"
    
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Create symlink for compatibility
    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    
    print_success "Docker Compose installed successfully"
else
    print_success "Docker Compose is already installed"
fi

# Verify installations
print_status "Verifying installations..."
docker --version || print_error "Docker installation failed"
docker-compose --version || print_error "Docker Compose installation failed"

# Clone repository
print_status "Cloning repository..."
if [ -d "$APP_DIR" ]; then
    print_warning "Directory $APP_DIR already exists. Backing up..."
    mv "$APP_DIR" "${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
fi

# Clone with error handling
if ! git clone "$REPO_URL" "$APP_DIR"; then
    print_error "Failed to clone repository. Please check the URL and your internet connection."
    exit 1
fi

cd "$APP_DIR"

# Create necessary directories
print_status "Creating application directories..."
mkdir -p data logs sessions backups

# Set proper permissions
chmod 755 data logs sessions backups

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
DB_HOST=postgres
DB_PORT=5432
DB_NAME=telegram_parser
DB_USER=parser_user
DB_PASSWORD=$(openssl rand -base64 32)

# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Docker
COMPOSE_PROJECT_NAME=telegram-parser
EOF

# Set proper permissions
chmod 600 .env

# Create init.sql for database initialization
print_status "Creating database initialization script..."
cat > init.sql << 'EOF'
-- Create database and user
CREATE DATABASE telegram_parser;
CREATE USER parser_user WITH ENCRYPTED PASSWORD 'PLACEHOLDER_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE telegram_parser TO parser_user;

-- Connect to the database
\c telegram_parser;

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO parser_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO parser_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO parser_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO parser_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO parser_user;
EOF

# Replace password placeholder
DB_PASSWORD=$(grep DB_PASSWORD .env | cut -d'=' -f2)
sed -i "s/PLACEHOLDER_PASSWORD/$DB_PASSWORD/g" init.sql

# Configure firewall
print_status "Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
    print_success "UFW firewall configured"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=22/tcp
    sudo firewall-cmd --permanent --add-port=80/tcp
    sudo firewall-cmd --permanent --add-port=443/tcp
    sudo firewall-cmd --reload
    print_success "Firewalld configured"
else
    print_warning "No firewall detected. Please configure manually."
fi

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
Group=docker

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

echo "🚀 Starting Telegram Parser..."

# Check if .env file has required variables
if ! grep -q "TELEGRAM_API_ID=.*[0-9]" .env; then
    echo "❌ Error: TELEGRAM_API_ID not configured in .env file"
    echo "Please edit .env file and add your Telegram API credentials"
    exit 1
fi

if ! grep -q "TELEGRAM_API_HASH=.*[a-zA-Z0-9]" .env; then
    echo "❌ Error: TELEGRAM_API_HASH not configured in .env file"
    echo "Please edit .env file and add your Telegram API credentials"
    exit 1
fi

# Start services
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Telegram Parser started successfully!"
    echo ""
    echo "🌐 Web interface: http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
    echo "📊 Check status: ./status.sh"
    echo "📝 View logs: ./logs.sh"
    echo ""
    echo "📋 Next steps:"
    echo "1. Open the web interface in your browser"
    echo "2. Configure your channels and filters"
    echo "3. Start the parser from the web interface"
else
    echo "❌ Failed to start some services. Check logs: ./logs.sh"
    exit 1
fi
EOF

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🛑 Stopping Telegram Parser..."
docker-compose down
echo "✅ Telegram Parser stopped"
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
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "No containers running"
echo ""
echo "🌐 Web Interface: http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo ""
echo "💾 Disk Usage:"
du -sh data/ logs/ 2>/dev/null || echo "No data directories found"
EOF

# Update script
cat > update.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "🔄 Updating Telegram Parser..."

# Stop services
./stop.sh

# Backup current version
echo "📦 Creating backup..."
./backup.sh

# Pull latest changes
echo "⬇️ Pulling latest changes..."
git pull origin main

# Rebuild and start
echo "🔨 Rebuilding containers..."
docker-compose build --no-cache
docker-compose up -d

echo "✅ Update completed!"
echo "📊 Check status: ./status.sh"
EOF

# Logs script
cat > logs.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

if [ "$1" = "-f" ]; then
    echo "📝 Following logs (Ctrl+C to exit)..."
    docker-compose logs -f
elif [ "$1" = "-t" ]; then
    # Show logs with timestamps
    docker-compose logs -t --tail=100
else
    echo "📝 Recent logs (last 100 lines):"
    docker-compose logs --tail=100
fi
EOF

# Backup script
cat > backup.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup..."

# Backup data and configuration
cp -r data logs .env "$BACKUP_DIR/" 2>/dev/null || true

# Create database backup if postgres is running
if docker-compose ps postgres | grep -q "Up"; then
    echo "💾 Backing up database..."
    docker-compose exec -T postgres pg_dump -U parser_user telegram_parser > "$BACKUP_DIR/database.sql"
fi

# Create compressed archive
tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "✅ Backup created: ${BACKUP_DIR}.tar.gz"
EOF

# Restore script
cat > restore.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "Usage: ./restore.sh <backup_file.tar.gz>"
    echo "Available backups:"
    ls -la backups/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restoring from backup: $BACKUP_FILE"

# Stop services
./stop.sh

# Extract backup
TEMP_DIR=$(mktemp -d)
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
BACKUP_DIR=$(ls "$TEMP_DIR")

# Restore files
cp -r "$TEMP_DIR/$BACKUP_DIR"/* . 2>/dev/null || true

# Restore database if backup exists
if [ -f "database.sql" ]; then
    echo "💾 Restoring database..."
    docker-compose up -d postgres
    sleep 10
    docker-compose exec -T postgres psql -U parser_user -d telegram_parser < database.sql
    rm database.sql
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Start services
./start.sh

echo "✅ Restore completed!"
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
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
EOF

# Create SSL setup script
cat > setup-ssl.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh <your-domain.com>"
    exit 1
fi

DOMAIN="$1"

echo "🔒 Setting up SSL for domain: $DOMAIN"

# Install certbot
if command -v apt &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
elif command -v yum &> /dev/null; then
    sudo yum install -y certbot python3-certbot-nginx
fi

# Get certificate
sudo certbot --nginx -d "$DOMAIN"

# Setup auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

echo "✅ SSL setup completed for $DOMAIN"
EOF

chmod +x setup-ssl.sh

# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"

echo "🏥 Health Check Report"
echo "====================="

# Check if containers are running
echo "📦 Container Status:"
docker-compose ps

echo ""
echo "🌐 Web Interface:"
if curl -s http://localhost/api/health > /dev/null; then
    echo "✅ API is responding"
else
    echo "❌ API is not responding"
fi

echo ""
echo "💾 Database Status:"
if docker-compose exec -T postgres pg_isready -U parser_user > /dev/null 2>&1; then
    echo "✅ Database is ready"
else
    echo "❌ Database is not ready"
fi

echo ""
echo "📊 System Resources:"
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h . | awk 'NR==2{printf "%s", $5}')"

echo ""
echo "📝 Recent Errors:"
docker-compose logs --tail=10 | grep -i error || echo "No recent errors found"
EOF

chmod +x health-check.sh

print_success "Deployment completed successfully! 🎉"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Configure Telegram API credentials:"
echo "   nano .env"
echo ""
echo "2. Get your Telegram API credentials from: https://my.telegram.org"
echo "   - Go to https://my.telegram.org"
echo "   - Login with your phone number"
echo "   - Go to 'API development tools'"
echo "   - Create new application"
echo "   - Copy api_id and api_hash to .env file"
echo ""
echo "3. Start the application:"
echo "   ./start.sh"
echo ""
echo "4. Access the web interface:"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "   http://$SERVER_IP"
echo ""
echo "📚 Available Commands:"
echo "   ./start.sh         - Start the parser"
echo "   ./stop.sh          - Stop the parser"
echo "   ./status.sh        - Check status"
echo "   ./logs.sh          - View logs"
echo "   ./logs.sh -f       - Follow logs"
echo "   ./update.sh        - Update application"
echo "   ./backup.sh        - Create backup"
echo "   ./restore.sh       - Restore from backup"
echo "   ./health-check.sh  - System health check"
echo "   ./setup-ssl.sh     - Setup SSL certificate"
echo ""
echo "🔧 Configuration files:"
echo "   .env                 - Environment variables"
echo "   docker-compose.yml   - Docker configuration"
echo "   nginx-ssl.conf       - SSL configuration template"
echo ""
print_warning "Important reminders:"
print_warning "- Configure your Telegram API credentials in .env file"
print_warning "- Set up SSL certificate for production use"
print_warning "- Configure your firewall rules"
print_warning "- Set up regular backups"
print_warning "- Monitor logs for any issues"
echo ""
print_success "Happy parsing! 🤖"
echo ""
echo "💡 Pro Tips:"
echo "- Use './health-check.sh' to monitor system health"
echo "- Set up a cron job for automatic backups"
echo "- Monitor disk space in the data/ and logs/ directories"
echo "- Check logs regularly with './logs.sh'"
echo ""
echo "🆘 Need help? Check the logs with './logs.sh' or './health-check.sh'"
