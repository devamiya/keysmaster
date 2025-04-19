const bindings = {};
let currentScope = 'global';
let sequenceBuffer = [];
let sequenceTimeout = null;
let isListenerAttached = false;
/**
 * Check if we are in a browser environment
 */
const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
/**
 * Detect if the OS is macOS (safe for SSR)
 */
const isMac = isBrowser && navigator.platform.toUpperCase().includes('MAC');
/**
 * Normalize user-defined combo strings (e.g., cmd → meta)
 */
function normalizeShortcutInput(combo) {
    return combo
        .toLowerCase()
        .replace(/command|cmd/g, 'meta')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Normalize key press into standardized string
 */
function normalizeKey(event) {
    const keys = [];
    if (event.ctrlKey)
        keys.push('ctrl');
    if (event.metaKey)
        keys.push('meta'); // ⌘ key on Mac
    if (event.altKey)
        keys.push('alt');
    if (event.shiftKey)
        keys.push('shift');
    keys.push(event.key.toLowerCase());
    return keys.join('+');
}
function resetSequenceBuffer() {
    sequenceBuffer = [];
    if (sequenceTimeout)
        clearTimeout(sequenceTimeout);
}
function handler(event) {
    const key = normalizeKey(event);
    sequenceBuffer.push(key);
    const scopeBindings = bindings[currentScope] || {};
    const sequence = sequenceBuffer.join(' ');
    const fn = scopeBindings[sequence];
    if (fn) {
        event.preventDefault();
        fn(event);
        resetSequenceBuffer();
    }
    else {
        sequenceTimeout = window.setTimeout(resetSequenceBuffer, 500);
    }
}
/**
 * Explicitly attach the keyboard listener (safe in browser)
 */
function init() {
    if (isBrowser && !isListenerAttached) {
        document.addEventListener('keydown', handler, true);
        isListenerAttached = true;
    }
}
/**
 * Explicitly remove the keyboard listener
 */
function destroy() {
    if (isBrowser && isListenerAttached) {
        document.removeEventListener('keydown', handler, true);
        isListenerAttached = false;
    }
}
function shortcut(keyCombo, callback, options = {}) {
    const scope = options.scope || 'global';
    const normalized = normalizeShortcutInput(keyCombo);
    if (!bindings[scope])
        bindings[scope] = {};
    bindings[scope][normalized] = callback;
}
shortcut.setScope = function (scope) {
    currentScope = scope;
};
shortcut.getScope = function () {
    return currentScope;
};
shortcut.getBindings = function () {
    return bindings;
};
shortcut.remove = function (keyCombo, scope = 'global') {
    var _a;
    const normalized = normalizeShortcutInput(keyCombo);
    (_a = bindings[scope]) === null || _a === void 0 ? true : delete _a[normalized];
};
shortcut.init = init;
shortcut.destroy = destroy;
shortcut.isMac = isMac;
export default shortcut;
