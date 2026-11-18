import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Гонка регионов — Жаңа адамдар',
  description: 'Гонка 7 регионов за новеньких, которых привлекли кампусы. Прозрачная статистика, прогресс к порогам. Главный приз — кэмп для региона-победителя.',
  openGraph: {
    title: 'Гонка регионов — Жаңа адамдар',
    description: 'Рейтинг регионов по привлечённым новичкам. Главный приз — кэмп для региона-победителя.',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased text-slate-900">{children}</body>
    </html>
  )
}
