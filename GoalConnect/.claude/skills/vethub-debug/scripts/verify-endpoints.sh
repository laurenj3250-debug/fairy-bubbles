#!/bin/bash
# VetHub Endpoint Verification Script
# Tests critical API endpoints to verify they're working

set -e

BASE_URL="${1:-http://localhost:3000}"
echo "🔍 Testing VetHub API endpoints at $BASE_URL"
echo "============================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    
    echo -n "Testing $method $endpoint... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ $status${NC}"
        return 0
    else
        echo -e "${RED}✗ Expected $expected_status, got $status${NC}"
        echo "  Response: $body"
        return 1
    fi
}

# Test critical endpoints
failed=0

test_endpoint "GET" "/api/patients" "200" || ((failed++))
test_endpoint "GET" "/api/tasks/general" "200" || ((failed++))
test_endpoint "GET" "/api/common/problems" "200" || ((failed++))
test_endpoint "GET" "/api/common/comments" "200" || ((failed++))
test_endpoint "GET" "/api/common/medications" "200" || ((failed++))

echo ""
echo "============================================"
if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All endpoints working!${NC}"
    exit 0
else
    echo -e "${RED}✗ $failed endpoint(s) failed${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Check DATABASE_URL in .env.local"
    echo "  - Verify Prisma migrations are up to date"
    echo "  - Check server logs for errors"
    exit 1
fi
