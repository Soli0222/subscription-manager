#!/bin/bash

# Schema synchronization script
# This script updates the ConfigMap with the content from schema.sql

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCHEMA_FILE="sql/schema.sql"
CONFIGMAP_FILE="helm/subscription-manager/templates/configmap.yaml"
TEMP_FILE=$(mktemp)

cleanup() {
    rm -f "${TEMP_FILE}"
}
trap cleanup EXIT

echo -e "${YELLOW}Synchronizing schema from ${SCHEMA_FILE} to ${CONFIGMAP_FILE}...${NC}"

# Check if files exist
if [[ ! -f "${SCHEMA_FILE}" ]]; then
    echo -e "${RED}Error: ${SCHEMA_FILE} not found${NC}"
    exit 1
fi

if [[ ! -f "${CONFIGMAP_FILE}" ]]; then
    echo -e "${RED}Error: ${CONFIGMAP_FILE} not found${NC}"
    exit 1
fi

# Create the new ConfigMap content
echo "Creating updated ConfigMap..."

# Extract everything before the SQL content
awk '/01-schema\.sql: \|/{print; exit} {print}' "${CONFIGMAP_FILE}" > "${TEMP_FILE}"

# Add the SQL content with proper indentation
while IFS= read -r line; do
    echo "    $line" >> "${TEMP_FILE}"
done < "${SCHEMA_FILE}"

# Extract everything after the SQL content (the {{- end }} part)
awk '/01-schema\.sql: \|/{flag=1; next} /^{{.*}}$/{if(flag) {print; flag=0}} !flag' "${CONFIGMAP_FILE}" >> "${TEMP_FILE}"

# Replace the original file
mv "${TEMP_FILE}" "${CONFIGMAP_FILE}"

echo -e "${GREEN}✅ ConfigMap has been updated with the content from ${SCHEMA_FILE}${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the changes: git diff ${CONFIGMAP_FILE}"
echo "2. Commit the changes if they look correct"
echo "3. Run ./scripts/check-schema-sync.sh to verify synchronization"
