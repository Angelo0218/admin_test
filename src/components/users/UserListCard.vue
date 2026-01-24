<template>
  <div class="card-border rounded-8 auto-bg p-12">
    <div class="flex items-center justify-between gap-8">
      <div class="text-14 font-600">
        {{ row.username || '-' }}
      </div>
      <NTag :type="statusType(row.status)">
        {{ statusLabel(row.status) }}
      </NTag>
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
      <NButton
        v-if="row.status === 'ACTIVE'"
        size="small"
        type="error"
        @click="onDisable(row)"
      >
        {{ t('users.actions.disable') }}
      </NButton>
      <NButton
        v-else
        size="small"
        type="success"
        @click="onEnable(row)"
      >
        {{ t('users.actions.enable') }}
      </NButton>
      <NButton size="small" @click="onReset(row)">
        {{ t('users.actions.resetPassword') }}
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
  roleNames: {
    type: Function,
    required: true,
  },
  formatTime: {
    type: Function,
    required: true,
  },
  onDisable: {
    type: Function,
    required: true,
  },
  onEnable: {
    type: Function,
    required: true,
  },
  onReset: {
    type: Function,
    required: true,
  },
})

const { t } = useI18n()
</script>
