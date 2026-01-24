import { cloneDeep } from 'lodash-es'
import { i18n } from '@/locales'

const t = (key, params) => i18n.global.t(key, params)

export function useForm(initFormData = {}) {
  const formRef = ref(null)
  const formModel = ref(cloneDeep(initFormData))
  const rules = {
    required: {
      required: true,
      message: t('form.required'),
      trigger: ['blur', 'change'],
    },
  }
  const validation = () => {
    return formRef.value?.validate()
  }
  return [formRef, formModel, validation, rules]
}
