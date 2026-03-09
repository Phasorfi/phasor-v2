// Polyfills for server-side rendering
// This file provides browser API polyfills for the Node.js environment during SSR/build

if (typeof window === 'undefined') {
  // Polyfill indexedDB for server-side
  global.indexedDB = {
    open: () => ({
      result: {
        transaction: () => ({
          objectStore: () => ({
            get: () => ({ onsuccess: null, onerror: null }),
            put: () => ({ onsuccess: null, onerror: null }),
            delete: () => ({ onsuccess: null, onerror: null }),
          }),
        }),
      },
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
    }),
  } as any;
}
