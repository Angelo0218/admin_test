import { cloneDeep } from 'lodash-es'
import { i18n } from '@/locales'
import { useForm, useModal } from '.'

const t = (key, params) => i18n.global.t(key, params)

const ACTIONS = {
  view: () => t('common.view'),
  edit: () => t('common.edit'),
  add: () => t('common.create'),
}

export function useCrud({ name, initForm = {}, doCreate, doDelete, doUpdate, refresh }) {
  const modalAction = ref('')
  const [modalRef, okLoading] = useModal()
  const [modalFormRef, modalForm, validation] = useForm(initForm)

  function handleAdd(row = {}, title) {
    handleOpen({ action: 'add', title, row: Object.assign({}, cloneDeep(initForm), cloneDeep(row)) })
  }

  function handleEdit(row, title) {
    handleOpen({ action: 'edit', title, row })
  }

  function handleView(row, title) {
    handleOpen({ action: 'view', title, row })
  }

  function handleOpen(options = {}) {
    const { action, row, title, onOk } = options
    modalAction.value = action
    modalForm.value = { ...row }
    modalRef.value?.open({
      ...options,
      async onOk() {
        if (typeof onOk === 'function') {
          return await onOk()
        }
        return await handleSave()
      },
      title: title ?? `${ACTIONS[modalAction.value]?.() || ''}${name}`,
    })
  }

  async function handleSave(action) {
    if (!action && !['edit', 'add'].includes(modalAction.value)) {
      return false
    }
    await validation()
    const actions = {
      add: {
        api: () => doCreate(modalForm.value),
        cb: () => $message.success(t('crud.createSuccess')),
      },
      edit: {
        api: () => doUpdate(modalForm.value),
        cb: () => $message.success(t('crud.updateSuccess')),
      },
    }

    action = action || actions[modalAction.value]

    try {
      okLoading.value = true
      const data = await action.api()
      action.cb()
      okLoading.value = false
      data && refresh(data)
    }
    catch (error) {
      console.error(error)
      okLoading.value = false
      return false
    }
  }

  function handleDelete(id, confirmOptions) {
    if (!id && id !== 0)
      return
    const dialog = $dialog.warning({
      content: t('crud.deleteConfirmContent'),
      title: t('crud.deleteConfirmTitle'),
      positiveText: t('common.confirm'),
      negativeText: t('common.cancel'),
      async onPositiveClick() {
        try {
          dialog.loading = true
          const data = await doDelete(id)
          $message.success(t('crud.deleteSuccess'))
          dialog.loading = false
          refresh(data, true)
        }
        catch (error) {
          console.error(error)
          dialog.loading = false
        }
      },
      ...confirmOptions,
    })
  }

  return {
    modalRef,
    modalFormRef,
    modalAction,
    modalForm,
    okLoading,
    validation,
    handleAdd,
    handleDelete,
    handleEdit,
    handleView,
    handleOpen,
    handleSave,
  }
}
