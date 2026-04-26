import Link from 'next/link'
import { Zap, ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et de traitement des données personnelles de MoonDust ERP. Conformité RGPD.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white antialiased">
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

      <main className="max-w-3xl mx-auto px-5 py-12">
        <div className="mb-10">
          <p className="text-primary text-xs font-semibold uppercase tracking-wider mb-2">RGPD & Vie privée</p>
          <h1 className="text-3xl font-bold text-white mb-2">Politique de confidentialité</h1>
          <p className="text-slate-400 text-sm">Dernière mise à jour : 23 avril 2026 · Version 1.0</p>
        </div>

        <div className="space-y-8 text-slate-300 text-sm leading-relaxed [&_h2]:text-white [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-slate-200 [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_strong]:text-slate-100">

          <section>
            <h2>1. Responsable du traitement</h2>
            <p><strong>Haloweenlife co.</strong> est responsable du traitement des données personnelles collectées via MoonDust ERP. Contact : <a href="mailto:haloweenlife@gmail.com" className="text-primary hover:underline">haloweenlife@gmail.com</a></p>
          </section>

          <section>
            <h2>2. Données collectées</h2>
            <h3>2.1 Données de compte</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom et prénom</li>
              <li>Adresse e-mail</li>
              <li>Mot de passe (stocké sous forme hachée)</li>
              <li>Date et heure de création du compte</li>
            </ul>
            <h3>2.2 Données saisies dans l'application</h3>
            <p>L'ensemble des informations métier saisies (contacts, contrats, factures, etc.) sont des données dont l'utilisateur reste propriétaire. Elles sont stockées sur nos serveurs uniquement pour assurer le fonctionnement du service.</p>
            <h3>2.3 Données techniques</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Adresse IP (logs de connexion — conservation 90 jours)</li>
              <li>Cookies de session (nécessaires au fonctionnement)</li>
              <li>Navigateur et système d'exploitation (diagnostics)</li>
            </ul>
          </section>

          <section>
            <h2>3. Finalités du traitement</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Fourniture et amélioration du service</li>
              <li>Authentification et sécurité du compte</li>
              <li>Envoi d'e-mails transactionnels (confirmation de compte, réinitialisation de mot de passe, notifications importantes)</li>
              <li>Support client</li>
            </ul>
            <p>Haloweenlife co. <strong>ne revend pas</strong> et <strong>ne cède pas</strong> les données personnelles à des tiers à des fins commerciales.</p>
          </section>

          <section>
            <h2>4. Base légale des traitements</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Exécution du contrat</strong> — pour la fourniture du service</li>
              <li><strong>Intérêt légitime</strong> — pour la sécurité et l'amélioration du service</li>
              <li><strong>Obligation légale</strong> — pour la conservation de certains logs</li>
            </ul>
          </section>

          <section>
            <h2>5. Durée de conservation</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Données de compte actif :</strong> Durée de vie du compte</li>
              <li><strong>Après suppression du compte :</strong> 30 jours maximum, puis suppression définitive</li>
              <li><strong>Logs de connexion :</strong> 90 jours</li>
              <li><strong>Données de facturation (plans payants) :</strong> 10 ans (obligation légale)</li>
            </ul>
          </section>

          <section>
            <h2>6. Cookies</h2>
            <p>MoonDust ERP utilise uniquement des cookies strictement nécessaires au fonctionnement :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>connect.sid</strong> — Cookie de session Saltcorn (authentification, httpOnly)</li>
              <li><strong>md_uid / md_role</strong> — Identifiants de session côté Next.js (non httpOnly, lecture client)</li>
            </ul>
            <p>Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
          </section>

          <section>
            <h2>7. Hébergement et sous-traitants</h2>
            <p>Les données sont hébergées sur des serveurs situés en <strong>Europe</strong>. La liste des sous-traitants est disponible sur demande à <a href="mailto:haloweenlife@gmail.com" className="text-primary hover:underline">haloweenlife@gmail.com</a>.</p>
          </section>

          <section>
            <h2>8. Vos droits (RGPD)</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Droit d'accès</strong> — obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification</strong> — corriger des données inexactes</li>
              <li><strong>Droit à l'effacement</strong> — demander la suppression de votre compte et données</li>
              <li><strong>Droit à la portabilité</strong> — recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> — s'opposer à certains traitements</li>
              <li><strong>Droit à la limitation</strong> — restreindre le traitement dans certains cas</li>
            </ul>
            <p>Pour exercer ces droits, contactez : <a href="mailto:haloweenlife@gmail.com" className="text-primary hover:underline">haloweenlife@gmail.com</a></p>
            <p>Vous disposez également du droit d'introduire une réclamation auprès de la <strong>CNIL</strong> (<a href="https://www.cnil.fr" className="text-primary hover:underline" target="_blank" rel="noreferrer">cnil.fr</a>).</p>
          </section>

          <section>
            <h2>9. Sécurité</h2>
            <p>Haloweenlife co. met en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Connexions chiffrées (HTTPS/TLS via Caddy)</li>
              <li>Mots de passe hachés côté serveur</li>
              <li>Tokens d'authentification avec durée de validité limitée</li>
              <li>Architecture réseau isolée (base de données non exposée)</li>
            </ul>
          </section>

          <section>
            <h2>10. Modifications de la politique</h2>
            <p>Cette politique peut être mise à jour. Toute modification substantielle sera notifiée par e-mail au moins 30 jours avant son entrée en vigueur.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-white/5 py-8 px-5 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>© {new Date().getFullYear()} Haloweenlife co. — MoonDust ERP</span>
          <div className="flex items-center gap-4">
            <Link href="/terms"   className="hover:text-slate-400 transition-colors">CGU / CGV</Link>
            <Link href="/sitemap" className="hover:text-slate-400 transition-colors">Plan du site</Link>
            <Link href="/"        className="hover:text-slate-400 transition-colors">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
