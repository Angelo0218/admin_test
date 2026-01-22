<!--------------------------------
 - @Author: Ronnie Zhang
 - @LastEditor: Ronnie Zhang
 - @LastEditTime: 2023/12/05 21:28:09
 - @Email: zclzone@outlook.com
 - Copyright 穢 2023 Ronnie Zhang(憭扯?? | https://isme.top
 --------------------------------->

<template>
  <CommonPage :show-header="false">
    <div class="wh-full flex">
      <n-result
        class="m-auto"
        status="403"
        title="403 權限不足"
        description="您沒有權限存取此頁面"
        size="large"
      >
        <template #footer>
          <n-button v-if="back" type="primary" ghost @click="router.replace(back)">
            返回上一頁
          </n-button>
          <n-button type="primary" class="ml-20" @click="router.replace('/')">
            返回首頁
          </n-button>
        </template>
      </n-result>
    </div>
  </CommonPage>
</template>

<script setup>
const router = useRouter()
const route = useRoute()

const back = history.state.back

if (history.state.from === 'permission-guard') {
  delete history.state.from
}
else if (route.query.path) {
  router.replace(route.query.path)
}
</script>
