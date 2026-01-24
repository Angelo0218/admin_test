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

    <div class="grid mb-16 gap-12 sm:flex sm:flex-wrap sm:items-center">
      <n-select v-model:value="filters.status" :options="statusOptions" :placeholder="t('common.status')" class="w-full sm:w-160" />
      <n-select v-model:value="filters.category" :options="categoryOptions" :placeholder="t('tickets.labels.category')" class="w-full sm:w-180" />
      <n-input v-model:value="filters.keyword" :placeholder="t('tickets.list.searchPlaceholder')" class="w-full sm:w-220" />
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
              {{ row.id || '-' }}
            </div>
            <NTag :type="statusType(row.status)">
              {{ statusLabel(row.status) }}
            </NTag>
          </div>
          <div class="grid mt-10 gap-6 text-12">
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.subject }}</span>
              <span class="text-right">{{ row.subject || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.category }}</span>
              <span class="text-right">{{ categoryLabel(row.category) }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.requesterName }}</span>
              <span class="text-right">{{ row.requesterName || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.createdAt }}</span>
              <span class="text-right">{{ formatTime(row.createdAt) }}</span>
            </div>
          </div>
          <div class="mt-10 flex justify-end">
            <NButton size="small" type="primary" @click="router.push(`/tickets/${row.id}`)">
              {{ t('common.view') }}
            </NButton>
          </div>
        </div>
      </template>
    </ResponsiveTable>

    <MeModal ref="createModalRef">
      <n-form label-placement="left" label-width="90">
        <n-form-item :label="t('tickets.create.userId')">
          <n-input v-model:value="createState.requesterId" :placeholder="t('tickets.create.userIdPlaceholder')" />
        </n-form-item>
        <n-form-item :label="t('tickets.create.subject')">
          <n-input v-model:value="createState.subject" :placeholder="t('tickets.create.subjectPlaceholder')" />
        </n-form-item>
        <n-form-item :label="t('tickets.create.category')">
          <n-select v-model:value="createState.category" :options="categoryOptions" />
        </n-form-item>
        <n-form-item :label="t('tickets.create.tags')">
          <n-input v-model:value="createState.tags" :placeholder="t('tickets.create.tagsPlaceholder')" />
        </n-form-item>
        <n-form-item :label="t('tickets.create.internalNote')">
          <n-input v-model:value="createState.internalNote" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import { NButton, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/ticket'
import { CommonPage, MeModal, ResponsiveTable } from '@/components'
import { useModal } from '@/composables'

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
    render: row => formatTime(row.createdAt),
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
  const key = `tickets.status.${status}`
  const label = t(key)
  return label === key ? status || '-' : label
}

function categoryLabel(category) {
  const key = `tickets.category.${category}`
  const label = t(key)
  return label === key ? category || '-' : label
}

function statusType(status) {
  return status === 'WAITING'
    ? 'warning'
    : status === 'IN_PROGRESS'
      ? 'info'
      : status === 'CLOSED'
        ? 'success'
        : 'default'
}

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
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

fetchList()
</script>
