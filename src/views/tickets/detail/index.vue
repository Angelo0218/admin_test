<template>
  <CommonPage back>
    <n-space vertical size="large">
      <n-descriptions bordered :column="isMobile ? 1 : 2" label-placement="left">
        <n-descriptions-item :label="t('tickets.labels.id')">
          {{ detail.id || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('tickets.labels.subject')">
          {{ detail.subject || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('tickets.labels.category')">
          {{ categoryLabel(detail.category) }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('tickets.labels.status')">
          {{ statusLabel(detail.status) }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('tickets.labels.requester')">
          {{ detail.requesterName || '-' }}
        </n-descriptions-item>
        <n-descriptions-item :label="t('tickets.labels.createdAt')">
          {{ formatTime(detail.createdAt) }}
        </n-descriptions-item>
      </n-descriptions>

      <n-card :title="t('tickets.detail.settingsTitle')">
        <div class="flex flex-col gap-12 sm:flex-row sm:flex-wrap sm:items-start">
          <n-input v-model:value="meta.tags" :placeholder="t('tickets.detail.tagsPlaceholder')" class="w-full sm:w-240" />
          <n-input v-model:value="meta.internalNote" :placeholder="t('tickets.detail.internalNotePlaceholder')" class="w-full sm:w-320" />
          <n-button type="primary" @click="handleUpdateMeta">
            {{ t('common.update') }}
          </n-button>
        </div>
        <div class="mt-12 flex flex-col gap-12 sm:flex-row sm:flex-wrap sm:items-center">
          <n-select v-model:value="meta.status" :options="statusOptions" class="w-full sm:w-180" :disabled="!canUpdateStatus" />
          <n-button type="warning" :disabled="!canUpdateStatus" @click="handleUpdateStatus">
            {{ t('tickets.detail.changeStatus') }}
          </n-button>
        </div>
      </n-card>

      <n-card :title="t('tickets.detail.conversationTitle')">
        <n-empty v-if="!messages.length" :description="t('tickets.detail.emptyMessages')" />
        <div v-else class="flex flex-col gap-12">
          <div v-for="item in messages" :key="item.id" class="border rounded-8 p-12">
            <div class="mb-6 text-13 opacity-60">
              {{ item.senderName || item.senderId }} · {{ formatTime(item.createdAt) }}
            </div>
            <div>{{ item.message }}</div>
          </div>
        </div>
      </n-card>

      <n-card :title="t('tickets.detail.newMessageTitle')">
        <n-input v-model:value="replyMessage" type="textarea" :rows="4" :placeholder="t('tickets.detail.replyPlaceholder')" />
        <div class="mt-16 flex justify-end">
          <n-button type="primary" @click="handleReply">
            {{ t('tickets.detail.reply') }}
          </n-button>
        </div>
      </n-card>
    </n-space>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import api from '@/api/ticket'
import { CommonPage } from '@/components'
import { TICKET_TRANSITIONS } from '@/constants/status'

const { t } = useI18n()
const route = useRoute()
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)
const loading = ref(false)
const replyMessage = ref('')
const messages = ref([])
const detail = reactive({
  id: route.params.id,
  subject: '',
  category: '',
  status: '',
  requesterName: '',
  createdAt: '',
})

const meta = reactive({
  tags: '',
  internalNote: '',
  status: '',
})

const allStatusOptions = computed(() => [
  { label: t('tickets.status.WAITING'), value: 'WAITING' },
  { label: t('tickets.status.IN_PROGRESS'), value: 'IN_PROGRESS' },
  { label: t('tickets.status.CLOSED'), value: 'CLOSED' },
])

const allowedStatuses = computed(() => TICKET_TRANSITIONS[detail.status] || [])

// 狀態轉移僅做前端提示，後端仍保有嚴格檢查。
const statusOptions = computed(() => {
  if (!detail.status)
    return []
  const current = allStatusOptions.value.find(option => option.value === detail.status)
  const nextOptions = allowedStatuses.value
    .map(value => allStatusOptions.value.find(option => option.value === value))
    .filter(Boolean)
  if (!current)
    return nextOptions
  return [...nextOptions, { ...current, disabled: true }]
})

const canUpdateStatus = computed(() => allowedStatuses.value.length > 0)

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

function formatTime(value) {
  return value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchDetail() {
  try {
    loading.value = true
    const { data } = await api.getDetail(detail.id)
    const ticket = data?.ticket || {}
    detail.subject = ticket.subject || ''
    detail.category = ticket.category || ''
    detail.status = ticket.status || ''
    detail.requesterName = ticket.requesterName || ''
    detail.createdAt = ticket.createdAt || ''
    meta.tags = (ticket.tags || []).join(',')
    meta.internalNote = ticket.internalNote || ''
    meta.status = allowedStatuses.value[0] || detail.status || ''
    messages.value = data?.messages || []
  }
  catch (error) {
    console.error(error)
    $message.error(t('tickets.detail.fetchFailed'))
  }
  loading.value = false
}

async function handleReply() {
  if (!replyMessage.value) {
    $message.warning(t('tickets.detail.replyRequired'))
    return
  }
  try {
    loading.value = true
    await api.reply(detail.id, { message: replyMessage.value })
    replyMessage.value = ''
    await fetchDetail()
    $message.success(t('tickets.detail.replySuccess'))
  }
  catch (error) {
    console.error(error)
    $message.error(t('tickets.detail.replyFailed'))
  }
  loading.value = false
}

async function handleUpdateMeta() {
  try {
    loading.value = true
    await api.updateMeta(detail.id, {
      tags: meta.tags ? meta.tags.split(',').map(item => item.trim()).filter(Boolean) : [],
      internalNote: meta.internalNote || undefined,
    })
    await fetchDetail()
    $message.success(t('tickets.detail.updateSuccess'))
  }
  catch (error) {
    console.error(error)
    $message.error(t('tickets.detail.updateFailed'))
  }
  loading.value = false
}

async function handleUpdateStatus() {
  if (!canUpdateStatus.value) {
    $message.warning(t('tickets.detail.statusInvalid'))
    return
  }
  if (!meta.status) {
    $message.warning(t('tickets.detail.statusSelect'))
    return
  }
  if (!allowedStatuses.value.includes(meta.status)) {
    $message.warning(t('tickets.detail.statusInvalid'))
    return
  }
  try {
    loading.value = true
    await api.updateStatus(detail.id, { status: meta.status })
    await fetchDetail()
    $message.success(t('tickets.detail.statusUpdateSuccess'))
  }
  catch (error) {
    console.error(error)
    $message.error(t('tickets.detail.statusUpdateFailed'))
  }
  loading.value = false
}

fetchDetail()
</script>
