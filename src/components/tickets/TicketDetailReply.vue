<template>
  <n-card :title="t('tickets.detail.newMessageTitle')">
    <n-input v-model:value="model" type="textarea" :rows="4" :placeholder="t('tickets.detail.replyPlaceholder')" />
    <div class="mt-16 flex justify-end">
      <n-button type="primary" @click="emit('submit')">
        {{ t('tickets.detail.reply') }}
      </n-button>
    </div>
  </n-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])
const { t } = useI18n()

const model = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>
