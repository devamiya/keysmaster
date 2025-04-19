# keysmaster

🎹 A tiny JavaScript library to manage keyboard shortcuts and sequences with scoping and debounce.

## 🚀 Install

```bash
npm install keysmaster
```


# usgae

```js
import shortcut from 'keysmaster';

shortcut('ctrl+k', () => alert('Ctrl+K pressed!'));

// Set scope
shortcut('ctrl+b', () => console.log('Bold'), { scope: 'editor' });
shortcut.setScope('editor');
```