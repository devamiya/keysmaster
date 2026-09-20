import {
  index_default
} from "./chunk-HFKPMGCA.js";

// src/react.ts
import { useEffect, useRef } from "react";
function useShortcut(combo, callback, options = {}, deps = []) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    index_default.init();
    const handler = (event) => {
      if (callbackRef.current) {
        callbackRef.current(event);
      }
    };
    const unbind = index_default(combo, handler, options);
    return () => {
      unbind();
    };
  }, [combo, options.scope, options.enableInInput, options.preventDefault, options.stopPropagation, ...deps]);
}
var react_default = useShortcut;
export {
  react_default as default,
  useShortcut
};
//# sourceMappingURL=react.js.map