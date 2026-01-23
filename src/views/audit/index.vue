<!--------------------------------
 - Audit Logs
 --------------------------------->

<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        重新整理
      </NButton>
    </template>

    <div class="mb-16 flex flex-wrap gap-12">
      <n-input v-model:value="filters.action" placeholder="動作" class="w-180" />
      <n-input v-model:value="filters.targetType" placeholder="目標類型" class="w-180" />
      <n-input v-model:value="filters.keyword" placeholder="搜尋目標 ID" class="w-220" />
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
import { NButton } from 'naive-ui'
import api from '@/api/audit'
import { CommonPage } from '@/components'

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
  action: '',
  targetType: '',
  keyword: '',
})

const columns = [
  { title: '動作', key: 'action', minWidth: 160 },
  { title: '操作者', key: 'actorName', minWidth: 120 },
  { title: '目標類型', key: 'targetType', minWidth: 140 },
  { title: '目標 ID', key: 'targetId', minWidth: 140 },
  {
    title: '時間',
    key: 'createdAt',
    minWidth: 180,
    render: row => formatTime(row.createdAt),
  },
]

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

function buildQuery() {
  return {
    action: filters.action || undefined,
    targetType: filters.targetType || undefined,
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
    $message.error('讀取審計記錄失敗')
  }
  loading.value = false
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
