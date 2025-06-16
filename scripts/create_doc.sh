#!/bin/bash

if [ $# -lt 2 ]; then
  echo "Usage: $0 <document-title> <document-filename>"
  echo "Example: $0 'Getting Started Guide' getting-started.md"
  exit 1
fi

TITLE=$1
FILENAME=$2

echo "========================================"
echo "VeloFlux Documentation Creator"
echo "========================================"
echo ""

ROOT_DIR="/workspaces/VeloFlux"
DOCS_DIR="$ROOT_DIR/docs"

# Create the document
cat > "${DOCS_DIR}/${FILENAME}" << EOL
# ${TITLE}

_Created: $(date +"%Y-%m-%d")_
_Last updated: $(date +"%Y-%m-%d")_

## Overview

[Add a brief description here about what this document covers]

## Contents

- [Section 1](#section-1)
- [Section 2](#section-2)
- [Section 3](#section-3)

## Section 1

[Content for section 1]

## Section 2

[Content for section 2]

## Section 3

[Content for section 3]

---

## Related Documentation

- [Link to related document 1](./related-doc-1.md)
- [Link to related document 2](./related-doc-2.md)
EOL

echo "✅ Created new documentation: ${DOCS_DIR}/${FILENAME}"
echo ""
echo "Next steps:"
echo "1. Edit the file to add your content"
echo "2. Add a link to this document in the main README.md or relevant index page"
echo ""
