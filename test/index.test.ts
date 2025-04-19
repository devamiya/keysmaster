import shortcut from '../src/index.js';

test('should register shortcut and set scope', () => {
  shortcut('ctrl+x', () => {});
  shortcut.setScope('global');
  expect(shortcut.getBindings().global['ctrl+x']).toBeDefined();
});
