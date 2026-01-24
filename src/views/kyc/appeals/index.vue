<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        {{ t('common.refresh') }}
      </NButton>
    </template>

    <div class="grid mb-16 gap-12 sm:flex sm:flex-wrap sm:items-center">
      <n-select v-model:value="filters.status" :options="statusOptions" :placeholder="t('common.status')" class="w-full sm:w-180" />
      <n-input v-model:value="filters.keyword" :placeholder="t('kyc.list.appealSearchPlaceholder')" class="w-full sm:w-220" />
    </div>

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
              {{ row.applicationId || '-' }}
            </div>
            <NTag :type="statusType(row.status)">
              {{ statusLabel(row.status) }}
            </NTag>
          </div>
          <div class="grid mt-10 gap-6 text-12">
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.applicantName }}</span>
              <span class="text-right">{{ row.applicantName || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.idNumber }}</span>
              <span class="text-right">{{ row.idNumber || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.reason }}</span>
              <span class="text-right">{{ row.reason || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.handledAt }}</span>
              <span class="text-right">{{ formatTime(row.handledAt) }}</span>
            </div>
          </div>
          <div class="mt-10 flex justify-end gap-8">
            <NButton
              size="small"
              type="primary"
              @click="router.push(`/kyc/detail/${row.applicationId}`)"
            >
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
const loading = ref(false)
const rows = ref([])
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 1400)
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

const statusOptions = computed(() => [
  { label: t('kyc.appealStatus.PENDING'), value: 'PENDING' },
  { label: t('kyc.appealStatus.APPROVED'), value: 'APPROVED' },
  { label: t('kyc.appealStatus.REJECTED'), value: 'REJECTED' },
])

const baseColumns = computed(() => [
  { title: t('kyc.labels.caseId'), key: 'applicationId', width: 120, ellipsis: true },
  { title: t('kyc.labels.name'), key: 'applicantName', width: 120, ellipsis: true },
  { title: t('kyc.labels.idNumber'), key: 'idNumber', width: 120, ellipsis: true },
  {
    title: t('kyc.labels.status'),
    key: 'status',
    width: 90,
    render: row =>
      h(
        NTag,
        { type: statusType(row.status) },
        { default: () => statusLabel(row.status) },
      ),
  },
  { title: t('kyc.columns.reason'), key: 'reason', width: 180, ellipsis: true },
  { title: t('kyc.columns.handledBy'), key: 'handledByName', width: 120, ellipsis: true },
  {
    title: t('kyc.columns.handledAt'),
    key: 'handledAt',
    width: 140,
    render: row => formatTime(row.handledAt),
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
          onClick: () => router.push(`/kyc/detail/${row.applicationId}`),
        },
        { default: () => t('common.view') },
      )
    },
  },
])

const columnLabelMap = computed(() => Object.fromEntries(baseColumns.value.map(column => [column.key, column.title])))
const fieldLabels = computed(() => ({
  applicantName: columnLabelMap.value.applicantName,
  idNumber: columnLabelMap.value.idNumber,
  reason: columnLabelMap.value.reason,
  handledAt: columnLabelMap.value.handledAt,
}))
const narrowColumnKeys = new Set(['applicationId', 'applicantName', 'status', 'reason', 'handledAt', 'actions'])
const columns = computed(() => (isNarrow.value
  ? baseColumns.value.filter(column => narrowColumnKeys.has(column.key))
  : baseColumns.value))

function statusLabel(status) {
  const key = `kyc.appealStatus.${status}`
  const label = t(key)
  return label === key ? status || '-' : label
}

function statusType(status) {
  return status === 'PENDING' ? 'warning' : status === 'APPROVED' ? 'success' : 'error'
}

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
    $message.error(t('kyc.list.appealsFetchFailed'))
  }
  loading.value = false
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
