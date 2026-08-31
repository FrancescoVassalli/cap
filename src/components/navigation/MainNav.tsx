import { NavLink, type NavLinkProps } from 'react-router-dom'
import { clsx } from 'clsx'

interface MainNavProps {
  ariaLabel: string
  labels: {
    howWeHelp: string
    getHelp: string
  }
}

const navItems: Array<{ to: NavLinkProps['to']; key: 'howWeHelp' | 'getHelp' }> = [
  { to: '/how-we-help', key: 'howWeHelp' },
  { to: '/intake', key: 'getHelp' },
]

/**
 * Primary site navigation. Active links receive a calm filled treatment and
 * `aria-current="page"` is added automatically by NavLink.
 */
export function MainNav({ ariaLabel, labels }: MainNavProps) {
  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.key}
          to={item.to}
          className={({ isActive }) =>
            clsx(
              'inline-flex min-h-touch min-w-touch items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cap-primary focus-visible:ring-offset-2',
              isActive
                ? 'bg-cap-primary text-white shadow-sm'
                : 'text-slate-700 hover:bg-cap-secondary-50 hover:text-cap-primary border-b-2 border-transparent hover:border-cap-highlight',
            )
          }
        >
          {labels[item.key]}
        </NavLink>
      ))}
    </nav>
  )
}