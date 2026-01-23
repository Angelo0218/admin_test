<!--------------------------------
 - Ticket Detail
 --------------------------------->

<template>
  <CommonPage back>
    <n-space vertical size="large">
      <n-descriptions bordered :column="2" label-placement="left">
        <n-descriptions-item label="工單編號">
          {{ detail.id || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="主旨">
          {{ detail.subject || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="分類">
          {{ detail.category || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="狀態">
          {{ detail.status || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="用戶">
          {{ detail.requesterName || '-' }}
        </n-descriptions-item>
        <n-descriptions-item label="建立時間">
          {{ formatTime(detail.createdAt) }}
        </n-descriptions-item>
      </n-descriptions>

      <n-card title="工單設定">
        <div class="flex flex-wrap items-start gap-12">
          <n-input v-model:value="meta.tags" placeholder="標籤 (逗號分隔)" class="w-240" />
          <n-input v-model:value="meta.internalNote" placeholder="內部備註" class="w-320" />
          <n-button type="primary" @click="handleUpdateMeta">
            更新
          </n-button>
        </div>
        <div class="mt-12 flex flex-wrap items-center gap-12">
          <n-select v-model:value="meta.status" :options="statusOptions" class="w-180" />
          <n-button type="warning" @click="handleUpdateStatus">
            變更狀態
          </n-button>
        </div>
      </n-card>

      <n-card title="對話紀錄">
        <n-empty v-if="!messages.length" description="尚無回覆紀錄" />
        <div v-else class="flex flex-col gap-12">
          <div v-for="item in messages" :key="item.id" class="border rounded-8 p-12">
            <div class="mb-6 text-13 opacity-60">
              {{ item.senderName || item.senderId }} · {{ formatTime(item.createdAt) }}
            </div>
            <div>{{ item.message }}</div>
          </div>
        </div>
      </n-card>

      <n-card title="客服回覆">
        <n-input v-model:value="replyMessage" type="textarea" :rows="4" placeholder="輸入回覆內容" />
        <div class="mt-16 flex justify-end">
          <n-button type="primary" @click="handleReply">
            送出回覆
          </n-button>
        </div>
      </n-card>
    </n-space>
  </CommonPage>
</template>

<script setup>
import dayjs from 'dayjs'
import api from '@/api/ticket'
import { CommonPage } from '@/components'

const route = useRoute()
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

const statusOptions = [
  { label: '待回覆', value: 'WAITING' },
  { label: '處理中', value: 'IN_PROGRESS' },
  { label: '已結案', value: 'CLOSED' },
]

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
    meta.status = ticket.status || ''
    messages.value = data?.messages || []
  }
  catch (error) {
    console.error(error)
    $message.error('讀取工單詳情失敗')
  }
  loading.value = false
}

async function handleReply() {
  if (!replyMessage.value) {
    $message.warning('請輸入回覆內容')
    return
  }
  try {
    loading.value = true
    await api.reply(detail.id, { message: replyMessage.value })
    replyMessage.value = ''
    await fetchDetail()
    $message.success('已送出回覆')
  }
  catch (error) {
    console.error(error)
    $message.error('送出回覆失敗')
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
    $message.success('已更新')
  }
  catch (error) {
    console.error(error)
    $message.error('更新失敗')
  }
  loading.value = false
}

async function handleUpdateStatus() {
  if (!meta.status) {
    $message.warning('請選擇狀態')
    return
  }
  try {
    loading.value = true
    await api.updateStatus(detail.id, { status: meta.status })
    await fetchDetail()
    $message.success('狀態已更新')
  }
  catch (error) {
    console.error(error)
    $message.error('更新狀態失敗')
  }
  loading.value = false
}

fetchDetail()
</script>
