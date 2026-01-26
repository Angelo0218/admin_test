<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        {{ t('common.refresh') }}
      </NButton>
    </template>

    <AutoListFilters
      :rows="allRows"
      :filters="filters"
      :fields="filterFields"
      @update:filters="handleFiltersUpdate"
    />

    <ResponsiveTable
      :columns="columns"
      :data="pagedRows"
      :loading="loading"
      :pagination="pagination"
      remote
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
              <span class="text-right">{{ formatDateTime(row.handledAt) }}</span>
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
import { NButton, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/kyc'
import { AutoListFilters, CommonPage, ResponsiveTable } from '@/components'
import { useColumnLabels } from '@/composables/useColumnLabels'
import { useLocalListFilters } from '@/composables/useLocalListFilters'
import { formatDateTime } from '@/utils/date-format'

const { t } = useI18n()
const router = useRouter()
const loading = ref(false)
const allRows = ref([])
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 1400)
const filters = reactive({
  status: null,
  keyword: '',
})

const statusOptions = computed(() => [
  { label: t('kyc.appealStatus.PENDING'), value: 'PENDING' },
  { label: t('kyc.appealStatus.APPROVED'), value: 'APPROVED' },
  { label: t('kyc.appealStatus.REJECTED'), value: 'REJECTED' },
])
const filterFields = computed(() => [
  {
    key: 'status',
    type: 'select',
    options: statusOptions.value,
    placeholder: t('common.status'),
    class: 'w-full sm:w-180',
  },
  {
    key: 'keyword',
    type: 'keyword',
    keys: ['applicantName', 'idNumber', 'reason'],
    placeholder: t('kyc.list.appealSearchPlaceholder'),
    class: 'w-full sm:w-220',
  },
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
    render: row => formatDateTime(row.handledAt),
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

const { fieldLabels } = useColumnLabels(baseColumns, ['applicantName', 'idNumber', 'reason', 'handledAt'])
const narrowColumnKeys = new Set(['applicationId', 'applicantName', 'status', 'reason', 'handledAt', 'actions'])
const columns = computed(() => (isNarrow.value
  ? baseColumns.value.filter(column => narrowColumnKeys.has(column.key))
  : baseColumns.value))
const pagination = reactive({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  onChange: (nextPage) => {
    pagination.page = nextPage
  },
  onUpdatePageSize: (nextPageSize) => {
    pagination.pageSize = nextPageSize
    pagination.page = 1
  },
})

function statusLabel(status) {
  const key = `kyc.appealStatus.${status}`
  const label = t(key)
  return label === key ? status || '-' : label
}

function statusType(status) {
  return status === 'PENDING' ? 'warning' : status === 'APPROVED' ? 'success' : 'error'
}

const filteredRows = useLocalListFilters({
  rows: allRows,
  filters,
  rules: [
    { key: 'status', type: 'equals', getter: row => row.status },
    {
      key: 'keyword',
      type: 'includes',
      getters: [row => row.applicantName, row => row.idNumber, row => row.reason],
    },
  ],
})

const pagedRows = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredRows.value.slice(start, start + pagination.pageSize)
})

watch(
  filters,
  () => {
    pagination.page = 1
  },
  { deep: true },
)

watchEffect(() => {
  pagination.itemCount = filteredRows.value.length
})

async function fetchList() {
  try {
    loading.value = true
    const { data } = await api.listAppeals()
    allRows.value = data?.items || []
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

function handleFiltersUpdate(nextFilters) {
  Object.assign(filters, nextFilters)
}

fetchList()
</script>
