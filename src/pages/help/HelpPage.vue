/*
 * @Author: brycegao
 * @Github: https://github.com/brycegao
 * @Date: 2026/06/03
 * @Description: 帮助页面 — 操作指南与 Ollama 配置
 *
 * Copyright (c) 2026 brycegao
 *
 * Licensed under the MIT License.
 * See LICENSE file in the project root for full license information.
 */

<template>
  <div class="help-page">
    <div class="help-page__header">
      <div>
        <h2 class="help-page__title">帮助</h2>
        <p class="help-page__description">操作指南与 AI 配置说明</p>
      </div>
    </div>

    <NSpace vertical size="large">
      <!-- 快速开始 -->
      <NCard title="快速开始">
        <NSpace vertical size="small">
          <p class="help-page__intro">
            Invest Record Pro 是一款纯本地运行的投资决策记录工具。所有数据存储在本地 SQLite
            数据库中，不联网、不上传，保障您的隐私安全。
          </p>
          <div class="help-page__steps">
            <div class="help-page__step">
              <div class="help-page__step-num">1</div>
              <div class="help-page__step-content">
                <strong>添加投资标的</strong>
                <p>进入「投资标的」页面，点击「新增」，填写代码、名称、类型和市场。</p>
              </div>
            </div>
            <div class="help-page__step">
              <div class="help-page__step-num">2</div>
              <div class="help-page__step-content">
                <strong>创建交易计划</strong>
                <p>进入「交易计划」页面，制定买入/卖出计划，设定目标价格和数量。</p>
              </div>
            </div>
            <div class="help-page__step">
              <div class="help-page__step-num">3</div>
              <div class="help-page__step-content">
                <strong>记录交易</strong>
                <p>进入「交易记录」页面，记录每笔实际成交，可选择关联交易计划。</p>
              </div>
            </div>
            <div class="help-page__step">
              <div class="help-page__step-num">4</div>
              <div class="help-page__step-content">
                <strong>更新仓位快照</strong>
                <p>进入「仓位快照」页面，定期记录当前持仓状态，用于计算浮动盈亏。</p>
              </div>
            </div>
            <div class="help-page__step">
              <div class="help-page__step-num">5</div>
              <div class="help-page__step-content">
                <strong>复盘交易</strong>
                <p>进入「交易复盘」页面，对已完成的交易进行回顾总结，持续改进交易纪律。</p>
              </div>
            </div>
            <div class="help-page__step">
              <div class="help-page__step-num">6</div>
              <div class="help-page__step-content">
                <strong>生成月度报告</strong>
                <p>进入「月度报告」页面，一键生成本月投资报告，AI 辅助纪律分析。</p>
              </div>
            </div>
          </div>
        </NSpace>
      </NCard>

      <!-- Ollama 配置指南 -->
      <NCard title="AI 功能 — Ollama 配置指南">
        <NSpace vertical size="medium">
          <NAlert type="info" title="关于 AI 功能" closable>
            本软件使用 <strong>Ollama</strong> 提供本地 AI 分析能力（月度报告生成、交易纪律分析等）。
            Ollama 完全运行在您的电脑上，不涉及任何远程调用，无需联网即可使用。
          </NAlert>

          <div class="help-page__section">
            <h3 class="help-page__section-title">第一步：安装 Ollama</h3>
            <p>前往 Ollama 官网下载并安装：</p>
            <div class="help-page__link-box">
              <a href="https://ollama.com" target="_blank" rel="noopener">
                https://ollama.com
              </a>
            </div>
            <p class="help-page__tip">
              支持 macOS、Linux 和 Windows。macOS 推荐使用 Homebrew 安装：
            </p>
            <div class="help-page__code-block">
              <code>brew install ollama</code>
            </div>
          </div>

          <div class="help-page__section">
            <h3 class="help-page__section-title">第二步：启动 Ollama 服务</h3>
            <p>安装完成后，启动 Ollama 服务：</p>
            <div class="help-page__code-block">
              <code>ollama serve</code>
            </div>
            <p class="help-page__tip">
              macOS 应用版安装后，Ollama 会自动在后台运行，无需手动启动。
            </p>
          </div>

          <div class="help-page__section">
            <h3 class="help-page__section-title">第三步：下载大语言模型</h3>
            <p>在终端中运行以下命令下载推荐的中文模型：</p>
            <div class="help-page__code-block">
              <code>ollama pull qwen2.5:7b</code>
            </div>
            <p class="help-page__tip">
              推荐模型：<strong>qwen2.5:7b</strong>（约 4.7 GB，中文能力优秀，适合本工具的分析场景）。
              <br />
              其他可选模型：<code>qwen2.5:3b</code>（更轻量，约 2 GB）、<code>llama3.1:8b</code>（英文为主）。
              <br />
              模型越大效果越好，但需要更多内存和计算资源。建议至少 8 GB 内存。
            </p>
          </div>

          <div class="help-page__section">
            <h3 class="help-page__section-title">第四步：在软件中配置</h3>
            <p>完成以上步骤后，在「设置 → AI 设置」中：</p>
            <ol class="help-page__config-steps">
              <li>
                <strong>Ollama 地址</strong>：保持默认值
                <code>http://localhost:11434</code>
                <br />
                如果您修改过 Ollama 监听端口，请对应调整。
              </li>
              <li>
                <strong>模型名称</strong>：点击「测试连接」按钮，连接成功后会自动加载可用模型列表，选择您下载的模型（如 <code>qwen2.5:7b</code>）。
              </li>
              <li>
                点击「测试连接」确认连接正常，状态显示为
                <NText type="success">✓ 已连接</NText> 即可。
              </li>
            </ol>
          </div>

          <div class="help-page__section">
            <h3 class="help-page__section-title">常见问题</h3>
            <NSpace vertical size="small">
              <div class="help-page__faq">
                <p><strong>Q：连接失败，提示「无法连接 Ollama」？</strong></p>
                <p>请确认 Ollama 服务已启动。在终端运行 <code>ollama list</code> 检查服务状态。
                  macOS 可在菜单栏确认 Ollama 图标是否存在。</p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：模型列表为空？</strong></p>
                <p>请先运行 <code>ollama pull qwen2.5:7b</code> 下载模型。下载完成后重新测试连接。</p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：AI 生成速度很慢？</strong></p>
                <p>可尝试使用更小的模型（如 <code>qwen2.5:3b</code>），或在拥有独立显卡的机器上启用 GPU 加速。
                  Ollama 会自动检测并使用 GPU。</p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：不配置 AI 也能使用软件吗？</strong></p>
                <p>可以。AI 功能仅在生成月度报告时使用，其他功能（投资标的、交易计划、交易记录、仓位快照、交易复盘等）均不依赖 AI，可正常使用。</p>
              </div>
            </NSpace>
          </div>
        </NSpace>
      </NCard>

      <!-- 数据管理 -->
      <NCard title="数据管理">
        <NSpace vertical size="small">
          <p>所有数据存储在本地 SQLite 数据库中，可通过「设置 → 数据库」进行管理：</p>
          <ul class="help-page__list">
            <li><strong>备份数据库</strong>：将数据库文件复制到指定位置，建议定期备份。</li>
            <li><strong>恢复数据库</strong>：从备份文件恢复数据（会覆盖当前数据，操作不可撤销）。</li>
            <li><strong>打开文件夹</strong>：直接定位到数据库文件所在目录。</li>
          </ul>
          <NAlert type="warning" title="重要提醒">
            数据库文件是所有投资数据的唯一存储。请务必定期备份，避免数据丢失。
          </NAlert>
        </NSpace>
      </NCard>

      <!-- 快捷操作 -->
      <NCard title="功能说明">
        <NSpace vertical size="small">
          <div class="help-page__func-row">
            <span class="help-page__func-name">仪表盘</span>
            <span>投资组合概览：累计盈亏、持仓标的数、计划执行率、月度趋势图表</span>
          </div>
          <div class="help-page__func-row">
            <span class="help-page__func-name">投资标的</span>
            <span>管理关注的基金/股票/ETF，记录代码、名称、类型（指数/ETF/股票/混合）和市场</span>
          </div>
          <div class="help-page__func-row">
            <span class="help-page__func-name">交易计划</span>
            <span>制定买入/卖出计划，设定目标价格、数量和计划类型，跟踪执行进度</span>
          </div>
          <div class="help-page__func-row">
            <span class="help-page__func-name">交易记录</span>
            <span>记录每笔实际成交，支持按日期/类型/关联计划筛选，计算加权平均成本</span>
          </div>
          <div class="help-page__func-row">
            <span class="help-page__func-name">仓位快照</span>
            <span>定期记录持仓状态，用于计算浮动盈亏和持仓分布</span>
          </div>
          <div class="help-page__func-row">
            <span class="help-page__func-name">交易复盘</span>
            <span>对已完成的交易进行回顾总结，记录交易结果、问题和改进方向</span>
          </div>
          <div class="help-page__func-row">
            <span class="help-page__func-name">市场观察</span>
            <span>记录对市场趋势、政策变化、行业动态的观察和判断</span>
          </div>
          <div class="help-page__func-row">
            <span class="help-page__func-name">月度报告</span>
            <span>一键生成本月投资报告，AI 辅助分析交易纪律和改进建议</span>
          </div>
          <div class="help-page__func-row">
            <span class="help-page__func-name">设置</span>
            <span>数据库管理、AI 模型配置、主题和语言偏好</span>
          </div>
        </NSpace>
      </NCard>
    </NSpace>
  </div>
</template>

<script setup lang="ts">
import { NAlert, NCard, NSpace, NText } from 'naive-ui'
</script>

<style scoped>
.help-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.help-page__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.help-page__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.help-page__description {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.help-page__intro {
  color: #374151;
  font-size: 14px;
  line-height: 1.8;
}

.help-page__steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.help-page__step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.help-page__step-num {
  display: grid;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  background: #1f2937;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}

.help-page__step-content {
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
}

.help-page__step-content p {
  margin: 4px 0 0;
  color: #6b7280;
}

.help-page__section {
  margin-top: 4px;
}

.help-page__section-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.help-page__tip {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.8;
}

.help-page__link-box {
  padding: 8px 16px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
}

.help-page__link-box a {
  color: #0369a1;
  text-decoration: none;
}

.help-page__link-box a:hover {
  text-decoration: underline;
}

.help-page__code-block {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
}

.help-page__config-steps {
  padding-left: 20px;
  color: #374151;
  font-size: 14px;
  line-height: 2;
}

.help-page__config-steps code {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 13px;
}

.help-page__faq {
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.8;
}

.help-page__faq p {
  margin: 0;
}

.help-page__faq p + p {
  margin-top: 4px;
  color: #6b7280;
}

.help-page__faq code {
  padding: 2px 6px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 13px;
}

.help-page__list {
  padding-left: 20px;
  color: #374151;
  font-size: 14px;
  line-height: 2;
}

.help-page__func-row {
  display: flex;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
  line-height: 1.6;
}

.help-page__func-row:last-child {
  border-bottom: none;
}

.help-page__func-name {
  flex-shrink: 0;
  min-width: 80px;
  font-weight: 600;
  color: #1f2937;
}
</style>
