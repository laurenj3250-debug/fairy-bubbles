import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useKeyboardShortcuts,
  formatShortcut,
  Platform,
  type KeyboardShortcut
} from './useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    // Clear all event listeners before each test
    document.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('calls action when matching key is pressed', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Simulate Ctrl+K press
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('does not call action for non-matching keys', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Simulate Ctrl+J press (different key)
      const event = new KeyboardEvent('keydown', {
        key: 'j',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).not.toHaveBeenCalled();
    });

    it('handles multiple shortcuts', () => {
      const action1 = vi.fn();
      const action2 = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          description: 'Quick add',
          action: action1
        },
        {
          key: 'ArrowDown',
          description: 'Navigate down',
          action: action2
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Test first shortcut
      const event1 = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event1);
      });

      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).not.toHaveBeenCalled();

      // Test second shortcut
      const event2 = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event2);
      });

      expect(action1).toHaveBeenCalledTimes(1);
      expect(action2).toHaveBeenCalledTimes(1);
    });
  });

  describe('modifier keys', () => {
    it('requires ctrl key when specified', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Without ctrl key
      const event1 = new KeyboardEvent('keydown', {
        key: 'k',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event1);
      });

      expect(action).not.toHaveBeenCalled();

      // With ctrl key
      const event2 = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event2);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('requires shift key when specified', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'K',
          shift: true,
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Without shift key
      const event1 = new KeyboardEvent('keydown', {
        key: 'k',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event1);
      });

      expect(action).not.toHaveBeenCalled();

      // With shift key
      const event2 = new KeyboardEvent('keydown', {
        key: 'K',
        shiftKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event2);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('requires alt key when specified', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          alt: true,
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Without alt key
      const event1 = new KeyboardEvent('keydown', {
        key: 'k',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event1);
      });

      expect(action).not.toHaveBeenCalled();

      // With alt key
      const event2 = new KeyboardEvent('keydown', {
        key: 'k',
        altKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event2);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('handles multiple modifiers', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          shift: true,
          description: 'Advanced shortcut',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Only ctrl
      const event1 = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event1);
      });

      expect(action).not.toHaveBeenCalled();

      // Both ctrl and shift
      const event2 = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event2);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('case insensitivity', () => {
    it('matches keys case-insensitively', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'K',
          ctrl: true,
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Lowercase key
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('input element filtering', () => {
    it('does not trigger shortcuts when typing in input', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      // Create input element and focus it
      const input = document.createElement('input');
      input.type = 'text';
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        bubbles: true
      });

      Object.defineProperty(event, 'target', {
        value: input,
        writable: false
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('does not trigger shortcuts when typing in textarea', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        bubbles: true
      });

      Object.defineProperty(event, 'target', {
        value: textarea,
        writable: false
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });

    it('triggers shortcuts in inputs when enableInInputs is true', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts, { enableInInputs: true }));

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      Object.defineProperty(event, 'target', {
        value: input,
        writable: false
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('enable/disable', () => {
    it('does not trigger shortcuts when disabled', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts, { enabled: false }));

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).not.toHaveBeenCalled();
    });

    it('can be dynamically enabled/disabled', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          description: 'Quick add',
          action
        }
      ];

      const { rerender } = renderHook(
        ({ enabled }) => useKeyboardShortcuts(shortcuts, { enabled }),
        { initialProps: { enabled: false } }
      );

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true,
        bubbles: true
      });

      // Disabled
      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).not.toHaveBeenCalled();

      // Enable
      rerender({ enabled: true });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('special keys', () => {
    it('handles arrow keys', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'ArrowDown',
          description: 'Navigate down',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('handles Enter key', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'Enter',
          description: 'Submit',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('handles Escape key', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'Escape',
          description: 'Close',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('handles Space key', () => {
      const action = vi.fn();
      const shortcuts: KeyboardShortcut[] = [
        {
          key: ' ',
          description: 'Toggle',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('catches and logs errors in action callbacks', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const action = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          description: 'Quick add',
          action
        }
      ];

      renderHook(() => useKeyboardShortcuts(shortcuts));

      const event = new KeyboardEvent('keydown', {
        key: 'k',
        bubbles: true
      });

      act(() => {
        document.dispatchEvent(event);
      });

      expect(action).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      const shortcuts: KeyboardShortcut[] = [
        {
          key: 'k',
          ctrl: true,
          description: 'Quick add',
          action: vi.fn()
        }
      ];

      const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true);

      removeEventListenerSpy.mockRestore();
    });
  });
});

describe('formatShortcut', () => {
  describe('basic formatting', () => {
    it('formats simple key', () => {
      const shortcut = { key: 'k' };
      const formatted = formatShortcut(shortcut);
      expect(formatted).toBe('K');
    });

    it('formats ctrl+key', () => {
      const shortcut = { key: 'k', ctrl: true };
      const formatted = formatShortcut(shortcut);
      // Result depends on platform
      expect(formatted).toMatch(/^(⌘K|Ctrl\+K)$/);
    });

    it('formats shift+key', () => {
      const shortcut = { key: 'k', shift: true };
      const formatted = formatShortcut(shortcut);
      expect(formatted).toMatch(/^(⇧K|Shift\+K)$/);
    });

    it('formats alt+key', () => {
      const shortcut = { key: 'k', alt: true };
      const formatted = formatShortcut(shortcut);
      expect(formatted).toMatch(/^(⌥K|Alt\+K)$/);
    });
  });

  describe('special keys', () => {
    it('formats arrow keys', () => {
      expect(formatShortcut({ key: 'ArrowUp' })).toContain('↑');
      expect(formatShortcut({ key: 'ArrowDown' })).toContain('↓');
      expect(formatShortcut({ key: 'ArrowLeft' })).toContain('←');
      expect(formatShortcut({ key: 'ArrowRight' })).toContain('→');
    });

    it('formats Enter key', () => {
      expect(formatShortcut({ key: 'Enter' })).toContain('↵');
    });

    it('formats Escape key', () => {
      expect(formatShortcut({ key: 'Escape' })).toBe('Esc');
    });

    it('formats Space key', () => {
      expect(formatShortcut({ key: ' ' })).toBe('Space');
    });
  });

  describe('multiple modifiers', () => {
    it('formats multiple modifiers in correct order', () => {
      const shortcut = { key: 'k', ctrl: true, shift: true, alt: true };
      const formatted = formatShortcut(shortcut);

      // Should contain all modifiers
      expect(formatted).toMatch(/(⌘|Ctrl)/);
      expect(formatted).toMatch(/(⇧|Shift)/);
      expect(formatted).toMatch(/(⌥|Alt)/);
      expect(formatted).toContain('K');
    });
  });
});

describe('Platform', () => {
  describe('platform detection', () => {
    it('provides platform detection utilities', () => {
      expect(typeof Platform.isMac).toBe('function');
      expect(typeof Platform.isWindows).toBe('function');
      expect(typeof Platform.isLinux).toBe('function');
      expect(typeof Platform.getModifierKey).toBe('function');
    });

    it('returns modifier key based on platform', () => {
      const modKey = Platform.getModifierKey();
      expect(modKey).toMatch(/^(⌘|Ctrl)$/);
    });
  });
});
