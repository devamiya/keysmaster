import { useEffect, useRef } from 'react';
import shortcut, { ShortcutCallback, ShortcutOptions } from './index';

/**
 * React hook to register a keyboard shortcut or sequence.
 * Automatically initializes the shortcut listener and unbinds on unmount or options change.
 *
 * @param combo Keyboard shortcut combination e.g. 'mod+s', 'ctrl+k ctrl+c'
 * @param callback Callback function executed when shortcut triggers
 * @param options Shortcut configuration options (scope, enableInInput, preventDefault, stopPropagation)
 * @param deps Additional dependency array to re-bind when changed
 */
export function useShortcut(
  combo: string,
  callback: ShortcutCallback,
  options: ShortcutOptions = {},
  deps: any[] = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    shortcut.init();

    const handler: ShortcutCallback = (event) => {
      if (callbackRef.current) {
        callbackRef.current(event);
      }
    };

    const unbind = shortcut(combo, handler, options);

    return () => {
      unbind();
    };
  }, [combo, options.scope, options.enableInInput, options.preventDefault, options.stopPropagation, ...deps]);
}

export default useShortcut;
