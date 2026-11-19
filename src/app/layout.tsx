import type { Metadata } from 'next'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Гонка регионов — Жаңа адамдар',
  description: 'Гонка регионов за новеньких, которых привлекли Кампусы. Рейтинг и статистика по городам.',
  openGraph: {
    title: 'Гонка регионов — Жаңа адамдар',
    description: 'Рейтинг регионов по привлечённым новичкам.',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased text-slate-900">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  )
}
