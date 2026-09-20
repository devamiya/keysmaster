import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import shortcut, {
  normalizeShortcutInput,
  normalizeKey,
  isStandaloneModifier,
  isEditableElement,
} from '../src/index';

describe('keysmaster core', () => {
  beforeEach(() => {
    shortcut.resetBindings();
    shortcut.init();
  });

  afterEach(() => {
    shortcut.destroy();
    shortcut.resetBindings();
  });

  describe('normalization & canonical ordering', () => {
    it('orders modifier keys deterministically (ctrl -> alt -> shift -> meta)', () => {
      expect(normalizeShortcutInput('shift+ctrl+a')).toBe('ctrl+shift+a');
      expect(normalizeShortcutInput('cmd+shift+alt+ctrl+z')).toBe('ctrl+alt+shift+meta+z');
    });

    it('resolves modifier aliases correctly', () => {
      expect(normalizeShortcutInput('control+option+a')).toBe('ctrl+alt+a');
      expect(normalizeShortcutInput('command+a')).toBe('meta+a');
    });

    it('resolves key aliases correctly', () => {
      expect(normalizeShortcutInput('ctrl+esc')).toBe('ctrl+escape');
      expect(normalizeShortcutInput('ctrl+space')).toBe('ctrl+ ');
      expect(normalizeShortcutInput('ctrl+up')).toBe('ctrl+arrowup');
    });

    it('handles multi-key sequences with normalization', () => {
      expect(normalizeShortcutInput('ctrl+k ctrl+c')).toBe('ctrl+k ctrl+c');
      expect(normalizeShortcutInput('shift+ctrl+k shift+ctrl+c')).toBe('ctrl+shift+k ctrl+shift+c');
    });

    it('resolves mod / cmdorctrl alias based on OS', () => {
      const normalized = normalizeShortcutInput('mod+s');
      if (shortcut.isMac) {
        expect(normalized).toBe('meta+s');
      } else {
        expect(normalized).toBe('ctrl+s');
      }
    });

    it('formats key combos into native Mac and Windows symbols', () => {
      expect(shortcut.formatCombo('mod+s', true)).toBe('⌘S');
      expect(shortcut.formatCombo('mod+s', false)).toBe('Ctrl+S');
      expect(shortcut.formatCombo('mod+k mod+c', true)).toBe('⌘K  ⌘C');
      expect(shortcut.formatCombo('alt+i', true)).toBe('⌥I');
    });
  });

  describe('standalone modifier detection', () => {
    it('identifies standalone modifier keys', () => {
      expect(isStandaloneModifier('Control')).toBe(true);
      expect(isStandaloneModifier('Alt')).toBe(true);
      expect(isStandaloneModifier('Shift')).toBe(true);
      expect(isStandaloneModifier('Meta')).toBe(true);
      expect(isStandaloneModifier('a')).toBe(false);
    });

    it('returns null from normalizeKey for standalone modifier events', () => {
      const event = new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true });
      expect(normalizeKey(event)).toBeNull();
    });
  });

  describe('keyboard event triggering', () => {
    it('triggers a basic shortcut', () => {
      const cb = vi.fn();
      shortcut('ctrl+s', cb);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(event);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it('returns an unbind function that removes specific callback', () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();

      const unbind1 = shortcut('ctrl+s', cb1);
      shortcut('ctrl+s', cb2);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      document.dispatchEvent(event);
      expect(cb1).toHaveBeenCalledTimes(1);
      expect(cb2).toHaveBeenCalledTimes(1);

      unbind1();

      document.dispatchEvent(event);
      expect(cb1).toHaveBeenCalledTimes(1); // Not called again
      expect(cb2).toHaveBeenCalledTimes(2); // Called second time
    });

    it('triggers multi-key sequence shortcuts and ignores standalone modifiers in sequence', () => {
      const cb = vi.fn();
      shortcut('ctrl+k ctrl+c', cb);

      // Press Ctrl alone (standalone)
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Control', ctrlKey: true, bubbles: true, cancelable: true })
      );

      // Press Ctrl+K
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true, cancelable: true })
      );

      // Press Ctrl+C
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true, cancelable: true })
      );

      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('editable element filtering', () => {
    it('detects input, textarea, select, and contenteditable elements', () => {
      const input = document.createElement('input');
      const textarea = document.createElement('textarea');
      const div = document.createElement('div');
      div.contentEditable = 'true';

      expect(isEditableElement(input)).toBe(true);
      expect(isEditableElement(textarea)).toBe(true);
      expect(isEditableElement(div)).toBe(true);
      expect(isEditableElement(document.createElement('div'))).toBe(false);
    });

    it('ignores shortcuts in input elements by default', () => {
      const cb = vi.fn();
      shortcut('a', cb);

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 'a',
        bubbles: true,
        cancelable: true,
      });

      input.dispatchEvent(event);
      expect(cb).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('fires shortcut in input elements when enableInInput is true', () => {
      const cb = vi.fn();
      shortcut('ctrl+s', cb, { enableInInput: true });

      const input = document.createElement('input');
      document.body.appendChild(input);

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      input.dispatchEvent(event);
      expect(cb).toHaveBeenCalledTimes(1);

      document.body.removeChild(input);
    });
  });

  describe('scope stack & global fallback', () => {
    it('manages scope stack correctly', () => {
      shortcut.setScope('global');
      expect(shortcut.getScope()).toBe('global');

      shortcut.pushScope('editor');
      expect(shortcut.getScope()).toBe('editor');
      expect(shortcut.getScopeStack()).toEqual(['global', 'editor']);

      shortcut.pushScope('modal');
      expect(shortcut.getScope()).toBe('modal');
      expect(shortcut.getScopeStack()).toEqual(['global', 'editor', 'modal']);

      shortcut.popScope();
      expect(shortcut.getScope()).toBe('editor');

      shortcut.popScope();
      expect(shortcut.getScope()).toBe('global');
    });

    it('falls back to global scope shortcuts when inside modal scope', () => {
      const globalCb = vi.fn();
      const modalCb = vi.fn();

      shortcut('ctrl+g', globalCb, { scope: 'global' });
      shortcut('ctrl+m', modalCb, { scope: 'modal' });

      shortcut.pushScope('modal');

      // Dispatch ctrl+m (modal scoped)
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, bubbles: true, cancelable: true })
      );
      expect(modalCb).toHaveBeenCalledTimes(1);

      // Dispatch ctrl+g (global scoped) - should fall back to global
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'g', ctrlKey: true, bubbles: true, cancelable: true })
      );
      expect(globalCb).toHaveBeenCalledTimes(1);
    });
  });
});
