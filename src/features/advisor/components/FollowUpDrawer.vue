<!--
  @Description: 跟随/复盘弹窗 — 手填区间价，实时算踏空/躲避金额
-->
<template>
  <NDrawer
    :show="show"
    placement="right"
    width="520"
    @update:show="(v: boolean) => emit('update:show', v)"
  >
    <NDrawerContent title="复盘推荐" closable>
      <NSpace vertical :size="16">
        <div class="advisor-followup__ref">
          推荐：{{ signal?.assetCode }} {{ signal?.assetName }}
          ｜ 参考价 {{ formatMoney(signal?.refPrice ?? 0) }}
          ｜ 假设量 {{ signal?.hypotheticalQty ?? 0 }} 股
        </div>

        <NRadioGroup v-model:value="followed">
          <NRadioButton :value="true">已跟随</NRadioButton>
          <NRadioButton :value="false">未跟随</NRadioButton>
        </NRadioGroup>

        <template v-if="followed">
          <NFormItem label="实际价">
            <NSpace align="center" class="advisor-followup__full">
              <NInputNumber v-model:value="actualPriceYuan" :precision="2" :step="0.01" :min="0" placeholder="元" />
              <NText>元</NText>
            </NSpace>
          </NFormItem>
          <NFormItem label="实际数量">
            <NInputNumber v-model:value="actualQty" :precision="0" :step="100" :min="0" placeholder="股数" />
          </NFormItem>
          <NFormItem label="实际日期">
            <NDatePicker v-model:value="actualAtTs" type="datetime" class="advisor-followup__full" />
          </NFormItem>
          <NFormItem label="实际盈亏">
            <NSpace align="center" class="advisor-followup__full">
              <NInputNumber v-model:value="actualPnlYuan" :precision="2" :step="0.01" placeholder="元（可选）" />
              <NText>元</NText>
            </NSpace>
          </NFormItem>
        </template>

        <template v-else>
          <NFormItem label="未跟随原因">
            <NInput v-model:value="reason" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
          </NFormItem>
          <NFormItem label="区间最高价">
            <NSpace align="center" class="advisor-followup__full">
              <NInputNumber v-model:value="rangeHighYuan" :precision="2" :step="0.01" :min="0" placeholder="元" />
              <NText>元</NText>
            </NSpace>
          </NFormItem>
          <NFormItem label="区间最低价">
            <NSpace align="center" class="advisor-followup__full">
              <NInputNumber v-model:value="rangeLowYuan" :precision="2" :step="0.01" :min="0" placeholder="元" />
              <NText>元</NText>
            </NSpace>
          </NFormItem>
          <NFormItem label="终点收盘价">
            <NSpace align="center" class="advisor-followup__full">
              <NInputNumber v-model:value="rangeEndCloseYuan" :precision="2" :step="0.01" :min="0" placeholder="元" />
              <NText>元</NText>
            </NSpace>
          </NFormItem>
        </template>

        <NCard title="实时计算结果" size="small" :bordered="true">
          <NSpace vertical :size="8">
            <div>
              结果类型：
              <NTag :type="outcomeTagType">{{ outcomeLabel }}</NTag>
            </div>
            <div v-if="outcome?.missedAmount != null" class="pos">
              踏空金额：{{ formatMoney(outcome.missedAmount) }}
              （{{ pctText(outcome.missedPct) }}）
            </div>
            <div v-else-if="outcome?.missedPct != null">
              踏空比例：{{ pctText(outcome.missedPct) }}（未填假设量）
            </div>
            <div v-if="outcome?.avoidedAmount != null" class="neg">
              躲避金额：{{ formatMoney(outcome.avoidedAmount) }}
              （{{ pctText(outcome.avoidedPct) }}）
            </div>
            <div v-else-if="outcome?.avoidedPct != null">
              躲避比例：{{ pctText(outcome.avoidedPct) }}（未填假设量）
            </div>
            <div v-if="outcome?.outcomeType === 'followed' && actualPnlYuan != null" class="pos">
              跟随盈亏：{{ formatMoney(yuanToFen(actualPnlYuan)) }}
            </div>
          </NSpace>
        </NCard>
      </NSpace>

      <div class="advisor-followup__footer">
        <NButton @click="emit('update:show', false)">取消</NButton>
        <NButton type="primary" :loading="saving" @click="handleSave">保存复盘</NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  NButton, NCard, NDatePicker, NDrawer, NDrawerContent, NFormItem,
  NInput, NInputNumber, NRadioButton, NRadioGroup, NSpace, NTag, NText, useMessage,
} from 'naive-ui'
import { evaluateSignal, type ReviewOutcome } from '@/services/advisor-review-calc.service'
import { fenToYuan, formatMoney, yuanToFen } from '@/domain/types/financial'
import { useAdvisorStore } from '../store'
import type { AdvisorSignal, FollowUpUpsertPayload } from '@/domain/types'

const props = defineProps<{ show: boolean; signal: AdvisorSignal | null }>()
const emit = defineEmits<{ 'update:show': [boolean] }>()
const message = useMessage()
const advisorStore = useAdvisorStore()
const saving = ref(false)

const followed = ref(true)
const actualPriceYuan = ref<number | null>(null)
const actualQty = ref<number | null>(null)
const actualAtTs = ref<number>(Date.now())
const actualPnlYuan = ref<number | null>(null)
const reason = ref('')
const rangeHighYuan = ref<number | null>(null)
const rangeLowYuan = ref<number | null>(null)
const rangeEndCloseYuan = ref<number | null>(null)

// 弹窗打开时用已有 follow_up 预填
watch(
  () => [props.show, props.signal?.id] as const,
  ([show]) => {
    if (!show || !props.signal) return
    const existing = advisorStore.getFollowUpFor(props.signal.id)
    followed.value = existing?.followed ?? true
    actualPriceYuan.value = existing?.actualPrice != null ? fenToYuan(existing.actualPrice) : null
    actualQty.value = existing?.actualQty ?? null
    actualAtTs.value = existing?.actualAt ? new Date(existing.actualAt).getTime() : Date.now()
    actualPnlYuan.value = null
    reason.value = existing?.reason ?? ''
    rangeHighYuan.value = existing?.rangeHigh != null ? fenToYuan(existing.rangeHigh) : null
    rangeLowYuan.value = existing?.rangeLow != null ? fenToYuan(existing.rangeLow) : null
    rangeEndCloseYuan.value = existing?.rangeEndClose != null ? fenToYuan(existing.rangeEndClose) : null
  },
  { immediate: true },
)

const outcome = computed<ReviewOutcome | null>(() => {
  if (!props.signal) return null
  return evaluateSignal({
    refPrice: props.signal.refPrice,
    followed: followed.value,
    actualPnl: actualPnlYuan.value != null ? yuanToFen(actualPnlYuan.value) : undefined,
    hypotheticalQty: props.signal.hypotheticalQty,
    rangeHigh: rangeHighYuan.value != null ? yuanToFen(rangeHighYuan.value) : 0,
    rangeLow: rangeLowYuan.value != null ? yuanToFen(rangeLowYuan.value) : 0,
    rangeEndClose: rangeEndCloseYuan.value != null ? yuanToFen(rangeEndCloseYuan.value) : 0,
  })
})

const outcomeLabel = computed(() => {
  switch (outcome.value?.outcomeType) {
    case 'followed': return '已跟随'
    case 'missed_gain': return '踏空'
    case 'avoided_loss': return '躲避'
    default: return '—'
  }
})
const outcomeTagType = computed<'success' | 'warning' | 'error'>(() => {
  switch (outcome.value?.outcomeType) {
    case 'followed': return 'success'
    case 'missed_gain': return 'error'
    case 'avoided_loss': return 'warning'
    default: return 'warning'
  }
})

function pctText(pct: number | undefined): string {
  return `${(((pct ?? 0)) * 100).toFixed(1)}%`
}

async function handleSave(): Promise<void> {
  if (!props.signal) return
  if (!followed.value && (rangeHighYuan.value == null || rangeLowYuan.value == null || rangeEndCloseYuan.value == null)) {
    message.warning('未跟随时请填写区间最高/最低/收盘价')
    return
  }
  saving.value = true
  const payload: FollowUpUpsertPayload = {
    signalId: props.signal.id,
    followed: followed.value,
    actualPrice: actualPriceYuan.value != null ? yuanToFen(actualPriceYuan.value) : null,
    actualQty: actualQty.value,
    actualAt: followed.value ? new Date(actualAtTs.value).toISOString() : null,
    linkedTradeId: null,
    reason: reason.value.trim() || null,
    rangeHigh: rangeHighYuan.value != null ? yuanToFen(rangeHighYuan.value) : null,
    rangeLow: rangeLowYuan.value != null ? yuanToFen(rangeLowYuan.value) : null,
    rangeEndClose: rangeEndCloseYuan.value != null ? yuanToFen(rangeEndCloseYuan.value) : null,
    reviewedAt: new Date().toISOString(),
  }
  try {
    await advisorStore.saveFollowUp(payload)
    message.success('复盘已保存')
    emit('update:show', false)
  } catch {
    message.error(advisorStore.error ?? '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.advisor-followup__ref {
  color: #666;
  font-size: 13px;
  background: #fafafa;
  padding: 8px 12px;
  border-radius: 4px;
}
.advisor-followup__full {
  width: 100%;
}
.advisor-followup__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}
.pos { color: #e74c3c; font-weight: 600; }
.neg { color: #27ae60; font-weight: 600; }
</style>
