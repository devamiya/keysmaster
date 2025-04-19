type ShortcutCallback = (event: KeyboardEvent) => void;

interface ShortcutOptions {
  scope?: string;
}

const bindings: Record<string, Record<string, ShortcutCallback>> = {};
let currentScope = 'global';
let sequenceBuffer: string[] = [];
let sequenceTimeout: number | null = null;
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
function normalizeShortcutInput(combo: string): string {
  return combo
    .toLowerCase()
    .replace(/command|cmd/g, 'meta')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize key press into standardized string
 */
function normalizeKey(event: KeyboardEvent): string {
  const keys: string[] = [];
  if (event.ctrlKey) keys.push('ctrl');
  if (event.metaKey) keys.push('meta'); // ⌘ key on Mac
  if (event.altKey) keys.push('alt');
  if (event.shiftKey) keys.push('shift');
  keys.push(event.key.toLowerCase());

  return keys.join('+');
}

function resetSequenceBuffer() {
  sequenceBuffer = [];
  if (sequenceTimeout) clearTimeout(sequenceTimeout);
}

function handler(event: KeyboardEvent) {
  const key = normalizeKey(event);
  sequenceBuffer.push(key);

  const scopeBindings = bindings[currentScope] || {};
  const sequence = sequenceBuffer.join(' ');
  const fn = scopeBindings[sequence];

  if (fn) {
    event.preventDefault();
    fn(event);
    resetSequenceBuffer();
  } else {
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

function shortcut(
  keyCombo: string,
  callback: ShortcutCallback,
  options: ShortcutOptions = {}
): void {
  const scope = options.scope || 'global';
  const normalized = normalizeShortcutInput(keyCombo);
  if (!bindings[scope]) bindings[scope] = {};
  bindings[scope][normalized] = callback;
}

shortcut.setScope = function (scope: string) {
  currentScope = scope;
};

shortcut.getScope = function (): string {
  return currentScope;
};

shortcut.getBindings = function (): typeof bindings {
  return bindings;
};

shortcut.remove = function (keyCombo: string, scope: string = 'global') {
  const normalized = normalizeShortcutInput(keyCombo);
  delete bindings[scope]?.[normalized];
};

shortcut.init = init;
shortcut.destroy = destroy;
shortcut.isMac = isMac;

export default shortcut;
