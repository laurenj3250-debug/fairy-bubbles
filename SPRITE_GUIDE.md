# 🎨 Sprite Asset Guide - Fairy Bubbles RPG

This guide explains where to place your sprite assets for the D&D-flavored creature collector RPG.

## 📁 Folder Structure

```
GoalConnect/client/public/sprites/
├── creatures/     # Creature sprites (64x64 px)
├── biomes/        # Background images (1920x1080)
├── items/         # Item icons (32x32 or 48x48 px)
└── ui/            # UI elements & icons (24x24 to 64x64 px)
```

Each folder contains a `README.md` with detailed specifications.

## 🎮 What You Need

### Priority 1: Core Creatures (8 total)
These are seeded in the database and need sprites ASAP:
- `mossbun.png` - Garden Glade starter
- `teafox.png` - Garden Glade starter
- `glowmoth.png` - Garden Glade uncommon
- `pondskipper.png` - Moonlit River
- `lunafish.png` - Moonlit River
- `emberspark.png` - Ember Orchard
- `flamebat.png` - Ember Orchard
- `wonderphant.png` - Epic rare creature

### Priority 2: Biome Backgrounds (5 total)
- `biome-garden.png` - Garden Glade (always unlocked)
- `biome-river.png` - Moonlit River (Level 3)
- `biome-ember.png` - Ember Orchard (Level 5)
- `biome-dunes.png` - Zephyr Dunes (Level 7)
- `biome-clockwork.png` - Clockwork Garden (Level 9)

### Priority 3: Essential Items (8 total)
- `snack.png` - Heal item
- `basic-net.png` - Common capture tool
- `rare-net.png` - Rare capture tool
- `wisdom-charm.png` - +1 WIS
- `dexterity-charm.png` - +1 DEX
- `guard-brace.png` - Defense item
- `evasion-cloak.png` - Dodge item
- `evolution-gear.png` - Evolution item

### Priority 4: UI Elements
- Combat action icons (attack, skill, item, defend, capture)
- Stat icons (HP, STR, DEX, WIS)
- Element/tag icons (Water, Fire, Beast, Mystic)
- d20 dice icon for combat rolls

## 🎨 Art Style Recommendations

**Creatures:**
- Pixel art, 64x64 base resolution
- Transparent backgrounds
- Cute & whimsical (similar to Crumpet's vibe)
- Distinct silhouettes for easy recognition

**Biomes:**
- Painted or illustrated style
- Atmospheric and immersive
- Distinct color palettes per biome
- HD resolution (1920x1080 minimum)

**Items:**
- Simple icon style
- Clear at small sizes
- Color-coded by rarity
- Consistent style across all items

## 🔗 Database References

Sprite URLs are stored in the database:
- `creature_species.sprite_url` → `/sprites/creatures/mossbun.png`
- `biomes.background_sprite` → `/sprites/biomes/biome-garden.png`
- Items don't have sprite_url yet (TODO: add to items table)

## 📦 Using Sprite Packs

If you have sprite packs you want to use:
1. Extract sprites to appropriate folders
2. Rename to match naming convention
3. Update database seed data in migration file if names differ
4. Consider creating variants (idle, attack, captured animations)

## 🚀 Quick Start

1. **Add your sprites to the folders**
2. **Run the migration** (creates tables + seeds data):
   ```bash
   # Migration will be run automatically on next server start
   ```

3. **Test sprites** by viewing creatures in the compendium
4. **Iterate** - replace placeholder sprites as you create better ones

## 🎯 Next Steps

Once sprites are in place, the system will:
- Display creatures in battle
- Show biome backgrounds during encounters
- Render items in inventory
- Use UI icons in combat interface

---

**Note:** You can start with placeholder sprites (simple colored squares with text) and replace them incrementally!
