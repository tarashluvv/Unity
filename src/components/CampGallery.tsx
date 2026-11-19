'use client'

import { useEffect, useRef, useState } from 'react'
import { CurvedCarousel } from '@/components/CurvedCarousel'

const IMAGES = [
  {
    src: '/images/camp/opt/03-camp.webp',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
  {
    src: '/images/camp/opt/01-camp.webp',
    alt: 'Кэмп Жаңа адамдар',
    title: 'Кэмп Жаңа адамдар',
    caption: 'Атмосфера, люди и общая цель.',
  },
  {
    src: '/images/camp/opt/02-camp.webp',
    alt: 'Атмосфера кэмпа',
    title: 'Команда и атмосфера',
    caption: 'Новые знакомства и энергия команды.',
  },
  {
    src: '/images/camp/opt/04-camp.webp',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
  {
    src: '/images/camp/opt/05-camp.webp',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
  {
    src: '/images/camp/opt/06-camp.webp',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
  {
    src: '/images/camp/opt/07-camp.webp',
    alt: 'Моменты кэмпа',
    title: 'Путь к победе',
    caption: 'Каждый привлечённый новичок приближает регион к кэмпу.',
  },
]

const layerTransform = (index: number, progress: number) => {
  const start = index / IMAGES.length
  const end = (index + 1) / IMAGES.length
  const local = Math.min(1, Math.max(0, (progress - start) / Math.max(0.0001, end - start)))
  return index < IMAGES.length - 1 ? `translate3d(0, ${(-local * 100).toFixed(3)}%, 0)` : 'translate3d(0, 0, 0)'
}

export function CampGallery() {
  const mobileRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef(new Map<number, HTMLDivElement | null>())
  const progressRef = useRef(0)
  const activeRef = useRef(0)
  const rafRef = useRef(0)
  const [active, setActive] = useState(0)
  const [isDesktop, setIsDesktop] = useState(false)

  // Don't even mount the GSAP carousel on phones: it sets up ScrollTrigger
  // pinning and adds measurable work even when hidden with CSS.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const applyTransforms = () => {
      rafRef.current = 0
      for (let i = 0; i < IMAGES.length; i++) {
        const el = layerRefs.current.get(i)
        if (el) el.style.transform = layerTransform(i, progressRef.current)
      }
    }

    const onScroll = () => {
      const el = mobileRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const total = Math.max(1, el.offsetHeight - window.innerHeight)
      const passed = Math.min(total, Math.max(0, -rect.top))
      const progress = passed / total
      progressRef.current = progress

      const nextActive = Math.min(IMAGES.length - 1, Math.max(0, Math.floor(progress * IMAGES.length + 0.001)))
      if (nextActive !== activeRef.current) {
        activeRef.current = nextActive
        setActive(nextActive)
      }

      // Only write styles inside rAF: no React re-render on every scroll tick.
      if (!rafRef.current) rafRef.current = window.requestAnimationFrame(applyTransforms)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Preload the neighbouring photos so a fast scroll never shows an empty layer.
  useEffect(() => {
    for (const i of [active - 1, active + 1]) {
      if (i < 0 || i >= IMAGES.length) continue
      const img = new Image()
      img.src = IMAGES[i].src
    }
  }, [active])

  return (
    <section id="camp" className="relative w-full bg-white text-white">
      {/* Mobile: full-viewport sticky reveal. Only the current photo and its
          immediate neighbours are mounted, keeping decoded bitmaps low. */}
      <div ref={mobileRef} className="relative md:hidden" style={{ height: `${IMAGES.length * 100}vh`, width: '100vw' }}>
        <div className="sticky top-0 h-[100vh] w-[100vw] overflow-hidden">
          {IMAGES.map((img, i) => {
            if (i < active - 1 || i > active + 1) return null
            return (
              <div
                key={img.src}
                ref={(el) => { layerRefs.current.set(i, el) }}
                className="absolute inset-0 h-full w-full will-change-transform"
                style={{
                  zIndex: IMAGES.length - i,
                  transform: layerTransform(i, progressRef.current),
                  contain: 'paint',
                }}
              >
                <img src={img.src} alt={img.alt} className="h-full w-full object-cover" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#320066]/80 via-[#320066]/20 to-[#320066]/30" />
                <div className="absolute inset-x-0 bottom-0 p-6 pb-12">
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
              <span key={i} className={`h-2.5 w-2.5 rounded-full border border-white/60 transition ${active === i ? 'bg-white' : 'bg-white/20'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: CurvedCarousel (scroll-driven) — mounted only on md+ */}
      {isDesktop && <div className="hidden md:block">
        <div className="mx-auto max-w-7xl px-6 pt-10 lg:px-8">
          <h2 className="text-3xl font-extrabold text-[#4c008e] lg:text-6xl">Моменты из кэмпов</h2>
          <p className="mt-2 mb-8 max-w-2xl text-base text-[#4c008e]/80">Прокручивайте страницу, чтобы листать галерею.</p>
        </div>
        <CurvedCarousel
          images={IMAGES}
          mode="scroll"
          intro
          snap
          height="100vh"
          background="#320066"
          scrollLength={4}
          cardWidth={28}
          className="mt-2"
        />
      </div>}
    </section>
  )
}
