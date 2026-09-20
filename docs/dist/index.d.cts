type ShortcutCallback = (event: KeyboardEvent) => void;
interface ShortcutOptions {
    scope?: string;
    enableInInput?: boolean;
    preventDefault?: boolean;
    stopPropagation?: boolean;
}
interface Binding {
    id: number;
    combo: string;
    normalizedCombo: string;
    callback: ShortcutCallback;
    options: ShortcutOptions;
}
/**
 * Check if we are in a browser environment
 */
declare const isBrowser: boolean;
/**
 * Detect if the OS is macOS (safe for SSR)
 */
declare const isMac: boolean;
/**
 * Normalize user-defined combo strings with canonical modifier sorting and aliases
 */
declare function normalizeShortcutInput(combo: string): string;
/**
 * Check if a key press is a standalone modifier key
 */
declare function isStandaloneModifier(key: string): boolean;
/**
 * Normalize KeyboardEvent into standardized combo string
 */
declare function normalizeKey(event: KeyboardEvent): string | null;
/**
 * Check if event target is an editable form element
 */
declare function isEditableElement(target: EventTarget | null): boolean;
/**
 * Register a shortcut or sequence
 */
declare function shortcut(keyCombo: string, callback: ShortcutCallback, options?: ShortcutOptions): () => void;
declare namespace shortcut {
    var setScope: (scope: string) => void;
    var pushScope: (scope: string) => void;
    var popScope: () => string | undefined;
    var getScope: () => string;
    var getScopeStack: () => string[];
    var setFallbackToGlobal: (enabled: boolean) => void;
    var getBindings: () => Record<string, Binding[]>;
    var remove: (keyCombo: string, scope?: string) => void;
    var resetBindings: () => void;
    var init: () => void;
    var destroy: () => void;
    var isMac: boolean;
    var normalizeShortcutInput: typeof normalizeShortcutInput;
    var formatCombo: typeof formatCombo;
}
/**
 * Format a key combo into human-readable native key symbols (e.g. 'mod+s' -> '⌘ S' on Mac, 'Ctrl+S' on Win)
 */
declare function formatCombo(combo: string, mac?: boolean): string;

export { type Binding, type ShortcutCallback, type ShortcutOptions, shortcut as default, formatCombo, isBrowser, isEditableElement, isMac, isStandaloneModifier, normalizeKey, normalizeShortcutInput };
