import { redirect } from 'next/navigation'

export default function ContactDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/dashboard/partners/${params.id}`)
}
