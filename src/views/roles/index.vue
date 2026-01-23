<!--------------------------------
 - Role Permissions
 --------------------------------->

<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        重新整理
      </NButton>
    </template>

    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      striped
    />

    <MeModal ref="editModalRef">
      <n-form label-placement="left" label-width="100">
        <n-form-item label="權限代碼">
          <n-input v-model:value="editState.codes" placeholder="以逗號分隔" />
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup>
import { NButton } from 'naive-ui'
import api from '@/api/role'
import { CommonPage, MeModal } from '@/components'
import { useModal } from '@/composables'

const loading = ref(false)
const rows = ref([])
const [editModalRef, editLoading] = useModal()
const editState = reactive({
  id: '',
  codes: '',
})

const columns = [
  { title: '角色代碼', key: 'code', minWidth: 120 },
  { title: '角色名稱', key: 'name', minWidth: 120 },
  {
    title: '操作',
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
        { default: () => '編輯權限' },
      ),
  },
]

async function fetchList() {
  try {
    loading.value = true
    const { data } = await api.list()
    rows.value = data || []
  }
  catch (error) {
    console.error(error)
    $message.error('讀取角色列表失敗')
  }
  loading.value = false
}

function openEdit(row) {
  editState.id = row.id
  editState.codes = ''
  editModalRef.value?.open({
    title: `編輯權限 - ${row.name}`,
    okText: '儲存',
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
    $message.success('已更新權限')
  }
  catch (error) {
    console.error(error)
    $message.error('更新權限失敗')
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
