<template>
  <n-card :title="t('tickets.detail.conversationTitle')">
    <n-empty v-if="!messages.length" :description="t('tickets.detail.emptyMessages')" />
    <div v-else class="flex flex-col gap-12">
      <div v-for="item in messages" :key="item.id" class="border rounded-8 p-12">
        <div class="mb-6 text-13 opacity-60">
          {{ item.senderName || item.senderId }} - {{ formatTime(item.createdAt) }}
        </div>
        <div>{{ item.message }}</div>
      </div>
    </div>
  </n-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  messages: {
    type: Array,
    required: true,
  },
  formatTime: {
    type: Function,
    required: true,
  },
})

const { t } = useI18n()
</script>
