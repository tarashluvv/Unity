import UnityHero from '@/components/UnityHero'
import { LangToggle } from '@/lib/i18n'

export const metadata = {
  title: 'Unity',
  description: 'Команда Unity Жаңа адамдар',
  icons: {
    icon: '/images/unity.svg',
    shortcut: '/images/unity.svg',
    apple: '/images/unity.svg',
  },
}

export default function HomePage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#4c008e]">
      <div className="fixed right-4 top-4 z-50">
        <LangToggle />
      </div>
      <section className="h-full w-full">
        <UnityHero />
      </section>
    </main>
  )
}
