<template>
  <CommonPage back>
    <n-space vertical size="large">
      <n-descriptions bordered :column="isMobile ? 1 : 2" label-placement="left">
        <n-descriptions-item :label="t('kyc.labels.caseId')">
          {{ detail.id || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('kyc.labels.applicant')">
          {{ detail.applicantName || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('kyc.labels.name')">
          {{ detail.fullName || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('kyc.labels.idNumber')">
          {{ detail.idNumber || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('kyc.labels.documentType')">
          {{ detail.documentType || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('kyc.labels.phone')">
          {{ detail.phone || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('kyc.labels.status')">
          {{ statusLabel(detail.status) }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('kyc.labels.submittedAt')">
          {{ formatTime(detail.submittedAt) }}
        </n-descriptions-item>
      </n-descriptions>

      <n-card :title="t('kyc.documents.title')">
        <div class="grid gap-16 lg:grid-cols-3 sm:grid-cols-2">
          <n-empty v-if="!detail.documents.length" :description="t('kyc.documents.empty')" />
          <div v-for="doc in detail.documents" :key="doc.id" class="flex-col">
            <div class="mb-8 text-13 opacity-60">
              {{ doc.type }}
            </div>
            <n-image :src="doc.url" width="220" height="140" object-fit="cover" />
          </div>
        </div>
      </n-card>

      <n-card :title="t('kyc.review.title')">
        <n-input v-model:value="comment" type="textarea" :rows="4" :placeholder="t('kyc.review.placeholder')" />
        <div class="mt-16 flex justify-end gap-12">
          <n-button type="error" :disabled="!canReject" @click="handleReject">
            {{ t('kyc.review.reject') }}
          </n-button>
          <n-button type="warning" :disabled="!canNeedMore" @click="handleNeedMore">
            {{ t('kyc.review.needMore') }}
          </n-button>
          <n-button type="success" :disabled="!canApprove" @click="handleApprove">
            {{ t('kyc.review.approve') }}
          </n-button>
        </div>
      </n-card>

      <n-card :title="t('kyc.reviewRecords.title')">
        <ResponsiveTable :columns="reviewColumns" :data="reviews" :loading="loading">
          <template #card="{ row }">
            <div class="card-border rounded-8 auto-bg p-12">
              <div class="flex items-center justify-between gap-8">
                <div class="text-14 font-600">
                  {{ statusLabel(row.action) }}
                </div>
                <div class="text-12 opacity-60">
                  {{ formatTime(row.createdAt) }}
                </div>
              </div>
              <div class="grid mt-10 gap-6 text-12">
                <div class="flex items-center justify-between gap-8">
                  <span class="opacity-60">{{ reviewFieldLabels.reviewerName }}</span>
                  <span class="text-right">{{ row.reviewerName || '-' }}</span>
                </div>
                <div class="flex items-center justify-between gap-8">
                  <span class="opacity-60">{{ reviewFieldLabels.comment }}</span>
                  <span class="text-right">{{ row.comment || '-' }}</span>
                </div>
              </div>
            </div>
          </template>
        </ResponsiveTable>
      </n-card>

      <n-card :title="t('kyc.appealRecords.title')">
        <ResponsiveTable :columns="appealColumns" :data="appeals" :loading="loading">
          <template #card="{ row }">
            <div class="card-border rounded-8 auto-bg p-12">
              <div class="flex items-center justify-between gap-8">
                <div class="text-14 font-600">
                  {{ appealStatusLabel(row.status) }}
                </div>
                <div class="text-12 opacity-60">
                  {{ formatTime(row.handledAt) }}
                </div>
              </div>
              <div class="grid mt-10 gap-6 text-12">
                <div class="flex items-center justify-between gap-8">
                  <span class="opacity-60">{{ appealFieldLabels.reason }}</span>
                  <span class="text-right">{{ row.reason || '-' }}</span>
                </div>
                <div class="flex items-center justify-between gap-8">
                  <span class="opacity-60">{{ appealFieldLabels.handledByName }}</span>
                  <span class="text-right">{{ row.handledByName || '-' }}</span>
                </div>
              </div>
            </div>
          </template>
        </ResponsiveTable>
      </n-card>
    </n-space>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import api from '@/api/kyc'
import { CommonPage, ResponsiveTable } from '@/components'
import { KYC_TRANSITIONS } from '@/constants/status'

const { t } = useI18n()
const route = useRoute()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

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

const reviewColumns = computed(() => [
  {
    title: t('kyc.columns.action'),
    key: 'action',
    minWidth: 120,
    render: row => statusLabel(row.action),
  },
  { title: t('kyc.columns.reviewer'), key: 'reviewerName', minWidth: 120 },
  { title: t('kyc.columns.comment'), key: 'comment', minWidth: 200 },
  {
    title: t('kyc.columns.time'),
    key: 'createdAt',
    minWidth: 180,
    render: row => formatTime(row.createdAt),
  },
])

const appealColumns = computed(() => [
  { title: t('kyc.columns.reason'), key: 'reason', minWidth: 200 },
  {
    title: t('kyc.labels.status'),
    key: 'status',
    minWidth: 100,
    render: row => appealStatusLabel(row.status),
  },
  { title: t('kyc.columns.handledBy'), key: 'handledByName', minWidth: 120 },
  { title: t('kyc.columns.handledAt'), key: 'handledAt', minWidth: 180, render: row => formatTime(row.handledAt) },
])

const reviewFieldLabels = computed(() => ({
  reviewerName: reviewColumns.value[1].title,
  comment: reviewColumns.value[2].title,
}))

const appealFieldLabels = computed(() => ({
  reason: appealColumns.value[0].title,
  handledByName: appealColumns.value[2].title,
}))

function statusLabel(status) {
  const key = `kyc.status.${status}`
  const label = t(key)
  return label === key ? status || '-' : label
}

function appealStatusLabel(status) {
  const key = `kyc.appealStatus.${status}`
  const label = t(key)
  return label === key ? status || '-' : label
}

// 狀態轉移僅供前端提示，實際規則由後端判定。
function isReviewActionAllowed(action) {
  const allowed = KYC_TRANSITIONS[detail.status] || []
  return allowed.includes(action)
}

const canApprove = computed(() => isReviewActionAllowed('PASSED'))
const canReject = computed(() => isReviewActionAllowed('REJECTED'))
const canNeedMore = computed(() => isReviewActionAllowed('NEED_MORE'))

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
    $message.error(t('kyc.review.fetchFailed'))
  }
  loading.value = false
}

async function handleApprove() {
  await handleReview('PASSED')
}

async function handleReject() {
  if (!comment.value) {
    $message.warning(t('kyc.review.needRejectReason'))
    return
  }
  await handleReview('REJECTED')
}

async function handleNeedMore() {
  if (!comment.value) {
    $message.warning(t('kyc.review.needMoreReason'))
    return
  }
  await handleReview('NEED_MORE')
}

async function handleReview(action) {
  if (!isReviewActionAllowed(action)) {
    $message.warning(t('kyc.review.invalidStatus'))
    return
  }
  try {
    loading.value = true
    await api.review(detail.id, { action, comment: comment.value })
    $message.success(t('kyc.review.success'))
    comment.value = ''
    await fetchDetail()
  }
  catch (error) {
    console.error(error)
    $message.error(t('kyc.review.failed'))
  }
  loading.value = false
}

fetchDetail()
</script>
