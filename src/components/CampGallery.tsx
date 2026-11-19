'use client'

import { useEffect, useMemo, useState } from 'react'
import { CurvedCarousel } from '@/components/CurvedCarousel'
import { CardsParallax, type iCardItem } from '@/components/ui/scroll-cards'
import { useT } from '@/lib/i18n'

const IMAGES = [
  {
    src: '/images/camp/opt/03-camp.webp',
    alt: 'Моменты Кэмпа',
    title: 'Путь к победе',
    caption: 'Победа начинается с личной инициативы каждого.',
  },
  {
    src: '/images/camp/opt/01-camp.webp',
    alt: 'Кэмп Жаңа адамдар',
    title: 'Кэмп Жаңа адамдар',
    caption: 'Возможность почувствовать себя частью чего-то большего.',
  },
  {
    src: '/images/camp/opt/02-camp.webp',
    alt: 'Атмосфера Кэмпа',
    title: 'Команда и атмосфера',
    caption: 'Взаимная поддержка помогает достигать большего.',
  },
  {
    src: '/images/camp/opt/04-camp.webp',
    alt: 'Моменты Кэмпа',
    title: 'Движение вперёд',
    caption: 'Развитие начинается с действия, а не ожидания.',
  },
  {
    src: '/images/camp/opt/05-camp.webp',
    alt: 'Моменты Кэмпа',
    title: 'Сильные вместе',
    caption: 'Вместе мы можем реализовать то, что поодиночке казалось бы невозможным.',
  },
  {
    src: '/images/camp/opt/06-camp.webp',
    alt: 'Моменты Кэмпа',
    title: 'Энергия регионов',
    caption: 'Сила движения складывается из активности каждого города.',
  },
  {
    src: '/images/camp/opt/07-camp.webp',
    alt: 'Моменты Кэмпа',
    title: 'Награда победителю',
    caption: 'Каждый привлечённый новичок приближает команду к общей победе.',
  },
]

export function CampGallery() {
  const { t } = useT()
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

  const translatedImages = useMemo(
    () => IMAGES.map((img) => ({ ...img, alt: t(img.alt), title: t(img.title), caption: t(img.caption) })),
    [t]
  )

  const cards: iCardItem[] = translatedImages.map((img, i) => ({
    title: img.title,
    description: img.caption,
    src: img.src,
    color: i % 2 === 0 ? '#320066' : '#4c008e',
    textColor: '#ffffff',
  }))

  return (
    <section id="camp" className="relative w-full bg-white text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_10%_10%,rgba(255,164,0,0.10),transparent_40%),radial-gradient(ellipse_at_90%_20%,rgba(76,0,142,0.08),transparent_38%),linear-gradient(180deg,#ffffff_0%,#fcfaff_55%,#f5eefb_100%)]" />
      <div className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#ffa400]/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] top-10 h-[26rem] w-[26rem] rounded-full bg-[#4c008e]/10 blur-3xl" />

      {/* Mobile: stacked scroll cards */}
      <div className="relative md:hidden">
        <CardsParallax items={cards} />
      </div>

      {/* Desktop: CurvedCarousel (scroll-driven) — mounted only on md+ */}
      {isDesktop && <div className="hidden md:block">
        <CurvedCarousel
          images={translatedImages}
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
