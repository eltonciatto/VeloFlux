#!/bin/bash

# VeloFlux SaaS Automated Backup Script
# Creates comprehensive backups of all VeloFlux data

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/veloflux"
CONFIG_DIR="/etc/veloflux"
DATA_DIR="/var/lib/veloflux"
LOG_FILE="/var/log/veloflux/backup.log"
RETENTION_DAYS=30
COMPRESSION_LEVEL=6

# Load environment
source "$CONFIG_DIR/.env"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[BACKUP]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[BACKUP]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[BACKUP]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[BACKUP]${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory structure
setup_backup_dirs() {
    mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly,config,database,redis,ssl,logs}
    chmod 700 "$BACKUP_DIR"
}

# Backup configuration files
backup_config() {
    log_info "Backing up configuration files..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    CONFIG_BACKUP="$BACKUP_DIR/config/config_$TIMESTAMP.tar.gz"
    
    tar -czf "$CONFIG_BACKUP" -C /etc veloflux nginx/sites-available/veloflux
    
    if [[ -f "$CONFIG_BACKUP" ]]; then
        log_success "Configuration backup created: $CONFIG_BACKUP"
    else
        log_error "Configuration backup failed"
        return 1
    fi
}

# Backup PostgreSQL database
backup_database() {
    log_info "Backing up PostgreSQL database..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    DB_BACKUP="$BACKUP_DIR/database/postgres_$TIMESTAMP.sql.gz"
    
    if docker ps | grep -q veloflux-postgres; then
        docker exec veloflux-postgres pg_dump -U veloflux -d veloflux --verbose \
            | gzip -"$COMPRESSION_LEVEL" > "$DB_BACKUP"
        
        if [[ -f "$DB_BACKUP" && -s "$DB_BACKUP" ]]; then
            log_success "Database backup created: $DB_BACKUP"
        else
            log_error "Database backup failed or is empty"
            return 1
        fi
    else
        log_warning "PostgreSQL container not running, skipping database backup"
    fi
}

# Backup Redis data
backup_redis() {
    log_info "Backing up Redis data..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    REDIS_BACKUP="$BACKUP_DIR/redis/redis_$TIMESTAMP.rdb.gz"
    
    if docker ps | grep -q veloflux-redis-master; then
        # Create Redis backup
        docker exec veloflux-redis-master redis-cli -a "$VF_REDIS_PASS" BGSAVE
        
        # Wait for backup to complete
        while [[ $(docker exec veloflux-redis-master redis-cli -a "$VF_REDIS_PASS" LASTSAVE) -eq $(docker exec veloflux-redis-master redis-cli -a "$VF_REDIS_PASS" LASTSAVE) ]]; do
            sleep 1
        done
        
        # Copy and compress the backup
        docker cp veloflux-redis-master:/data/dump.rdb - | gzip -"$COMPRESSION_LEVEL" > "$REDIS_BACKUP"
        
        if [[ -f "$REDIS_BACKUP" && -s "$REDIS_BACKUP" ]]; then
            log_success "Redis backup created: $REDIS_BACKUP"
        else
            log_error "Redis backup failed or is empty"
            return 1
        fi
    else
        log_warning "Redis container not running, skipping Redis backup"
    fi
}

# Backup SSL certificates
backup_ssl() {
    log_info "Backing up SSL certificates..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    SSL_BACKUP="$BACKUP_DIR/ssl/ssl_$TIMESTAMP.tar.gz"
    
    if [[ -d "/etc/letsencrypt" ]]; then
        tar -czf "$SSL_BACKUP" -C /etc letsencrypt
        
        if [[ -f "$SSL_BACKUP" ]]; then
            log_success "SSL certificates backup created: $SSL_BACKUP"
        else
            log_error "SSL certificates backup failed"
            return 1
        fi
    else
        log_warning "No SSL certificates found, skipping SSL backup"
    fi
}

# Backup logs
backup_logs() {
    log_info "Backing up logs..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    LOGS_BACKUP="$BACKUP_DIR/logs/logs_$TIMESTAMP.tar.gz"
    
    # Backup VeloFlux logs
    if [[ -d "/var/log/veloflux" ]]; then
        tar -czf "$LOGS_BACKUP" -C /var/log veloflux nginx/veloflux* nginx/admin* nginx/api* nginx/grafana* nginx/prometheus*
        
        if [[ -f "$LOGS_BACKUP" ]]; then
            log_success "Logs backup created: $LOGS_BACKUP"
        else
            log_error "Logs backup failed"
            return 1
        fi
    fi
}

# Create full backup archive
create_full_backup() {
    log_info "Creating full backup archive..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_TYPE="${1:-daily}"
    FULL_BACKUP="$BACKUP_DIR/$BACKUP_TYPE/veloflux_full_backup_$TIMESTAMP.tar.gz"
    
    # Create temporary directory for this backup
    TEMP_DIR="/tmp/veloflux_backup_$TIMESTAMP"
    mkdir -p "$TEMP_DIR"
    
    # Copy all individual backups to temp directory
    cp -r "$BACKUP_DIR"/config/config_* "$TEMP_DIR/" 2>/dev/null || true
    cp -r "$BACKUP_DIR"/database/postgres_* "$TEMP_DIR/" 2>/dev/null || true
    cp -r "$BACKUP_DIR"/redis/redis_* "$TEMP_DIR/" 2>/dev/null || true
    cp -r "$BACKUP_DIR"/ssl/ssl_* "$TEMP_DIR/" 2>/dev/null || true
    cp -r "$BACKUP_DIR"/logs/logs_* "$TEMP_DIR/" 2>/dev/null || true
    
    # Create backup metadata
    cat > "$TEMP_DIR/backup_info.txt" << EOF
VeloFlux SaaS Backup Information
================================
Backup Date: $(date)
Backup Type: $BACKUP_TYPE
Server: $(hostname)
IP Address: $(hostname -I | awk '{print $1}')
VeloFlux Version: $VF_VERSION
Backup Size: $(du -sh "$TEMP_DIR" | cut -f1)

Included Components:
- Configuration files
- PostgreSQL database
- Redis data
- SSL certificates
- Application logs
- System information

Restore Instructions:
1. Extract this archive
2. Run the restore script: ./restore.sh
3. Verify all services are running
EOF

    # Create the full backup archive
    tar -czf "$FULL_BACKUP" -C "$(dirname "$TEMP_DIR")" "$(basename "$TEMP_DIR")"
    
    # Cleanup temp directory
    rm -rf "$TEMP_DIR"
    
    if [[ -f "$FULL_BACKUP" ]]; then
        BACKUP_SIZE=$(du -sh "$FULL_BACKUP" | cut -f1)
        log_success "Full backup created: $FULL_BACKUP ($BACKUP_SIZE)"
        
        # Create checksum
        sha256sum "$FULL_BACKUP" > "$FULL_BACKUP.sha256"
        log_success "Backup checksum created: $FULL_BACKUP.sha256"
    else
        log_error "Full backup creation failed"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    # Cleanup individual backup directories
    for dir in config database redis ssl logs; do
        find "$BACKUP_DIR/$dir" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    done
    
    # Cleanup full backup directories
    for dir in daily weekly monthly; do
        find "$BACKUP_DIR/$dir" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    done
    
    log_success "Old backups cleaned up"
}

# Send backup notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Email notification (if configured)
    if command -v mail >/dev/null 2>&1 && [[ -n "${BACKUP_EMAIL:-}" ]]; then
        echo "$message" | mail -s "VeloFlux Backup: $status" "$BACKUP_EMAIL"
    fi
    
    # Slack notification (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"VeloFlux Backup: $status\\n$message\"}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
}

# Main backup function
main() {
    local backup_type="${1:-daily}"
    
    log_info "Starting VeloFlux SaaS backup ($backup_type)..."
    
    # Setup
    setup_backup_dirs
    
    # Track backup status
    BACKUP_FAILED=false
    
    # Perform individual backups
    backup_config || BACKUP_FAILED=true
    backup_database || BACKUP_FAILED=true
    backup_redis || BACKUP_FAILED=true
    backup_ssl || BACKUP_FAILED=true
    backup_logs || BACKUP_FAILED=true
    
    # Create full backup if individual backups succeeded
    if [[ "$BACKUP_FAILED" == "false" ]]; then
        create_full_backup "$backup_type" || BACKUP_FAILED=true
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Report results
    if [[ "$BACKUP_FAILED" == "false" ]]; then
        log_success "✅ VeloFlux backup completed successfully"
        send_notification "SUCCESS" "VeloFlux backup completed successfully at $(date)"
    else
        log_error "❌ VeloFlux backup completed with errors"
        send_notification "FAILED" "VeloFlux backup completed with errors at $(date). Check logs for details."
        exit 1
    fi
}

# Handle different backup types
case "${1:-daily}" in
    "daily"|"weekly"|"monthly")
        main "$1"
        ;;
    "config")
        setup_backup_dirs
        backup_config
        ;;
    "database")
        setup_backup_dirs
        backup_database
        ;;
    "redis")
        setup_backup_dirs
        backup_redis
        ;;
    "ssl")
        setup_backup_dirs
        backup_ssl
        ;;
    "logs")
        setup_backup_dirs
        backup_logs
        ;;
    *)
        echo "Usage: $0 {daily|weekly|monthly|config|database|redis|ssl|logs}"
        echo ""
        echo "Backup types:"
        echo "  daily    - Daily backup (default)"
        echo "  weekly   - Weekly backup"
        echo "  monthly  - Monthly backup"
        echo ""
        echo "Individual components:"
        echo "  config   - Configuration files only"
        echo "  database - PostgreSQL database only"
        echo "  redis    - Redis data only"
        echo "  ssl      - SSL certificates only"
        echo "  logs     - Application logs only"
        exit 1
        ;;
esac
