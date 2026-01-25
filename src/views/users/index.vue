<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        {{ t('common.refresh') }}
      </NButton>
    </template>

    <UserListFilters
      :filters="filters"
      :status-options="statusOptions"
      @update-filter="handleFilterUpdate"
    />

    <ResponsiveTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
    >
      <template #card="{ row }">
        <UserListCard
          :row="row"
          :field-labels="fieldLabels"
          :status-label="statusLabel"
          :status-type="statusType"
          :role-names="roleNames"
          :format-time="formatDateTime"
          :on-disable="openDisable"
          :on-enable="handleEnable"
          :on-reset="openReset"
        />
      </template>
    </ResponsiveTable>

    <MeModal ref="disableModalRef">
      <UserDisableForm :state="disableState" @update-field="handleDisableFieldUpdate" />
    </MeModal>

    <MeModal ref="resetModalRef">
      <UserResetForm :state="resetState" @update-field="handleResetFieldUpdate" />
    </MeModal>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { NButton, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/user'
import { CommonPage, MeModal, ResponsiveTable } from '@/components'
import UserDisableForm from '@/components/users/UserDisableForm.vue'
import UserListCard from '@/components/users/UserListCard.vue'
import UserListFilters from '@/components/users/UserListFilters.vue'
import UserResetForm from '@/components/users/UserResetForm.vue'
import { useModal } from '@/composables'
import { useListPage } from '@/composables/useListPage'
import { formatDateTime } from '@/utils/date-format'

const { t } = useI18n()
const loading = ref(false)
const rows = ref([])
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 1400)
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
const { pagination } = useListPage({ filters, fetchList })

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
    render: row => formatDateTime(row.createdAt),
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

function handleFilterUpdate({ key, value }) {
  filters[key] = value
}

function handleDisableFieldUpdate({ key, value }) {
  disableState[key] = value
}

function handleResetFieldUpdate({ key, value }) {
  resetState[key] = value
}

fetchList()
</script>
