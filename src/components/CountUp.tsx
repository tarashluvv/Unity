'use client'
import { useEffect, useState } from 'react'

export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let start: number | null = null
    let raf = 0
    const step = (t: number) => {
      if (start === null) start = t
      const p = Math.min(1, (t - start) / duration)
      const ease = 1 - Math.pow(1 - p, 3)
      setN(Math.round(ease * value))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{n.toLocaleString('ru-RU')}</>
}
