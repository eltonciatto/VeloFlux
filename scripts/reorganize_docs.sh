#!/bin/bash

echo "========================================"
echo "VeloFlux Documentation Reorganization"
echo "========================================"
echo ""

ROOT_DIR="/workspaces/VeloFlux"
DOCS_DIR="$ROOT_DIR/docs"
BACKUP_DIR="$ROOT_DIR/docs/archive"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"
echo "✅ Created backup directory at $BACKUP_DIR"

# List of markdown files to process
MD_FILES=(
  "AGENTS.md"
  "COMMERCIAL_LICENSE.md"
  "COMPREHENSIVE_ANALYSIS.md" 
  "DEPLOYMENT_SUCCESS.md"
  "HEADER.md"
  "LANCAMENTO_COMPLETO.md"
  "PRODUCAO_ROBUSTA.md"
  "QUICK_START.md"
  "README-EN.md"
  "ROUTING_FIXES.md"
  "SSH_ONELINERS.md"
  "TRANSLATION_FINAL_REPORT.md"
  "VPS_ANALYSIS_FINAL_REPORT.md"
  "VPS_STATUS_FINAL.md"
)

# Empty or sensitive files that should be deleted
EMPTY_FILES=(
  "SSH_ONELINERS.md"
)

# Process each markdown file
for file in "${MD_FILES[@]}"; do
  if [ -f "$ROOT_DIR/$file" ]; then
    # Check if file is empty
    if [ ! -s "$ROOT_DIR/$file" ]; then
      echo "🗑️  Removing empty file: $file"
      rm "$ROOT_DIR/$file"
    else
      # Check if we should delete this file
      if [[ " ${EMPTY_FILES[@]} " =~ " ${file} " ]]; then
        echo "🗑️  Removing file with sensitive/empty content: $file"
        rm "$ROOT_DIR/$file"
      else
        # Move the file to docs directory
        echo "📦 Moving $file to docs/"
        cp "$ROOT_DIR/$file" "$DOCS_DIR/$(echo $file | tr '[:upper:]' '[:lower:]')"
        # Create a backup
        cp "$ROOT_DIR/$file" "$BACKUP_DIR/$file"
        # Remove the original
        rm "$ROOT_DIR/$file"
      fi
    fi
  else
    echo "⚠️  File not found: $file"
  fi
done

# Special handling for README.md - create a symlink
if [ -f "$ROOT_DIR/README.md" ]; then
  echo "📦 Processing README.md"
  cp "$ROOT_DIR/README.md" "$DOCS_DIR/readme.md"
  cp "$ROOT_DIR/README.md" "$BACKUP_DIR/README.md"
  # We don't remove the original README.md as it's required at the root
fi

echo ""
echo "✅ Documentation reorganization complete!"
echo "✅ All files have been moved to $DOCS_DIR"
echo "✅ Backups stored in $BACKUP_DIR"
echo ""
