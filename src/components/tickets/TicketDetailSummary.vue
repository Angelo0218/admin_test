<template>
  <n-descriptions bordered :column="isMobile ? 1 : 2" label-placement="left">
    <n-descriptions-item :label="t('tickets.labels.id')">
      {{ summary.id }}
    </n-descriptions-item>
    <n-descriptions-item :label="t('tickets.labels.subject')">
      {{ summary.subject }}
    </n-descriptions-item>
    <n-descriptions-item :label="t('tickets.labels.category')">
      {{ summary.category }}
    </n-descriptions-item>
    <n-descriptions-item :label="t('tickets.labels.status')">
      {{ summary.status }}
    </n-descriptions-item>
    <n-descriptions-item :label="t('tickets.labels.requester')">
      {{ summary.requesterName }}
    </n-descriptions-item>
    <n-descriptions-item :label="t('tickets.labels.createdAt')">
      {{ summary.createdAt }}
    </n-descriptions-item>
  </n-descriptions>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  isMobile: {
    type: Boolean,
    required: true,
  },
  summary: {
    type: Object,
    required: true,
  },
})

const { t } = useI18n()
</script>
