#!/bin/bash

# GoalConnect - Authenticated Browser Launcher
# Quick helper to launch browsers with saved authentication

set -e

# Configuration
AUTH_FILE="playwright/.auth/user.json"
BASE_URL="${BASE_URL:-http://localhost:5000}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if auth file exists
if [ ! -f "$AUTH_FILE" ]; then
    echo -e "${YELLOW}⚠️  Auth file not found at $AUTH_FILE${NC}"
    echo -e "${BLUE}Running auth setup first...${NC}"
    npx playwright test tests/auth.setup.ts
    echo ""
fi

# Parse command line arguments
MODE="${1:-codegen}"
VIEWPORT="${2:-desktop}"

# Viewport presets
case $VIEWPORT in
    desktop)
        VIEWPORT_SIZE="1440,900"
        ;;
    tablet)
        VIEWPORT_SIZE="768,1024"
        ;;
    mobile)
        VIEWPORT_SIZE="375,667"
        ;;
    *)
        VIEWPORT_SIZE="$VIEWPORT"
        ;;
esac

echo -e "${GREEN}🚀 GoalConnect Authenticated Browser${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Mode:     ${YELLOW}$MODE${NC}"
echo -e "Viewport: ${YELLOW}$VIEWPORT_SIZE${NC}"
echo -e "URL:      ${YELLOW}$BASE_URL${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

case $MODE in
    codegen)
        echo -e "${GREEN}📝 Launching Codegen Mode (with inspector)${NC}"
        npx playwright codegen \
            --load-storage="$AUTH_FILE" \
            --viewport-size="$VIEWPORT_SIZE" \
            "$BASE_URL"
        ;;

    debug)
        echo -e "${GREEN}🐛 Launching Debug Mode${NC}"
        npx playwright test --debug \
            --project=chromium
        ;;

    headed)
        echo -e "${GREEN}👁️  Launching Headed Test Mode${NC}"
        npx playwright test --headed \
            --project=chromium
        ;;

    ui)
        echo -e "${GREEN}🎨 Launching UI Mode${NC}"
        npx playwright test --ui
        ;;

    screenshot)
        echo -e "${GREEN}📸 Taking screenshots of all pages${NC}"
        npm run screenshot
        ;;

    *)
        echo -e "${RED}❌ Unknown mode: $MODE${NC}"
        echo ""
        echo -e "${YELLOW}Usage:${NC}"
        echo "  $0 [mode] [viewport]"
        echo ""
        echo -e "${YELLOW}Modes:${NC}"
        echo "  codegen     - Interactive browser with code generation (default)"
        echo "  debug       - Debug mode with step-through"
        echo "  headed      - Run tests with visible browser"
        echo "  ui          - Launch Playwright UI mode"
        echo "  screenshot  - Capture all pages"
        echo ""
        echo -e "${YELLOW}Viewports:${NC}"
        echo "  desktop     - 1440x900 (default)"
        echo "  tablet      - 768x1024"
        echo "  mobile      - 375x667"
        echo "  WxH         - Custom (e.g., 1920,1080)"
        echo ""
        echo -e "${YELLOW}Examples:${NC}"
        echo "  $0 codegen mobile"
        echo "  $0 ui"
        echo "  $0 screenshot"
        echo "  $0 codegen 1920,1080"
        exit 1
        ;;
esac
