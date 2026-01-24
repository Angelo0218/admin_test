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
      :pagination="pagination"
    >
      <template #card="{ row }">
        <div class="card-border rounded-8 auto-bg p-12">
          <div class="flex items-center justify-between gap-8">
            <div class="text-14 font-600">
              {{ row.id || '-' }}
            </div>
            <NTag :type="statusType(row.status)">
              {{ statusLabel(row.status) }}
            </NTag>
          </div>
          <div class="grid mt-10 gap-6 text-12">
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.fullName }}</span>
              <span class="text-right">{{ row.fullName || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.idNumber }}</span>
              <span class="text-right">{{ row.idNumber || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.documentType }}</span>
              <span class="text-right">{{ row.documentType || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.submittedAt }}</span>
              <span class="text-right">{{ formatTime(row.submittedAt) }}</span>
            </div>
          </div>
          <div class="mt-10 flex justify-end">
            <NButton size="small" type="primary" @click="router.push(`/kyc/detail/${row.id}`)">
              {{ t('common.view') }}
            </NButton>
          </div>
        </div>
      </template>
    </ResponsiveTable>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import { NButton, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/kyc'
import { CommonPage, ResponsiveTable } from '@/components'

const { t } = useI18n()
const router = useRouter()
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 1400)

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

const baseColumns = computed(() => [
  { title: t('kyc.labels.caseId'), key: 'id', width: 120, ellipsis: true },
  { title: t('kyc.labels.name'), key: 'fullName', width: 120, ellipsis: true },
  { title: t('kyc.labels.idNumber'), key: 'idNumber', width: 120, ellipsis: true },
  { title: t('kyc.labels.documentType'), key: 'documentType', width: 120 },
  { title: t('kyc.labels.phone'), key: 'phone', width: 120 },
  {
    title: t('kyc.labels.status'),
    key: 'status',
    width: 90,
    render: row =>
      h(
        NTag,
        {
          type: statusType(row.status),
        },
        { default: () => statusLabel(row.status) },
      ),
  },
  {
    title: t('kyc.labels.submittedAt'),
    key: 'submittedAt',
    width: 140,
    render: row => formatTime(row.submittedAt),
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 80,
    align: 'right',
    render: (row) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => router.push(`/kyc/detail/${row.id}`),
        },
        { default: () => t('common.view') },
      )
    },
  },
])

const columnLabelMap = computed(() => Object.fromEntries(baseColumns.value.map(column => [column.key, column.title])))
const fieldLabels = computed(() => ({
  fullName: columnLabelMap.value.fullName,
  idNumber: columnLabelMap.value.idNumber,
  documentType: columnLabelMap.value.documentType,
  submittedAt: columnLabelMap.value.submittedAt,
}))
const narrowColumnKeys = new Set(['id', 'fullName', 'idNumber', 'status', 'submittedAt', 'actions'])
const columns = computed(() => (isNarrow.value
  ? baseColumns.value.filter(column => narrowColumnKeys.has(column.key))
  : baseColumns.value))

function statusLabel(status) {
  const key = `kyc.status.${status}`
  const label = t(key)
  return label === key ? status || '-' : label
}

function statusType(status) {
  return status === 'PENDING'
    ? 'warning'
    : status === 'NEED_MORE'
      ? 'info'
      : status === 'PASSED'
        ? 'success'
        : status === 'REJECTED'
          ? 'error'
          : 'default'
}

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
    $message.error(t('kyc.list.pendingFetchFailed'))
  }
  loading.value = false
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
