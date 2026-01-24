<template>
  <CommonPage :show-header="false">
    <div class="wh-full flex">
      <n-result
        class="m-auto"
        status="404"
        :title="t('errors.404Title')"
        :description="t('errors.404Desc')"
        size="large"
      >
        <template #footer>
          <n-button type="primary" ghost @click="replace('/')">
            {{ t('errors.backHome') }}
          </n-button>
        </template>
      </n-result>
    </div>
  </CommonPage>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { replace } = useRouter()
</script>
