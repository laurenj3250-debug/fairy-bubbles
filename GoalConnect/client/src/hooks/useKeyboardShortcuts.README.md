# useKeyboardShortcuts Hook

A comprehensive React hook for managing keyboard shortcuts in the GoalConnect application.

## Features

- **Cross-platform support**: Automatically detects Mac vs Windows/Linux and uses appropriate modifier keys
- **Smart input detection**: Prevents shortcuts from triggering when typing in form fields
- **Modifier key combinations**: Supports Ctrl/Cmd, Shift, and Alt modifiers
- **Browser shortcut prevention**: Prevents conflicts with browser default shortcuts
- **TypeScript support**: Fully typed with comprehensive interfaces
- **Flexible API**: Multiple ways to define shortcuts based on your needs

## Installation

The hook is located at `/client/src/hooks/useKeyboardShortcuts.ts` and requires no additional dependencies beyond React.

## Basic Usage

```typescript
import { useKeyboardShortcuts, KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrl: true,
      meta: true, // Also set meta for Mac compatibility
      description: 'Quick add task',
      action: () => openQuickAddDialog(),
    },
    {
      key: 'ArrowUp',
      description: 'Navigate up',
      action: () => moveSelectionUp(),
    },
    {
      key: 'e',
      description: 'Edit task',
      action: () => editSelectedTask(),
    },
  ];

  useKeyboardShortcuts(shortcuts, {
    enabled: true,
    enableInInputs: false, // Don't trigger when typing in inputs
  });

  return <div>...</div>;
}
```

## API Reference

### `useKeyboardShortcuts(shortcuts, options)`

Main hook for registering keyboard shortcuts.

**Parameters:**
- `shortcuts: KeyboardShortcut[]` - Array of keyboard shortcut configurations
- `options: UseKeyboardShortcutsOptions` (optional)
  - `enabled?: boolean` - Enable/disable all shortcuts (default: true)
  - `enableInInputs?: boolean` - Allow shortcuts in input fields (default: false)

**Returns:**
- `platform` object with platform detection info:
  - `isMac: boolean`
  - `isWindows: boolean`
  - `isLinux: boolean`
  - `modifierKey: string` - "⌘" on Mac, "Ctrl" on Windows/Linux

### `KeyboardShortcut` Interface

```typescript
interface KeyboardShortcut {
  key: string;           // The key to listen for (e.g., 'k', 'ArrowUp', 'Enter')
  ctrl?: boolean;        // Require Ctrl/Cmd modifier
  meta?: boolean;        // Require Cmd modifier (Mac)
  shift?: boolean;       // Require Shift modifier
  alt?: boolean;         // Require Alt/Option modifier
  description: string;   // Human-readable description
  action: () => void;    // Function to execute when triggered
}
```

### `formatShortcut(shortcut)`

Utility function to format shortcuts for display.

```typescript
import { formatShortcut } from '@/hooks/useKeyboardShortcuts';

const formatted = formatShortcut({ key: 'k', ctrl: true });
// Returns: "⌘K" on Mac, "Ctrl+K" on Windows/Linux
```

### `DefaultShortcuts`

Predefined shortcut configurations matching the implementation plan:

```typescript
import { DefaultShortcuts } from '@/hooks/useKeyboardShortcuts';

const shortcuts = [
  {
    ...DefaultShortcuts.QUICK_ADD,  // ⌘K / Ctrl+K
    description: 'Quick add',
    action: () => openQuickAdd(),
  },
  {
    ...DefaultShortcuts.NAVIGATE_UP,  // ↑
    description: 'Navigate up',
    action: () => moveUp(),
  },
  // ... more shortcuts
];
```

Available default shortcuts:
- `QUICK_ADD` - ⌘K / Ctrl+K
- `NAVIGATE_UP` - ↑
- `NAVIGATE_DOWN` - ↓
- `OPEN_TASK` - Enter
- `EDIT_TASK` - E
- `DELETE_TASK` - Delete
- `DELETE_TASK_ALT` - Backspace
- `TOGGLE_COMPLETE` - Space
- `PRIORITY_1` - 1
- `PRIORITY_2` - 2
- `PRIORITY_3` - 3
- `PRIORITY_4` - 4
- `PROJECT_SELECTOR` - P
- `LABELS_SELECTOR` - L
- `DUE_DATE` - D
- `HELP` - ?
- `CLOSE_MODAL` - Escape

### `useKeyboardShortcutsMap(shortcutsMap, options)`

Alternative API using a map-based approach:

```typescript
import { useKeyboardShortcutsMap } from '@/hooks/useKeyboardShortcuts';

function MyComponent() {
  useKeyboardShortcutsMap({
    'k+ctrl': () => openQuickAdd(),
    'ArrowUp': () => moveUp(),
    'e': () => edit(),
  });

  return <div>...</div>;
}
```

## Platform Detection

The hook automatically detects the user's platform and handles modifier keys appropriately:

- **Mac**: Uses ⌘ (Command/Meta key) as primary modifier
- **Windows/Linux**: Uses Ctrl as primary modifier

When defining shortcuts, set both `ctrl` and `meta` to true for cross-platform compatibility:

```typescript
{
  key: 'k',
  ctrl: true,
  meta: true,  // Ensures it works on both Mac and Windows/Linux
  description: 'Quick add',
  action: () => openQuickAdd(),
}
```

## Input Field Detection

By default, shortcuts are **disabled** when the user is typing in:
- `<input>` elements (text, email, password, etc.)
- `<textarea>` elements
- `<select>` elements
- Elements with `contenteditable="true"`

To enable shortcuts in input fields, set `enableInInputs: true` in the options.

## Best Practices

### 1. Use Descriptive Names

```typescript
// Good
const shortcuts = [
  {
    key: 'e',
    description: 'Edit selected task',
    action: () => editTask(),
  },
];

// Avoid
const shortcuts = [
  {
    key: 'e',
    description: 'e',
    action: () => editTask(),
  },
];
```

### 2. Prevent Conflicts with Browser Shortcuts

The hook automatically calls `preventDefault()` on matched events, but be careful with:
- Ctrl+W (close tab)
- Ctrl+T (new tab)
- Ctrl+R (reload)

These may not be preventable in all browsers.

### 3. Provide Escape Routes

Always provide a way to close modals/dialogs:

```typescript
{
  key: 'Escape',
  description: 'Close modal',
  action: () => closeAllModals(),
}
```

### 4. Conditional Shortcuts

Enable/disable shortcuts based on component state:

```typescript
const [hasSelection, setHasSelection] = useState(false);

useKeyboardShortcuts(shortcuts, {
  enabled: hasSelection, // Only enable when there's a selection
});
```

### 5. Group Related Shortcuts

Organize shortcuts by category for better maintainability:

```typescript
const navigationShortcuts = [
  { key: 'ArrowUp', description: 'Navigate up', action: moveUp },
  { key: 'ArrowDown', description: 'Navigate down', action: moveDown },
];

const actionShortcuts = [
  { key: 'e', description: 'Edit', action: edit },
  { key: 'Delete', description: 'Delete', action: remove },
];

const allShortcuts = [...navigationShortcuts, ...actionShortcuts];
useKeyboardShortcuts(allShortcuts);
```

## Examples

See `/client/src/hooks/useKeyboardShortcuts.example.tsx` for comprehensive examples including:
- Basic usage with all default shortcuts
- Conditional shortcuts based on context
- Displaying keyboard shortcut hints
- Creating a help modal with all shortcuts
- Full page implementation with focus management

## Testing

Integration tests are located at `/tests/keyboard-shortcuts.spec.ts` and cover:
- Platform detection
- Input focus detection
- Modifier key combinations
- Arrow key navigation
- All action shortcuts
- Browser shortcut prevention
- Edge cases and rapid key presses

Run tests with:
```bash
npm test keyboard-shortcuts
```

## Implementation Plan Reference

This hook implements **Phase 5.1** of the Advanced Features Implementation Plan:
- ✅ Handle global keyboard events
- ✅ Support modifier combinations (⌘/Ctrl, Shift, Alt)
- ✅ Platform detection (Mac vs Windows/Linux)
- ✅ Prevent conflicts with browser shortcuts
- ✅ Respect input focus (don't trigger when typing in forms)

## Troubleshooting

### Shortcuts not working

1. Check if shortcuts are enabled: `enabled: true`
2. Verify you're not in an input field (unless `enableInInputs: true`)
3. Check browser console for errors
4. Ensure the component using the hook is mounted

### Shortcuts triggering in input fields

Set `enableInInputs: false` (default) in the options.

### Platform detection incorrect

The hook uses `navigator.platform` and `navigator.userAgent`. If detection fails:
1. Check the browser being used
2. Verify navigator is available (SSR considerations)
3. Manually test the `Platform` utilities

### Conflicts with browser shortcuts

Some browser shortcuts (like Ctrl+W) cannot be overridden for security reasons. Choose alternative key combinations if needed.

## Future Enhancements

Potential improvements for future versions:
- [ ] Custom keyboard layouts support
- [ ] Shortcut recording UI
- [ ] Conflict detection between shortcuts
- [ ] Analytics/telemetry for shortcut usage
- [ ] Shortcut customization by users
- [ ] Accessibility improvements (screen reader announcements)

## License

Part of the GoalConnect project. See project LICENSE for details.
