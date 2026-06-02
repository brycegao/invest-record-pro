<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <div>
        <h2 class="settings-page__title">设置</h2>
        <p class="settings-page__description">应用配置与 AI 集成设置</p>
      </div>
    </div>

    <n-grid cols="1" x-gap="16" y-gap="16">
      <n-grid-item>
        <n-card title="AI 设置">
          <n-form label-placement="left" label-width="auto">
            <n-form-item label="Ollama 地址">
              <n-input
                v-model:value="store.ollamaUrl"
                placeholder="http://localhost:11434"
                :disabled="store.isLoading"
              />
            </n-form-item>

            <n-form-item label="模型">
              <n-select
                v-model:value="store.ollamaModel"
                :options="modelOptions"
                placeholder="加载模型列表..."
                :loading="modelsLoading"
                :disabled="store.isLoading"
                filterable
              />
            </n-form-item>

            <n-form-item label=" ">
              <n-space align="center">
                <n-button
                  :loading="checkingOllama"
                  @click="handleCheckOllama"
                >
                  测试连接
                </n-button>
                <n-tag :type="connectionTagType" size="small" :bordered="false">
                  {{ connectionLabel }}
                </n-tag>
              </n-space>
            </n-form-item>

            <n-alert
              v-if="store.hasError"
              type="error"
              :title="store.error ?? undefined"
              closable
              @close="store.clearError()"
              style="margin-top: 8px"
            />

            <n-form-item label=" " style="margin-top: 16px">
              <n-button
                type="primary"
                :loading="store.isLoading"
                @click="handleSave"
              >
                保存设置
              </n-button>
            </n-form-item>
          </n-form>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card title="关于">
          <n-descriptions :column="1" label-placement="left" size="small">
            <n-descriptions-item label="版本">1.0.0</n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NGi,
  NGrid,
  NGridItem,
  NInput,
  NSelect,
  NSpace,
  NTag,
} from 'naive-ui'
import { useSettingsStore } from '@/features/settings/store'
import { ollamaService } from '@/services/ollama.service'

const message = useMessage()
const store = useSettingsStore()

const modelsLoading = ref(false)
const checkingOllama = ref(false)
const modelOptions = ref<SelectOption[]>([])

const connectionLabel = computed(() => {
  return store.ollamaAvailable ? '已连接' : '未连接'
})

const connectionTagType = computed(() => {
  return store.ollamaAvailable ? ('success' as const) : ('default' as const)
})

function showStoreError(): boolean {
  if (store.error) {
    message.error(store.error)
    return true
  }

  return false
}

onMounted(async () => {
  await store.loadSettings()
  showStoreError()

  // 加载模型列表
  await loadModelOptions()
})

async function loadModelOptions(): Promise<void> {
  modelsLoading.value = true
  try {
    const models = await ollamaService.listModels()
    modelOptions.value = models.map((m) => ({
      label: m.name,
      value: m.name,
    }))
  } catch {
    modelOptions.value = []
  } finally {
    modelsLoading.value = false
  }
}

async function handleCheckOllama(): Promise<void> {
  checkingOllama.value = true
  try {
    const available = await store.checkOllama()
    if (available) {
      message.success('Ollama 连接成功')
      await loadModelOptions()
    } else {
      message.warning('无法连接 Ollama，请确认服务已启动')
    }
  } finally {
    checkingOllama.value = false
  }
}

async function handleSave(): Promise<void> {
  await store.setOllamaUrl(store.ollamaUrl)
  if (!showStoreError()) {
    if (store.ollamaModel) {
      await store.setOllamaModel(store.ollamaModel)
    }
    if (!showStoreError()) {
      message.success('设置已保存')
    }
  }
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-page__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.settings-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}
</style>
