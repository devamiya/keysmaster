# 🔑 keysmaster

[![npm version](https://img.shields.io/npm/v/keysmaster.svg?style=flat&color=blue)](https://www.npmjs.com/package/keysmaster)
[![npm downloads](https://img.shields.io/npm/dw/keysmaster?style=flat&color=brightgreen)](https://www.npmjs.com/package/keysmaster)
[![license](https://img.shields.io/npm/l/keysmaster?style=flat&color=orange)](https://github.com/devamiya/keysmaster/blob/main/LICENSE)

A simple, powerful, and SSR-safe JavaScript **Keyboard Shortcut Manager** with support for:

- ✅ Debouncing multi-key sequences (e.g., `ctrl+k ctrl+c`)
- ✅ Scope-based shortcuts (e.g., per modal/component)
- ✅ Mac ⌘/Command key detection
- ✅ SSR-safe (works with Next.js, Node.js, etc.)
- ✅ Works with plain JavaScript or TypeScript

---

## 📦 Installation

```bash
npm install keysmaster
# or
yarn add keysmaster
```

---

## 🔰 Quick Start

```ts
import keysmaster from 'keysmaster';

keysmaster.init();

keysmaster('ctrl+s', (e) => {
  e.preventDefault();
  console.log('Save triggered!');
});
```

> ✅ Use `keysmaster('ctrl+s', callback)` to bind, and `keysmaster.remove('ctrl+s')` to unbind.

---

## ⚛️ React / Next.js Usage

Keysmaster works perfectly in client-side or SSR apps like Next.js.

```tsx
import { useEffect } from 'react';
import keysmaster from 'keysmaster';

export default function Component() {
  useEffect(() => {
    keysmaster.init();

    const combo = keysmaster.isMac ? 'cmd+s' : 'ctrl+s';

    keysmaster(combo, () => {
      console.log('Save triggered!');
    });

    return () => keysmaster.destroy(); // Clean up
  }, []);

  return <div>Press Cmd+S / Ctrl+S to save</div>;
}
```

---

## 🔧 API Reference

### `keysmaster(combo, callback, options?)`
Bind a keyboard shortcut or sequence.

- `combo`: String like `'ctrl+s'`, `'shift+d'`, or `'ctrl+k ctrl+c'`
- `callback`: Function to run when triggered
- `options.scope` (optional): Bind only within this scope

---

### `keysmaster.remove(combo, scope?)`
Unbind a specific shortcut (within optional scope)

---

### `keysmaster.setScope(scope: string)`
Switch active scope (e.g., `'modal'`, `'editor'`, etc.)

---

### `keysmaster.getScope()`
Returns the current scope (`'global'` by default)

---

### `keysmaster.init()`
Attach the keyboard listener (must be called on client)

---

### `keysmaster.destroy()`
Detach the keyboard listener

---

### `keysmaster.isMac`
Returns `true` if running on macOS (safe for SSR)

---

## 🧠 Mac Compatibility

Keysmaster automatically detects `⌘ Cmd` on macOS. Use:

```ts
const combo = keysmaster.isMac ? 'cmd+s' : 'ctrl+s';
```

---

## 🧪 Example HTML Demo

Check out [`/demo/index.html`](./demo/index.html) for a vanilla HTML/JS demo.

```html
<script type="module">
  import shortcut from './dist/index.js';

  shortcut.init();

  shortcut('ctrl+shift+k', () => {
    alert('Shortcut triggered!');
  });
</script>
```

---

## 🌍 SSR + Node.js Support

Keysmaster safely checks for `window`, `navigator`, and `document` before using them.

It's safe to import and use in:

- ✅ Node.js
- ✅ Next.js
- ✅ Vite / Webpack apps

---

## 🔓 License

MIT — Made with ❤️ by [Amiya Panigrahi](https://devamiya.me)

---

## 📦 Coming Soon

- [ ] Custom key alias maps
- [ ] Wildcard key support (`ctrl+*`)
- [ ] Hook: `useShortcut()` for React

---

### 🔗 Links

- 🧠 GitHub: [github.com/your-username/keysmaster](https://github.com/devamiya/keysmaster)
- 🐞 Report Issues: [GitHub Issues](https://github.com/devamiya/keysmaster/issues)
- 🌍 Homepage: [npmjs.com/package/keysmaster](https://www.npmjs.com/package/keysmaster)

