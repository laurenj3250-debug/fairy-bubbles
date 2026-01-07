# Lauren's Advanced Organic React Native Design System

**Personal design system for building sophisticated, meditation-app-style React Native applications with organic shapes, smooth animations, and modern visual design.**

## When to Use This Skill

- Building React Native apps that need a polished, modern aesthetic (wellness, lifestyle, relationship apps)
- Creating apps with organic, flowing design inspired by meditation apps
- Implementing sophisticated animations and visual effects
- Need React Native equivalents of shadcn/ui, pattern.css, blobity, motion
- Building apps like Sugarbum (relationship tracking), wellness apps, social apps
- Need advanced Reanimated 2 animations, SVG patterns, gradient effects

## Lauren's Design Preferences

**Hard Requirements:**
- ❌ NO generic Claude styling - must be unique and sophisticated
- ❌ NO emojis unless explicitly requested - use proper icons/illustrations
- ✅ MUST look like it took hours to craft - high visual polish
- ✅ Meditation app aesthetic - soft, organic, calming
- ✅ Visible design elements - blob shapes at 0.25+ opacity, not invisible
- ✅ Layered backgrounds - waves + patterns + animated blobs
- ✅ Professional branding - custom naming (e.g., "Sugarbum" not "App")
- ✅ Reanimated 2 for all animations - smooth, performant, native

**Advanced Features to Include:**
- Complex SVG patterns and morphing shapes
- Multi-layer parallax effects
- Gesture-based interactions
- Spring physics animations
- Skeleton loading states
- Micro-interactions with haptics
- Advanced gradient compositions
- Glassmorphism effects
- Dynamic theming system

## Design Philosophy

### Visual Aesthetic
- **Soft, organic shapes**: Blob-style cards, rounded corners, flowing SVG paths
- **Muted, sophisticated colors**: Dusty rose, sage green, deep navy, cream backgrounds
- **Layered backgrounds**: Wave patterns, dot grids, geometric textures
- **Gentle animations**: Pulsing blobs, smooth transitions, spring physics
- **Clean typography**: Clear hierarchy, readable text, minimal clutter

### Color Palette Template
```javascript
export const colors = {
  // Primary Colors
  primary: '#E8A89A',      // Dusty rose (or your brand color)
  secondary: '#5C8D7E',    // Sage green (or complementary)
  accent: '#3D3B5E',       // Deep navy (for text/CTAs)
  background: '#FFF9F5',   // Cream/warm white

  // Secondary Palette
  soft1: '#F5B5A8',        // Coral pink
  soft2: '#4A9B8E',        // Teal
  soft3: '#C8BFE7',        // Light lavender
  soft4: '#F5D491',        // Warm yellow

  // Neutrals
  offWhite: '#FEFCF9',
  lightGray: '#E8E6E3',
  mediumGray: '#A8A6A3',
  charcoal: '#4A4948',
  deepNavy: '#3D3B5E',
};
```

## Required Dependencies

Install these packages for full functionality:

```bash
npm install react-native-svg expo-linear-gradient react-native-reanimated
```

For Expo projects, ensure `expo-linear-gradient` is installed. For bare React Native, use `react-native-linear-gradient`.

## Core Components to Create

### 1. Theme System (`src/theme/`)

Create a centralized theme with:
- **colors.js** - Full color palette
- **typography.js** - Font sizes, weights, text styles
- **spacing.js** - 4px grid spacing, border radius, shadows
- **index.js** - Export all theme values

Example structure:
```javascript
// src/theme/spacing.js
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16,
  xl: 24, '2xl': 32, '3xl': 48, '4xl': 64,
};

export const borderRadius = {
  small: 12,
  medium: 20,
  large: 28,
  round: 9999,
};

export const shadows = {
  level1: {
    shadowColor: '#3D3B5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  level2: { /* deeper shadow */ },
  level3: { /* deepest shadow */ },
};
```

### 2. BlobCard Component

Create organic-shaped cards with SVG blob backgrounds:

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import theme from '../theme';

export const BlobCard = ({ children, colors: gradientColors, style }) => {
  const defaultGradient = [theme.colors.primary, theme.colors.soft1];

  return (
    <View style={[styles.container, style]}>
      {/* Blob shape background */}
      <View style={StyleSheet.absoluteFill}>
        <Svg viewBox="0 0 200 200" style={StyleSheet.absoluteFill}>
          <Path
            d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,39.8,76.8C25.8,84.6,8.8,87.6,-7.2,87.4C-23.2,87.2,-38.4,83.8,-51.8,75.8C-65.2,67.8,-76.8,55.2,-83.6,40.2C-90.4,25.2,-92.4,7.8,-89.8,-8.4C-87.2,-24.6,-80,-39.6,-69.4,-51.8C-58.8,-64,-44.8,-73.4,-29.6,-79.8C-14.4,-86.2,1.8,-89.6,17.2,-87.4C32.6,-85.2,47.2,-77.4,44.7,-76.4Z"
            fill={gradientColors?.[0] || defaultGradient[0]}
            opacity={0.25}
          />
        </Svg>
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    ...theme.shadows.level1,
  },
  content: {
    padding: theme.spacing.xl,
  },
});
```

**Generate more blob paths at**: https://www.blobmaker.app/

### 3. AnimatedBlob Component

Create floating, pulsing blob shapes using Reanimated 2:

```javascript
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import theme from '../theme';

export const AnimatedBlob = ({
  color = theme.colors.primary,
  size = 200,
  opacity = 0.2,
  style
}) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.96, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const blobPath = "M47.3,-76.9C59.9,-68.7,67.8,-53.2,74.2,-37.5C80.6,-21.8,85.5,-5.9,84.1,9.3C82.7,24.5,75.1,38.9,64.8,49.8C54.5,60.7,41.5,68.1,27.6,72.8C13.7,77.5,-1.2,79.5,-15.8,76.8C-30.4,74.1,-44.7,66.7,-56.2,55.4C-67.7,44.1,-76.4,29,-80.4,12.4C-84.4,-4.2,-83.7,-22.3,-76.9,-37.2C-70.1,-52.1,-57.2,-63.8,-42.8,-71.3C-28.4,-78.8,-12.6,-82.1,2.8,-86.7C18.2,-91.3,34.7,-85.1,47.3,-76.9Z";

  return (
    <Animated.View
      style={[
        styles.container,
        { width: size, height: size },
        animatedStyle,
        style,
      ]}
      pointerEvents="none"
    >
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Path d={blobPath} fill={color} opacity={opacity} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute' },
});
```

### 4. WavePattern Component

Create flowing wave backgrounds:

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import theme from '../theme';

export const WavePattern = ({
  color = theme.colors.primary,
  opacity = 0.1
}) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 1440 320">
        <Path
          d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          fill={color}
          opacity={opacity}
        />
      </Svg>
    </View>
  );
};
```

### 5. PatternBackground Component

Create decorative pattern backgrounds (dots, grid, zigzag, etc.):

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';
import theme from '../theme';

export const PatternBackground = ({
  pattern = 'dots',
  color = theme.colors.primary,
  opacity = 0.1,
  size = 'medium'
}) => {
  const sizes = { small: 20, medium: 40, large: 60 };
  const gridSize = sizes[size];
  const strokeWidth = size === 'small' ? 1 : size === 'medium' ? 1.5 : 2;

  const renderPattern = () => {
    switch (pattern) {
      case 'dots':
        return (
          <Circle
            cx={gridSize / 2}
            cy={gridSize / 2}
            r={gridSize / 8}
            fill={color}
            opacity={opacity}
          />
        );

      case 'grid':
        return (
          <>
            <Line x1="0" y1={gridSize/2} x2={gridSize} y2={gridSize/2}
                  stroke={color} strokeWidth={strokeWidth} opacity={opacity} />
            <Line x1={gridSize/2} y1="0" x2={gridSize/2} y2={gridSize}
                  stroke={color} strokeWidth={strokeWidth} opacity={opacity} />
          </>
        );

      // Add more patterns: diagonal-lines, cross-dots, triangles, zigzag
      default:
        return null;
    }
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        {renderPattern()}
      </Svg>
    </View>
  );
};
```

### 6. GentleButton Component

Create buttons with haptic feedback and smooth styling:

```javascript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Vibration } from 'react-native';
import theme from '../theme';

export const GentleButton = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style
}) => {
  const handlePress = () => {
    Vibration.vibrate(10);
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.button,
        styles[variant],
        styles[size],
        style
      ]}
    >
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  soft: {
    backgroundColor: theme.colors.primary,
  },
  medium: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  large: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing['2xl'],
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
  primaryText: {
    color: theme.colors.offWhite,
  },
  secondaryText: {
    color: theme.colors.accent,
  },
  softText: {
    color: theme.colors.offWhite,
  },
});
```

### 7. StatusAvatar Component

Create avatars with gradient status rings:

```javascript
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';

export const StatusAvatar = ({
  imageUrl,
  status = 'active',
  size = 120
}) => {
  const statusColors = {
    active: [theme.colors.secondary, theme.colors.soft2],
    away: [theme.colors.soft4, theme.colors.soft1],
    busy: [theme.colors.primary, theme.colors.soft1],
    sleeping: [theme.colors.soft3, theme.colors.primary],
  };

  const ringSize = size + 12;
  const avatarSize = size;

  return (
    <View style={{ width: ringSize, height: ringSize }}>
      <LinearGradient
        colors={statusColors[status]}
        style={[
          styles.ring,
          { width: ringSize, height: ringSize, borderRadius: ringSize / 2 }
        ]}
      >
        <View style={styles.avatarContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[
                styles.avatar,
                { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
              ]}
            />
          ) : (
            <View style={[
              styles.placeholder,
              { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
            ]} />
          )}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: theme.colors.offWhite,
    borderRadius: 9999,
    padding: 4,
  },
  avatar: {
    backgroundColor: theme.colors.lightGray,
  },
  placeholder: {
    backgroundColor: theme.colors.lightGray,
  },
});
```

## Screen Layout Pattern

Use this structure for consistent, beautiful screens:

```javascript
import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet } from 'react-native';
import { WavePattern, AnimatedBlob, PatternBackground } from '../components';
import theme from '../theme';

export default function ExampleScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Layered decorative backgrounds */}
      <WavePattern color={theme.colors.primary} opacity={0.08} />
      <PatternBackground pattern="dots" color={theme.colors.secondary} opacity={0.08} />

      {/* Floating animated blobs */}
      <AnimatedBlob
        color={theme.colors.primary}
        size={180}
        opacity={0.15}
        style={{ top: '10%', right: '-10%' }}
      />
      <AnimatedBlob
        color={theme.colors.secondary}
        size={150}
        opacity={0.12}
        style={{ bottom: '20%', left: '-5%' }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Your content here */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing['2xl'],
    paddingBottom: theme.spacing['4xl'],
  },
});
```

## Design Principles

1. **Always use the theme system** - Never hardcode colors or spacing
2. **Layer backgrounds** - Wave + pattern + animated blobs = depth
3. **Position blobs thoughtfully** - Partially off-screen, asymmetric placement
4. **Consistent spacing** - Use 4px grid (xs, sm, md, lg, xl, 2xl, 3xl, 4xl)
5. **Organic shapes** - Blob cards, rounded corners (medium = 20px)
6. **Soft animations** - Gentle pulsing, slow rotation (4-20 second durations)
7. **Muted opacity** - Backgrounds at 0.08-0.15, blobs at 0.12-0.25
8. **Clear hierarchy** - Use text styles from theme (h1, h2, h3, body, bodySmall, caption)
9. **Subtle shadows** - Use theme shadow levels, not harsh drops
10. **Haptic feedback** - Add gentle vibrations (10ms) to button interactions

## Common Patterns

### Modal/Overlay Pattern
Use BlobCard with higher elevation shadow for modals

### Empty State Pattern
Large emoji + BlobCard + descriptive text + CTA button

### List Item Pattern
BlobCard with horizontal layout, icon/emoji on left, content in middle, chevron on right

### Status Indicator Pattern
Use StatusAvatar with different status states (active, away, busy, sleeping)

### Loading Pattern
Use theme loading text with gentle fade animation

## Color Psychology

- **Dusty rose/coral** - Warmth, comfort, love, relationships
- **Sage green/teal** - Calm, balance, growth, wellness
- **Deep navy** - Trust, stability, professionalism
- **Cream/warm white** - Clean, spacious, peaceful
- **Light lavender** - Rest, meditation, spirituality
- **Warm yellow** - Energy, optimism, positivity

## Resources

- Blob generator: https://www.blobmaker.app/
- SVG path editor: https://yqnn.github.io/svg-path-editor/
- Color palette generator: https://coolors.co/
- Gradient maker: https://cssgradient.io/
- React Native Reanimated docs: https://docs.swmansion.com/react-native-reanimated/

## IMPORTANT: Configuration for Reanimated

Add to `babel.config.js`:
```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: ['react-native-reanimated/plugin'], // Must be last
};
```

After adding, run: `npm start -- --reset-cache`

---

## 🚀 Advanced Components & Patterns

### 8. GlassCard Component (Glassmorphism)

Create modern glass-effect cards with blur and transparency:

```javascript
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import theme from '../theme';

export const GlassCard = ({ children, intensity = 20, style }) => {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} style={StyleSheet.absoluteFill} tint="light">
        <View style={styles.overlay} />
      </BlurView>
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...theme.shadows.level2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    padding: theme.spacing.xl,
  },
});
```

**Install**: `npx expo install expo-blur`

### 9. SkeletonLoader Component

Create beautiful skeleton loading states:

```javascript
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '../theme';

export const SkeletonLoader = ({ width = '100%', height = 20, borderRadius = 12, style }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, { width, height, borderRadius }, animatedStyle, style]}>
      <LinearGradient
        colors={[theme.colors.lightGray, theme.colors.offWhite, theme.colors.lightGray]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});

// Usage examples:
// <SkeletonLoader width="80%" height={24} />
// <SkeletonLoader width={120} height={120} borderRadius={60} /> // Circle
```

### 10. PressableCard Component with Spring Physics

Advanced pressable with spring animations and haptics:

```javascript
import React from 'react';
import { Pressable, StyleSheet, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import theme from '../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PressableCard = ({ children, onPress, style }) => {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.97]);

    return {
      transform: [{ scale }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
    Vibration.vibrate(5);
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
    });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.container, animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.xl,
    ...theme.shadows.level1,
  },
});
```

### 11. ParallaxScrollView Component

Create depth with parallax scrolling:

```javascript
import React, { useRef } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export const ParallaxScrollView = ({ children, headerComponent, headerHeight = 300 }) => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, headerHeight],
      [0, -headerHeight / 2],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-headerHeight, 0, headerHeight],
      [2, 1, 0.8],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, headerHeight / 2, headerHeight],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight }, headerStyle]}>
        {headerComponent}
      </Animated.View>

      <AnimatedScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: headerHeight }}
      >
        {children}
      </AnimatedScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
});
```

### 12. MorphingBlob Component

Blobs that morph between different shapes:

```javascript
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import theme from '../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const MorphingBlob = ({ color = theme.colors.primary, size = 200, opacity = 0.2 }) => {
  const morphProgress = useSharedValue(0);

  const blobPaths = [
    "M47.3,-76.9C59.9,-68.7,67.8,-53.2,74.2,-37.5C80.6,-21.8,85.5,-5.9,84.1,9.3C82.7,24.5,75.1,38.9,64.8,49.8C54.5,60.7,41.5,68.1,27.6,72.8C13.7,77.5,-1.2,79.5,-15.8,76.8C-30.4,74.1,-44.7,66.7,-56.2,55.4C-67.7,44.1,-76.4,29,-80.4,12.4C-84.4,-4.2,-83.7,-22.3,-76.9,-37.2C-70.1,-52.1,-57.2,-63.8,-42.8,-71.3C-28.4,-78.8,-12.6,-82.1,2.8,-86.7C18.2,-91.3,34.7,-85.1,47.3,-76.9Z",
    "M43.8,-73.5C56.4,-66.3,66.2,-53.1,72.6,-38.4C79,-23.7,82,-7.5,79.9,7.6C77.8,22.7,70.6,36.7,60.8,48.2C51,59.7,38.6,68.7,24.8,73.9C11,79.1,-4.2,80.5,-18.9,76.8C-33.6,73.1,-47.8,64.3,-58.7,52.3C-69.6,40.3,-77.2,25.1,-79.4,9.2C-81.6,-6.7,-78.4,-23.3,-70.5,-37.2C-62.6,-51.1,-50,-62.3,-36.2,-69C-22.4,-75.7,-7.4,-77.9,6.8,-87.7C21,-97.5,31.2,-80.7,43.8,-73.5Z",
    "M39.4,-66.8C50.3,-58.4,58.3,-46.7,64.8,-33.8C71.3,-20.9,76.3,-6.8,75.8,7.1C75.3,21,69.3,34.7,60.4,46.2C51.5,57.7,39.7,67,26.5,71.8C13.3,76.6,-1.3,76.9,-15.2,73.1C-29.1,69.3,-42.3,61.4,-53.1,50.4C-63.9,39.4,-72.3,25.3,-75.8,9.9C-79.3,-5.5,-77.9,-22.2,-71.2,-36.4C-64.5,-50.6,-52.5,-62.3,-39.3,-70C-26.1,-77.7,-10.7,-81.4,2.9,-85.8C16.5,-90.2,28.5,-75.2,39.4,-66.8Z",
  ];

  useEffect(() => {
    morphProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    // Simple interpolation between paths - for production use proper SVG morphing library
    const pathIndex = Math.floor(morphProgress.value);
    return {
      d: blobPaths[pathIndex % blobPaths.length],
    };
  });

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200" style={styles.svg}>
      <AnimatedPath animatedProps={animatedProps} fill={color} opacity={opacity} />
    </Svg>
  );
};

const styles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
});
```

### 13. GestureCard Component

Swipeable cards with gesture recognition:

```javascript
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import theme from '../theme';

export const GestureCard = ({ children, onSwipeLeft, onSwipeRight, style }) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const panGestureEvent = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.translateX = translateX.value;
      context.translateY = translateY.value;
    },
    onActive: (event, context) => {
      translateX.value = context.translateX + event.translationX;
      translateY.value = context.translateY + event.translationY;
    },
    onEnd: (event) => {
      const shouldDismiss = Math.abs(translateX.value) > 100;

      if (shouldDismiss) {
        const direction = translateX.value > 0 ? 1 : -1;
        translateX.value = withTiming(direction * 500);
        translateY.value = withTiming(event.translationY);

        if (direction > 0 && onSwipeRight) {
          runOnJS(onSwipeRight)();
        } else if (direction < 0 && onSwipeLeft) {
          runOnJS(onSwipeLeft)();
        }
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    },
  });

  const rStyle = useAnimatedStyle(() => {
    const rotate = translateX.value / 10;

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <PanGestureHandler onGestureEvent={panGestureEvent}>
      <Animated.View style={[styles.card, rStyle, style]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.xl,
    ...theme.shadows.level2,
  },
});
```

**Install**: `npm install react-native-gesture-handler`

## 🎨 Advanced Theming System

### Dynamic Theme Switcher

```javascript
// src/context/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';
import { lightTheme, darkTheme, customThemes } from '../theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');

  const theme = currentTheme === 'light' ? lightTheme :
                currentTheme === 'dark' ? darkTheme :
                customThemes[currentTheme];

  const switchTheme = (themeName) => setCurrentTheme(themeName);

  return (
    <ThemeContext.Provider value={{ theme, switchTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// Usage in components:
// const { theme, switchTheme } = useTheme();
// <View style={{ backgroundColor: theme.colors.background }} />
```

### Custom Meditation App Themes

```javascript
// src/theme/presets.js
export const meditationPresets = {
  calm: {
    primary: '#A8D5BA',    // Soft mint
    secondary: '#89A8D5',  // Periwinkle
    accent: '#5D6D7E',     // Slate
    background: '#F5F9F7',
  },
  sunset: {
    primary: '#F5A962',    // Peach
    secondary: '#E87E7E',  // Coral
    accent: '#7E5A8B',     // Plum
    background: '#FFF8F3',
  },
  forest: {
    primary: '#6B8F71',    // Forest green
    secondary: '#8FA88F',  // Sage
    accent: '#4A5F55',     // Deep pine
    background: '#F7FAF8',
  },
  lavender: {
    primary: '#B8A9D6',    // Lavender
    secondary: '#D6B8CB',  // Mauve
    accent: '#6B5B7E',     // Deep purple
    background: '#F9F7FC',
  },
};
```

## 📱 Lauren-Specific Patterns

### Sugarbum App Architecture

```javascript
// Screen structure for relationship/wellness apps
src/
├── screens/
│   ├── HomeScreen.js           // Partner's status, signals
│   ├── PartnerScreen.js        // Connection management
│   ├── PrivacyScreen.js        // Granular privacy controls
│   ├── SettingsScreen.js       // User preferences
│   └── AuthScreens/
│       ├── LoginScreen.js
│       └── RegisterScreen.js
├── components/
│   ├── ui/                     // Reusable UI components
│   │   ├── BlobCard.js
│   │   ├── AnimatedBlob.js
│   │   ├── GlassCard.js
│   │   └── ...
│   ├── domain/                 // Feature-specific components
│   │   ├── PartnerStatusCard.js
│   │   ├── SignalIndicator.js
│   │   └── PrivacyToggle.js
│   └── layouts/
│       ├── ScreenLayout.js
│       └── CardGrid.js
├── theme/
│   ├── colors.js
│   ├── typography.js
│   ├── spacing.js
│   ├── presets.js
│   └── index.js
├── context/
│   ├── AuthContext.js
│   ├── ThemeContext.js
│   └── SignalsContext.js
└── utils/
    ├── animations.js
    └── haptics.js
```

### Essential Animation Utilities

```javascript
// src/utils/animations.js
import { Easing } from 'react-native-reanimated';

export const springConfig = {
  gentle: { damping: 20, stiffness: 120 },
  bouncy: { damping: 10, stiffness: 150 },
  stiff: { damping: 30, stiffness: 200 },
};

export const timingConfig = {
  fast: { duration: 200, easing: Easing.inOut(Easing.ease) },
  normal: { duration: 300, easing: Easing.inOut(Easing.ease) },
  slow: { duration: 500, easing: Easing.inOut(Easing.ease) },
  organic: { duration: 800, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
};
```

### Haptic Patterns

```javascript
// src/utils/haptics.js
import { Vibration } from 'react-native';

export const haptics = {
  light: () => Vibration.vibrate(5),
  medium: () => Vibration.vibrate(10),
  heavy: () => Vibration.vibrate(15),
  success: () => Vibration.vibrate([0, 10, 50, 10]),
  error: () => Vibration.vibrate([0, 10, 50, 10, 50, 10]),
  notification: () => Vibration.vibrate([0, 10, 100, 10]),
};

// Usage:
// import { haptics } from '../utils/haptics';
// onPress={() => { haptics.medium(); handlePress(); }}
```

## 🎯 Quality Checklist

Before considering design complete, verify:

- [ ] All colors from theme system (no hardcoded hex values)
- [ ] Consistent spacing using 4px grid
- [ ] Blob shapes visible (opacity ≥ 0.25)
- [ ] 3+ layered backgrounds (waves + patterns + blobs)
- [ ] Smooth Reanimated 2 animations (not Animated API)
- [ ] Haptic feedback on all interactions
- [ ] Proper branding (no "App", use custom name)
- [ ] Professional polish (looks like hours of work)
- [ ] Works on iOS simulator before deploying
- [ ] No emojis (unless explicitly requested)
- [ ] All text uses theme typography styles
- [ ] Shadows from theme (level1, level2, level3)
- [ ] Border radius from theme (small: 12, medium: 20, large: 28)
- [ ] SafeAreaView on all screens
- [ ] StatusBar configured (barStyle="dark-content" or "light-content")

## 🚨 Common Mistakes to Avoid

1. **Using Animated instead of Reanimated 2** - Always use Reanimated 2 for better performance
2. **Invisible blob shapes** - Opacity too low, must be 0.15+ to be visible
3. **Hardcoded colors** - Always use theme.colors.*
4. **Missing babel config** - Reanimated won't work without it
5. **Forgetting SafeAreaView** - iPhone notch will overlap content
6. **Generic styling** - Takes minimal effort, looks template-y
7. **No layering** - Flat backgrounds lack depth
8. **Missing haptics** - Buttons feel lifeless without tactile feedback
9. **Poor blob placement** - Should be partially off-screen, asymmetric
10. **Emoji overload** - Use sparingly and professionally

---

**This is Lauren's advanced design system for building sophisticated, meditation-app-style React Native applications. All components prioritize performance, beauty, and user experience.**
