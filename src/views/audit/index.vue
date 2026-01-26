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
              {{ row.action || '-' }}
            </div>
            <div class="text-12 opacity-60">
              {{ formatDateTime(row.createdAt) }}
            </div>
          </div>
          <div class="grid mt-10 gap-6 text-12">
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.actorName }}</span>
              <span class="text-right">{{ row.actorName || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.targetType }}</span>
              <span class="text-right">{{ row.targetType || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.targetId }}</span>
              <span class="text-right">{{ row.targetId || '-' }}</span>
            </div>
          </div>
        </div>
      </template>
    </ResponsiveTable>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { NButton } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/audit'
import { AutoListFilters, CommonPage, ResponsiveTable } from '@/components'
import { useColumnLabels } from '@/composables/useColumnLabels'
import { useLocalListFilters } from '@/composables/useLocalListFilters'
import { formatDateTime } from '@/utils/date-format'

const { t } = useI18n()
const loading = ref(false)
const allRows = ref([])
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 1400)
const filters = reactive({
  keyword: '',
  timeRange: null,
})
const filterFields = computed(() => [
  {
    key: 'keyword',
    type: 'keyword',
    keys: ['action', 'actorName', 'targetType', 'targetId'],
    placeholder: t('audit.list.keywordPlaceholder'),
    class: 'w-full sm:w-360',
  },
  {
    key: 'timeRange',
    type: 'daterange',
    pickerType: 'datetimerange',
    placeholder: t('audit.labels.time'),
    class: 'w-full sm:w-260',
  },
])

const baseColumns = computed(() => [
  { title: t('audit.labels.action'), key: 'action', width: 140, ellipsis: true },
  { title: t('audit.labels.actor'), key: 'actorName', width: 120, ellipsis: true },
  { title: t('audit.labels.targetType'), key: 'targetType', width: 120, ellipsis: true },
  { title: t('audit.labels.targetId'), key: 'targetId', width: 140, ellipsis: true },
  {
    title: t('audit.labels.time'),
    key: 'createdAt',
    width: 140,
    render: row => formatDateTime(row.createdAt),
  },
])

const { fieldLabels } = useColumnLabels(baseColumns, ['actorName', 'targetType', 'targetId'])
const narrowColumnKeys = new Set(['action', 'actorName', 'targetType', 'createdAt'])
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

const keywordFilteredRows = useLocalListFilters({
  rows: allRows,
  filters,
  rules: [
    {
      key: 'keyword',
      type: 'includes',
      getters: [row => row.action, row => row.actorName, row => row.targetType, row => row.targetId],
    },
  ],
})

const filteredRows = computed(() => {
  const range = filters.timeRange
  const hasRange = Array.isArray(range) && range.length === 2
  const rangeStart = hasRange ? Number(range[0]) : null
  const rangeEnd = hasRange ? Number(range[1]) : null

  if (!hasRange) {
    return keywordFilteredRows.value
  }

  return keywordFilteredRows.value.filter((row) => {
    const rowTime = Number(new Date(row.createdAt))
    if (!Number.isFinite(rowTime))
      return false
    if (Number.isFinite(rangeStart) && rowTime < rangeStart)
      return false
    if (Number.isFinite(rangeEnd) && rowTime > rangeEnd)
      return false
    return true
  })
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
    $message.error(t('audit.list.fetchFailed'))
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
