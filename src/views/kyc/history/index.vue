<!--------------------------------
 - KYC History
 --------------------------------->

<template>
  <CommonPage>
    <template #action>
      <n-button type="primary" @click="handleRefresh">
        重新整理
      </n-button>
    </template>

    <div class="mb-16 flex flex-wrap gap-12">
      <n-select v-model:value="filters.status" :options="statusOptions" placeholder="狀態" class="w-180" />
      <n-date-picker v-model:value="filters.range" type="daterange" clearable />
      <n-input v-model:value="filters.keyword" placeholder="搜尋姓名或身分證號" class="w-220" />
    </div>

    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      striped
    />
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import { NTag } from 'naive-ui'
import api from '@/api/kyc'
import { CommonPage } from '@/components'

const loading = ref(false)
const rows = ref([])
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  onChange: (page) => {
    pagination.page = page
    fetchHistory()
  },
  onUpdatePageSize: (pageSize) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    fetchHistory()
  },
})

const filters = reactive({
  status: null,
  range: null,
  keyword: '',
})

const statusOptions = [
  { label: '已通過', value: 'APPROVED' },
  { label: '已拒絕', value: 'REJECTED' },
  { label: '已重置', value: 'RESET' },
]

const columns = [
  { title: '案件編號', key: 'id', minWidth: 120 },
  { title: '姓名', key: 'fullName', minWidth: 120 },
  { title: '身分證號', key: 'idNumber', minWidth: 140 },
  {
    title: '狀態',
    key: 'status',
    minWidth: 100,
    render: row =>
      h(
        NTag,
        { type: row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'error' : 'default' },
        { default: () => row.status || '-' },
      ),
  },
  { title: '審核人員', key: 'auditorName', minWidth: 120 },
  {
    title: '更新時間',
    key: 'updatedAt',
    minWidth: 180,
    render: row => formatTime(row.updatedAt),
  },
]

function handleRefresh() {
  fetchHistory()
}

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function buildQuery() {
  const range = filters.range || []
  const dateFrom = range[0] ? dayjs(range[0]).toISOString() : undefined
  const dateTo = range[1] ? dayjs(range[1]).toISOString() : undefined
  return {
    status: filters.status || undefined,
    keyword: filters.keyword || undefined,
    dateFrom,
    dateTo,
    page: pagination.page,
    pageSize: pagination.pageSize,
  }
}

async function fetchHistory() {
  try {
    loading.value = true
    const { data } = await api.getHistory(buildQuery())
    rows.value = data?.items || []
    pagination.itemCount = data?.total || 0
  }
  catch (error) {
    console.error(error)
    $message.error('讀取歷史記錄失敗')
  }
  loading.value = false
}

fetchHistory()
</script>
