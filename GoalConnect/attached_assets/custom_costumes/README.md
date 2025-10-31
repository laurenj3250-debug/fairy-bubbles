# Custom Costumes 🎨

**Drop your costume images here and they'll automatically appear in the shop!**

## ✨ How It Works

This folder lets you add custom costumes to Gremlin Dashboard without touching any code!

1. **Drop your image** into this folder (PNG, JPG, etc.)
2. **Edit `costumes.json`** to add costume details  
3. **Restart the app** - your costume appears in the shop!
4. **Purchase & equip** - works exactly like the built-in costumes!

## 🖼️ Image Guidelines

**Best Practices:**
- **Transparent backgrounds** work best for layering on the cat
- **Recommended size**: 512x512px or larger
- **File format**: PNG (for transparency), JPG, or any web image

**Categories & Positioning:**
Your costume's category determines where it appears on the cat:
- `"hat"`: On top of the head (party hats, crowns, etc.)
- `"accessory"`: Face/eye level (sunglasses, masks, etc.)
- `"outfit"`: Body area (capes, clothes, etc.)

## 📝 Configuring Costumes

Edit `costumes.json` as an array of costume objects:

```json
[
  {
    "name": "Vampire Costume",
    "description": "Complete vampire outfit with cape and top hat",
    "category": "outfit",
    "price": 60,
    "imageFile": "vampire_full_costume.png",
    "rarity": "epic"
  },
  {
    "name": "Pirate Hat",
    "description": "Arr matey! A classic pirate tricorn",
    "category": "hat",
    "price": 80,
    "imageFile": "pirate_hat.png",
    "rarity": "rare"
  }
]
```

### Field Reference

| Field | Type | Description | Options |
|-------|------|-------------|---------|
| `name` | string | Display name in shop | Any text |
| `description` | string | Short description | Any text |
| `category` | string | Where it appears on cat | `"hat"`, `"accessory"`, `"outfit"` |
| `price` | number | Cost in points | Any number (e.g., 60, 120, 200) |
| `imageFile` | string | Your image filename | Must match file in this folder |
| `rarity` | string | Visual style & badge color | `"common"` (gray), `"rare"` (blue), `"epic"` (purple) |

## 🔧 Technical Details

**Behind the Scenes:**
- Custom costumes load dynamically from `costumes.json`
- First purchase imports costume to database
- Future uses work identically to built-in costumes
- Changes require app restart to take effect

**Current Example:**
The `vampire_full_costume.png` is your uploaded vampire image, configured as an epic outfit costume for 60 points!

## 💡 Tips

- **Start cheap** - Test with low-price costumes (10-50 points)
- **Multiple images** - You can have as many costumes as you want!
- **Mix & match** - Combine hats, accessories, and outfits
- **Rarity matters** - Epic costumes get purple badges and stand out more

Happy costume creating! 🎉
