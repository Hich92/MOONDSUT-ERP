import { Building2 }   from 'lucide-react'
import { PartnerForm } from '@/components/modules/PartnerForm'
import { getLocale }   from '@/lib/get-locale'
import { getT }        from '@/lib/i18n'

export default async function NewPartnerPage({
  searchParams,
}: { searchParams: { is_company?: string; type?: string; parent_id?: string } }) {
  const t         = getT(getLocale())
  const isCompany = searchParams.is_company === 'true'
  const initType  = searchParams.type ?? 'contact'
  const parentId  = searchParams.parent_id ? Number(searchParams.parent_id) : undefined

  return (
    <div className="flex flex-col min-h-screen">
      <header className="page-header">
        <div className="flex items-center gap-3">
          <div className="brand-icon">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="page-heading">
              {isCompany ? t('partners.new_company') : t('partners.new_person')}
            </h1>
            <p className="text-xs text-muted-foreground">{t('partners.subtitle')}</p>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto">
        <PartnerForm
          initialIsCompany={isCompany}
          initialType={initType}
          initialParentId={parentId}
          backHref="/dashboard/partners"
        />
      </div>
    </div>
  )
}
