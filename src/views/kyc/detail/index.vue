<!--------------------------------
 - KYC Audit Detail
 --------------------------------->

<template>
  <CommonPage back>
    <n-space vertical size="large">
      <n-descriptions bordered :column="2" label-placement="left">
        <n-descriptions-item label="案件編號">
          {{ detail.id || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="姓名">
          {{ detail.fullName || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="身分證號">
          {{ detail.idNumber || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="狀態">
          {{ detail.status || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="提交時間">
          {{ formatTime(detail.submittedAt) }}
        </n-descriptions-item>
        <n-descriptions-item label="分配審查員">
          {{ detail.assignedAuditorName || '-' }}
        </n-descriptions-item>
      </n-descriptions>

      <n-card title="證件資料">
        <div class="grid gap-16 lg:grid-cols-3 sm:grid-cols-2">
          <n-empty v-if="!detail.documents.length" description="尚無證件資料" />
          <div v-for="doc in detail.documents" :key="doc.id" class="flex-col">
            <div class="mb-8 text-13 opacity-60">
              {{ doc.type }}
            </div>
            <n-image :src="doc.url" width="220" height="140" object-fit="cover" />
          </div>
        </div>
      </n-card>

      <n-card title="審核意見">
        <n-input v-model:value="comment" type="textarea" :rows="4" placeholder="輸入審核意見" />
        <div class="mt-16 flex justify-end gap-12">
          <n-button v-if="isSuperAdmin" type="warning" @click="handleReset">
            重置狀態
          </n-button>
          <n-button type="error" @click="handleReject">
            拒絕
          </n-button>
          <n-button type="success" @click="handleApprove">
            通過
          </n-button>
        </div>
      </n-card>

      <n-card title="審核紀錄">
        <n-data-table :columns="historyColumns" :data="auditHistory" striped />
      </n-card>
    </n-space>
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import api from '@/api/kyc'
import { CommonPage } from '@/components'
import { useUserStore } from '@/store'

const route = useRoute()
const userStore = useUserStore()
const isSuperAdmin = computed(() => userStore.currentRole?.code === 'SUPER_ADMIN')

const loading = ref(false)
const comment = ref('')
const auditHistory = ref([])
const detail = reactive({
  id: route.params.id,
  fullName: '',
  idNumber: '',
  status: 'PENDING',
  submittedAt: '',
  assignedAuditorName: '',
  documents: [],
})

const historyColumns = [
  { title: '動作', key: 'action', minWidth: 120 },
  { title: '審查員', key: 'auditorName', minWidth: 120 },
  { title: '意見', key: 'comment', minWidth: 200 },
  {
    title: '時間',
    key: 'createdAt',
    minWidth: 180,
    render: row => formatTime(row.createdAt),
  },
]

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchDetail() {
  try {
    loading.value = true
    const { data } = await api.getDetail(detail.id)
    const application = data?.application || {}
    detail.fullName = application.fullName || ''
    detail.idNumber = application.idNumber || ''
    detail.status = application.status || 'PENDING'
    detail.submittedAt = application.submittedAt || ''
    detail.assignedAuditorName = application.assignedAuditorName || ''
    detail.documents = application.documents || []
    auditHistory.value = data?.auditHistory || []
  }
  catch (error) {
    console.error(error)
    $message.error('讀取案件詳情失敗')
  }
  loading.value = false
}

async function handleApprove() {
  await handleAudit('APPROVED')
}

async function handleReject() {
  if (!comment.value) {
    $message.warning('請輸入拒絕原因')
    return
  }
  await handleAudit('REJECTED')
}

async function handleAudit(decision) {
  try {
    loading.value = true
    await api.audit(detail.id, {
      decision,
      comment: comment.value,
    })
    $message.success('已送出審核')
    comment.value = ''
    await fetchDetail()
  }
  catch (error) {
    console.error(error)
    $message.error('審核送出失敗')
  }
  loading.value = false
}

async function handleReset() {
  const d = $dialog.warning({
    title: '確認',
    content: '確定要重置審核狀態嗎？',
    positiveText: '確定',
    negativeText: '取消',
    async onPositiveClick() {
      try {
        d.loading = true
        await api.reset(detail.id, { reason: '重置審核狀態' })
        $message.success('已重置狀態')
        await fetchDetail()
        d.loading = false
      }
      catch (error) {
        console.error(error)
        $message.error('重置狀態失敗')
        d.loading = false
      }
    },
  })
}

fetchDetail()
</script>
