<template>
  <n-form label-placement="left" label-width="80">
    <n-form-item :label="t('users.reset.passwordLabel')">
      <n-input
        :value="state.password"
        :placeholder="t('users.reset.passwordPlaceholder')"
        @update:value="value => emit('updateField', { key: 'password', value })"
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
