import { redirect } from 'next/navigation'

export default function ContactsRedirect() {
  redirect('/dashboard/partners?kind=per')
}
