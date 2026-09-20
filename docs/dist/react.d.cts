import { ShortcutCallback, ShortcutOptions } from './index.cjs';

/**
 * React hook to register a keyboard shortcut or sequence.
 * Automatically initializes the shortcut listener and unbinds on unmount or options change.
 *
 * @param combo Keyboard shortcut combination e.g. 'mod+s', 'ctrl+k ctrl+c'
 * @param callback Callback function executed when shortcut triggers
 * @param options Shortcut configuration options (scope, enableInInput, preventDefault, stopPropagation)
 * @param deps Additional dependency array to re-bind when changed
 */
declare function useShortcut(combo: string, callback: ShortcutCallback, options?: ShortcutOptions, deps?: any[]): void;

export { useShortcut as default, useShortcut };
