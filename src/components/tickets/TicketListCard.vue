<template>
  <div class="card-border rounded-8 auto-bg p-12">
    <div class="flex items-center justify-between gap-8">
      <div class="text-14 font-600">
        {{ row.id || '-' }}
      </div>
      <NTag :type="statusType(row.status)">
        {{ statusLabel(row.status) }}
      </NTag>
    </div>
    <div class="grid mt-10 gap-6 text-12">
      <div class="flex items-center justify-between gap-8">
        <span class="opacity-60">{{ fieldLabels.subject }}</span>
        <span class="text-right">{{ row.subject || '-' }}</span>
      </div>
      <div class="flex items-center justify-between gap-8">
        <span class="opacity-60">{{ fieldLabels.category }}</span>
        <span class="text-right">{{ categoryLabel(row.category) }}</span>
      </div>
      <div class="flex items-center justify-between gap-8">
        <span class="opacity-60">{{ fieldLabels.requesterName }}</span>
        <span class="text-right">{{ row.requesterName || '-' }}</span>
      </div>
      <div class="flex items-center justify-between gap-8">
        <span class="opacity-60">{{ fieldLabels.createdAt }}</span>
        <span class="text-right">{{ formatTime(row.createdAt) }}</span>
      </div>
    </div>
    <div class="mt-10 flex justify-end">
      <NButton size="small" type="primary" @click="onView(row)">
        {{ t('common.view') }}
      </NButton>
    </div>
  </div>
</template>

<script setup>
import { NButton, NTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'

defineProps({
  row: {
    type: Object,
    required: true,
  },
  fieldLabels: {
    type: Object,
    required: true,
  },
  statusLabel: {
    type: Function,
    required: true,
  },
  statusType: {
    type: Function,
    required: true,
  },
  categoryLabel: {
    type: Function,
    required: true,
  },
  formatTime: {
    type: Function,
    required: true,
  },
  onView: {
    type: Function,
    required: true,
  },
})

const { t } = useI18n()
</script>
