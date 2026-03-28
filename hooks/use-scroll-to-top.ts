import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function useScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // Smooth scroll to top when pathname changes
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }, [pathname])
}
