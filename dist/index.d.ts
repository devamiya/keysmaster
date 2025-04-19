type ShortcutCallback = (event: KeyboardEvent) => void;
interface ShortcutOptions {
    scope?: string;
}
declare const bindings: Record<string, Record<string, ShortcutCallback>>;
declare function shortcut(keyCombo: string, callback: ShortcutCallback, options?: ShortcutOptions): void;
declare namespace shortcut {
    var setScope: (scope: string) => void;
    var getScope: () => string;
    var getBindings: () => typeof bindings;
    var remove: (keyCombo: string, scope?: string) => void;
    var init: () => void;
    var destroy: () => void;
    var isMac: boolean;
}
export default shortcut;
