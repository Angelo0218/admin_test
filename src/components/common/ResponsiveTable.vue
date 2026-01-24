<template>
  <div class="responsive-table">
    <n-data-table
      class="responsive-table__desktop"
      :columns="columns"
      :data="data"
      :loading="loading"
      :pagination="pagination || false"
      striped
    />

    <div class="responsive-table__mobile">
      <n-spin :show="loading">
        <div v-if="!data?.length" class="py-24">
          <n-empty :description="t('common.noData')" />
        </div>
        <div v-else class="grid gap-12">
          <slot
            v-for="(row, index) in data"
            :key="resolveRowKey(row, index)"
            name="card"
            :row="row"
            :index="index"
          />
        </div>
      </n-spin>

      <n-pagination
        v-if="pagination"
        class="mt-12 flex justify-center"
        :page="pagination.page"
        :page-size="pagination.pageSize"
        :item-count="pagination.itemCount"
        :page-sizes="pagination.pageSizes || [10, 20, 50]"
        show-size-picker
        @update:page="pagination.onChange"
        @update:page-size="pagination.onUpdatePageSize"
      />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  pagination: {
    type: Object,
    default: null,
  },
  rowKey: {
    type: [String, Function],
    default: 'id',
  },
})

const { t } = useI18n()

function resolveRowKey(row, index) {
  if (typeof props.rowKey === 'function') {
    return props.rowKey(row)
  }
  return row?.[props.rowKey] ?? index
}
</script>

<style scoped>
.responsive-table__mobile {
  display: none;
}

@media (max-width: 768px) {
  .responsive-table__desktop {
    display: none;
  }

  .responsive-table__mobile {
    display: block;
  }
}
</style>
