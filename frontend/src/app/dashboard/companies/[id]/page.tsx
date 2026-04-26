import { redirect } from 'next/navigation'

// Les sociétés sont des partenaires — redirection transparente
export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/partners/${params.id}`)
}
