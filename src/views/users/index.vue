<template>
  <CommonPage>
    <template #action>
      <NSpace>
        <NButton type="primary" @click="openCreate">
          {{ t('users.actions.create') }}
        </NButton>
        <NButton @click="handleRefresh">
          {{ t('common.refresh') }}
        </NButton>
      </NSpace>
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
          :on-delete="openDelete"
        />
      </template>
    </ResponsiveTable>

    <MeModal ref="createModalRef">
      <UserCreateForm
        ref="createFormRef"
        :state="createState"
        :role-options="roleOptions"
        @update-field="handleCreateFieldUpdate"
      />
    </MeModal>

    <MeModal ref="disableModalRef">
      <UserDisableForm :state="disableState" @update-field="handleDisableFieldUpdate" />
    </MeModal>

    <MeModal ref="deleteModalRef">
      <UserDeleteForm :state="deleteState" @update-field="handleDeleteFieldUpdate" />
    </MeModal>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { NButton, NSpace, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/user'
import { CommonPage, MeModal, ResponsiveTable } from '@/components'
import UserCreateForm from '@/components/users/UserCreateForm.vue'
import UserDeleteForm from '@/components/users/UserDeleteForm.vue'
import UserDisableForm from '@/components/users/UserDisableForm.vue'
import UserListCard from '@/components/users/UserListCard.vue'
import UserListFilters from '@/components/users/UserListFilters.vue'
import { useModal } from '@/composables'
import { useListPage } from '@/composables/useListPage'
import { useStaffRoleOptions } from '@/composables/useStaffRoleOptions'
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

const [createModalRef, createLoading] = useModal()
const [disableModalRef, disableLoading] = useModal()
const [deleteModalRef, deleteLoading] = useModal()
const createFormRef = ref(null)
const { roleOptions } = useStaffRoleOptions({ t })
const createState = reactive({
  username: '',
  password: '',
  displayName: '',
  roleCode: 'SUPPORT',
})
const disableState = reactive({
  id: '',
  reason: '',
})
const deleteState = reactive({
  id: '',
  adminPassword: '',
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
            type: 'error',
            onClick: () => openDelete(row),
          },
          { default: () => t('users.actions.delete') },
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

function openCreate() {
  createState.username = ''
  createState.password = ''
  createState.displayName = ''
  createState.roleCode = 'SUPPORT'
  createFormRef.value?.resetValidation?.()
  createModalRef.value?.open({
    title: t('users.create.title'),
    okText: t('common.create'),
    onOk: handleCreate,
  })
}

async function handleCreate() {
  const isValid = await createFormRef.value?.validate?.()
  if (!isValid)
    return false
  try {
    createLoading.value = true
    await api.create({
      username: createState.username,
      password: createState.password,
      displayName: createState.displayName,
      roleCode: createState.roleCode,
    })
    $message.success(t('users.create.success'))
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error(t('users.create.failed'))
    return false
  }
  finally {
    createLoading.value = false
  }
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

function openDelete(row) {
  deleteState.id = row.id
  deleteState.adminPassword = ''
  deleteModalRef.value?.open({
    title: `${t('users.delete.title')} - ${row.username}`,
    okText: t('users.actions.delete'),
    onOk: handleDelete,
  })
}

async function handleDelete() {
  if (!deleteState.adminPassword) {
    $message.warning(t('users.delete.adminPasswordRequired'))
    return false
  }
  try {
    deleteLoading.value = true
    await api.remove(deleteState.id, { adminPassword: deleteState.adminPassword })
    $message.success(t('users.delete.success'))
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error(t('users.delete.failed'))
    return false
  }
  finally {
    deleteLoading.value = false
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

function handleCreateFieldUpdate({ key, value }) {
  createState[key] = value
}

function handleDeleteFieldUpdate({ key, value }) {
  deleteState[key] = value
}

fetchList()
</script>
