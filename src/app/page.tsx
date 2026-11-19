import UnityHero from '@/components/UnityHero'

export const metadata = {
  title: 'Жаңа адамдар',
  description: 'Команда Жаңа адамдар',
}

export default function HomePage() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-[#4c008e]">
      <section className="h-full w-full">
        <UnityHero />
      </section>
    </main>
  )
}
