<template>
  <n-form label-placement="left" label-width="90">
    <n-form-item :label="t('users.delete.adminPasswordLabel')">
      <n-input
        :value="state.adminPassword"
        type="password"
        show-password-on="mousedown"
        :placeholder="t('users.delete.adminPasswordPlaceholder')"
        @update:value="value => emit('updateField', { key: 'adminPassword', value })"
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
