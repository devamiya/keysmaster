const bindings = {};
let currentScope = 'global';
let sequenceBuffer = [];
let sequenceTimeout = null;
function normalizeKey(event) {
    const keys = [];
    if (event.ctrlKey)
        keys.push('ctrl');
    if (event.metaKey)
        keys.push('meta');
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
document.addEventListener('keydown', handler, true);
function shortcut(keyCombo, callback, options = {}) {
    const scope = options.scope || 'global';
    if (!bindings[scope])
        bindings[scope] = {};
    bindings[scope][keyCombo.toLowerCase()] = callback;
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
    (_a = bindings[scope]) === null || _a === void 0 ? true : delete _a[keyCombo.toLowerCase()];
};
shortcut.disableAll = function () {
    document.removeEventListener('keydown', handler, true);
};
shortcut.enableAll = function () {
    document.addEventListener('keydown', handler, true);
};
export default shortcut;
