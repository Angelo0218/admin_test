<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        {{ t('common.refresh') }}
      </NButton>
    </template>

    <div class="grid mb-16 gap-12 sm:flex sm:flex-wrap sm:items-center">
      <n-input v-model:value="filters.action" :placeholder="t('audit.list.actionPlaceholder')" class="w-full sm:w-180" />
      <n-input v-model:value="filters.targetType" :placeholder="t('audit.list.targetTypePlaceholder')" class="w-full sm:w-180" />
      <n-input v-model:value="filters.keyword" :placeholder="t('audit.list.keywordPlaceholder')" class="w-full sm:w-220" />
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
import { CommonPage, ResponsiveTable } from '@/components'
import { useListPage } from '@/composables/useListPage'
import { formatDateTime } from '@/utils/date-format'

const { t } = useI18n()
const loading = ref(false)
const rows = ref([])
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 1400)
const filters = reactive({
  action: '',
  targetType: '',
  keyword: '',
})

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

const columnLabelMap = computed(() => Object.fromEntries(baseColumns.value.map(column => [column.key, column.title])))
const fieldLabels = computed(() => ({
  actorName: columnLabelMap.value.actorName,
  targetType: columnLabelMap.value.targetType,
  targetId: columnLabelMap.value.targetId,
}))
const narrowColumnKeys = new Set(['action', 'actorName', 'targetType', 'createdAt'])
const columns = computed(() => (isNarrow.value
  ? baseColumns.value.filter(column => narrowColumnKeys.has(column.key))
  : baseColumns.value))
const { pagination } = useListPage({ filters, fetchList })

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
    $message.error(t('audit.list.fetchFailed'))
  }
  loading.value = false
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
