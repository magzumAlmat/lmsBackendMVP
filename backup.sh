#!/bin/bash

# Configuration
BACKUP_DIR="$(pwd)/backups"
DB_USER="admin"
DB_NAME="admin"
DB_PASSWORD="root"  # Replace with your actual password
CONTAINER_NAME="kazniisaLMS_db"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Check if Docker container is running
if ! docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
    echo "Error: Container $CONTAINER_NAME is not running!" >&2
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Test database connection
echo "Testing connection to $DB_NAME..."
docker exec "$CONTAINER_NAME" env PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null
if [ $? -ne 0 ]; then
    echo "Error: Failed to connect to database. Check DB_USER, DB_PASSWORD, or DB_NAME." >&2
    exit 1
fi

# Perform full backup using pg_dump
echo "Creating backup of $DB_NAME..."
docker exec "$CONTAINER_NAME" env PGPASSWORD="$DB_PASSWORD" pg_dump -U "$DB_USER" "$DB_NAME" --verbose | gzip > "$BACKUP_DIR/$DB_NAME_$DATE.sql.gz"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_DIR/$DB_NAME_$DATE.sql.gz"
    # Check backup size
    BACKUP_SIZE=$(stat -f %z "$BACKUP_DIR/$DB_NAME_$DATE.sql.gz")
    echo "Backup size: $BACKUP_SIZE bytes"
    if [ "$BACKUP_SIZE" -lt 100 ]; then
        echo "Warning: Backup file is very small. Database may be empty or inaccessible."
        echo "Checking tables..."
        docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\dt"
    fi
    
    # Remove backups older than RETENTION_DAYS
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
    echo "Cleaned up backups older than $RETENTION_DAYS days"
else
    echo "Backup failed!" >&2
    exit 1
fi