# #!/bin/bash

# # Configuration
# BACKUP_DIR="$(pwd)/backups"
# DB_USER="admin"
# DB_NAME="admin"
# DB_PASSWORD="root"  # Replace with your actual password
# CONTAINER_NAME="kazniisaLMS_db"
# RESTORE_DB_NAME="kazniisalms_db_restore"  # Temporary database name for safety

# # Check if Docker container is running
# if ! docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
#     echo "Error: Container $CONTAINER_NAME is not running!" >&2
#     exit 1
# fi

# # Check if backup directory exists
# if [ ! -d "$BACKUP_DIR" ]; then
#     echo "Error: Backup directory $BACKUP_DIR does not exist!" >&2
#     exit 1
# fi

# # List available backups
# echo "Available backups in $BACKUP_DIR:"
# ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null
# if [ $? -ne 0 ]; then
#     echo "Error: No backups found in $BACKUP_DIR!" >&2
#     exit 1
# fi

# # Prompt user to select a backup file
# echo "Enter the name of the backup file to restore (e.g., kazniisalms_db_20250415_123456.sql.gz):"
# read -r BACKUP_FILE

# # Validate backup file
# BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
# if [ ! -f "$BACKUP_PATH" ]; then
#     echo "Error: Backup file $BACKUP_PATH does not exist!" >&2
#     exit 1
# fi

# # Check backup file size (warn if too small)
# BACKUP_SIZE=$(stat -f %z "$BACKUP_PATH")
# if [ "$BACKUP_SIZE" -lt 100 ]; then
#     echo "Warning: Backup file is very small ($BACKUP_SIZE bytes). It may be empty or corrupted."
#     echo "Do you want to continue? (y/n)"
#     read -r CONTINUE
#     if [ "$CONTINUE" != "y" ]; then
#         echo "Aborted by user."
#         exit 1
#     fi
# fi

# # Drop existing restore database if it exists
# echo "Dropping existing $RESTORE_DB_NAME if it exists..."
# docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $RESTORE_DB_NAME;"
# if [ $? -ne 0 ]; then
#     echo "Error: Failed to drop existing $RESTORE_DB_NAME!" >&2
#     exit 1
# fi

# # Create a new database for restoration
# echo "Creating temporary database $RESTORE_DB_NAME..."
# docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $RESTORE_DB_NAME;"
# if [ $? -ne 0 ]; then
#     echo "Error: Failed to create database $RESTORE_DB_NAME!" >&2
#     exit 1
# fi

# # Decompress and restore the backup
# # Decompress and restore the backup
# echo "Restoring backup $BACKUP_FILE to $RESTORE_DB_NAME..."
# gunzip -c "$BACKUP_PATH" | docker exec -i "$CONTAINER_NAME" env PGPASSWORD="$DB_PASSWORD" psql -U "$DB_USER" -d "$RESTORE_DB_NAME"
# if [ $? -eq 0 ]; then
#     echo "Restoration successful! Data restored to $RESTORE_DB_NAME."
    
#     # Reset all sequences to start from 1
#     echo "Resetting sequences to start from 1..."
#     docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$RESTORE_DB_NAME" -c "DO \$\$ DECLARE r record; BEGIN FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' RESTART WITH 1;'; END LOOP; END \$\$;"
#     if [ $? -eq 0 ]; then
#         echo "Sequences reset successfully."
#     else
#         echo "Error: Failed to reset sequences!" >&2
#         exit 1
#     fi
# else
#     echo "Error: Restoration failed!" >&2
#     # Drop the temporary database if restoration fails
#     docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $RESTORE_DB_NAME;"
#     exit 1
# fi



# # Instructions for next steps
# echo "Next steps:"
# echo "1. Verify the data in $RESTORE_DB_NAME:"
# echo "   docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $RESTORE_DB_NAME -c 'SELECT * FROM users LIMIT 5;'"
# echo "2. If satisfied, you can replace the original database:"
# echo "   docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c 'DROP DATABASE IF EXISTS $DB_NAME;'"
# echo "   docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c 'ALTER DATABASE $RESTORE_DB_NAME RENAME TO $DB_NAME;'"
# echo "3. Restart your application:"
# echo "   cd $(pwd) && npm start"


#!/bin/bash

# Configuration
BACKUP_DIR="$(pwd)/backups"
DB_USER="admin"
DB_NAME="admin"
: "${process.env.DB_PASSWORD?Error: DB_PASSWORD not set}"  # Use environment variable
CONTAINER_NAME="kazniisaLMS_db"
RESTORE_DB_NAME="kazniisalms_db_restore"  # Temporary database name for safety
LOG_FILE="$BACKUP_DIR/restore.log"

# Log function
log() {
    echo "$(date): $1" | tee -a "$LOG_FILE"
}

# Check if Docker container is running
if ! docker ps -q -f name="$CONTAINER_NAME" | grep -q .; then
    log "Error: Container $CONTAINER_NAME is not running!" >&2
    exit 1
fi

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    log "Error: Backup directory $BACKUP_DIR does not exist!" >&2
    exit 1
fi

# List available backups
log "Available backups in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null
if [ $? -ne 0 ]; then
    log "Error: No backups found in $BACKUP_DIR!" >&2
    exit 1
fi

# Prompt user to select a backup file
echo "Enter the name of the backup file to restore (e.g., 20250415_123456.sql.gz):"
read -r BACKUP_FILE

# Validate backup file
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
if [ ! -f "$BACKUP_PATH" ]; then
    log "Error: Backup file $BACKUP_PATH does not exist!" >&2
    exit 1
fi

# Check backup file integrity
log "Checking integrity of $BACKUP_FILE..."
gunzip -t "$BACKUP_PATH"
if [ $? -ne 0 ]; then
    log "Error: Backup file $BACKUP_PATH is corrupted!" >&2
    exit 1
fi

# Check backup file size (warn if too small)
BACKUP_SIZE=$(wc -c < "$BACKUP_PATH")
if [ "$BACKUP_SIZE" -lt 1000 ]; then
    log "Warning: Backup file is very small ($BACKUP_SIZE bytes). It may be empty or corrupted."
    echo "Do you want to continue? (y/n)"
    read -r CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        log "Aborted by user."
        exit 1
    fi
fi

# Terminate active connections to restore database
log "Terminating active connections to $RESTORE_DB_NAME..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$RESTORE_DB_NAME' AND pid <> pg_backend_pid();"

# Drop existing restore database if it exists
log "Dropping existing $RESTORE_DB_NAME if it exists..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $RESTORE_DB_NAME;"
if [ $? -ne 0 ]; then
    log "Error: Failed to drop existing $RESTORE_DB_NAME!" >&2
    exit 1
fi

# Create a new database for restoration
log "Creating temporary database $RESTORE_DB_NAME..."
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $RESTORE_DB_NAME;"
if [ $? -ne 0 ]; then
    log "Error: Failed to create database $RESTORE_DB_NAME!" >&2
    exit 1
fi

# Decompress and restore the backup
log "Restoring backup $BACKUP_FILE to $RESTORE_DB_NAME..."
gunzip -c "$BACKUP_PATH" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$RESTORE_DB_NAME"
if [ $? -eq 0 ]; then
    log "Restoration successful! Data restored to $RESTORE_DB_NAME."
    
    # Ask user if they want to reset sequences
    echo "Do you want to reset all sequences to start from 1? (y/n)"
    read -r RESET_SEQUENCES
    if [ "$RESET_SEQUENCES" = "y" ]; then
        log "Resetting sequences to start from 1..."
        docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$RESTORE_DB_NAME" -c "DO \$\$ DECLARE r record; BEGIN FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP EXECUTE 'ALTER SEQUENCE ' || quote_ident(r.sequence_name) || ' RESTART WITH 1;'; END LOOP; END \$\$"
        if [ $? -eq 0 ]; then
            log "Sequences reset successfully."
        else
            log "Error: Failed to reset sequences!" >&2
            exit 1
        fi
    fi
else
    log "Error: Restoration failed!" >&2
    # Drop the temporary database if restoration fails
    docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $RESTORE_DB_NAME;"
    exit 1
fi

# Instructions for next steps
log "Next steps:"
echo "1. Verify the data in $RESTORE_DB_NAME:"
echo "   docker exec -it $CONTAINER_NAME psql -U $DB_USER -d $RESTORE_DB_NAME -c 'SELECT * FROM users LIMIT 5;'"
echo "2. Create a backup of the current $DB_NAME before replacing it:"
echo "   BACKUP_DIR=\"$BACKUP_DIR\""
echo "   DATE=\$(date +%Y%m%d_%H%M%S)"
echo "   docker exec $CONTAINER_NAME pg_dump -U $DB_USER $DB_NAME --verbose | gzip > \"$BACKUP_DIR/${DB_NAME}_backup_before_restore_\$DATE.sql.gz\""
echo "3. If satisfied, replace the original database:"
echo "   docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c 'DROP DATABASE IF EXISTS $DB_NAME;'"
echo "   docker exec $CONTAINER_NAME psql -U $DB_USER -d postgres -c 'ALTER DATABASE $RESTORE_DB_NAME RENAME TO $DB_NAME;'"
echo "4. Restart your application:"
echo "   cd $(pwd) && npm start"