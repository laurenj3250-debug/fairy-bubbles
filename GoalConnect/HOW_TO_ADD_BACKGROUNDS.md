# How to Add Your Own Custom Backgrounds & Themes 🎨

Each mountain unlock can have its own gorgeous background image AND matching color theme!

---

## 📸 Step 1: Find Beautiful Mountain Images

### Recommended Free Sources:

**Unsplash** (https://unsplash.com)
- Search: "mountain sunset", "alpine peak", "himalaya", "summit view"
- All images are free to use
- High quality, professional photography

**Pexels** (https://pexels.com)
- Search: "mountain range", "snowy peak", "glacier", "alpine landscape"
- Completely free, no attribution required

**Your Own Photos!**
- Use photos from your own climbing adventures
- Makes it super personal and motivating

### Image Tips:
- **Resolution**: At least 1920x1080 (Full HD) for crisp display
- **Aspect Ratio**: 16:9 works best (landscape orientation)
- **File Format**: JPG or PNG (JPG preferred for smaller file size)
- **File Size**: Under 2MB is ideal (compress if needed at tinypng.com)
- **Subject**: Mountains, peaks, sunrise/sunset, glaciers, ridges

---

## 💾 Step 2: Save Your Image

1. Download your chosen image
2. Rename it something descriptive: `yosemite-sunset.jpg`, `denali-peak.jpg`, etc.
3. Save it to: `/client/public/backgrounds/your-image.jpg`

**Create the folder if it doesn't exist:**
```bash
mkdir -p /client/public/backgrounds
```

---

## 🎨 Step 3: Add Background + Theme to Config

Open `/client/src/themes/config.ts` and add your background:

```typescript
export const backgrounds: BackgroundConfig[] = [
  // ... existing backgrounds ...

  // YOUR NEW BACKGROUND
  {
    id: 'my-mountain',           // Unique ID (no spaces)
    name: 'Yosemite Half Dome',  // Display name
    image: '/backgrounds/yosemite-sunset.jpg',  // Your image path
    unlockStreak: 14,             // Days needed to unlock
    description: 'Two weeks of dedication!',
    timeOfDay: 'sunset',          // 'dawn', 'day', 'sunset', or 'night'
    themeId: 'myCustomTheme'      // Optional: link to custom theme
  }
];
```

---

## 🌈 Step 4: Create a Matching Theme (Optional but BEAUTIFUL!)

Scroll down in the same file to the "THEME PRESETS" section.

### Quick Method: Copy and Customize

```typescript
/**
 * MY CUSTOM THEME
 * Description of the vibe
 */
export const myCustomTheme: Theme = {
  name: 'My Custom Theme',
  colors: {
    // Pick colors from your image!
    background: '220 30% 25%',        // Dominant dark color
    foreground: '40 80% 95%',         // Light text color
    card: '220 25% 30%',              // Slightly lighter than background
    cardForeground: '40 80% 95%',

    primary: '200 70% 50%',           // Accent from image (blue, pink, etc.)
    primaryForeground: '220 30% 10%',

    secondary: '220 20% 35%',
    secondaryForeground: '40 80% 95%',

    accent: '30 90% 55%',             // Complementary accent
    accentForeground: '220 30% 10%',

    success: '142 71% 55%',
    successForeground: '220 30% 10%',
    warning: '38 92% 60%',
    warningForeground: '220 30% 10%',
    destructive: '0 84% 60%',
    destructiveForeground: '0 0% 100%',

    border: '220 15% 38%',
    input: '220 15% 38%',
    ring: '200 70% 50%',
    muted: '220 20% 32%',
    mutedForeground: '40 50% 75%'
  },
  spacing: {
    sectionGap: '1.5rem',
    cardPadding: '1.5rem',
    borderRadius: '0.75rem'
  },
  effects: {
    cardShadow: '0 4px 12px 0 rgb(0 0 0 / 0.15)',
    hoverScale: 1.02,
    transitionSpeed: '150ms'
  }
};
```

### Register Your Theme

Add it to the themes registry:

```typescript
export const themes = {
  mountainDusk: mountainDuskTheme,
  alpineMeadow: alpineMeadowTheme,
  sunsetPeak: sunsetPeakTheme,
  alpineDawn: alpineDawnTheme,
  glacierBlue: glacierBlueTheme,
  northernLights: northernLightsTheme,
  myCustomTheme: myCustomTheme,  // ← Add here!
};
```

---

## 🎨 How to Pick Colors from Your Image

### Method 1: Online Color Picker
1. Go to https://imagecolorpicker.com
2. Upload your mountain image
3. Click on different parts to get HSL values
4. Pick 2-3 main colors: dark (background), medium (primary), bright (accent)

### Method 2: Use a Design Tool
- Open image in Figma, Photoshop, or any design tool
- Use eyedropper tool
- Convert RGB to HSL using https://htmlcolors.com/rgb-to-hsl

### Example Color Picking Process:

**Image: Sunset over pink mountains**
1. **Background**: Deep purple-pink from shadowed mountain → `340 35% 20%`
2. **Primary**: Bright pink from lit peaks → `340 82% 60%`
3. **Accent**: Golden orange from sun → `25 95% 63%`
4. **Foreground**: Warm cream for text → `40 90% 95%`

---

## 🖼️ Real Examples

### Example 1: Patagonia Blue Hour
```typescript
{
  id: 'patagonia-blue',
  name: 'Patagonia Blue Hour',
  image: '/backgrounds/patagonia.jpg',
  unlockStreak: 45,
  description: 'Six weeks of climbing!',
  timeOfDay: 'night',
  themeId: 'patagoniaNight'
}

// Theme with deep blues and purples
export const patagoniaNightTheme: Theme = {
  name: 'Patagonia Night',
  colors: {
    background: '230 40% 18%',     // Deep midnight blue
    foreground: '200 80% 95%',     // Ice-blue white
    primary: '200 80% 55%',        // Glacier blue
    accent: '260 70% 60%',         // Purple twilight
    // ... etc
  }
};
```

### Example 2: Desert Mountain Sunrise
```typescript
{
  id: 'desert-sunrise',
  name: 'Desert Mountain Dawn',
  image: '/backgrounds/desert-peaks.jpg',
  unlockStreak: 60,
  description: 'Two months strong!',
  timeOfDay: 'dawn',
  themeId: 'desertDawn'
}

// Theme with warm oranges and reds
export const desertDawnTheme: Theme = {
  name: 'Desert Dawn',
  colors: {
    background: '20 40% 20%',      // Deep rust red
    foreground: '35 90% 95%',      // Warm sand white
    primary: '15 90% 55%',         // Sunrise orange
    accent: '340 80% 60%',         // Hot pink
    // ... etc
  }
};
```

---

## ✅ Step 5: Test Your Changes

```bash
# Build to check for errors
npm run build

# Run locally
npm run dev

# Visit http://localhost:5173
```

Your new background + theme will automatically activate when you reach that streak!

---

## 🎁 Pre-Made Theme Color Palettes

Copy these ready-to-use color schemes:

### Emerald Forest
```typescript
background: '150 35% 20%'    // Deep forest green
primary: '140 70% 50%'       // Bright emerald
accent: '60 90% 55%'         // Golden yellow
```

### Lavender Peaks
```typescript
background: '270 30% 22%'    // Deep purple-gray
primary: '280 60% 60%'       // Lavender
accent: '320 80% 65%'        // Pink
```

### Copper Canyon
```typescript
background: '20 40% 20%'     // Deep rust
primary: '25 85% 55%'        // Copper orange
accent: '40 90% 60%'         // Gold
```

### Arctic Ice
```typescript
background: '200 40% 18%'    // Deep ice blue
primary: '190 90% 50%'       // Bright cyan
accent: '210 100% 60%'       // Electric blue
```

---

## 💡 Pro Tips

1. **Match the vibe**: Pick dark, moody colors for night scenes, bright for day
2. **Contrast is key**: Make sure text is readable (foreground vs background)
3. **Test on mobile**: Colors look different on small screens
4. **Seasonal themes**: Create spring (green), summer (blue), fall (orange), winter (white) sets
5. **Personal meaning**: Use photos from mountains you've actually climbed!

---

## 🔄 How the Auto-Switching Works

When you unlock a new background by reaching the streak:
1. `ProgressBackground` component detects your current streak
2. Finds the matching background from the array
3. Applies the linked theme automatically
4. Shows unlock notification 7 days before reaching it
5. Celebrates when you unlock it!

---

## 📋 Quick Checklist

- [ ] Found beautiful mountain image
- [ ] Saved to `/client/public/backgrounds/your-image.jpg`
- [ ] Added background entry to `backgrounds` array
- [ ] Created matching theme (optional)
- [ ] Registered theme in `themes` object
- [ ] Linked theme to background with `themeId`
- [ ] Ran `npm run build` to test
- [ ] Committed to git
- [ ] Pushed to Railway

---

## 🎉 Gallery Ideas

Build a collection! Some ideas:

**Famous Peaks:**
- Everest, K2, Denali, Matterhorn, Kilimanjaro

**Locations:**
- Alps, Rockies, Andes, Himalayas, Cascades

**Conditions:**
- Golden hour, blue hour, storm clouds, clear skies, northern lights

**Seasons:**
- Spring bloom, summer green, fall colors, winter snow

---

## 🚀 Share Your Themes!

Created an amazing theme? Share it:
1. Export your theme code
2. Take a screenshot
3. Share with the community!

Happy customizing! 🏔️✨
