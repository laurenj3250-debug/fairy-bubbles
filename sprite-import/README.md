# 🎨 Sprite Import - Easy Drop Zone

## How to Use

### 1. Drop your sprites here:
```
sprite-import/unsorted/
```

Just dump ALL your sprite pack files into the `unsorted/` folder. I'll handle the rest!

### 2. Tell me what you have:
When you're ready, just say:
- "I added sprites, can you organize them?"
- "Sort the sprites I uploaded"
- "Process sprite-import folder"

### 3. I'll automatically:
- ✅ Identify what each sprite is (creature, biome, item, UI)
- ✅ Resize if needed
- ✅ Rename to match database conventions
- ✅ Move to correct `/sprites/` folders
- ✅ Update database with sprite URLs
- ✅ Generate a report of what was processed

## Supported Formats
- PNG (preferred, with transparency)
- JPG/JPEG (for backgrounds)
- SVG (I'll convert to PNG)
- GIF (I'll extract first frame)

## What I Look For
I'll use filename patterns and image analysis to categorize:
- **Creatures**: animals, monsters, characters
- **Biomes**: large landscapes, backgrounds
- **Items**: small icons, equipment, tools
- **UI**: buttons, icons, decorative elements

## Example

**You drop:**
```
unsorted/
├── cute_rabbit_32x32.png
├── forest_background_1920x1080.jpg
├── potion_icon.png
├── attack_button.png
└── fire_dragon_sprite.png
```

**I organize to:**
```
GoalConnect/client/public/sprites/
├── creatures/
│   ├── cute-rabbit.png       # Renamed, categorized
│   └── fire-dragon.png
├── biomes/
│   └── forest-background.png
├── items/
│   └── potion-icon.png
└── ui/
    └── attack-button.png
```

## Pro Tips
- Don't worry about organization - just dump everything!
- Include descriptive filenames if possible (helps me categorize)
- Mix of styles is fine - I'll handle consistency
- If unsure about a sprite, I'll ask you what it should be

---

**Ready?** Drop your sprites in `unsorted/` and ping me!
