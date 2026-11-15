import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrolling; RouteFocus calls scrollTo on route change.
Object.defineProperty(window, 'scrollTo', {
  value: () => undefined,
  writable: true,
})

function createMemoryStorage(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear() {
      items.clear()
    },
    getItem(key) {
      return items.get(key) ?? null
    },
    key(index) {
      return Array.from(items.keys())[index] ?? null
    },
    removeItem(key) {
      items.delete(key)
    },
    setItem(key, value) {
      items.set(key, String(value))
    },
  }
}

if (!window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    value: createMemoryStorage(),
    configurable: true,
  })
}

if (!window.sessionStorage) {
  Object.defineProperty(window, 'sessionStorage', {
    value: createMemoryStorage(),
    configurable: true,
  })
}
