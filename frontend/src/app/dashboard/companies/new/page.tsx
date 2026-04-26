import { redirect } from 'next/navigation'

export default function NewCompanyRedirect() {
  redirect('/dashboard/partners/new?is_company=true')
}
