<!--------------------------------
 - KYC Pending List
 --------------------------------->

<template>
  <CommonPage>
    <template #action>
      <NButton type="primary" @click="handleRefresh">
        重新整理
      </NButton>
    </template>

    <n-data-table
      :columns="columns"
      :data="rows"
      :loading="loading"
      :pagination="pagination"
      striped
    />

    <MeModal ref="assignModalRef">
      <n-form label-placement="left" label-width="80">
        <n-form-item label="審查員">
          <n-select
            v-model:value="assignState.auditorId"
            :options="auditorOptions"
            placeholder="選擇審查員"
            clearable
          />
        </n-form-item>
      </n-form>
    </MeModal>
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import { NButton, NTag } from 'naive-ui'
import api from '@/api/kyc'
import { CommonPage, MeModal } from '@/components'
import { useModal } from '@/composables'
import { useUserStore } from '@/store'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const rows = ref([])
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

const isSuperAdmin = computed(() => userStore.currentRole?.code === 'SUPER_ADMIN')
const [assignModalRef, assignLoading] = useModal()
const assignState = reactive({
  applicationId: '',
  auditorId: null,
})
const auditorOptions = ref([])

const columns = [
  { title: '案件編號', key: 'id', minWidth: 120 },
  { title: '姓名', key: 'fullName', minWidth: 120 },
  { title: '身分證號', key: 'idNumber', minWidth: 140 },
  {
    title: '狀態',
    key: 'status',
    minWidth: 100,
    render: row =>
      h(
        NTag,
        { type: row.status === 'PENDING' ? 'warning' : 'default' },
        { default: () => row.status || '-' },
      ),
  },
  {
    title: '提交時間',
    key: 'submittedAt',
    minWidth: 180,
    render: row => formatTime(row.submittedAt),
  },
  {
    title: '操作',
    key: 'actions',
    minWidth: 180,
    align: 'right',
    render: (row) => {
      const actions = [
        h(
          NButton,
          {
            size: 'small',
            type: 'primary',
            onClick: () => router.push(`/kyc/detail/${row.id}`),
          },
          { default: () => '查看' },
        ),
      ]
      if (isSuperAdmin.value) {
        actions.push(
          h(
            NButton,
            {
              size: 'small',
              class: 'ml-8',
              onClick: () => openAssign(row),
            },
            { default: () => '分配' },
          ),
        )
      }
      return h('div', { class: 'flex justify-end' }, actions)
    },
  },
]

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchList() {
  try {
    loading.value = true
    const { data } = await api.getPendingList({
      page: pagination.page,
      pageSize: pagination.pageSize,
    })
    rows.value = data?.items || []
    pagination.itemCount = data?.total || 0
  }
  catch (error) {
    console.error(error)
    $message.error('讀取待審核列表失敗')
  }
  loading.value = false
}

async function fetchAuditors() {
  try {
    const { data } = await api.getAuditors()
    auditorOptions.value = (data || []).map(item => ({
      label: item.name,
      value: item.id,
    }))
  }
  catch (error) {
    console.error(error)
    $message.error('讀取審查員清單失敗')
  }
}

async function openAssign(row) {
  assignState.applicationId = row.id
  assignState.auditorId = row.assignedAuditorId || null
  if (!auditorOptions.value.length)
    await fetchAuditors()
  assignModalRef.value?.open({
    title: `分配審查員 - ${row.fullName || row.id}`,
    okText: '確認',
    onOk: handleAssign,
  })
}

async function handleAssign() {
  if (!assignState.auditorId) {
    $message.warning('請選擇審查員')
    return false
  }
  try {
    assignLoading.value = true
    await api.assign(assignState.applicationId, {
      auditorId: assignState.auditorId,
    })
    $message.success('已分配')
    await fetchList()
  }
  catch (error) {
    console.error(error)
    $message.error('分配失敗')
    return false
  }
  finally {
    assignLoading.value = false
  }
}

function handleRefresh() {
  fetchList()
}

fetchList()
</script>
