// Tiny observable state container for the side panel.

const shallowEqual = (a, b) =>
  Array.isArray(a) && Array.isArray(b)
    ? a.length === b.length && a.every((v, i) => Object.is(v, b[i]))
    : Object.is(a, b);

export function createStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  function get() {
    return state;
  }

  /** Merge a patch (or the patch returned by `fn(state)`) and notify listeners. */
  function set(update) {
    const prev = state;
    const patch = typeof update === "function" ? update(state) : update;
    state = { ...state, ...patch };
    for (const listener of [...listeners]) listener(state, prev);
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  /**
   * Call `callback(value, previous)` now and whenever `select(state)` changes.
   * Selectors may return an array; it's compared item by item.
   */
  function watch(select, callback) {
    let current = select(state);
    callback(current, undefined);
    return subscribe((next) => {
      const value = select(next);
      if (shallowEqual(value, current)) return;
      const previous = current;
      current = value;
      callback(value, previous);
    });
  }

  return { get, set, subscribe, watch };
}
