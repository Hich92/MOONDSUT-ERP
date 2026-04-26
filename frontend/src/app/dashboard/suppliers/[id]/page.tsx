import { redirect } from 'next/navigation'

// Les fournisseurs sont des partenaires — redirection transparente
export default function SupplierDetailPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/partners/${params.id}`)
}
