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
      @update-filter="handleFilterUpdate"
    />

    <ResponsiveTable
      :columns="columns"
      :data="pagedRows"
      :loading="loading"
      :pagination="pagination"
    >
      <template #card="{ row }">
        <UserListCard
          :row="row"
          :field-labels="fieldLabels"
          :role-names="roleNames"
          :format-time="formatDateTime"
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

    <MeModal ref="deleteModalRef">
      <UserDeleteForm :state="deleteState" @update-field="handleDeleteFieldUpdate" />
    </MeModal>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { NButton, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import api from '@/api/user'
import { CommonPage, MeModal, ResponsiveTable } from '@/components'
import UserCreateForm from '@/components/users/UserCreateForm.vue'
import UserDeleteForm from '@/components/users/UserDeleteForm.vue'
import UserListCard from '@/components/users/UserListCard.vue'
import UserListFilters from '@/components/users/UserListFilters.vue'
import { useModal } from '@/composables'
import { useColumnLabels } from '@/composables/useColumnLabels'
import { useLocalListFilters } from '@/composables/useLocalListFilters'
import { useStaffRoleOptions } from '@/composables/useStaffRoleOptions'
import { formatDateTime } from '@/utils/date-format'

const { t } = useI18n()
const loading = ref(false)
const allRows = ref([])
const { width } = useWindowSize()
const isNarrow = computed(() => width.value < 1400)
const filters = reactive({
  keyword: '',
})

const [createModalRef, createLoading] = useModal()
const [deleteModalRef, deleteLoading] = useModal()
const createFormRef = ref(null)
const { roleOptions } = useStaffRoleOptions({ t })
const createState = reactive({
  username: '',
  password: '',
  displayName: '',
  roleCode: 'SUPPORT',
})
const deleteState = reactive({
  id: '',
  adminPassword: '',
})
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
  { title: t('users.labels.id'), key: 'id', width: 160, ellipsis: true },
  { title: t('users.labels.username'), key: 'username', width: 120, ellipsis: true },
  { title: t('users.labels.displayName'), key: 'displayName', width: 120, ellipsis: true },
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
      return h(
        'div',
        { class: 'flex flex-wrap justify-end gap-6' },
        [
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => openDelete(row),
            },
            { default: () => t('users.actions.delete') },
          ),
        ],
      )
    },
  },
])

const { fieldLabels } = useColumnLabels(baseColumns, ['displayName', 'roles', 'createdAt'])
const narrowColumnKeys = new Set(['username', 'displayName', 'roles', 'actions'])
const columns = computed(() => (isNarrow.value
  ? baseColumns.value.filter(column => narrowColumnKeys.has(column.key))
  : baseColumns.value))

const filteredRows = useLocalListFilters({
  rows: allRows,
  filters,
  rules: [
    {
      key: 'keyword',
      type: 'includes',
      getters: [row => row.username, row => row.displayName],
    },
  ],
})

const pagedRows = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredRows.value.slice(start, start + pagination.pageSize)
})

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

async function fetchList() {
  try {
    loading.value = true
    const { data } = await api.list()
    allRows.value = data?.items || []
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

function handleCreateFieldUpdate({ key, value }) {
  createState[key] = value
}

function handleDeleteFieldUpdate({ key, value }) {
  deleteState[key] = value
}

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

fetchList()
</script>
