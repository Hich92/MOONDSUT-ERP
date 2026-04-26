import { Truck }   from 'lucide-react'
import { FormPage, type FieldConfig } from '@/components/modules/FormPage'
import { getLocale } from '@/lib/get-locale'
import { getT }      from '@/lib/i18n'

export default async function NewSupplierPage() {
  const t = getT(getLocale())

  const fields: FieldConfig[] = [
    {
      name: 'name', label: t('field.name'), type: 'text',
      required: true, span: true, placeholder: 'Acme Corp',
      tooltip: t('field.name_tip'),
    },
    {
      name: 'type', label: t('field.type'), type: 'select', defaultValue: 'services',
      options: [
        { value: 'services', label: t('opt.services') },
        { value: 'goods',    label: t('opt.goods')    },
        { value: 'mixed',    label: t('opt.mixed')    },
      ],
      tooltip: t('field.type_tip'),
    },
    {
      name: 'payment_terms', label: t('field.payment_terms'), type: 'select', defaultValue: '30',
      options: [
        { value: '0',  label: 'Immédiat'  },
        { value: '15', label: '15 jours'  },
        { value: '30', label: '30 jours'  },
        { value: '45', label: '45 jours'  },
        { value: '60', label: '60 jours'  },
        { value: '90', label: '90 jours'  },
      ],
      tooltip: t('field.payment_terms_tip'),
    },
    {
      name: 'email', label: t('field.email'), type: 'email',
      placeholder: 'contact@fournisseur.fr',
      tooltip: t('field.email_tip'),
    },
    {
      name: 'phone', label: t('field.phone'), type: 'tel',
      placeholder: '+33 1 23 45 67 89',
      tooltip: t('field.phone_tip'),
    },
    {
      name: 'siren', label: 'SIREN', type: 'text',
      placeholder: '123 456 789',
      tooltip: t('field.siret_tip'),
    },
    {
      name: 'address', label: t('field.address'), type: 'text', span: true,
      placeholder: '1 rue de la Paix, 75001 Paris',
      tooltip: t('field.address_tip'),
    },
    {
      name: 'city', label: t('field.city'), type: 'text',
      placeholder: 'Paris',
      tooltip: t('field.city_tip'),
    },
    {
      name: 'country', label: t('field.country'), type: 'text',
      placeholder: 'France',
      tooltip: t('field.country_tip'),
    },
    {
      name: 'notes', label: t('field.notes'), type: 'textarea', span: true,
      tooltip: t('field.notes_tip'),
    },
  ]

  return (
    <FormPage
      title={t('suppliers.new')}
      iconNode={<Truck className="w-4 h-4" />}
      fields={fields}
      apiTable="suppliers"
      backHref="/dashboard/suppliers"
    />
  )
}
