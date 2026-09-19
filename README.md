# 🔑 keysmaster

[![npm version](https://img.shields.io/npm/v/keysmaster.svg?style=flat&color=blue)](https://www.npmjs.com/package/keysmaster)
[![npm downloads](https://img.shields.io/npm/dw/keysmaster?style=flat&color=brightgreen)](https://www.npmjs.com/package/keysmaster)
[![license](https://img.shields.io/npm/l/keysmaster?style=flat&color=orange)](https://github.com/devamiya/keysmaster/blob/main/LICENSE)

A tiny, powerful, and SSR-safe JavaScript & React **Keyboard Shortcut Manager** featuring:

- ✅ **Cross-Platform `mod+s`**: Automatically resolves to `⌘ Cmd` on macOS and `Ctrl` on Windows/Linux.
- ✅ **Canonical Modifier Ordering**: `shift+ctrl+a` and `ctrl+shift+a` work seamlessly out of the box.
- ✅ **Sequence Buffering**: Robust multi-key sequence detection (e.g. `ctrl+k ctrl+c`) ignoring standalone modifier keys.
- ✅ **Form Input Protection**: Prevents unwanted shortcuts while typing in `<input>`, `<textarea>`, or `contenteditable` (configurable per shortcut).
- ✅ **Scope Stack & Fallback**: Push/pop nested scopes (e.g. `modal` -> `editor`) with automatic fallback to global shortcuts.
- ✅ **Official React Hook**: Exported `useShortcut()` hook with automatic lifecycle cleanup.
- ✅ **Unbind Function Return**: `shortcut(...)` returns a clean `unbind()` function for simple cleanup.
- ✅ **Dual ESM & CommonJS**: Works out-of-the-box with Next.js, Node.js, Vite, Webpack, CJS, ESM, and TypeScript.

---

## 📦 Installation

```bash
npm install keysmaster
# or
yarn add keysmaster
# or
pnpm add keysmaster
```

---

## 🔰 Quick Start (Vanilla JS / TS)

```ts
import shortcut from 'keysmaster';

// Initialize the global keyboard listener
shortcut.init();

// Cross-platform Cmd+S (Mac) / Ctrl+S (Windows)
const unbind = shortcut('mod+s', (e) => {
  e.preventDefault();
  console.log('Document saved!');
});

// To unbind later:
// unbind();
```

---

## ⚛️ React & Next.js Usage

Import the built-in React hook from `keysmaster/react`:

```tsx
import { useState } from 'react';
import { useShortcut } from 'keysmaster/react';

export default function ModalComponent() {
  const [isOpen, setIsOpen] = useState(true);

  // Automatically binds on mount and unbinds on unmount
  useShortcut('esc', () => {
    setIsOpen(false);
  });

  // Cross-platform save action
  useShortcut('mod+s', () => {
    console.log('Saved inside React component!');
  });

  return isOpen ? <div>Modal Content (Press ESC to close, Cmd+S / Ctrl+S to save)</div> : null;
}
```

---

## 🧠 Smart Cross-Platform `mod` Alias

`keysmaster` automatically detects macOS vs Windows/Linux:

- `mod+s` ➔ `⌘ Cmd + S` on macOS, `Ctrl + S` on Windows/Linux.
- `cmd+s` or `command+s` ➔ `Meta + S`.
- `ctrl+s` or `control+s` ➔ `Control + S`.
- `option+s` or `alt+s` ➔ `Alt + S`.

---

## ⚡ Multi-Key Sequences

Create Vim / VS Code style multi-key sequences easily:

```ts
shortcut('ctrl+k ctrl+c', () => {
  console.log('Comment line sequence triggered!');
});
```

Standalone modifier presses (e.g., holding or tapping `Ctrl`) are filtered out automatically so they don't corrupt the sequence buffer.

---

## 🎯 Scopes & Scope Stack

Organize shortcuts into scopes (e.g. `global`, `modal`, `editor`):

```ts
// Set active scope
shortcut.setScope('editor');

// Or push onto scope stack (great for nested UI modals/dialogs)
shortcut.pushScope('modal');

// Bind a modal-only shortcut
shortcut('esc', closeModal, { scope: 'modal' });

// Pop scope when modal closes (restores 'editor' scope)
shortcut.popScope();
```

> 💡 **Global Fallback**: When in a sub-scope like `modal`, shortcuts registered in `global` scope will still trigger automatically unless overridden.

---

## 📝 Form Input Filtering

By default, keyboard shortcuts are **ignored** when the user is focused inside editable elements (`<input>`, `<textarea>`, `<select>`, or `contenteditable="true"`).

To allow a shortcut to fire inside inputs, set `enableInInput: true`:

```ts
shortcut('alt+i', () => {
  console.log('Fires even inside text inputs!');
}, { enableInInput: true });
```

---

## 🔧 Full API Reference

### `shortcut(combo, callback, options?)`
Registers a keyboard shortcut or sequence. Returns an `unbind()` cleanup function.

**Options**:
- `scope?: string` — Target scope (defaults to currently active scope).
- `enableInInput?: boolean` — Whether to trigger inside input fields (default `false`).
- `preventDefault?: boolean` — Call `event.preventDefault()` automatically (default `true`).
- `stopPropagation?: boolean` — Call `event.stopPropagation()` automatically (default `false`).

---

### Scope Stack Methods
- `shortcut.setScope(scope: string)` — Sets current scope (resets stack).
- `shortcut.pushScope(scope: string)` — Pushes scope onto stack.
- `shortcut.popScope()` — Pops top scope from stack.
- `shortcut.getScope()` — Returns active scope name.
- `shortcut.getScopeStack()` — Returns current scope stack array.

---

### Lifecycle & Utilities
- `shortcut.init()` — Attaches key listener to `document`.
- `shortcut.destroy()` — Detaches global listener.
- `shortcut.remove(combo, scope?)` — Unbinds all callbacks matching the combo in specified scope.
- `shortcut.resetBindings()` — Clears all bindings and resets scope stack.
- `shortcut.isMac` — `true` if running on macOS (SSR safe).

---

## 🧪 Interactive Demo

Check out [`/docs/index.html`](./docs/index.html) for a live visual demo and playground.

```bash
npx serve .
# Open http://localhost:3000/docs/index.html
```

---

## 🔓 License

MIT © [Amiya Panigrahi](https://devamiya.me)
