import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrolling; RouteFocus calls scrollTo on route change.
Object.defineProperty(window, 'scrollTo', {
  value: () => undefined,
  writable: true,
})
