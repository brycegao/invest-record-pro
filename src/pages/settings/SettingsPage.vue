<template>
  <div class="settings-page">
    <div class="settings-page__header">
      <div>
        <h2 class="settings-page__title">设置</h2>
      </div>
    </div>

    <n-space vertical size="large">
      <!-- 卡片 1：数据库 -->
      <n-card title="数据库">
        <n-space vertical size="small">
          <p class="settings-page__db-path">{{ store.dbPath || '加载中...' }}</p>
          <n-space>
            <n-button :disabled="!store.dbPath" @click="handleOpenFolder">打开文件夹</n-button>
            <n-button :loading="backuping" @click="handleBackup">备份数据库</n-button>
            <n-popconfirm @positive-click="handleRestoreConfirm">
              <template #trigger>
                <n-button type="warning" :disabled="restoring">恢复数据库</n-button>
              </template>
              恢复将覆盖当前数据，此操作不可撤销
            </n-popconfirm>
          </n-space>
        </n-space>
      </n-card>

      <!-- 卡片 2：AI 设置 -->
      <n-card title="AI 设置">
        <n-space vertical size="medium">
          <n-form-item label="Ollama 地址">
            <n-input
              v-model:value="store.ollamaUrl"
              placeholder="http://localhost:11434"
              :disabled="store.isLoading"
            />
          </n-form-item>

          <n-form-item label="模型名称">
            <n-select
              v-model:value="store.ollamaModel"
              :options="modelOptions"
              placeholder="加载模型列表..."
              :loading="modelsLoading"
              :disabled="store.isLoading"
              filterable
            />
          </n-form-item>

          <n-space align="center">
            <n-button
              type="primary"
              :loading="testingConnection"
              @click="handleTestConnection"
            >
              测试连接
            </n-button>
            <n-text :type="store.ollamaAvailable ? 'success' : 'error'">
              {{ store.ollamaAvailable ? '✓ 已连接' : '✗ 未连接' }}
            </n-text>
          </n-space>
        </n-space>
      </n-card>

      <!-- 卡片 3：显示设置 -->
      <n-card title="显示设置">
        <n-space vertical size="medium">
          <n-form-item label="主题">
            <n-radio-group
              v-model:value="store.currentTheme"
              @update:value="handleThemeChange"
            >
              <n-radio value="light">浅色</n-radio>
              <n-radio value="dark">深色</n-radio>
              <n-radio value="system">跟随系统</n-radio>
            </n-radio-group>
          </n-form-item>
          <n-form-item label="语言">
            <n-select
              value="zh-CN"
              disabled
              :options="[{ label: '简体中文', value: 'zh-CN' }]"
              style="width: 200px"
            />
          </n-form-item>
        </n-space>
      </n-card>

      <!-- 卡片 4：关于 -->
      <n-card title="关于">
        <n-space vertical size="small">
          <p><strong>Invest Record Pro</strong></p>
          <p style="font-size: 14px; color: #6b7280">版本：1.0.0</p>
          <p style="font-size: 14px; color: #6b7280">许可证：MIT</p>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import {
  NButton,
  NCard,
  NFormItem,
  NInput,
  NPopconfirm,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NText,
} from 'naive-ui'
import { save } from '@tauri-apps/plugin-dialog'
import { open } from '@tauri-apps/plugin-dialog'
import { open as shellOpen } from '@tauri-apps/plugin-shell'
import { useSettingsStore } from '@/features/settings/store'
import { ollamaService } from '@/services/ollama.service'
import type { ThemeOption } from '@/domain/types'

const message = useMessage()
const store = useSettingsStore()

const modelsLoading = ref(false)
const testingConnection = ref(false)
const backuping = ref(false)
const restoring = ref(false)
const modelOptions = ref<SelectOption[]>([])

onMounted(async () => {
  await store.loadSettings()
  if (store.hasError) {
    message.error(store.error ?? '加载设置失败')
  }
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

async function handleOpenFolder(): Promise<void> {
  if (!store.dbPath) return
  try {
    const path = store.dbPath.replace(/[^/\\]*$/, '')
    await shellOpen(path)
  } catch {
    message.error('无法打开文件夹')
  }
}

async function handleBackup(): Promise<void> {
  try {
    const filePath = await save({
      title: '选择备份保存路径',
      defaultPath: `data-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: '数据库文件', extensions: ['db'] }],
    })
    if (!filePath) return

    backuping.value = true
    await store.backup(filePath)
    message.success('数据库备份成功')
  } catch {
    message.error(store.error ?? '备份数据库失败')
  } finally {
    backuping.value = false
  }
}

async function handleRestoreConfirm(): Promise<void> {
  try {
    const filePath = await open({
      title: '选择要恢复的数据库文件',
      filters: [{ name: '数据库文件', extensions: ['db'] }],
    })
    if (!filePath) return

    restoring.value = true
    await store.restore(filePath)
    message.success('数据库恢复成功，请重启应用')
  } catch {
    message.error(store.error ?? '恢复数据库失败')
  } finally {
    restoring.value = false
  }
}

async function handleTestConnection(): Promise<void> {
  testingConnection.value = true
  try {
    // 先同步 URL 到 ollamaService
    try {
      ollamaService.setBaseUrl(store.ollamaUrl)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ollama 地址无效')
      return
    }

    const available = await store.checkOllama()
    if (available) {
      message.success('Ollama 连接成功')
      await loadModelOptions()
    } else {
      message.warning('无法连接 Ollama，请确认服务已启动')
    }
  } finally {
    testingConnection.value = false
  }
}

async function handleThemeChange(value: string): Promise<void> {
  await store.setTheme(value as ThemeOption)
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

.settings-page__db-path {
  font-size: 14px;
  color: #6b7280;
  word-break: break-all;
  margin: 0;
}
</style>
