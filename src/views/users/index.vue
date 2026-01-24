<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        {{ t('common.refresh') }}
      </NButton>
    </template>

    <div class="grid mb-16 gap-12 sm:flex sm:flex-wrap sm:items-center">
      <n-select v-model:value="filters.status" :options="statusOptions" :placeholder="t('common.status')" class="w-full sm:w-160" />
      <n-input v-model:value="filters.keyword" :placeholder="t('users.list.searchPlaceholder')" class="w-full sm:w-220" />
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
              {{ row.username || '-' }}
            </div>
            <NTag :type="statusType(row.status)">
              {{ statusLabel(row.status) }}
            </NTag>
          </div>
          <div class="grid mt-10 gap-6 text-12">
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.displayName }}</span>
              <span class="text-right">{{ row.displayName || '-' }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.roles }}</span>
              <span class="text-right">{{ roleNames(row.roles) }}</span>
            </div>
            <div class="flex items-center justify-between gap-8">
              <span class="opacity-60">{{ fieldLabels.createdAt }}</span>
              <span class="text-right">{{ formatTime(row.createdAt) }}</span>
            </div>
          </div>
          <div class="mt-10 flex flex-wrap justify-end gap-8">
            <NButton
              v-if="row.status === 'ACTIVE'"
              size="small"
              type="error"
              @click="openDisable(row)"
            >
              {{ t('users.actions.disable') }}
            </NButton>
            <NButton
              v-else
              size="small"
              type="success"
              @click="handleEnable(row)"
            >
              {{ t('users.actions.enable') }}
            </NButton>
            <NButton size="small" @click="openReset(row)">
              {{ t('users.actions.resetPassword') }}
            </NButton>
          </div>
        </div>
      </template>
    </ResponsiveTable>

    <MeModal ref="disableModalRef">
      <n-form label-placement="left" label-width="80">
        <n-form-item :label="t('users.disable.reasonLabel')">
          <n-input v-model:value="disableState.reason" type="textarea" :rows="3" />
        </n-form-item>
      </n-form>
    </MeModal>

    <MeModal ref="resetModalRef">
      <n-form label-placement="left" label-width="80">
        <n-form-item :label="t('users.reset.passwordLabel')">
          <n-input v-model:value="resetState.password" :placeholder="t('users.reset.passwordPlaceholder')" />
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
import api from '@/api/user'
import { CommonPage, MeModal, ResponsiveTable } from '@/components'
import { useModal } from '@/composables'

const { t } = useI18n()
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
  { label: t('users.status.ACTIVE'), value: 'ACTIVE' },
  { label: t('users.status.DISABLED'), value: 'DISABLED' },
])

const [disableModalRef, disableLoading] = useModal()
const [resetModalRef, resetLoading] = useModal()
const disableState = reactive({
  id: '',
  reason: '',
})
const resetState = reactive({
  id: '',
  password: '',
})

const baseColumns = computed(() => [
  { title: t('users.labels.id'), key: 'id', width: 160, ellipsis: true },
  { title: t('users.labels.username'), key: 'username', width: 120, ellipsis: true },
  { title: t('users.labels.displayName'), key: 'displayName', width: 120, ellipsis: true },
  {
    title: t('users.labels.status'),
    key: 'status',
    width: 90,
    render: row =>
      h(
        NTag,
        { type: statusType(row.status) },
        { default: () => statusLabel(row.status) },
      ),
  },
  {
    title: t('users.labels.roles'),
    key: 'roles',
    width: 140,
    ellipsis: true,
    render: row => roleNames(row.roles),
  },
  {
    title: t('users.labels.createdAt'),
    key: 'createdAt',
    width: 140,
    render: row => formatTime(row.createdAt),
  },
  {
    title: t('common.actions'),
    key: 'actions',
    width: 150,
    align: 'right',
    render: (row) => {
      const actions = []
      if (row.status === 'ACTIVE') {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => openDisable(row),
            },
            { default: () => t('users.actions.disable') },
          ),
        )
      }
      else {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              type: 'success',
              onClick: () => handleEnable(row),
            },
            { default: () => t('users.actions.enable') },
          ),
        )
      }
      actions.push(
        h(
          NButton,
          {
            size: 'small',
            class: 'ml-8',
            onClick: () => openReset(row),
          },
          { default: () => t('users.actions.resetPassword') },
        ),
      )
      return h('div', { class: 'flex flex-wrap justify-end gap-6' }, actions)
    },
  },
])

const columnLabelMap = computed(() => Object.fromEntries(baseColumns.value.map(column => [column.key, column.title])))
const fieldLabels = computed(() => ({
  displayName: columnLabelMap.value.displayName,
  roles: columnLabelMap.value.roles,
  createdAt: columnLabelMap.value.createdAt,
}))
const narrowColumnKeys = new Set(['username', 'displayName', 'status', 'roles', 'actions'])
const columns = computed(() => (isNarrow.value
  ? baseColumns.value.filter(column => narrowColumnKeys.has(column.key))
  : baseColumns.value))

function statusLabel(status) {
  const key = `users.status.${status}`
  const label = t(key)
  return label === key ? status || '-' : label
}

function roleNames(roles) {
  if (!roles?.length)
    return '-'
  const names = roles.map((role) => {
    const key = `roles.${role.code}`
    const label = t(key)
    return label === key ? role.name : label
  })
  return names.join(', ')
}

function statusType(status) {
  return status === 'ACTIVE' ? 'success' : 'error'
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
    const { data } = await api.list(buildQuery())
    rows.value = data?.items || []
    pagination.itemCount = data?.total || 0
  }
  catch (error) {
    console.error(error)
    $message.error(t('users.list.fetchFailed'))
  }
  loading.value = false
}

function openDisable(row) {
  disableState.id = row.id
  disableState.reason = ''
  disableModalRef.value?.open({
    title: `${t('users.disable.title')} - ${row.username}`,
    okText: t('common.confirm'),
    onOk: handleDisable,
  })
}

async function handleDisable() {
  if (!disableState.reason) {
    $message.warning(t('users.disable.reasonRequired'))
    return false
  }
  try {
    disableLoading.value = true
    await api.disable(disableState.id, { reason: disableState.reason })
    $message.success(t('users.disable.success'))
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error(t('users.disable.failed'))
    return false
  }
  finally {
    disableLoading.value = false
  }
}

async function handleEnable(row) {
  try {
    await api.enable(row.id)
    $message.success(t('users.enable.success'))
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error(t('users.enable.failed'))
  }
  loading.value = false
}

function openReset(row) {
  resetState.id = row.id
  resetState.password = ''
  resetModalRef.value?.open({
    title: `${t('users.reset.title')} - ${row.username}`,
    okText: t('common.confirm'),
    onOk: handleReset,
  })
}

async function handleReset() {
  try {
    resetLoading.value = true
    await api.resetPassword(resetState.id, { password: resetState.password || undefined })
    $message.success(t('users.reset.success'))
  }
  catch (error) {
    console.error(error)
    $message.error(t('users.reset.failed'))
    return false
  }
  finally {
    resetLoading.value = false
  }
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
