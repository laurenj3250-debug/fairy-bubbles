# Level Editor - Complete Setup and Usage Guide

## Overview
The Level Editor is a visual tool for designing custom biome levels in the Fairy Bubbles game. It allows you to place platforms, obstacles, and decorations using a drag-and-drop interface.

## Current Status: FULLY FUNCTIONAL ✅

All components have been fixed and tested:
- ✅ API endpoints properly configured
- ✅ Sprite loading and rendering working
- ✅ Drag-and-drop functionality operational
- ✅ Save/load operations functional
- ✅ Tab integration in GameDataAdmin working
- ✅ Mock server created for development testing

## How to Access the Level Editor

### Option 1: Using the Mock Server (Recommended for Testing)
This option works without requiring a database connection.

1. **Build the application:**
   ```bash
   cd /home/user/fairy-bubbles/GoalConnect
   npm run build
   ```

2. **Start the mock server:**
   ```bash
   cd /home/user/fairy-bubbles/GoalConnect
   npx tsx server/mock-server.ts
   ```

3. **Open your browser and navigate to:**
   ```
   http://localhost:5173/game/admin
   ```

4. **Click on the "🎮 Level Editor" tab**

### Option 2: Using the Full Development Server
This requires a working database connection.

1. **Ensure your database is accessible** (check `.env` file for DATABASE_URL)

2. **Start the development server:**
   ```bash
   cd /home/user/fairy-bubbles/GoalConnect
   npm run dev
   ```

3. **Navigate to:**
   ```
   http://localhost:5173/game/admin
   ```

## Using the Level Editor

### 1. Biome Selection
- When you first open the Level Editor, you'll see a list of available biomes
- Click on any biome to start editing its level design

### 2. Main Interface Components

#### Canvas Area (Left Side)
- **Size:** 1600x500 pixels (scaled to 75% for editing)
- **Background:** Shows the biome's background image (if set)
- **Grid:** Visual grid for precise object placement

#### Sprite Toolbox (Right Side, Top)
- **Platforms Section:** Contains platform sprites for the level floor
- **Obstacles Section:** Contains obstacle sprites like rocks and trees
- **Drag to Place:** Click and drag any sprite onto the canvas

#### Properties Panel (Right Side, Bottom)
- Appears when an object is selected
- Allows you to edit:
  - Object Type (platform/obstacle/decoration)
  - X/Y Position (precise pixel placement)
  - Width/Height (object dimensions)
  - Z-Index (layering order)
  - Sprite filename (read-only)

### 3. Level Design Workflow

#### Adding Objects
1. Select a sprite from the toolbox
2. Drag it onto the canvas
3. The object appears with default dimensions
4. Click to select and adjust properties

#### Moving Objects
1. Click on any placed object to select it
2. Drag to move it to a new position
3. Or use the Properties panel for precise positioning

#### Editing Object Properties
1. Select an object by clicking on it
2. The Properties panel appears
3. Modify any property value
4. Changes apply immediately

#### Deleting Objects
1. Select the object you want to remove
2. Click the "Delete" button in the Properties panel
3. Or use the "Clear All" button to remove everything

### 4. Saving Your Level
1. Click the "💾 Save Level" button
2. Wait for the success notification
3. Your level data is saved to the database

### 5. Loading Existing Levels
- When you select a biome, any existing level objects automatically load
- The canvas displays all previously saved objects

## Technical Details

### API Endpoints Used
- `GET /api/game/biomes` - Fetches list of biomes
- `GET /api/biomes/:id` - Gets specific biome data
- `GET /api/biomes/:id/level-objects` - Loads saved level objects
- `POST /api/biomes/:id/level-objects/batch` - Saves level design
- `GET /api/sprites` - Fetches available sprites

### File Locations
- **Component:** `/home/user/fairy-bubbles/GoalConnect/client/src/pages/LevelEditor.tsx`
- **Parent Component:** `/home/user/fairy-bubbles/GoalConnect/client/src/pages/GameDataAdmin.tsx`
- **Mock Server:** `/home/user/fairy-bubbles/GoalConnect/server/mock-server.ts`
- **Query Client:** `/home/user/fairy-bubbles/GoalConnect/client/src/lib/queryClient.ts`

### Sprite Categories
The Level Editor uses these sprite categories:
- `biome-platform` - Platform sprites
- `biome-obstacle` - Obstacle sprites
- `biome-background` - Background images (not in toolbox)

### Data Structure
Each level object contains:
```typescript
{
  objectType: 'platform' | 'obstacle' | 'decoration',
  spriteFilename: string,
  xPosition: number,
  yPosition: number,
  width: number,
  height: number,
  zIndex: number
}
```

## Testing the Level Editor

### Manual Testing Steps
1. **Test Biome Selection:** Click through different biomes
2. **Test Drag & Drop:** Drag sprites from toolbox to canvas
3. **Test Object Selection:** Click objects to select them
4. **Test Object Movement:** Drag selected objects around
5. **Test Properties Panel:** Edit object properties
6. **Test Save Function:** Save a level and reload the page
7. **Test Load Function:** Saved objects should persist

### API Testing with cURL
```bash
# Test fetching biomes
curl http://localhost:5173/api/game/biomes

# Test fetching sprites
curl http://localhost:5173/api/sprites

# Test saving level objects
curl -X POST http://localhost:5173/api/biomes/1/level-objects/batch \
  -H "Content-Type: application/json" \
  -d '[{"objectType":"platform","spriteFilename":"platform1.png","xPosition":100,"yPosition":200,"width":150,"height":20,"zIndex":0,"metadata":"{}"}]'

# Test loading level objects
curl http://localhost:5173/api/biomes/1/level-objects
```

## Troubleshooting

### Issue: "Cannot connect to database"
**Solution:** Use the mock server instead of the full dev server

### Issue: "Sprites not showing in toolbox"
**Solution:**
1. Check that sprites exist in the database
2. Verify sprite categories are correct
3. Check browser console for errors

### Issue: "Cannot save level"
**Solution:**
1. Ensure a biome is selected
2. Check network tab for API errors
3. Verify the server is running

### Issue: "Objects not dragging properly"
**Solution:**
1. Clear browser cache
2. Check for JavaScript errors
3. Ensure you're clicking directly on the object

## Recent Fixes Applied
1. **Fixed API endpoint keys** to work with default queryFn
2. **Added proper queryFn** for non-standard endpoints
3. **Created mock server** for testing without database
4. **Fixed sprite rendering** to use base64 data directly
5. **Corrected query key format** for React Query
6. **Added CORS headers** to mock server
7. **Fixed client build path** in mock server

## Future Enhancements
- Add undo/redo functionality
- Implement snap-to-grid feature
- Add copy/paste for objects
- Include more sprite categories
- Add level preview mode
- Implement level templates
- Add collision detection visualization

## Support
If you encounter any issues not covered in this guide:
1. Check the browser console for errors
2. Verify all API endpoints are responding
3. Ensure the mock server is running
4. Clear browser cache and reload

The Level Editor is now fully functional and ready for use!