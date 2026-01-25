<template>
  <n-form ref="formRef" :model="state" :rules="rules" label-placement="left" label-width="90">
    <n-form-item :label="t('users.create.usernameLabel')" path="username">
      <n-input
        :value="state.username"
        :placeholder="t('users.create.usernamePlaceholder')"
        @update:value="value => emit('updateField', { key: 'username', value })"
      />
    </n-form-item>
    <n-form-item :label="t('users.create.passwordLabel')" path="password">
      <n-input
        :value="state.password"
        type="password"
        show-password-on="mousedown"
        :placeholder="t('users.create.passwordPlaceholder')"
        @update:value="value => emit('updateField', { key: 'password', value })"
      />
    </n-form-item>
    <n-form-item :label="t('users.create.displayNameLabel')" path="displayName">
      <n-input
        :value="state.displayName"
        :placeholder="t('users.create.displayNamePlaceholder')"
        @update:value="value => emit('updateField', { key: 'displayName', value })"
      />
    </n-form-item>
    <n-form-item :label="t('users.create.roleLabel')" path="roleCode">
      <n-select
        :value="state.roleCode"
        :options="roleOptions"
        :placeholder="t('users.create.rolePlaceholder')"
        @update:value="value => emit('updateField', { key: 'roleCode', value })"
      />
    </n-form-item>
  </n-form>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserCreateRules } from '@/composables/useUserCreateRules'

defineProps({
  state: {
    type: Object,
    required: true,
  },
  roleOptions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['updateField'])
const { t } = useI18n()
const { rules } = useUserCreateRules({ t })
const formRef = ref(null)

async function validate() {
  if (!formRef.value?.validate)
    return true
  try {
    await formRef.value.validate()
    return true
  }
  catch {
    return false
  }
}

function resetValidation() {
  formRef.value?.restoreValidation?.()
}

defineExpose({
  validate,
  resetValidation,
})
</script>
