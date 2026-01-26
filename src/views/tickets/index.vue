<template>
  <CommonPage>
    <template #action>
      <n-space>
        <NButton @click="handleRefresh">
          {{ t('common.refresh') }}
        </NButton>
      </n-space>
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
        <TicketListCard
          :row="row"
          :field-labels="fieldLabels"
          :status-label="statusLabel"
          :status-type="statusType"
          :category-label="categoryLabel"
          :format-time="formatDateTime"
          :on-view="handleView"
        />
      </template>
    </ResponsiveTable>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { NButton, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/ticket'
import { AutoListFilters, CommonPage, ResponsiveTable } from '@/components'
import TicketListCard from '@/components/tickets/TicketListCard.vue'
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
  category: null,
  keyword: '',
})

const statusOptions = computed(() => [
  { label: t('tickets.status.WAITING'), value: 'WAITING' },
  { label: t('tickets.status.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('tickets.status.CLOSED'), value: 'CLOSED' },
])

const categoryOptions = computed(() => [
  { label: t('tickets.category.ACCOUNT'), value: 'ACCOUNT' },
  { label: t('tickets.category.KYC'), value: 'KYC' },
  { label: t('tickets.category.TICKET'), value: 'TICKET' },
  { label: t('tickets.category.OTHER'), value: 'OTHER' },
])
const filterFields = computed(() => [
  {
    key: 'status',
    type: 'select',
    options: statusOptions.value,
    placeholder: t('common.status'),
    class: 'w-full sm:w-160',
  },
  {
    key: 'category',
    type: 'select',
    options: categoryOptions.value,
    placeholder: t('tickets.labels.category'),
    class: 'w-full sm:w-180',
  },
  {
    key: 'keyword',
    type: 'keyword',
    keys: ['subject', 'requesterName'],
    placeholder: t('tickets.list.searchPlaceholder'),
    class: 'w-full sm:w-220',
  },
])

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

const baseColumns = computed(() => [
  { title: t('tickets.labels.id'), key: 'id', width: 160, ellipsis: true },
  { title: t('tickets.labels.subject'), key: 'subject', width: 180, ellipsis: true },
  {
    title: t('tickets.labels.category'),
    key: 'category',
    width: 100,
    render: row => categoryLabel(row.category),
  },
  {
    title: t('tickets.labels.status'),
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
  { title: t('tickets.labels.requester'), key: 'requesterName', width: 120, ellipsis: true },
  {
    title: t('tickets.labels.createdAt'),
    key: 'createdAt',
    width: 140,
    render: row => formatDateTime(row.createdAt),
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 80,
    align: 'right',
    render: row =>
      h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => router.push(`/tickets/${row.id}`),
        },
        { default: () => t('common.view') },
      ),
  },
])

const { fieldLabels } = useColumnLabels(baseColumns, ['subject', 'category', 'requesterName', 'createdAt'])
const narrowColumnKeys = new Set(['id', 'subject', 'status', 'requesterName', 'createdAt', 'actions'])
const columns = computed(() => (isNarrow.value
  ? baseColumns.value.filter(column => narrowColumnKeys.has(column.key))
  : baseColumns.value))

function statusLabel(status) {
  if (!status)
    return '-'
  const key = `tickets.status.${status}`
  const label = t(key)
  return label === key ? status : label
}

function categoryLabel(category) {
  if (!category)
    return '-'
  const key = `tickets.category.${category}`
  const label = t(key)
  return label === key ? category : label
}

function statusType(status) {
  if (status === 'WAITING')
    return 'warning'
  if (status === 'IN_PROGRESS')
    return 'info'
  if (status === 'CLOSED')
    return 'success'
  return 'default'
}

const filteredRows = useLocalListFilters({
  rows: allRows,
  filters,
  rules: [
    { key: 'status', type: 'equals', getter: row => row.status },
    { key: 'category', type: 'equals', getter: row => row.category },
    {
      key: 'keyword',
      type: 'includes',
      getters: [row => row.subject, row => row.requesterName],
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
    const { data } = await api.list()
    allRows.value = data?.items || []
  }
  catch (error) {
    console.error(error)
    $message.error(t('tickets.list.fetchFailed'))
  }
  loading.value = false
}

function handleRefresh() {
  fetchList()
}

function handleFiltersUpdate(nextFilters) {
  Object.assign(filters, nextFilters)
}

function handleView(row) {
  router.push(`/tickets/${row.id}`)
}

fetchList()
</script>
