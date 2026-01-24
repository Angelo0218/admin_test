<template>
  <n-form label-placement="left" label-width="90">
    <n-form-item :label="t('tickets.create.userId')">
      <n-input
        :value="state.requesterId"
        :placeholder="t('tickets.create.userIdPlaceholder')"
        @update:value="value => emit('updateField', { key: 'requesterId', value })"
      />
    </n-form-item>
    <n-form-item :label="t('tickets.create.subject')">
      <n-input
        :value="state.subject"
        :placeholder="t('tickets.create.subjectPlaceholder')"
        @update:value="value => emit('updateField', { key: 'subject', value })"
      />
    </n-form-item>
    <n-form-item :label="t('tickets.create.category')">
      <n-select
        :value="state.category"
        :options="categoryOptions"
        @update:value="value => emit('updateField', { key: 'category', value })"
      />
    </n-form-item>
    <n-form-item :label="t('tickets.create.tags')">
      <n-input
        :value="state.tags"
        :placeholder="t('tickets.create.tagsPlaceholder')"
        @update:value="value => emit('updateField', { key: 'tags', value })"
      />
    </n-form-item>
    <n-form-item :label="t('tickets.create.internalNote')">
      <n-input
        :value="state.internalNote"
        type="textarea"
        :rows="3"
        @update:value="value => emit('updateField', { key: 'internalNote', value })"
      />
    </n-form-item>
  </n-form>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  state: {
    type: Object,
    required: true,
  },
  categoryOptions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['updateField'])
const { t } = useI18n()
</script>
