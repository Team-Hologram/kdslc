/**
 * Client instrumentation entry point.
 *
 * This file is executed before your application code runs on the client. We use
 * it to import lightweight polyfills that normalize missing APIs on older
 * browsers and iOS devices. Without these polyfills, modern syntax in
 * dependencies (such as optional chaining) or missing global APIs can cause
 * blank pages, broken buttons or unresponsive UI on legacy Safari versions. See
 * the Next.js documentation for more on instrumenting client behavior and
 * polyfills【754415679369115†L575-L600】.
 */

// Import global polyfills. The file defines polyfills for `globalThis`,
// `Array.prototype.at`, `Promise.allSettled`, `Object.hasOwn` and other
// features that are missing on some older browsers. Because this file runs
// before any other client code, it ensures those features are available when
// dependencies are evaluated.
import '../polyfills'

// Add additional client‑side instrumentation or observability hooks here if
// necessary. For example, you could initialize performance monitoring or
// analytics services.