<!--------------------------------
 - User List
 --------------------------------->

<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        重新整理
      </NButton>
    </template>

    <div class="mb-16 flex flex-wrap gap-12">
      <n-select v-model:value="filters.status" :options="statusOptions" placeholder="狀態" class="w-160" />
      <n-input v-model:value="filters.keyword" placeholder="搜尋帳號或姓名" class="w-220" />
    </div>

    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      striped
    />

    <MeModal ref="disableModalRef">
      <n-form label-placement="left" label-width="80">
        <n-form-item label="停用原因">
          <n-input v-model:value="disableState.reason" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
    </MeModal>

    <MeModal ref="resetModalRef">
      <n-form label-placement="left" label-width="80">
        <n-form-item label="新密碼">
          <n-input v-model:value="resetState.password" placeholder="預設 123456" />
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import { NButton, NTag } from 'naive-ui'
import api from '@/api/user'
import { CommonPage, MeModal } from '@/components'
import { useModal } from '@/composables'

const loading = ref(false)
const rows = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  onChange: (page) => {
    pagination.page = page
    fetchList()
  },
  onUpdatePageSize: (pageSize) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    fetchList()
  },
})

const filters = reactive({
  status: null,
  keyword: '',
})

const statusOptions = [
  { label: '正常', value: 'ACTIVE' },
  { label: '停用', value: 'DISABLED' },
]

const [disableModalRef, disableLoading] = useModal()
const [resetModalRef, resetLoading] = useModal()
const disableState = reactive({
  id: '',
  reason: '',
})
const resetState = reactive({
  id: '',
  password: '',
})

const columns = [
  { title: '用戶 ID', key: 'id', minWidth: 120 },
  { title: '帳號', key: 'username', minWidth: 120 },
  { title: '名稱', key: 'displayName', minWidth: 120 },
  {
    title: '狀態',
    key: 'status',
    minWidth: 100,
    render: row =>
      h(
        NTag,
        { type: row.status === 'ACTIVE' ? 'success' : 'error' },
        { default: () => row.status || '-' },
      ),
  },
  {
    title: '角色',
    key: 'roles',
    minWidth: 160,
    render: row => (row.roles || []).map(item => item.name).join(', ') || '-',
  },
  {
    title: '建立時間',
    key: 'createdAt',
    minWidth: 180,
    render: row => formatTime(row.createdAt),
  },
  {
    title: '操作',
    key: 'actions',
    minWidth: 220,
    align: 'right',
    render: (row) => {
      const actions = []
      if (row.status === 'ACTIVE') {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => openDisable(row),
            },
            { default: () => '停用' },
          ),
        )
      }
      else {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'success',
              onClick: () => handleEnable(row),
            },
            { default: () => '啟用' },
          ),
        )
      }
      actions.push(
        h(
          NButton,
          {
            size: 'small',
            class: 'ml-8',
            onClick: () => openReset(row),
          },
          { default: () => '重設密碼' },
        ),
      )
      return h('div', { class: 'flex justify-end' }, actions)
    },
  },
]

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function buildQuery() {
  return {
    status: filters.status || undefined,
    keyword: filters.keyword || undefined,
    page: pagination.page,
    pageSize: pagination.pageSize,
  }
}

async function fetchList() {
  try {
    loading.value = true
    const { data } = await api.list(buildQuery())
    rows.value = data?.items || []
    pagination.itemCount = data?.total || 0
  }
  catch (error) {
    console.error(error)
    $message.error('讀取用戶列表失敗')
  }
  loading.value = false
}

function openDisable(row) {
  disableState.id = row.id
  disableState.reason = ''
  disableModalRef.value?.open({
    title: `停用用戶 - ${row.username}`,
    okText: '確認',
    onOk: handleDisable,
  })
}

async function handleDisable() {
  if (!disableState.reason) {
    $message.warning('請輸入停用原因')
    return false
  }
  try {
    disableLoading.value = true
    await api.disable(disableState.id, { reason: disableState.reason })
    $message.success('已停用')
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error('停用失敗')
    return false
  }
  finally {
    disableLoading.value = false
  }
}

async function handleEnable(row) {
  try {
    loading.value = true
    await api.enable(row.id)
    $message.success('已啟用')
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error('啟用失敗')
  }
  loading.value = false
}

function openReset(row) {
  resetState.id = row.id
  resetState.password = ''
  resetModalRef.value?.open({
    title: `重設密碼 - ${row.username}`,
    okText: '確認',
    onOk: handleReset,
  })
}

async function handleReset() {
  try {
    resetLoading.value = true
    await api.resetPassword(resetState.id, { password: resetState.password || undefined })
    $message.success('已重設密碼')
  }
  catch (error) {
    console.error(error)
    $message.error('重設密碼失敗')
    return false
  }
  finally {
    resetLoading.value = false
  }
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
