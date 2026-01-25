<template>
  <CommonPage>
    <template #action>
      <n-space>
        <NButton type="primary" @click="openCreate">
          {{ t('tickets.list.create') }}
        </NButton>
        <NButton @click="handleRefresh">
          {{ t('common.refresh') }}
        </NButton>
      </n-space>
    </template>

    <TicketListFilters
      :filters="filters"
      :status-options="statusOptions"
      :category-options="categoryOptions"
      @update-filter="handleFilterUpdate"
    />

    <ResponsiveTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
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

    <MeModal ref="createModalRef">
      <TicketCreateForm
        :state="createState"
        :category-options="categoryOptions"
        @update-field="handleCreateFieldUpdate"
      />
    </MeModal>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { NButton, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/ticket'
import { CommonPage, MeModal, ResponsiveTable } from '@/components'
import TicketCreateForm from '@/components/tickets/TicketCreateForm.vue'
import TicketListCard from '@/components/tickets/TicketListCard.vue'
import TicketListFilters from '@/components/tickets/TicketListFilters.vue'
import { useModal } from '@/composables'
import { useListPage } from '@/composables/useListPage'
import { formatDateTime } from '@/utils/date-format'

const { t } = useI18n()
const router = useRouter()
const loading = ref(false)
const rows = ref([])
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

const [createModalRef, createLoading] = useModal()
const createState = reactive({
  requesterId: '',
  subject: '',
  category: 'ACCOUNT',
  tags: '',
  internalNote: '',
})
const { pagination } = useListPage({ filters, fetchList, watchFilters: false })

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

const columnLabelMap = computed(() => Object.fromEntries(baseColumns.value.map(column => [column.key, column.title])))
const fieldLabels = computed(() => ({
  subject: columnLabelMap.value.subject,
  category: columnLabelMap.value.category,
  requesterName: columnLabelMap.value.requesterName,
  createdAt: columnLabelMap.value.createdAt,
}))
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

function buildQuery() {
  return {
    status: filters.status || undefined,
    category: filters.category || undefined,
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
    $message.error(t('tickets.list.fetchFailed'))
  }
  loading.value = false
}

function openCreate() {
  createState.requesterId = ''
  createState.subject = ''
  createState.category = 'ACCOUNT'
  createState.tags = ''
  createState.internalNote = ''
  createModalRef.value?.open({
    title: t('tickets.create.title'),
    okText: t('common.create'),
    onOk: handleCreate,
  })
}

async function handleCreate() {
  if (!createState.requesterId || !createState.subject) {
    $message.warning(t('tickets.create.missing'))
    return false
  }
  try {
    createLoading.value = true
    await api.create({
      requesterId: createState.requesterId,
      subject: createState.subject,
      category: createState.category,
      tags: createState.tags ? createState.tags.split(',').map(item => item.trim()).filter(Boolean) : [],
      internalNote: createState.internalNote || undefined,
    })
    $message.success(t('tickets.create.success'))
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error(t('tickets.create.failed'))
    return false
  }
  finally {
    createLoading.value = false
  }
}

function handleRefresh() {
  fetchList()
}

function handleFilterUpdate({ key, value }) {
  filters[key] = value
}

function handleCreateFieldUpdate({ key, value }) {
  createState[key] = value
}

function handleView(row) {
  router.push(`/tickets/${row.id}`)
}

fetchList()
</script>
