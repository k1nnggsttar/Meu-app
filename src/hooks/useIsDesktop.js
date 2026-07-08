import { useEffect, useState } from 'react'

export default function useIsDesktop(breakpoint = 1024) {
  const query = `(min-width: ${breakpoint}px)`
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return isDesktop
}
