<template>
  <n-form label-placement="left" label-width="80">
    <n-form-item :label="t('users.disable.reasonLabel')">
      <n-input
        :value="state.reason"
        type="textarea"
        :rows="3"
        @update:value="value => emit('updateField', { key: 'reason', value })"
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
})

const emit = defineEmits(['updateField'])
const { t } = useI18n()
</script>
