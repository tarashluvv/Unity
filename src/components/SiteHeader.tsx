'use client'

import { useEffect, useState } from 'react'
import { LangToggle, useT } from '@/lib/i18n'

export function SiteHeader({ base = '/camp2026' }: { base?: string }) {
  const { t } = useT()
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 12)
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? Math.min(100, (y / h) * 100) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${scrolled ? 'border-b border-[#e9e0f2] bg-white/90 backdrop-blur-xl shadow-sm' : 'border-b border-transparent bg-white/70 backdrop-blur-md sm:bg-white/40'}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-3 sm:py-3 lg:px-4">
        <a href={base} className="group flex min-w-0 items-center" aria-label={t('На главную')}>
          <img src="/images/logo.svg" alt="Жаңа адамдар. Unity" className="h-9 w-auto shrink-0 transition-transform duration-300 group-hover:scale-[1.02] sm:h-11" />
        </a>
        <nav className="flex items-center gap-1.5 text-sm sm:gap-2">
          <a href={`${base}#camp`} className="hidden rounded-full px-3 py-2 font-semibold text-[#4c008e]/80 transition hover:bg-[#f5eefb] hover:text-[#4c008e] md:inline">{t('Кэмп')}</a>
          <a href={`${base}#leaderboard`} className="rounded-full bg-[#ffa400] px-3.5 py-2 font-semibold text-white shadow-sm transition hover:bg-[#e69400] sm:px-4">{t('Лидерборд')}</a>
          <LangToggle />
        </nav>
      </div>
      <div className="h-[2px] w-full bg-transparent">
        <div className="h-full bg-gradient-to-r from-[#ffa400] via-[#ffb52e] to-[#ffa400] transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
    </header>
  )
}
