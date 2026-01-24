<template>
  <n-card :title="t('tickets.detail.settingsTitle')">
    <div class="flex flex-col gap-12 sm:flex-row sm:flex-wrap sm:items-start">
      <n-input
        :value="meta.tags"
        :placeholder="t('tickets.detail.tagsPlaceholder')"
        class="w-full sm:w-240"
        @update:value="value => emit('updateMetaField', { key: 'tags', value })"
      />
      <n-input
        :value="meta.internalNote"
        :placeholder="t('tickets.detail.internalNotePlaceholder')"
        class="w-full sm:w-320"
        @update:value="value => emit('updateMetaField', { key: 'internalNote', value })"
      />
      <n-button type="primary" @click="emit('submitMeta')">
        {{ t('common.update') }}
      </n-button>
    </div>
    <div class="mt-12 flex flex-col gap-12 sm:flex-row sm:flex-wrap sm:items-center">
      <n-select
        :value="meta.status"
        :options="statusOptions"
        class="w-full sm:w-180"
        :disabled="!canUpdateStatus"
        @update:value="value => emit('updateMetaField', { key: 'status', value })"
      />
      <n-button type="warning" :disabled="!canUpdateStatus" @click="emit('submitStatus')">
        {{ t('tickets.detail.changeStatus') }}
      </n-button>
    </div>
  </n-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  meta: {
    type: Object,
    required: true,
  },
  statusOptions: {
    type: Array,
    required: true,
  },
  canUpdateStatus: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['updateMetaField', 'submitMeta', 'submitStatus'])
const { t } = useI18n()
</script>
