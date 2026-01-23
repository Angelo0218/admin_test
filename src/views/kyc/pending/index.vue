<!--------------------------------
 - KYC Pending List
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
      :pagination="pagination"
      striped
    />
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import { NButton, NTag } from 'naive-ui'
import api from '@/api/kyc'
import { CommonPage } from '@/components'

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

const columns = [
  { title: '案件編號', key: 'id', minWidth: 120 },
  { title: '姓名', key: 'fullName', minWidth: 120 },
  { title: '身分證號', key: 'idNumber', minWidth: 140 },
  { title: '證件類型', key: 'documentType', minWidth: 120 },
  { title: '電話', key: 'phone', minWidth: 120 },
  {
    title: '狀態',
    key: 'status',
    minWidth: 100,
    render: row =>
      h(
        NTag,
        {
          type:
            row.status === 'PENDING'
              ? 'warning'
              : row.status === 'NEED_MORE'
                ? 'info'
                : row.status === 'PASSED'
                  ? 'success'
                  : row.status === 'REJECTED'
                    ? 'error'
                    : 'default',
        },
        { default: () => row.status || '-' },
      ),
  },
  {
    title: '提交時間',
    key: 'submittedAt',
    minWidth: 180,
    render: row => formatTime(row.submittedAt),
  },
  {
    title: '操作',
    key: 'actions',
    minWidth: 180,
    align: 'right',
    render: (row) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => router.push(`/kyc/detail/${row.id}`),
        },
        { default: () => '查看' },
      )
    },
  },
]

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchList() {
  try {
    loading.value = true
    const { data } = await api.list({
      status: 'PENDING',
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    rows.value = data?.items || []
    pagination.itemCount = data?.total || 0
  }
  catch (error) {
    console.error(error)
    $message.error('讀取待審核列表失敗')
  }
  loading.value = false
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
