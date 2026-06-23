<!--
  @Description: 录入投顾推荐表单（页内常驻，金额输入元、内部转分）
-->
<template>
  <NCard title="录入推荐" size="small" class="advisor-form">
    <NForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="90"
      :show-feedback="true"
    >
      <div class="advisor-form__grid">
        <NFormItem label="老师" path="advisor">
          <NInput v-model:value="formData.advisor" placeholder="如 张老师" clearable />
        </NFormItem>

        <NFormItem label="标的" path="assetId">
          <NSelect
            v-model:value="formData.assetId"
            :options="assetOptions"
            :loading="assetLoading"
            filterable
            remote
            clearable
            placeholder="搜索代码或名称"
            @search="handleAssetSearch"
          />
        </NFormItem>

        <NFormItem label="方向" path="direction">
          <NRadioGroup v-model:value="formData.direction">
            <NRadioButton value="buy">买入推荐</NRadioButton>
            <NRadioButton value="sell">卖出推荐</NRadioButton>
          </NRadioGroup>
        </NFormItem>

        <NFormItem label="推荐时间" path="signalAt">
          <NDatePicker v-model:value="signalAtTs" type="datetime" class="advisor-form__full" />
        </NFormItem>

        <NFormItem label="参考价" path="refPrice">
          <NSpace align="center" class="advisor-form__full">
            <NInputNumber v-model:value="refPriceYuan" :precision="2" :step="0.01" :min="0" placeholder="元" />
            <NText>元</NText>
          </NSpace>
        </NFormItem>

        <NFormItem label="目标价">
          <NSpace align="center" class="advisor-form__full">
            <NInputNumber v-model:value="targetPriceYuan" :precision="2" :step="0.01" :min="0" clearable placeholder="元" />
            <NText>元</NText>
          </NSpace>
        </NFormItem>

        <NFormItem label="止损位">
          <NSpace align="center" class="advisor-form__full">
            <NInputNumber v-model:value="stopLossYuan" :precision="2" :step="0.01" :min="0" clearable placeholder="元" />
            <NText>元</NText>
          </NSpace>
        </NFormItem>

        <NFormItem label="假设量">
          <NSpace align="center" class="advisor-form__full">
            <NInputNumber v-model:value="hypotheticalQty" :precision="0" :step="100" :min="0" placeholder="股数" />
            <NText>股</NText>
          </NSpace>
        </NFormItem>
      </div>

      <NFormItem label="备注">
        <NInput v-model:value="noteText" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
      </NFormItem>

      <div class="advisor-form__footer">
        <NButton @click="handleReset">重置</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">提交</NButton>
      </div>
    </NForm>
  </NCard>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NButton, NCard, NDatePicker, NForm, NFormItem, NInput, NInputNumber,
  NRadioButton, NRadioGroup, NSelect, NSpace, NText, useMessage,
} from 'naive-ui'
import type { AdvisorDirection, AdvisorSignalCreatePayload } from '@/domain/types'
import { yuanToFen } from '@/domain/types/financial'
import { searchAssetOptions, type AssetLookupOption } from '@/services/asset-lookup.service'
import { useAdvisorStore } from '../store'

const message = useMessage()
const advisorStore = useAdvisorStore()
const formRef = ref<FormInst | null>(null)
const submitting = ref(false)
const assetOptions = ref<AssetLookupOption[]>([])
const assetLoading = ref(false)

const formData = ref({
  advisor: '',
  assetId: 0,
  direction: 'buy' as AdvisorDirection,
  signalAt: '',
})
const signalAtTs = ref<number>(Date.now())
const refPriceYuan = ref<number | null>(null)
const targetPriceYuan = ref<number | null>(null)
const stopLossYuan = ref<number | null>(null)
const hypotheticalQty = ref<number>(1000)
const noteText = ref('')

const formRules: FormRules = {
  advisor: { required: true, message: '请输入老师名', trigger: 'blur' },
  assetId: { required: true, type: 'number', min: 1, message: '请选择标的', trigger: 'change' },
  signalAt: { required: true, message: '请选择推荐时间', trigger: 'change' },
  refPrice: { required: true, type: 'number', min: 1, message: '请输入参考价', trigger: 'blur' },
}

// 给 NForm 校验用的合成字段
const refPriceFen = computed(() => yuanToFen(refPriceYuan.value ?? 0))
watch([signalAtTs, refPriceYuan], () => {
  formData.value.signalAt = new Date(signalAtTs.value).toISOString()
  ;(formData.value as unknown as { refPrice: number }).refPrice = refPriceFen.value
}, { immediate: true })

void loadAssetOptions('')

async function loadAssetOptions(keyword = ''): Promise<void> {
  assetLoading.value = true
  try {
    assetOptions.value = await searchAssetOptions(keyword)
  } catch {
    message.error('加载标的选项失败')
  } finally {
    assetLoading.value = false
  }
}

function handleAssetSearch(keyword: string): void {
  void loadAssetOptions(keyword)
}

function buildPayload(): AdvisorSignalCreatePayload {
  return {
    advisor: formData.value.advisor.trim(),
    assetId: formData.value.assetId,
    direction: formData.value.direction,
    signalAt: new Date(signalAtTs.value).toISOString(),
    refPrice: yuanToFen(refPriceYuan.value ?? 0),
    targetPrice: targetPriceYuan.value == null ? null : yuanToFen(targetPriceYuan.value),
    stopLoss: stopLossYuan.value == null ? null : yuanToFen(stopLossYuan.value),
    hypotheticalQty: hypotheticalQty.value,
    note: noteText.value.trim() || null,
  }
}

async function handleSubmit(): Promise<void> {
  formData.value.signalAt = new Date(signalAtTs.value).toISOString()
  ;(formData.value as unknown as { refPrice: number }).refPrice = refPriceFen.value
  try {
    await formRef.value?.validate()
  } catch {
    message.error('请检查表单填写内容')
    return
  }
  submitting.value = true
  try {
    await advisorStore.createSignal(buildPayload())
    message.success('推荐已创建')
    handleReset()
  } catch {
    message.error(advisorStore.error ?? '创建失败')
  } finally {
    submitting.value = false
  }
}

function handleReset(): void {
  formData.value.advisor = ''
  formData.value.assetId = 0
  formData.value.direction = 'buy'
  signalAtTs.value = Date.now()
  refPriceYuan.value = null
  targetPriceYuan.value = null
  stopLossYuan.value = null
  hypotheticalQty.value = 1000
  noteText.value = ''
  formRef.value?.restoreValidation()
}
</script>

<style scoped>
.advisor-form {
  margin-bottom: 16px;
}
.advisor-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 24px;
}
.advisor-form__full {
  width: 100%;
}
.advisor-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
:deep(.pos) { color: #e74c3c; }
:deep(.neg) { color: #27ae60; }
</style>
