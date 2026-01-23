<!--------------------------------
 - Ticket List
 --------------------------------->

<template>
  <CommonPage>
    <template #action>
      <n-space>
        <NButton type="primary" @click="openCreate">
          新增工單
        </NButton>
        <NButton @click="handleRefresh">
          重新整理
        </NButton>
      </n-space>
    </template>

    <div class="mb-16 flex flex-wrap gap-12">
      <n-select v-model:value="filters.status" :options="statusOptions" placeholder="狀態" class="w-160" />
      <n-select v-model:value="filters.category" :options="categoryOptions" placeholder="分類" class="w-180" />
      <n-input v-model:value="filters.keyword" placeholder="搜尋標題或姓名" class="w-220" />
    </div>

    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      striped
    />

    <MeModal ref="createModalRef">
      <n-form label-placement="left" label-width="90">
        <n-form-item label="用戶 ID">
          <n-input v-model:value="createState.requesterId" placeholder="輸入用戶 ID" />
        </n-form-item>
        <n-form-item label="主旨">
          <n-input v-model:value="createState.subject" placeholder="輸入主旨" />
        </n-form-item>
        <n-form-item label="分類">
          <n-select v-model:value="createState.category" :options="categoryOptions" />
        </n-form-item>
        <n-form-item label="標籤">
          <n-input v-model:value="createState.tags" placeholder="以逗號分隔" />
        </n-form-item>
        <n-form-item label="內部備註">
          <n-input v-model:value="createState.internalNote" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import { NButton, NTag } from 'naive-ui'
import api from '@/api/ticket'
import { CommonPage, MeModal } from '@/components'
import { useModal } from '@/composables'

const router = useRouter()
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
  category: null,
  keyword: '',
})

const statusOptions = [
  { label: '待回覆', value: 'WAITING' },
  { label: '處理中', value: 'IN_PROGRESS' },
  { label: '已結案', value: 'CLOSED' },
]

const categoryOptions = [
  { label: '帳號問題', value: 'ACCOUNT' },
  { label: 'KYC 問題', value: 'KYC' },
  { label: '票務問題', value: 'TICKET' },
  { label: '其他', value: 'OTHER' },
]

const [createModalRef, createLoading] = useModal()
const createState = reactive({
  requesterId: '',
  subject: '',
  category: 'ACCOUNT',
  tags: '',
  internalNote: '',
})

const columns = [
  { title: '工單編號', key: 'id', minWidth: 140 },
  { title: '主旨', key: 'subject', minWidth: 200 },
  { title: '分類', key: 'category', minWidth: 120 },
  {
    title: '狀態',
    key: 'status',
    minWidth: 100,
    render: row =>
      h(
        NTag,
        {
          type:
            row.status === 'WAITING'
              ? 'warning'
              : row.status === 'IN_PROGRESS'
                ? 'info'
                : row.status === 'CLOSED'
                  ? 'success'
                  : 'default',
        },
        { default: () => row.status || '-' },
      ),
  },
  { title: '用戶', key: 'requesterName', minWidth: 120 },
  {
    title: '建立時間',
    key: 'createdAt',
    minWidth: 180,
    render: row => formatTime(row.createdAt),
  },
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
          type: 'primary',
          onClick: () => router.push(`/tickets/${row.id}`),
        },
        { default: () => '查看' },
      ),
  },
]

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function buildQuery() {
  return {
    status: filters.status || undefined,
    category: filters.category || undefined,
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
    $message.error('讀取工單列表失敗')
  }
  loading.value = false
}

function openCreate() {
  createState.requesterId = ''
  createState.subject = ''
  createState.category = 'ACCOUNT'
  createState.tags = ''
  createState.internalNote = ''
  createModalRef.value?.open({
    title: '新增工單',
    okText: '建立',
    onOk: handleCreate,
  })
}

async function handleCreate() {
  if (!createState.requesterId || !createState.subject) {
    $message.warning('請輸入用戶 ID 與主旨')
    return false
  }
  try {
    createLoading.value = true
    await api.create({
      requesterId: createState.requesterId,
      subject: createState.subject,
      category: createState.category,
      tags: createState.tags ? createState.tags.split(',').map(item => item.trim()).filter(Boolean) : [],
      internalNote: createState.internalNote || undefined,
    })
    $message.success('已建立工單')
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error('建立工單失敗')
    return false
  }
  finally {
    createLoading.value = false
  }
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
