'use client'

import Image from 'next/image'

export interface iCardItem {
  title: string
  description: string
  tag?: string
  src: string
  link?: string
  color: string
  textColor: string
}

function Card({ title, description, src, color, textColor }: iCardItem) {
  return (
    <div className="sticky top-0 flex h-screen items-center justify-center px-4">
      <div
        className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-8 py-12 shadow-md md:h-[400px] md:max-w-[600px] md:px-12"
        style={{ backgroundColor: color }}
      >
        <div className="absolute inset-0 z-0">
          <Image
            src={src}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#320066]/45" />
        </div>
        <span className="relative z-10 mt-5 text-4xl font-black tracking-tight md:text-6xl" style={{ color: textColor }}>
          {title}
        </span>
        <div
          className="z-10 mt-2 mb-0 text-center text-lg font-medium leading-[1.4] tracking-wide md:text-2xl"
          style={{ color: textColor }}
        >
          {description}
        </div>
      </div>
    </div>
  )
}

export function CardsParallax({ items }: { items: iCardItem[] }) {
  return (
    <div className="min-h-screen">
      {items.map((item, i) => (
        <Card key={`p_${i}`} {...item} />
      ))}
    </div>
  )
}
