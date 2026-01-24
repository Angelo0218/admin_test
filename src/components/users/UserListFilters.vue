<template>
  <div class="grid mb-16 gap-12 sm:flex sm:flex-wrap sm:items-center">
    <n-select
      :value="filters.status"
      :options="statusOptions"
      :placeholder="t('common.status')"
      class="w-full sm:w-160"
      @update:value="value => emit('updateFilter', { key: 'status', value })"
    />
    <n-input
      :value="filters.keyword"
      :placeholder="t('users.list.searchPlaceholder')"
      class="w-full sm:w-220"
      @update:value="value => emit('updateFilter', { key: 'keyword', value })"
    />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  filters: {
    type: Object,
    required: true,
  },
  statusOptions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['updateFilter'])
const { t } = useI18n()
</script>
