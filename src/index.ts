export type ShortcutCallback = (event: KeyboardEvent) => void;

export interface ShortcutOptions {
  scope?: string;
  enableInInput?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface Binding {
  id: number;
  combo: string;
  normalizedCombo: string;
  callback: ShortcutCallback;
  options: ShortcutOptions;
}

const MODIFIER_ORDER: Record<string, number> = {
  ctrl: 0,
  alt: 1,
  shift: 2,
  meta: 3,
};

const MODIFIER_ALIASES: Record<string, string> = {
  control: 'ctrl',
  ctrl: 'ctrl',
  alt: 'alt',
  option: 'alt',
  shift: 'shift',
  cmd: 'meta',
  command: 'meta',
  meta: 'meta',
};

const KEY_ALIASES: Record<string, string> = {
  esc: 'escape',
  space: ' ',
  del: 'delete',
  ins: 'insert',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
};

/**
 * Check if we are in a browser environment
 */
export const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Detect if the OS is macOS (safe for SSR)
 */
export const isMac: boolean = (() => {
  if (!isBrowser) return false;
  if ('userAgentData' in navigator && (navigator as any).userAgentData?.platform) {
    return (navigator as any).userAgentData.platform.toUpperCase().includes('MAC');
  }
  if (typeof navigator !== 'undefined' && navigator.userAgent) {
    return /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent);
  }
  if (typeof navigator !== 'undefined' && navigator.platform) {
    return navigator.platform.toUpperCase().includes('MAC');
  }
  return false;
})();

/**
 * Normalize user-defined combo strings with canonical modifier sorting and aliases
 */
export function normalizeShortcutInput(combo: string): string {
  const parts = combo.trim().toLowerCase().split(/\s+/);

  return parts
    .map((part) => {
      const tokens = part.split('+').filter(Boolean);
      const modifiers: string[] = [];
      let mainKey = '';

      for (const token of tokens) {
        let normalizedToken = token;
        if (token === 'mod' || token === 'cmdorctrl') {
          normalizedToken = isMac ? 'meta' : 'ctrl';
        }

        const canonicalModifier = MODIFIER_ALIASES[normalizedToken];
        if (canonicalModifier) {
          if (!modifiers.includes(canonicalModifier)) {
            modifiers.push(canonicalModifier);
          }
        } else {
          mainKey = KEY_ALIASES[normalizedToken] || normalizedToken;
        }
      }

      modifiers.sort((a, b) => MODIFIER_ORDER[a] - MODIFIER_ORDER[b]);

      if (modifiers.length > 0 && mainKey) {
        return `${modifiers.join('+')}+${mainKey}`;
      } else if (modifiers.length > 0) {
        return modifiers.join('+');
      } else {
        return mainKey;
      }
    })
    .join(' ');
}

/**
 * Check if a key press is a standalone modifier key
 */
export function isStandaloneModifier(key: string): boolean {
  const lower = key.toLowerCase();
  return lower === 'control' || lower === 'alt' || lower === 'shift' || lower === 'meta';
}

/**
 * Normalize KeyboardEvent into standardized combo string
 */
export function normalizeKey(event: KeyboardEvent): string | null {
  if (isStandaloneModifier(event.key)) {
    return null;
  }

  const modifiers: string[] = [];
  if (event.ctrlKey) modifiers.push('ctrl');
  if (event.altKey) modifiers.push('alt');
  if (event.shiftKey) modifiers.push('shift');
  if (event.metaKey) modifiers.push('meta');

  let key = event.key.toLowerCase();
  if (key === ' ') {
    key = ' ';
  } else if (KEY_ALIASES[key]) {
    key = KEY_ALIASES[key];
  }

  if (MODIFIER_ALIASES[key]) {
    return modifiers.join('+');
  }

  if (modifiers.length > 0) {
    return `${modifiers.join('+')}+${key}`;
  }
  return key;
}

/**
 * Check if event target is an editable form element
 */
export function isEditableElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }
  return (
    target.isContentEditable === true ||
    (target as any).isContentEditable === 'true' ||
    target.contentEditable === 'true' ||
    target.getAttribute('contenteditable') === 'true' ||
    target.getAttribute('contenteditable') === ''
  );
}

// Global Store State
let bindings: Record<string, Binding[]> = {};
let scopeStack: string[] = ['global'];
let sequenceBuffer: string[] = [];
let sequenceTimeout: number | null = null;
let isListenerAttached = false;
let fallbackToGlobal = true;
let nextBindingId = 1;

function resetSequenceBuffer() {
  sequenceBuffer = [];
  if (sequenceTimeout !== null) {
    clearTimeout(sequenceTimeout);
    sequenceTimeout = null;
  }
}

function handler(event: KeyboardEvent) {
  const key = normalizeKey(event);
  if (!key) {
    // Ignore standalone modifier presses without corrupting sequence buffer
    return;
  }

  sequenceBuffer.push(key);
  const currentSequence = sequenceBuffer.join(' ');

  const currentScope = scopeStack[scopeStack.length - 1] || 'global';
  const scopesToCheck: string[] = [currentScope];
  if (fallbackToGlobal && currentScope !== 'global') {
    scopesToCheck.push('global');
  }

  const isEditable = isEditableElement(event.target);

  // Search for matching binding in accessible scopes
  let matchedBindings: Binding[] = [];
  for (const scope of scopesToCheck) {
    const scopeBindings = bindings[scope] || [];
    const matches = scopeBindings.filter((b) => b.normalizedCombo === currentSequence);
    if (matches.length > 0) {
      matchedBindings = matches;
      break;
    }
  }

  const activeMatches = matchedBindings.filter((b) => {
    if (isEditable && !b.options.enableInInput) {
      return false;
    }
    return true;
  });

  if (activeMatches.length > 0) {
    for (const binding of activeMatches) {
      if (binding.options.preventDefault !== false) {
        event.preventDefault();
      }
      if (binding.options.stopPropagation) {
        event.stopPropagation();
      }
      binding.callback(event);
    }
    resetSequenceBuffer();
    return;
  }

  // Check if currentSequence is a prefix of any registered sequence in accessible scopes
  let isPrefix = false;
  for (const scope of scopesToCheck) {
    const scopeBindings = bindings[scope] || [];
    for (const b of scopeBindings) {
      if (b.normalizedCombo.startsWith(currentSequence + ' ')) {
        isPrefix = true;
        break;
      }
    }
    if (isPrefix) break;
  }

  if (isPrefix) {
    if (sequenceTimeout !== null) clearTimeout(sequenceTimeout);
    sequenceTimeout = window.setTimeout(resetSequenceBuffer, 500);
  } else {
    // Fallback: check if the single latest key matches a 1-key shortcut
    sequenceBuffer = [key];
    const singleSequence = key;

    let singleMatches: Binding[] = [];
    for (const scope of scopesToCheck) {
      const scopeBindings = bindings[scope] || [];
      const matches = scopeBindings.filter((b) => b.normalizedCombo === singleSequence);
      if (matches.length > 0) {
        singleMatches = matches;
        break;
      }
    }

    const activeSingleMatches = singleMatches.filter((b) => {
      if (isEditable && !b.options.enableInInput) {
        return false;
      }
      return true;
    });

    if (activeSingleMatches.length > 0) {
      for (const binding of activeSingleMatches) {
        if (binding.options.preventDefault !== false) {
          event.preventDefault();
        }
        if (binding.options.stopPropagation) {
          event.stopPropagation();
        }
        binding.callback(event);
      }
      resetSequenceBuffer();
    } else {
      if (sequenceTimeout !== null) clearTimeout(sequenceTimeout);
      sequenceTimeout = window.setTimeout(resetSequenceBuffer, 500);
    }
  }
}

/**
 * Attach the global keyboard listener
 */
function init() {
  if (isBrowser && !isListenerAttached) {
    document.addEventListener('keydown', handler, true);
    isListenerAttached = true;
  }
}

/**
 * Detach the global keyboard listener
 */
function destroy() {
  if (isBrowser && isListenerAttached) {
    document.removeEventListener('keydown', handler, true);
    isListenerAttached = false;
  }
}

/**
 * Register a shortcut or sequence
 */
function shortcut(
  keyCombo: string,
  callback: ShortcutCallback,
  options: ShortcutOptions = {}
): () => void {
  const scope = options.scope || shortcut.getScope();
  const normalizedCombo = normalizeShortcutInput(keyCombo);

  const binding: Binding = {
    id: nextBindingId++,
    combo: keyCombo,
    normalizedCombo,
    callback,
    options: { scope, ...options },
  };

  if (!bindings[scope]) {
    bindings[scope] = [];
  }
  bindings[scope].push(binding);

  return () => {
    if (bindings[scope]) {
      bindings[scope] = bindings[scope].filter((b) => b.id !== binding.id);
    }
  };
}

shortcut.setScope = function (scope: string) {
  scopeStack = [scope];
};

shortcut.pushScope = function (scope: string) {
  scopeStack.push(scope);
};

shortcut.popScope = function (): string | undefined {
  if (scopeStack.length > 1) {
    return scopeStack.pop();
  }
  return scopeStack[0];
};

shortcut.getScope = function (): string {
  return scopeStack[scopeStack.length - 1] || 'global';
};

shortcut.getScopeStack = function (): string[] {
  return [...scopeStack];
};

shortcut.setFallbackToGlobal = function (enabled: boolean) {
  fallbackToGlobal = enabled;
};

shortcut.getBindings = function (): Record<string, Binding[]> {
  return bindings;
};

shortcut.remove = function (keyCombo: string, scope?: string) {
  const targetScope = scope || shortcut.getScope();
  const normalized = normalizeShortcutInput(keyCombo);
  if (bindings[targetScope]) {
    bindings[targetScope] = bindings[targetScope].filter((b) => b.normalizedCombo !== normalized);
  }
};

shortcut.resetBindings = function () {
  bindings = {};
  scopeStack = ['global'];
  resetSequenceBuffer();
};

/**
 * Format a key combo into human-readable native key symbols (e.g. 'mod+s' -> '⌘ S' on Mac, 'Ctrl+S' on Win)
 */
export function formatCombo(combo: string, mac = isMac): string {
  const parts = combo.trim().toLowerCase().split(/\s+/);
  return parts
    .map((part) => {
      const tokens = part.split('+').filter(Boolean);
      return tokens
        .map((t) => {
          let token = t;
          if (token === 'mod' || token === 'cmdorctrl') {
            token = mac ? 'meta' : 'ctrl';
          }
          if (mac) {
            if (token === 'meta' || token === 'cmd' || token === 'command') return '⌘';
            if (token === 'alt' || token === 'option') return '⌥';
            if (token === 'ctrl' || token === 'control') return '⌃';
            if (token === 'shift') return '⇧';
            if (token === 'esc' || token === 'escape') return 'Esc';
            if (token === 'space') return 'Space';
            return token.toUpperCase();
          } else {
            if (token === 'meta' || token === 'cmd' || token === 'command') return 'Win';
            if (token === 'alt' || token === 'option') return 'Alt';
            if (token === 'ctrl' || token === 'control') return 'Ctrl';
            if (token === 'shift') return 'Shift';
            if (token === 'esc' || token === 'escape') return 'Esc';
            if (token === 'space') return 'Space';
            return token.toUpperCase();
          }
        })
        .join(mac ? '' : '+');
    })
    .join('  ');
}

shortcut.init = init;
shortcut.destroy = destroy;
shortcut.isMac = isMac;
shortcut.normalizeShortcutInput = normalizeShortcutInput;
shortcut.formatCombo = formatCombo;

export default shortcut;
