import { redirect } from 'next/navigation'

// Les fournisseurs sont désormais des partenaires avec type='fournisseur'
export default function SuppliersPage() {
  redirect('/dashboard/partners?type=fournisseur')
}
