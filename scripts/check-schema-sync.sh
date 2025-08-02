#!/bin/bash

# Schema sync checker script
# This script checks if sql/schema.sql and the SQL content in helm configmap are identical

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCHEMA_FILE="sql/schema.sql"
CONFIGMAP_FILE="helm/subscription-manager/templates/configmap.yaml"
TEMP_DIR=$(mktemp -d)
EXTRACTED_SQL="${TEMP_DIR}/extracted-schema.sql"
NORMALIZED_ORIGINAL="${TEMP_DIR}/normalized-original.sql"
NORMALIZED_EXTRACTED="${TEMP_DIR}/normalized-extracted.sql"

cleanup() {
    rm -rf "${TEMP_DIR}"
}
trap cleanup EXIT

echo -e "${YELLOW}Checking schema synchronization...${NC}"

# Check if files exist
if [[ ! -f "${SCHEMA_FILE}" ]]; then
    echo -e "${RED}Error: ${SCHEMA_FILE} not found${NC}"
    exit 1
fi

if [[ ! -f "${CONFIGMAP_FILE}" ]]; then
    echo -e "${RED}Error: ${CONFIGMAP_FILE} not found${NC}"
    exit 1
fi

# Extract SQL from ConfigMap
echo "Extracting SQL from ConfigMap..."
awk '/01-schema\.sql: \|/{flag=1; next} /^[[:space:]]*[a-zA-Z0-9_-]+:/{if(flag) exit} /^{{.*}}$/{if(flag) exit} flag' \
    "${CONFIGMAP_FILE}" | \
    sed 's/^    //' > "${EXTRACTED_SQL}"

if [[ ! -s "${EXTRACTED_SQL}" ]]; then
    echo -e "${RED}Error: Could not extract SQL from ConfigMap or extracted content is empty${NC}"
    exit 1
fi

# Normalize both files for comparison
normalize_sql() {
    local input_file="$1"
    local output_file="$2"
    
    # Remove empty lines, trim whitespace, normalize multiple spaces to single space
    # Also remove comments that are just whitespace
    grep -v '^[[:space:]]*$' "${input_file}" | \
    sed 's/^[[:space:]]*//' | \
    sed 's/[[:space:]]*$//' | \
    sed 's/[[:space:]]\+/ /g' | \
    grep -v '^--[[:space:]]*$' > "${output_file}"
}

echo "Normalizing files for comparison..."
normalize_sql "${SCHEMA_FILE}" "${NORMALIZED_ORIGINAL}"
normalize_sql "${EXTRACTED_SQL}" "${NORMALIZED_EXTRACTED}"

# Compare the normalized files
echo "Comparing schemas..."
if diff -u "${NORMALIZED_ORIGINAL}" "${NORMALIZED_EXTRACTED}" > /dev/null; then
    echo -e "${GREEN}✅ Schema files are in sync!${NC}"
    exit 0
else
    echo -e "${RED}❌ Schema files are out of sync!${NC}"
    echo ""
    echo "Differences found:"
    diff -u "${NORMALIZED_ORIGINAL}" "${NORMALIZED_EXTRACTED}" || true
    echo ""
    echo -e "${YELLOW}Please ensure that:${NC}"
    echo "1. The SQL content in ${SCHEMA_FILE}"
    echo "2. The SQL content in ${CONFIGMAP_FILE} under '01-schema.sql: |'"
    echo "3. Are identical"
    echo ""
    echo "You can use this script to check: ./scripts/check-schema-sync.sh"
    exit 1
fi
