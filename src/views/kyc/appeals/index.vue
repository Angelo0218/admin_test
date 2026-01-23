<!--------------------------------
 - KYC Appeals
 --------------------------------->

<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        重新整理
      </NButton>
    </template>

    <div class="mb-16 flex flex-wrap gap-12">
      <n-select v-model:value="filters.status" :options="statusOptions" placeholder="狀態" class="w-180" />
      <n-input v-model:value="filters.keyword" placeholder="搜尋姓名或身分證號" class="w-220" />
    </div>

    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      striped
    />

    <MeModal ref="resolveModalRef">
      <n-form label-placement="left" label-width="80">
        <n-form-item label="處理結果">
          <n-select v-model:value="resolveState.status" :options="resolveOptions" />
        </n-form-item>
        <n-form-item label="處理備註">
          <n-input v-model:value="resolveState.decisionComment" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import { NButton, NTag } from 'naive-ui'
import api from '@/api/kyc'
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
  { label: '待處理', value: 'PENDING' },
  { label: '申訴通過', value: 'APPROVED' },
  { label: '申訴拒絕', value: 'REJECTED' },
]

const resolveOptions = [
  { label: '申訴通過', value: 'APPROVED' },
  { label: '申訴拒絕', value: 'REJECTED' },
]

const [resolveModalRef, resolveLoading] = useModal()
const resolveState = reactive({
  id: '',
  status: 'APPROVED',
  decisionComment: '',
})

const columns = [
  { title: '案件編號', key: 'applicationId', minWidth: 120 },
  { title: '姓名', key: 'applicantName', minWidth: 120 },
  { title: '身分證號', key: 'idNumber', minWidth: 140 },
  {
    title: '狀態',
    key: 'status',
    minWidth: 100,
    render: row =>
      h(
        NTag,
        { type: row.status === 'PENDING' ? 'warning' : row.status === 'APPROVED' ? 'success' : 'error' },
        { default: () => row.status || '-' },
      ),
  },
  { title: '申訴原因', key: 'reason', minWidth: 200 },
  { title: '處理人', key: 'handledByName', minWidth: 120 },
  {
    title: '處理時間',
    key: 'handledAt',
    minWidth: 180,
    render: row => formatTime(row.handledAt),
  },
  {
    title: '操作',
    key: 'actions',
    minWidth: 120,
    align: 'right',
    render: (row) => {
      if (row.status !== 'PENDING') {
        return null
      }
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => openResolve(row),
        },
        { default: () => '處理' },
      )
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
    const { data } = await api.listAppeals(buildQuery())
    rows.value = data?.items || []
    pagination.itemCount = data?.total || 0
  }
  catch (error) {
    console.error(error)
    $message.error('讀取申訴列表失敗')
  }
  loading.value = false
}

function openResolve(row) {
  resolveState.id = row.id
  resolveState.status = 'APPROVED'
  resolveState.decisionComment = ''
  resolveModalRef.value?.open({
    title: `處理申訴 - ${row.applicationId}`,
    okText: '確認',
    onOk: handleResolve,
  })
}

async function handleResolve() {
  try {
    resolveLoading.value = true
    await api.resolveAppeal(resolveState.id, {
      status: resolveState.status,
      decisionComment: resolveState.decisionComment || undefined,
    })
    $message.success('已更新申訴狀態')
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error('更新申訴狀態失敗')
    return false
  }
  finally {
    resolveLoading.value = false
  }
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
