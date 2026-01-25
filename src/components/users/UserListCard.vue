<template>
  <div class="card-border rounded-8 auto-bg p-12">
    <div class="flex items-center justify-between gap-8">
      <div class="text-14 font-600">
        {{ row.username || '-' }}
      </div>
    </div>
    <div class="grid mt-10 gap-6 text-12">
      <div class="flex items-center justify-between gap-8">
        <span class="opacity-60">{{ fieldLabels.displayName }}</span>
        <span class="text-right">{{ row.displayName || '-' }}</span>
      </div>
      <div class="flex items-center justify-between gap-8">
        <span class="opacity-60">{{ fieldLabels.roles }}</span>
        <span class="text-right">{{ roleNames(row.roles) }}</span>
      </div>
      <div class="flex items-center justify-between gap-8">
        <span class="opacity-60">{{ fieldLabels.createdAt }}</span>
        <span class="text-right">{{ formatTime(row.createdAt) }}</span>
      </div>
    </div>
    <div class="mt-10 flex flex-wrap justify-end gap-8">
      <NButton size="small" type="error" @click="onDelete(row)">
        {{ t('users.actions.delete') }}
      </NButton>
    </div>
  </div>
</template>

<script setup>
import { NButton } from 'naive-ui'
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
  roleNames: {
    type: Function,
    required: true,
  },
  formatTime: {
    type: Function,
    required: true,
  },
  onDelete: {
    type: Function,
    required: true,
  },
})

const { t } = useI18n()
</script>
