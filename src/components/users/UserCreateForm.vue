<template>
  <n-form label-placement="left" label-width="90">
    <n-form-item :label="t('users.create.usernameLabel')">
      <n-input
        :value="state.username"
        :placeholder="t('users.create.usernamePlaceholder')"
        @update:value="value => emit('updateField', { key: 'username', value })"
      />
    </n-form-item>
    <n-form-item :label="t('users.create.passwordLabel')">
      <n-input
        :value="state.password"
        type="password"
        show-password-on="mousedown"
        :placeholder="t('users.create.passwordPlaceholder')"
        @update:value="value => emit('updateField', { key: 'password', value })"
      />
    </n-form-item>
    <n-form-item :label="t('users.create.displayNameLabel')">
      <n-input
        :value="state.displayName"
        :placeholder="t('users.create.displayNamePlaceholder')"
        @update:value="value => emit('updateField', { key: 'displayName', value })"
      />
    </n-form-item>
    <n-form-item :label="t('users.create.roleLabel')">
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
import { useI18n } from 'vue-i18n'

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
</script>
