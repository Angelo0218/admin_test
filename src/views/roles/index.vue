<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        {{ t('common.refresh') }}
      </NButton>
    </template>

    <ResponsiveTable
      :columns="columns"
      :data="rows"
      :loading="loading"
    >
      <template #card="{ row }">
        <div class="card-border rounded-8 auto-bg p-12">
          <div class="flex items-center justify-between gap-8">
            <div class="text-14 font-600">
              {{ row.code || '-' }}
            </div>
            <NButton size="small" @click="openEdit(row)">
              {{ t('rolesPage.edit.title') }}
            </NButton>
          </div>
          <div class="mt-8 text-12 opacity-70">
            {{ roleLabel(row.code) }}
          </div>
        </div>
      </template>
    </ResponsiveTable>

    <MeModal ref="editModalRef">
      <n-form label-placement="left" label-width="100">
        <n-form-item :label="t('rolesPage.labels.permissions')">
          <n-input v-model:value="editState.codes" :placeholder="t('rolesPage.edit.placeholder')" />
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup>
import { NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/role'
import { CommonPage, MeModal, ResponsiveTable } from '@/components'
import { useModal } from '@/composables'

const { t } = useI18n()
const loading = ref(false)
const rows = ref([])
const [editModalRef, editLoading] = useModal()
const editState = reactive({
  id: '',
  codes: '',
})

const columns = computed(() => [
  { title: t('rolesPage.labels.code'), key: 'code', minWidth: 120 },
  { title: t('rolesPage.labels.name'), key: 'name', minWidth: 120, render: row => roleLabel(row.code) },
  {
    title: t('common.actions'),
    key: 'actions',
    minWidth: 120,
    align: 'right',
    render: row =>
      h(
        NButton,
        {
          size: 'small',
          onClick: () => openEdit(row),
        },
        { default: () => t('rolesPage.edit.title') },
      ),
  },
])

function roleLabel(code) {
  const key = `roles.${code}`
  const label = t(key)
  return label === key ? code : label
}

async function fetchList() {
  try {
    loading.value = true
    const { data } = await api.list()
    rows.value = data || []
  }
  catch (error) {
    console.error(error)
    $message.error(t('rolesPage.list.fetchFailed'))
  }
  loading.value = false
}

function openEdit(row) {
  editState.id = row.id
  editState.codes = ''
  editModalRef.value?.open({
    title: `${t('rolesPage.edit.title')} - ${roleLabel(row.code)}`,
    okText: t('common.save'),
    onOk: handleSave,
  })
}

async function handleSave() {
  try {
    editLoading.value = true
    const permissionCodes = editState.codes
      ? editState.codes.split(',').map(item => item.trim()).filter(Boolean)
      : []
    await api.updatePermissions(editState.id, { permissionCodes: permissionCodes.length ? permissionCodes : ['placeholder'] })
    $message.success(t('rolesPage.edit.success'))
  }
  catch (error) {
    console.error(error)
    $message.error(t('rolesPage.edit.failed'))
    return false
  }
  finally {
    editLoading.value = false
  }
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
