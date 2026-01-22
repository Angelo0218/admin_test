<!--------------------------------
 - @Author: Ronnie Zhang
 - @LastEditor: Ronnie Zhang
 - @LastEditTime: 2023/12/05 21:28:15
 - @Email: zclzone@outlook.com
 - Copyright 穢 2023 Ronnie Zhang(憭扯?? | https://isme.top
 --------------------------------->

<template>
  <CommonPage :show-header="false">
    <div class="wh-full flex">
      <n-result
        m-auto
        status="404"
        title="404 找不到頁面"
        description="您要造訪的頁面不存在"
        size="large"
      >
        <template #footer>
          <n-button type="primary" ghost @click="replace('/')">
            返回首頁
          </n-button>
        </template>
      </n-result>
    </div>
  </CommonPage>
</template>

<script setup>
const { replace } = useRouter()
</script>
