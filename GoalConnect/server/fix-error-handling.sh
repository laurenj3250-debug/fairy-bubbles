#!/bin/bash

# Script to fix error handling patterns in routes.ts
# Replaces: catch (error: any) -> catch (error)
# And adds proper error logging

FILE="/Users/laurenjohnston/fairy-bubbles/GoalConnect/server/routes.ts"

# Backup original file
cp "$FILE" "$FILE.bak"

# Replace all occurrences of 'catch (error: any)' with 'catch (error)'
sed -i '' 's/catch (error: any)/catch (error)/g' "$FILE"

echo "Fixed error handling patterns in routes.ts"
echo "Backup created at routes.ts.bak"
