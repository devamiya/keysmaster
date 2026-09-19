var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

// src/index.ts
var MODIFIER_ORDER = {
  ctrl: 0,
  alt: 1,
  shift: 2,
  meta: 3
};
var MODIFIER_ALIASES = {
  control: "ctrl",
  ctrl: "ctrl",
  alt: "alt",
  option: "alt",
  shift: "shift",
  cmd: "meta",
  command: "meta",
  meta: "meta"
};
var KEY_ALIASES = {
  esc: "escape",
  space: " ",
  del: "delete",
  ins: "insert",
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright"
};
var isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
var isMac = (() => {
  var _a;
  if (!isBrowser) return false;
  if ("userAgentData" in navigator && ((_a = navigator.userAgentData) == null ? void 0 : _a.platform)) {
    return navigator.userAgentData.platform.toUpperCase().includes("MAC");
  }
  if (typeof navigator !== "undefined" && navigator.userAgent) {
    return /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent);
  }
  if (typeof navigator !== "undefined" && navigator.platform) {
    return navigator.platform.toUpperCase().includes("MAC");
  }
  return false;
})();
function normalizeShortcutInput(combo) {
  const parts = combo.trim().toLowerCase().split(/\s+/);
  return parts.map((part) => {
    const tokens = part.split("+").filter(Boolean);
    const modifiers = [];
    let mainKey = "";
    for (const token of tokens) {
      let normalizedToken = token;
      if (token === "mod" || token === "cmdorctrl") {
        normalizedToken = isMac ? "meta" : "ctrl";
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
      return `${modifiers.join("+")}+${mainKey}`;
    } else if (modifiers.length > 0) {
      return modifiers.join("+");
    } else {
      return mainKey;
    }
  }).join(" ");
}
function isStandaloneModifier(key) {
  const lower = key.toLowerCase();
  return lower === "control" || lower === "alt" || lower === "shift" || lower === "meta";
}
function normalizeKey(event) {
  if (isStandaloneModifier(event.key)) {
    return null;
  }
  const modifiers = [];
  if (event.ctrlKey) modifiers.push("ctrl");
  if (event.altKey) modifiers.push("alt");
  if (event.shiftKey) modifiers.push("shift");
  if (event.metaKey) modifiers.push("meta");
  let key = event.key.toLowerCase();
  if (key === " ") {
    key = " ";
  } else if (KEY_ALIASES[key]) {
    key = KEY_ALIASES[key];
  }
  if (MODIFIER_ALIASES[key]) {
    return modifiers.join("+");
  }
  if (modifiers.length > 0) {
    return `${modifiers.join("+")}+${key}`;
  }
  return key;
}
function isEditableElement(target) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tagName = target.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }
  return target.isContentEditable === true || target.isContentEditable === "true" || target.contentEditable === "true" || target.getAttribute("contenteditable") === "true" || target.getAttribute("contenteditable") === "";
}
var bindings = {};
var scopeStack = ["global"];
var sequenceBuffer = [];
var sequenceTimeout = null;
var isListenerAttached = false;
var fallbackToGlobal = true;
var nextBindingId = 1;
function resetSequenceBuffer() {
  sequenceBuffer = [];
  if (sequenceTimeout !== null) {
    clearTimeout(sequenceTimeout);
    sequenceTimeout = null;
  }
}
function handler(event) {
  const key = normalizeKey(event);
  if (!key) {
    return;
  }
  sequenceBuffer.push(key);
  const currentSequence = sequenceBuffer.join(" ");
  const currentScope = scopeStack[scopeStack.length - 1] || "global";
  const scopesToCheck = [currentScope];
  if (fallbackToGlobal && currentScope !== "global") {
    scopesToCheck.push("global");
  }
  const isEditable = isEditableElement(event.target);
  let matchedBindings = [];
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
  let isPrefix = false;
  for (const scope of scopesToCheck) {
    const scopeBindings = bindings[scope] || [];
    for (const b of scopeBindings) {
      if (b.normalizedCombo.startsWith(currentSequence + " ")) {
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
    sequenceBuffer = [key];
    const singleSequence = key;
    let singleMatches = [];
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
function init() {
  if (isBrowser && !isListenerAttached) {
    document.addEventListener("keydown", handler, true);
    isListenerAttached = true;
  }
}
function destroy() {
  if (isBrowser && isListenerAttached) {
    document.removeEventListener("keydown", handler, true);
    isListenerAttached = false;
  }
}
function shortcut(keyCombo, callback, options = {}) {
  const scope = options.scope || shortcut.getScope();
  const normalizedCombo = normalizeShortcutInput(keyCombo);
  const binding = {
    id: nextBindingId++,
    combo: keyCombo,
    normalizedCombo,
    callback,
    options: __spreadValues({ scope }, options)
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
shortcut.setScope = function(scope) {
  scopeStack = [scope];
};
shortcut.pushScope = function(scope) {
  scopeStack.push(scope);
};
shortcut.popScope = function() {
  if (scopeStack.length > 1) {
    return scopeStack.pop();
  }
  return scopeStack[0];
};
shortcut.getScope = function() {
  return scopeStack[scopeStack.length - 1] || "global";
};
shortcut.getScopeStack = function() {
  return [...scopeStack];
};
shortcut.setFallbackToGlobal = function(enabled) {
  fallbackToGlobal = enabled;
};
shortcut.getBindings = function() {
  return bindings;
};
shortcut.remove = function(keyCombo, scope) {
  const targetScope = scope || shortcut.getScope();
  const normalized = normalizeShortcutInput(keyCombo);
  if (bindings[targetScope]) {
    bindings[targetScope] = bindings[targetScope].filter((b) => b.normalizedCombo !== normalized);
  }
};
shortcut.resetBindings = function() {
  bindings = {};
  scopeStack = ["global"];
  resetSequenceBuffer();
};
shortcut.init = init;
shortcut.destroy = destroy;
shortcut.isMac = isMac;
shortcut.normalizeShortcutInput = normalizeShortcutInput;
var index_default = shortcut;

export {
  isBrowser,
  isMac,
  normalizeShortcutInput,
  isStandaloneModifier,
  normalizeKey,
  isEditableElement,
  index_default
};
//# sourceMappingURL=chunk-7BP55HGP.js.map