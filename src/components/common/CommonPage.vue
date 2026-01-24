<template>
  <main class="h-full flex-col flex-1 overflow-hidden bg-#f5f6fb dark:bg-#121212">
    <AppCard
      v-if="showHeader"
      class="sticky top-0 z-1 min-h-60 flex flex-col justify-between gap-12 px-16 sm:flex-row sm:items-center sm:px-24"
      border-b="1px solid light_border dark:dark_border"
    >
      <slot v-if="$slots.header" name="header" />
      <template v-else>
        <div class="flex items-center">
          <slot name="title-prefix">
            <template v-if="back">
              <div
                class="mr-16 flex cursor-pointer items-center text-16 opacity-60 transition-all-300 hover:opacity-40"
                @click="router.back()"
              >
                <i class="i-material-symbols:arrow-left-alt" />
                <span class="ml-4">{{ t('common.back') }}</span>
              </div>
            </template>
          </slot>

          <div class="mr-12 h-16 w-4 rounded-l-2 bg-primary" />
          <h2 class="font-normal">
            {{ pageTitle }}
          </h2>
          <slot name="title-suffix" />
        </div>
        <slot name="action" />
      </template>
    </AppCard>
    <AppCard class="cus-scroll m-8 h-0 flex-1 rounded-8 p-16 sm:m-12 sm:p-24" bordered>
      <slot />
    </AppCard>

    <slot name="footer">
      <AppCard v-if="showFooter" class="flex-shrink-0 py-12">
        <TheFooter />
      </AppCard>
    </slot>
  </main>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  back: {
    type: Boolean,
    default: false,
  },
  showFooter: {
    type: Boolean,
    default: false,
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: undefined,
  },
})
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const pageTitle = computed(() => {
  if (props.title)
    return props.title
  const key = route.meta?.titleKey
  if (key)
    return t(key)
  return route.meta?.title || ''
})
</script>
