import { redirect } from 'next/navigation'

export default function NewContactRedirect() {
  redirect('/dashboard/partners/new')
}
