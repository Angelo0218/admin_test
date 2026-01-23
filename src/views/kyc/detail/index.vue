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
        <n-descriptions-item label="申請人">
          {{ detail.applicantName || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="姓名">
          {{ detail.fullName || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="身分證號">
          {{ detail.idNumber || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="證件類型">
          {{ detail.documentType || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="電話">
          {{ detail.phone || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="狀態">
          {{ detail.status || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="提交時間">
          {{ formatTime(detail.submittedAt) }}
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
          <n-button type="error" @click="handleReject">
            拒絕
          </n-button>
          <n-button type="warning" @click="handleNeedMore">
            補件
          </n-button>
          <n-button type="success" @click="handleApprove">
            通過
          </n-button>
        </div>
      </n-card>

      <n-card title="審核紀錄">
        <n-data-table :columns="reviewColumns" :data="reviews" striped />
      </n-card>

      <n-card title="申訴紀錄">
        <n-data-table :columns="appealColumns" :data="appeals" striped />
      </n-card>
    </n-space>
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import api from '@/api/kyc'
import { CommonPage } from '@/components'

const route = useRoute()

const loading = ref(false)
const comment = ref('')
const reviews = ref([])
const appeals = ref([])
const detail = reactive({
  id: route.params.id,
  applicantName: '',
  fullName: '',
  idNumber: '',
  documentType: '',
  phone: '',
  status: 'PENDING',
  submittedAt: '',
  documents: [],
})

const reviewColumns = [
  { title: '動作', key: 'action', minWidth: 120 },
  { title: '審查員', key: 'reviewerName', minWidth: 120 },
  { title: '意見', key: 'comment', minWidth: 200 },
  {
    title: '時間',
    key: 'createdAt',
    minWidth: 180,
    render: row => formatTime(row.createdAt),
  },
]

const appealColumns = [
  { title: '申訴原因', key: 'reason', minWidth: 200 },
  { title: '狀態', key: 'status', minWidth: 100 },
  { title: '處理人', key: 'handledByName', minWidth: 120 },
  { title: '處理時間', key: 'handledAt', minWidth: 180, render: row => formatTime(row.handledAt) },
]

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchDetail() {
  try {
    loading.value = true
    const { data } = await api.getDetail(detail.id)
    const application = data?.application || {}
    detail.applicantName = application.applicantName || ''
    detail.fullName = application.fullName || ''
    detail.idNumber = application.idNumber || ''
    detail.documentType = application.documentType || ''
    detail.phone = application.phone || ''
    detail.status = application.status || 'PENDING'
    detail.submittedAt = application.submittedAt || ''
    detail.documents = application.documents || []
    reviews.value = data?.reviews || []
    appeals.value = data?.appeals || []
  }
  catch (error) {
    console.error(error)
    $message.error('讀取案件詳情失敗')
  }
  loading.value = false
}

async function handleApprove() {
  await handleReview('PASSED')
}

async function handleReject() {
  if (!comment.value) {
    $message.warning('請輸入拒絕原因')
    return
  }
  await handleReview('REJECTED')
}

async function handleNeedMore() {
  if (!comment.value) {
    $message.warning('請輸入補件原因')
    return
  }
  await handleReview('NEED_MORE')
}

async function handleReview(action) {
  try {
    loading.value = true
    await api.review(detail.id, { action, comment: comment.value })
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

fetchDetail()
</script>
