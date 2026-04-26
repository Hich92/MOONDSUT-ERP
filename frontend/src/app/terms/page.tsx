import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation et de Vente",
  description: "Conditions générales d'utilisation (CGU) et de vente (CGV) de MoonDust ERP, logiciel ERP/CRM édité par Haloweenlife co.",
}

function PublicHeader() {
  return (
    <header className="border-b border-white/5 bg-slate-950">
      <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center group-hover:bg-primary/80 transition-colors">
            <Zap className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-white font-semibold text-sm">MoonDust ERP</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Retour
        </Link>
      </div>
    </header>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="mb-10">
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">Documents contractuels</p>
          <h1 className="text-3xl font-bold text-white mb-2">Conditions Générales d'Utilisation et de Vente</h1>
          <p className="text-slate-400 text-sm">Dernière mise à jour : 23 avril 2026 · Version 1.0</p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-slate-200 [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_strong]:text-slate-100">

          <section>
            <h2>1. Présentation et éditeur</h2>
            <p>MoonDust ERP est un logiciel de gestion en mode SaaS (Software as a Service) édité par <strong>Haloweenlife co.</strong>, dont l'adresse de contact est <a href="mailto:haloweenlife@gmail.com" className="text-primary hover:underline">haloweenlife@gmail.com</a>.</p>
            <p>La plateforme est accessible à l'adresse <a href="https://portal.moondust.cloud" className="text-primary hover:underline">portal.moondust.cloud</a>.</p>
            <p>MoonDust ERP est actuellement en <strong>phase alpha/bêta</strong>. Le rollout commercial officiel est prévu pour <strong>septembre 2026</strong>.</p>
          </section>

          <section>
            <h2>2. Acceptation des conditions</h2>
            <p>L'utilisation de MoonDust ERP implique l'acceptation sans réserve des présentes CGU/CGV. En créant un compte, l'utilisateur reconnaît avoir lu et accepté l'ensemble des présentes conditions.</p>
          </section>

          <section>
            <h2>3. Description du service</h2>
            <p>MoonDust ERP est un logiciel de gestion d'entreprise proposant les fonctionnalités suivantes :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Gestion de contacts, partenaires et fournisseurs (CRM)</li>
              <li>Suivi des opportunités commerciales (pipeline)</li>
              <li>Gestion des contrats clients et fournisseurs</li>
              <li>Gestion de projets et tâches</li>
              <li>Émission et suivi de factures</li>
              <li>Wiki interne et gestion documentaire</li>
              <li>Tableaux de bord et indicateurs de performance</li>
            </ul>
            <h3>3.1 Plan BASIC (gratuit)</h3>
            <p>Le plan BASIC donne accès à l'ensemble des fonctionnalités actuellement disponibles, gratuitement et sans limitation de durée sur les fonctionnalités de base.</p>
            <h3>3.2 Plans futurs (PRO et FULL)</h3>
            <p>Des plans payants (PRO et FULL) seront proposés à partir de septembre 2026. Leurs conditions tarifaires seront publiées préalablement à leur mise en vente et feront l'objet d'une mise à jour des présentes CGV.</p>
          </section>

          <section>
            <h2>4. Inscription et compte utilisateur</h2>
            <p>L'accès au service nécessite la création d'un compte. L'utilisateur s'engage à :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fournir des informations exactes et à les maintenir à jour</li>
              <li>Choisir un mot de passe sécurisé (minimum 8 caractères) et à ne pas le divulguer</li>
              <li>Ne pas créer de comptes multiples avec la même identité</li>
              <li>Notifier immédiatement tout accès non autorisé à son compte</li>
            </ul>
            <p>Haloweenlife co. se réserve le droit de suspendre ou supprimer tout compte ne respectant pas les présentes CGU.</p>
          </section>

          <section>
            <h2>5. Données et propriété</h2>
            <p><strong>Données utilisateur :</strong> L'utilisateur conserve la pleine propriété de l'ensemble des données qu'il saisit dans la plateforme. Haloweenlife co. n'exploite pas ces données à des fins commerciales.</p>
            <p><strong>Droit de portabilité :</strong> L'utilisateur peut demander l'export de ses données à tout moment en contactant <a href="mailto:haloweenlife@gmail.com" className="text-primary hover:underline">haloweenlife@gmail.com</a>.</p>
          </section>

          <section>
            <h2>6. Disponibilité et niveau de service</h2>
            <p>Pendant la phase alpha/bêta, Haloweenlife co. ne garantit pas un niveau de disponibilité spécifique (SLA). La plateforme est fournie "en l'état" (<em>as-is</em>). Des interruptions de service peuvent survenir pour maintenance ou évolution.</p>
            <p>En contrepartie de cette absence de garantie de disponibilité, le service est fourni gratuitement pendant toute la phase de test.</p>
          </section>

          <section>
            <h2>7. Utilisation acceptable</h2>
            <p>Il est interdit d'utiliser MoonDust ERP pour :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Toute activité illégale ou frauduleuse</li>
              <li>La collecte ou le traitement de données à caractère personnel sans base légale</li>
              <li>La diffusion de contenu illicite, diffamatoire ou portant atteinte aux droits de tiers</li>
              <li>Des tentatives d'accès non autorisé aux systèmes ou aux données d'autres utilisateurs</li>
              <li>La revente ou la mise à disposition du service à des tiers sans autorisation écrite</li>
            </ul>
          </section>

          <section>
            <h2>8. Limitation de responsabilité</h2>
            <p>Haloweenlife co. ne peut être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser le service, notamment la perte de données, de revenus ou de bénéfices.</p>
            <p>L'utilisateur est seul responsable de la sauvegarde de ses données critiques (les plans payants incluront des sauvegardes automatiques).</p>
          </section>

          <section>
            <h2>9. Propriété intellectuelle</h2>
            <p>L'ensemble des éléments constituant MoonDust ERP (code source, interface, marques, logos) est la propriété exclusive de Haloweenlife co. et est protégé par les lois en vigueur sur la propriété intellectuelle.</p>
            <p>Toute reproduction, représentation ou redistribution sans autorisation préalable est strictement interdite.</p>
          </section>

          <section>
            <h2>10. Résiliation</h2>
            <p>L'utilisateur peut résilier son compte à tout moment en contactant <a href="mailto:haloweenlife@gmail.com" className="text-primary hover:underline">haloweenlife@gmail.com</a>. La résiliation entraîne la suppression des données dans un délai de 30 jours.</p>
            <p>Haloweenlife co. se réserve le droit de résilier un compte en cas de violation des présentes CGU, après notification préalable sauf en cas de faute grave.</p>
          </section>

          <section>
            <h2>11. Modifications des CGU/CGV</h2>
            <p>Haloweenlife co. se réserve le droit de modifier les présentes conditions à tout moment. Les utilisateurs seront informés par e-mail ou par notification dans l'interface au moins 30 jours avant l'entrée en vigueur des modifications.</p>
          </section>

          <section>
            <h2>12. Droit applicable et juridiction</h2>
            <p>Les présentes CGU/CGV sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux compétents seront ceux du ressort du siège social de Haloweenlife co.</p>
          </section>

          <section>
            <h2>13. Contact</h2>
            <p>Pour toute question relative aux présentes conditions : <a href="mailto:haloweenlife@gmail.com" className="text-primary hover:underline">haloweenlife@gmail.com</a></p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 px-5 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} Haloweenlife co. — MoonDust ERP</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Confidentialité</Link>
            <Link href="/sitemap" className="hover:text-slate-400 transition-colors">Plan du site</Link>
            <Link href="/"        className="hover:text-slate-400 transition-colors">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
