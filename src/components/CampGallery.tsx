'use client'

import { useEffect, useRef, useState } from 'react'
import { CurvedCarousel } from '@/components/CurvedCarousel'

const IMAGES = [
  {
    src: '/images/camp/03-camp.jpg',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
  {
    src: '/images/camp/01-camp.webp',
    alt: 'Кэмп Жаңа адамдар',
    title: 'Кэмп для региона',
    caption: 'Главный приз — поездка в кэмп для региона-победителя.',
  },
  {
    src: '/images/camp/02-camp.jpg',
    alt: 'Атмосфера кэмпа',
    title: 'Команда и атмосфера',
    caption: 'Новые знакомства, энергия и общая цель.',
  },
  
  {
    src: '/images/camp/04-camp.jpg',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
  {
    src: '/images/camp/05-camp.jpg',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
  {
    src: '/images/camp/06-camp.jpg',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
  {
    src: '/images/camp/07-camp.jpg',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
]

export function CampGallery() {
  const mobileRef = useRef<HTMLDivElement>(null)
  const [mobileProgress, setMobileProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const el = mobileRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = Math.max(1, el.offsetHeight - window.innerHeight)
      const passed = Math.min(total, Math.max(0, -rect.top))
      setMobileProgress(passed / total)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const activeMobile = Math.min(IMAGES.length - 1, Math.floor(mobileProgress * IMAGES.length + 0.001))

  return (
    <section id="camp" className="relative w-full bg-white text-white">
      {/* Mobile: full-viewport sticky reveal (previous goes up, next appears from under) */}
      <div ref={mobileRef} className="relative md:hidden" style={{ height: `${IMAGES.length * 100}vh`, width: '100vw' }}>
        <div className="sticky top-0 h-[100vh] w-[100vw] overflow-hidden">
          {IMAGES.map((img, i) => {
            const start = i / IMAGES.length
            const end = (i + 1) / IMAGES.length
            const local = Math.min(1, Math.max(0, (mobileProgress - start) / Math.max(0.0001, end - start)))
            const translate = i < IMAGES.length - 1 ? -local * 100 : 0
            return (
              <div
                key={img.src}
                className="absolute inset-0 h-full w-full will-change-transform"
                style={{ zIndex: IMAGES.length - i, transform: `translateY(${translate}%)` }}
              >
                <img src={img.src} alt={img.alt} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#241814]/80 via-[#241814]/20 to-[#241814]/30" />
                <div className="absolute inset-x-0 bottom-0 p-6 pb-12">
                  <div className="mb-2 inline-flex rounded-full bg-[#1d6f42] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Кэмп — главный приз</div>
                  <h3 className="text-2xl font-extrabold leading-tight">{img.title}</h3>
                  <p className="mt-2 max-w-md text-sm text-white/85">{img.caption}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-white/70">
                    <span>{i + 1} / {IMAGES.length}</span>
                    {i < IMAGES.length - 1 && <span className="animate-bounce">↓ листайте</span>}
                  </div>
                </div>
              </div>
            )
          })}
          <div className="pointer-events-none absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
            {IMAGES.map((_, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full border border-white/60 transition ${activeMobile === i ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: CurvedCarousel (scroll-driven) */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
          <div className="mb-2 inline-flex rounded-full bg-[#1d6f42] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">Главный приз</div>
          <h2 className="text-3xl font-extrabold text-[#3b2a22] lg:text-6xl">Моменты из кэмпов</h2>
          <p className="mt-2 max-w-2xl text-base text-[#3b2a22]/80 mb-8">Прокручивайте страницу, чтобы листать галерею — регион-победитель едет в кэмп.</p>
        </div>
        <CurvedCarousel
          images={IMAGES}
          mode="scroll"
          intro
          snap
          height="100vh"
          background="#241814"
          scrollLength={4}
          cardWidth={28}
          className="mt-2"
        />
      </div>
    </section>
  )
}
