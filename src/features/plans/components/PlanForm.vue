/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 交易计划新增/编辑表单
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <NDrawer
    :show="visible"
    placement="right"
    width="560"
    :show-close="false"
    :mask-closable="!isDirty"
    :close-on-esc="!isDirty"
    @update:show="handleVisibleUpdate"
  >
    <NDrawerContent :title="drawerTitle">
      <NForm ref="formRef" :model="formData" :rules="formRules" label-placement="top">
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

        <NFormItem label="计划类型" path="planType">
          <NSelect v-model:value="formData.planType" :options="planTypeOptions" disabled />
        </NFormItem>

        <NFormItem label="计划仓位" path="positionPercent">
          <NSpace align="center" class="plan-form__position">
            <NInputNumber
              v-model:value="positionPercentDisplay"
              :min="0"
              :max="100"
              :step="1"
              clearable
              placeholder="输入仓位"
            />
            <NText>%</NText>
          </NSpace>
        </NFormItem>

        <NFormItem label="开始日期" path="startDate">
          <NDatePicker
            v-model:value="startDateValue"
            type="date"
            clearable
            class="plan-form__date-picker"
          />
        </NFormItem>

        <NFormItem label="结束日期" path="endDate">
          <NDatePicker
            v-model:value="endDateValue"
            type="date"
            clearable
            class="plan-form__date-picker"
          />
        </NFormItem>

        <NFormItem label="备注" path="notes">
          <NInput
            :value="formData.notes ?? ''"
            type="textarea"
            placeholder="补充计划说明"
            :autosize="{ minRows: 3, maxRows: 5 }"
            @update:value="(value) => updateNotes(value)"
          />
        </NFormItem>

        <NDivider title-placement="left">计划规则</NDivider>

        <NSpace
          v-for="(rule, index) in planRules"
          :key="index"
          align="center"
          class="plan-form__rule"
        >
          <NSelect
            v-model:value="rule.ruleType"
            :options="ruleTypeOptions"
            placeholder="类型"
            class="plan-form__rule-type"
          />
          <NSelect
            v-model:value="rule.operator"
            :options="ruleOperatorOptions"
            placeholder="条件"
            class="plan-form__rule-operator"
          />
          <NInput v-model:value="rule.value" placeholder="值" class="plan-form__rule-value" />
          <NButton text type="error" @click="removeRule(index)">删除</NButton>
        </NSpace>

        <NButton dashed @click="addRule">+ 添加规则</NButton>
      </NForm>

      <div class="plan-form__footer">
        <NButton @click="handleCancel">取消</NButton>
        <NButton type="primary" :loading="loading" @click="handleSubmit">保存</NButton>
      </div>
    </NDrawerContent>
  </NDrawer>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import dayjs from 'dayjs'
import type { FormInst, FormRules } from 'naive-ui'
import {
  NButton,
  NDatePicker,
  NDivider,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NText,
  useMessage,
} from 'naive-ui'
import type { Plan, PlanCreatePayload, PlanRule, PlanType } from '@/domain/types'
import {
  PLAN_TYPE_LABELS,
  PLAN_TYPES,
  RULE_OPERATORS,
  RULE_TYPES,
  type RuleOperator,
  type RuleType,
} from '@/domain/types'
import { searchAssetOptions, type AssetLookupOption } from '@/services/asset-lookup.service'

type EditablePlanRule = {
  ruleType: RuleType
  operator: RuleOperator | null
  value: string | null
}

interface Props {
  visible: boolean
  plan?: Plan | null
  planType: PlanType
  rules?: PlanRule[]
  loading?: boolean
}

interface Emits {
  (event: 'update:visible', value: boolean): void
  (event: 'submit', data: PlanCreatePayload): void
}

const props = withDefaults(defineProps<Props>(), {
  plan: null,
  rules: () => [],
  loading: false,
})

const emit = defineEmits<Emits>()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const assetOptions = ref<AssetLookupOption[]>([])
const assetLoading = ref(false)
const startDateValue = ref<number | null>(null)
const endDateValue = ref<number | null>(null)
const positionPercentDisplay = ref<number | null>(null)
const planRules = ref<EditablePlanRule[]>([])

const defaultFormData: PlanCreatePayload = {
  assetId: 0,
  planType: 'buy',
  status: 'pending',
  positionPercent: null,
  startDate: null,
  endDate: null,
  notes: null,
  rules: [],
}

const formData = ref<PlanCreatePayload>({ ...defaultFormData })
const initialSnapshot = ref('')

const isEditMode = computed(() => !!props.plan)
const drawerTitle = computed(() => {
  if (isEditMode.value) {
    return '编辑计划'
  }

  return props.planType === 'buy' ? '新增买入计划' : '新增卖出计划'
})
const isDirty = computed(() => buildSnapshot() !== initialSnapshot.value)

const planTypeOptions = PLAN_TYPES.map((planType) => ({
  label: PLAN_TYPE_LABELS[planType],
  value: planType,
}))

const ruleTypeOptions = RULE_TYPES.map((ruleType) => ({
  label: ruleType,
  value: ruleType,
}))

const ruleOperatorOptions = RULE_OPERATORS.map((operator) => ({
  label: operator,
  value: operator,
}))

const formRules: FormRules = {
  assetId: {
    required: true,
    type: 'number',
    min: 1,
    message: '请选择标的',
    trigger: 'change',
  },
  planType: { required: true, message: '请选择计划类型', trigger: 'change' },
}

watch(
  () => [props.visible, props.plan, props.planType, props.rules] as const,
  async ([visible, plan]) => {
    if (!visible) {
      return
    }

    if (plan) {
      formData.value = {
        assetId: plan.assetId,
        planType: plan.planType,
        status: plan.status,
        positionPercent: plan.positionPercent,
        startDate: plan.startDate,
        endDate: plan.endDate,
        notes: plan.notes,
        rules: [],
      }
      positionPercentDisplay.value =
        plan.positionPercent === null ? null : plan.positionPercent / 100
      startDateValue.value = dateStringToMs(plan.startDate)
      endDateValue.value = dateStringToMs(plan.endDate)
      planRules.value = props.rules.map(toEditableRule)
      await ensureSelectedAssetOption(plan)
    } else {
      formData.value = {
        ...defaultFormData,
        planType: props.planType,
      }
      positionPercentDisplay.value = null
      startDateValue.value = null
      endDateValue.value = null
      planRules.value = []
      await loadAssetOptions()
    }

    nextTick(() => {
      initialSnapshot.value = buildSnapshot()
    })
  },
  { immediate: true },
)

watch(positionPercentDisplay, (value) => {
  formData.value.positionPercent = value === null ? null : Math.round(value * 100)
})

watch(startDateValue, (value) => {
  formData.value.startDate = value === null ? null : dayjs(value).format('YYYY-MM-DD')
})

watch(endDateValue, (value) => {
  formData.value.endDate = value === null ? null : dayjs(value).format('YYYY-MM-DD')
})

function toEditableRule(rule: PlanRule): EditablePlanRule {
  return {
    ruleType: rule.ruleType,
    operator: rule.operator,
    value: rule.value,
  }
}

function buildSnapshot(): string {
  return JSON.stringify({
    formData: formData.value,
    rules: planRules.value,
  })
}

function dateStringToMs(value: string | null): number | null {
  if (!value) {
    return null
  }

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.valueOf() : null
}

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

async function ensureSelectedAssetOption(plan: Plan): Promise<void> {
  const selectedOption =
    plan.assetCode || plan.assetName
      ? {
          label: `${plan.assetCode ?? ''} ${plan.assetName ?? ''}`.trim(),
          value: plan.assetId,
        }
      : null

  await loadAssetOptions(selectedOption?.label ?? '')

  if (
    selectedOption &&
    !assetOptions.value.some((option) => option.value === selectedOption.value)
  ) {
    assetOptions.value = [selectedOption, ...assetOptions.value]
  }
}

function handleAssetSearch(keyword: string): void {
  void loadAssetOptions(keyword)
}

function updateNotes(value: string): void {
  formData.value.notes = value.trim() ? value : null
}

function addRule(): void {
  planRules.value.push({
    ruleType: 'price',
    operator: '>=',
    value: null,
  })
}

function removeRule(index: number): void {
  planRules.value.splice(index, 1)
}

function handleVisibleUpdate(value: boolean): void {
  emit('update:visible', value)
}

function handleCancel(): void {
  emit('update:visible', false)
}

async function handleSubmit(): Promise<void> {
  try {
    await formRef.value?.validate()
    emit('submit', {
      ...formData.value,
      rules: planRules.value.map((rule) => ({ ...rule })),
    })
  } catch {
    message.error('请检查表单填写内容')
  }
}
</script>

<style scoped>
:deep(.n-drawer-body-content-wrapper) {
  padding: 16px;
}

.plan-form__position,
.plan-form__date-picker {
  width: 100%;
}

.plan-form__rule {
  margin-bottom: 8px;
}

.plan-form__rule-type {
  width: 100px;
}

.plan-form__rule-operator {
  width: 80px;
}

.plan-form__rule-value {
  width: 120px;
}

.plan-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
