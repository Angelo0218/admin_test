<template>
  <CommonPage back>
    <n-space vertical size="large">
      <TicketDetailSummary :summary="summary" :is-mobile="isMobile" />
      <TicketDetailSettings
        :meta="meta"
        :status-options="statusOptions"
        :can-update-status="canUpdateStatus"
        @update-meta-field="handleMetaFieldChange"
        @submit-meta="handleUpdateMeta"
        @submit-status="handleUpdateStatus"
      />
      <TicketDetailConversation :messages="messages" :format-time="formatTime" />
      <TicketDetailReply v-model="replyMessage" @submit="handleReply" />
    </n-space>
  </CommonPage>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import api from '@/api/ticket'
import { CommonPage } from '@/components'
import TicketDetailConversation from '@/components/tickets/TicketDetailConversation.vue'
import TicketDetailReply from '@/components/tickets/TicketDetailReply.vue'
import TicketDetailSettings from '@/components/tickets/TicketDetailSettings.vue'
import TicketDetailSummary from '@/components/tickets/TicketDetailSummary.vue'

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
  availableStatuses: [],
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

const allowedStatuses = computed(() => detail.availableStatuses || [])
const summary = computed(() => ({
  id: detail.id || '-',
  subject: detail.subject || '-',
  category: categoryLabel(detail.category),
  status: statusLabel(detail.status),
  requesterName: detail.requesterName || '-',
  createdAt: formatTime(detail.createdAt),
}))

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

function handleMetaFieldChange({ key, value }) {
  meta[key] = value
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
    detail.availableStatuses = data?.availableStatuses || []
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
