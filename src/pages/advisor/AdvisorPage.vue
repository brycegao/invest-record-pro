<!--
  @Description: 投顾推荐与复盘页面
-->
<template>
  <div class="advisor-page">
    <div class="advisor-page__header">
      <div>
        <h2 class="advisor-page__title">投顾推荐</h2>
        <p class="advisor-page__description">记录老师买卖推荐，按需复盘准确性（踏空/躲避金额）</p>
      </div>
    </div>
    <AdvisorPageBody />
  </div>
</template>

<script setup lang="ts">
import AdvisorPageBody from '@/features/advisor/components/AdvisorPageBody.vue'
</script>

<style scoped>
.advisor-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.advisor-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.advisor-page__title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}
.advisor-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}
</style>
