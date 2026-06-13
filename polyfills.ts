/**
 * Polyfills for older browsers and legacy iOS devices.
 *
 * Next.js only injects a few core polyfills (like fetch) by default【754415679369115†L552-L573】.
 * If your code or any of the libraries you consume rely on newer JavaScript
 * language features, you must provide your own polyfills so that the code
 * remains functional on environments such as iOS 12 or Safari 13. This file
 * aggregates lightweight polyfills for some frequently missing features.
 *
 * Note: Import this file in `app/instrumentation-client.ts` to ensure the
 * polyfills are evaluated before any application code executes on the client.
 */

/* eslint-disable no-extend-native */

// -----------------------------------------------------------------------------
// globalThis polyfill
//
// `globalThis` is the standard way to access the global object across
// environments (browsers, Node.js, workers). Older Safari versions
// (particularly prior to iOS 13) do not define `globalThis`. The following
// snippet is adapted from the MDN documentation【747202611831146†L300-L323】 and
// defines `globalThis` using a getter on Object.prototype. It cleans itself up
// afterwards so as not to leave extra properties behind.
(() => {
  if (typeof globalThis === 'undefined') {
    Object.defineProperty(Object.prototype, '__magic__', {
      get() {
        return this;
      },
      configurable: true,
    });
    // @ts-ignore
    // eslint-disable-next-line no-undef
    __magic__.globalThis = __magic__;
    delete (Object.prototype as any).__magic__;
  }
})();

// -----------------------------------------------------------------------------
// Array.prototype.at polyfill
//
// Safari versions prior to 15 do not support the `.at()` method on arrays.
// This polyfill mirrors the behavior described in the TC39 proposal and
// MDN documentation【376218607492324†L204-L208】. It returns the item at a
// positive or negative index, or `undefined` if out of bounds.
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    value: function at<T>(this: T[], index: number): T | undefined {
      // Coerce to integer (handles floats and non-numbers)
      let i = Math.trunc(index) || 0;
      const len = this.length;
      if (i < 0) i += len;
      if (i < 0 || i >= len) return undefined;
      return this[i];
    },
    writable: true,
    configurable: true,
  });
}

// -----------------------------------------------------------------------------
// Promise.allSettled polyfill
//
// Older browsers may lack `Promise.allSettled`. This implementation wraps
// each element of the iterable with a Promise that always resolves with an
// object describing whether the original promise fulfilled or rejected.
if (typeof Promise.allSettled !== 'function') {
  // Cast the polyfilled function to the correct type so TypeScript does
  // not complain when assigning it. The actual runtime behavior aligns
  // with the Promise.allSettled specification, returning an array of
  // objects with a `status` field and either a `value` or `reason`.
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled
  (Promise as any).allSettled = (<T>(
    promises: Iterable<T | PromiseLike<T>>,
  ): Promise<PromiseSettledResult<T>[]> => {
    const wrappedPromises = Array.from(promises).map((p) =>
      Promise.resolve(p).then(
        (value) => ({ status: 'fulfilled', value } as PromiseFulfilledResult<T>),
        (reason) => ({ status: 'rejected', reason } as PromiseRejectedResult),
      ),
    );
    return Promise.all(wrappedPromises);
  }) as PromiseConstructor['allSettled'];
}

// -----------------------------------------------------------------------------
// Object.hasOwn polyfill
//
// Safari < 15 does not support `Object.hasOwn`. Polyfill using the more
// established `hasOwnProperty` method.
if (typeof Object.hasOwn !== 'function') {
  Object.hasOwn = function hasOwn(obj: unknown, prop: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  };
}

// -----------------------------------------------------------------------------
// Additional polyfills can be added here as needed. For example, you might
// polyfill `ResizeObserver` or other browser APIs that your application uses.
// Keep each polyfill wrapped in feature detection to avoid overwriting
// native implementations on modern browsers.