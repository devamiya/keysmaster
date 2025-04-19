type ShortcutCallback = (event: KeyboardEvent) => void;

interface ShortcutOptions {
  scope?: string;
}

const bindings: Record<string, Record<string, ShortcutCallback>> = {};
let currentScope = 'global';
let sequenceBuffer: string[] = [];
let sequenceTimeout: number | null = null;

function normalizeKey(event: KeyboardEvent): string {
  const keys: string[] = [];
  if (event.ctrlKey) keys.push('ctrl');
  if (event.metaKey) keys.push('meta');
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

document.addEventListener('keydown', handler, true);

function shortcut(keyCombo: string, callback: ShortcutCallback, options: ShortcutOptions = {}): void {
  const scope = options.scope || 'global';
  if (!bindings[scope]) bindings[scope] = {};
  bindings[scope][keyCombo.toLowerCase()] = callback;
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
  delete bindings[scope]?.[keyCombo.toLowerCase()];
};

shortcut.disableAll = function () {
  document.removeEventListener('keydown', handler, true);
};

shortcut.enableAll = function () {
  document.addEventListener('keydown', handler, true);
};

export default shortcut;
