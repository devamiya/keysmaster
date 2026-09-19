import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useShortcut } from '../src/react';
import shortcut from '../src/index';

// @ts-ignore
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('useShortcut React Hook', () => {
  let container: HTMLDivElement | null = null;

  beforeEach(() => {
    shortcut.resetBindings();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    shortcut.destroy();
    shortcut.resetBindings();
  });

  it('binds shortcut on mount and unbinds on unmount', () => {
    const cb = vi.fn();

    function TestComponent() {
      useShortcut('ctrl+s', cb);
      return <div>Test</div>;
    }

    const root = createRoot(container!);
    act(() => {
      root.render(<TestComponent />);
    });

    const event = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    });

    document.dispatchEvent(event);
    expect(cb).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });

    document.dispatchEvent(event);
    expect(cb).toHaveBeenCalledTimes(1); // Not called after unmount
  });

  it('updates binding when shortcut combo changes', () => {
    const cb = vi.fn();

    function TestComponent() {
      const [combo, setCombo] = useState('ctrl+a');
      useShortcut(combo, cb);
      return (
        <button id="btn" onClick={() => setCombo('ctrl+b')}>
          Change
        </button>
      );
    }

    const root = createRoot(container!);
    act(() => {
      root.render(<TestComponent />);
    });

    const eventA = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true, bubbles: true });
    const eventB = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true });

    document.dispatchEvent(eventA);
    expect(cb).toHaveBeenCalledTimes(1);

    const btn = container!.querySelector('#btn') as HTMLButtonElement;
    act(() => {
      btn.click();
    });

    document.dispatchEvent(eventA);
    expect(cb).toHaveBeenCalledTimes(1); // Old combo no longer triggers

    document.dispatchEvent(eventB);
    expect(cb).toHaveBeenCalledTimes(2); // New combo triggers
  });
});
