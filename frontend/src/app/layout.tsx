import type { Metadata } from 'next'
import './globals.css'
import { PreferencesProvider } from '@/components/providers/PreferencesProvider'

export const metadata: Metadata = {
  title: {
    default: 'MoonDust ERP — Logiciel ERP/CRM pour PME',
    template: '%s | MoonDust ERP',
  },
  description:
    'MoonDust ERP est un logiciel ERP/CRM nouvelle génération pour PME françaises. Gérez vos contrats, opportunités, projets, tâches et factures depuis une interface unifiée. Accès BASIC gratuit. Rollout officiel prévu septembre 2026.',
  keywords: [
    'ERP', 'CRM', 'PME', 'gestion commerciale', 'contrats', 'opportunités',
    'projets', 'factures', 'logiciel gestion', 'ERP français', 'CRM PME',
    'gestion relation client', 'pipeline commercial', 'facturation',
  ],
  authors: [{ name: 'Haloweenlife co.' }],
  creator: 'Haloweenlife co.',
  publisher: 'Haloweenlife co.',
  metadataBase: new URL('https://portal.moondust.cloud'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://portal.moondust.cloud',
    siteName: 'MoonDust ERP',
    title: 'MoonDust ERP — L\'ERP qui s\'adapte à votre vitesse',
    description:
      'Logiciel ERP/CRM pour PME françaises. Contrats, CRM, projets, facturation — tout-en-un. Gratuit en accès anticipé.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MoonDust ERP — Logiciel ERP/CRM pour PME',
    description: 'Logiciel ERP/CRM pour PME françaises. Gratuit en accès anticipé (phase alpha).',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: 'https://portal.moondust.cloud',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <PreferencesProvider>{children}</PreferencesProvider>
      </body>
    </html>
  )
}
