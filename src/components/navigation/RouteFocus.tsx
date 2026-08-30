import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Restores a natural starting view on route changes: scrolls to the top and
 * moves keyboard/interaction focus to the page heading so screen-reader users
 * know a new page is present. Place once inside the router.
 */
export function RouteFocus() {
  const { pathname } = useLocation()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const main = document.getElementById('main-content')
      const heading = main?.querySelector<HTMLHeadingElement>('h1')
      if (heading) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      }
    })

    try {
      window.scrollTo(0, 0)
    } catch {
      // jsdom does not implement scrolling
    }

    return () => window.cancelAnimationFrame(frame)
  }, [pathname])

  return null
}