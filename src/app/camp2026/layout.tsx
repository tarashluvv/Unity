import type { Metadata } from 'next'

export const metadata: Metadata = {
  icons: {
    icon: '/images/YellowLogoZha.svg',
    shortcut: '/images/YellowLogoZha.svg',
    apple: '/images/YellowLogoZha.svg',
  },
}

export default function CampLayout({ children }: { children: React.ReactNode }) {
  return children
}
