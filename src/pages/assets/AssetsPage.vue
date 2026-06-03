<template>
  <div class="assets-page">
    <div class="assets-page__header">
      <div>
        <h2 class="assets-page__title">投资标的</h2>
        <p class="assets-page__description">管理你关注和持有的投资标的</p>
      </div>
    </div>

    <NSpace class="assets-page__actions">
      <NButton type="primary" @click="handleCreate">+ 新增标的</NButton>
      <NButton :loading="exporting" @click="handleExport">导出</NButton>
    </NSpace>

    <NSpace align="end" class="assets-page__filters">
      <NFormItem label="代码/名称" class="assets-page__filter-item">
        <NInput
          v-model:value="filterKeyword"
          placeholder="搜索代码或名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </NFormItem>

      <NFormItem label="类型" class="assets-page__select-item">
        <NSelect v-model:value="filterType" :options="typeOptions" placeholder="类型" />
      </NFormItem>

      <NFormItem label="市场" class="assets-page__select-item">
        <NSelect v-model:value="filterMarket" :options="marketOptions" placeholder="市场" />
      </NFormItem>

      <NFormItem label=" " class="assets-page__button-item">
        <NSpace>
          <NButton type="primary" :loading="store.isLoading" @click="handleSearch">搜索</NButton>
          <NButton :disabled="store.isLoading" @click="handleReset">重置</NButton>
        </NSpace>
      </NFormItem>
    </NSpace>

    <AssetTable
      :data="store.assets"
      :loading="store.isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <AssetForm
      :visible="formVisible"
      :asset="selectedAsset"
      :loading="store.isLoading"
      @update:visible="handleFormVisibleUpdate"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NFormItem, NInput, NSelect, NSpace, useMessage } from 'naive-ui'
import { AssetForm, AssetTable } from '@/features/assets/components'
import { useAssetStore } from '@/features/assets/store'
import type { Asset, AssetCreatePayload, AssetFilter } from '@/domain/types'
import { ASSET_TYPE_LABELS, ASSET_TYPES, MARKET_LABELS, MARKETS } from '@/domain/types'
import { save } from '@tauri-apps/plugin-dialog'
import { writeTextFile } from '@tauri-apps/plugin-fs'
import { exportAssetsCsv } from '@/features/settings/repository'

const message = useMessage()
const store = useAssetStore()

const formVisible = ref(false)
const selectedAsset = ref<Asset | null>(null)
const exporting = ref(false)
const filterKeyword = ref('')
const filterType = ref<AssetFilter['type']>('')
const filterMarket = ref<AssetFilter['market']>('')

const typeOptions = [
  { label: '全部', value: '' },
  ...ASSET_TYPES.map((type) => ({ label: ASSET_TYPE_LABELS[type], value: type })),
]

const marketOptions = [
  { label: '全部', value: '' },
  ...MARKETS.map((market) => ({ label: MARKET_LABELS[market], value: market })),
]

onMounted(async () => {
  await store.loadAssets()
  showStoreError()
})

function showStoreError(): boolean {
  if (store.error) {
    message.error(store.error)
    return true
  }

  return false
}

function hasActiveFilters(): boolean {
  return !!filterKeyword.value.trim() || !!filterType.value || !!filterMarket.value
}

async function refreshAssets(): Promise<void> {
  if (hasActiveFilters()) {
    await handleSearch()
    return
  }

  await store.loadAssets()
}

function handleCreate(): void {
  selectedAsset.value = null
  formVisible.value = true
}

function handleEdit(row: Asset): void {
  selectedAsset.value = row
  formVisible.value = true
}

async function handleDelete(row: Asset): Promise<void> {
  await store.deleteAsset(row.id)

  if (!showStoreError()) {
    message.success('删除成功')
  }
}

async function handleFormSubmit(data: AssetCreatePayload): Promise<void> {
  if (selectedAsset.value) {
    await store.updateAsset({ ...data, id: selectedAsset.value.id })
  } else {
    await store.createAsset(data)
  }

  if (showStoreError()) {
    return
  }

  message.success(selectedAsset.value ? '更新成功' : '创建成功')
  formVisible.value = false
  selectedAsset.value = null
  await refreshAssets()
}

async function handleSearch(): Promise<void> {
  store.setFilters({
    keyword: filterKeyword.value.trim() || undefined,
    type: filterType.value,
    market: filterMarket.value,
  })
  await store.searchAssets()
  showStoreError()
}

async function handleReset(): Promise<void> {
  filterKeyword.value = ''
  filterType.value = ''
  filterMarket.value = ''
  store.setFilters({ keyword: '', type: '', market: '' })
  await store.loadAssets()
  showStoreError()
}

function handleFormVisibleUpdate(visible: boolean): void {
  formVisible.value = visible

  if (!visible) {
    selectedAsset.value = null
  }
}

async function handleExport(): Promise<void> {
  try {
    const filePath = await save({
      title: '导出标的数据',
      defaultPath: `assets-${new Date().toISOString().slice(0, 10)}.csv`,
      filters: [{ name: 'CSV 文件', extensions: ['csv'] }],
    })
    if (!filePath) return

    exporting.value = true
    const csv = await exportAssetsCsv()
    await writeTextFile(filePath, csv)
    message.success('导出成功')
  } catch {
    message.error('导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.assets-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assets-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.assets-page__title {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0;
}

.assets-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.assets-page__actions,
.assets-page__filters {
  width: 100%;
}

.assets-page__filter-item {
  width: 220px;
  margin-bottom: 0;
}

.assets-page__select-item {
  width: 136px;
  margin-bottom: 0;
}

.assets-page__button-item {
  margin-bottom: 0;
}
</style>
