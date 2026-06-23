/* * @Author: brycegao * @Github: https://github.com/brycegao * @Date: 2026/06/03 * @Description:
帮助页面 — 操作指南与 Ollama 配置 * * Copyright (c) 2026 brycegao * * Licensed under the MIT
License. * See LICENSE file in the project root for full license information. */

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
            本软件使用 <strong>Ollama</strong> 提供本地 AI
            分析能力（月度报告生成、交易纪律分析等）。 AI
            推理在您的电脑本机完成，不上传投资数据。首次安装 Ollama
            和下载模型需要联网；模型下载完成后，生成月度报告可在本机离线运行。
          </NAlert>

          <div class="help-page__section">
            <h3 class="help-page__section-title">第一步：安装 Ollama</h3>
            <p>新用户建议安装官方 Ollama App。它会自动启动后台服务，并包含完整的模型运行组件。</p>
            <div class="help-page__link-box">
              <a href="https://ollama.com" target="_blank" rel="noopener"> https://ollama.com </a>
            </div>
            <p class="help-page__tip">macOS 也可以通过 Homebrew 安装官方 App 版：</p>
            <div class="help-page__code-block">
              <code>brew install --cask ollama-app</code>
            </div>
            <p class="help-page__tip">
              不建议在 macOS 上使用 <code>brew install ollama</code> 的 formula
              版；部分版本可能缺少运行模型所需的 <code>llama-server</code>，导致生成时出现 HTTP
              500。
            </p>
          </div>

          <div class="help-page__section">
            <h3 class="help-page__section-title">第二步：启动 Ollama 服务</h3>
            <p>安装官方 App 后，打开「Ollama」应用，菜单栏出现 Ollama 图标即表示后台服务已启动。</p>
            <div class="help-page__code-block">
              <code>open -a Ollama</code>
            </div>
            <p class="help-page__tip">
              也可以在终端运行 <code>ollama --version</code> 或
              <code>curl http://localhost:11434/api/tags</code> 检查服务是否可访问。默认服务地址是
              <code>http://localhost:11434</code>。
            </p>
          </div>

          <div class="help-page__section">
            <h3 class="help-page__section-title">第三步：下载大语言模型</h3>
            <p>在终端中运行以下命令下载推荐的中文模型：</p>
            <div class="help-page__code-block">
              <code>ollama pull qwen2.5:7b</code>
            </div>
            <p class="help-page__tip">
              推荐模型：<strong>qwen2.5:7b</strong>（约 4.7
              GB，中文能力较好，适合月度复盘、交易纪律分析）。
              <br />
              电脑内存较小时可选：<code>qwen2.5:3b</code>（更轻量，速度更快，分析深度略弱）。
              <br />
              下载完成后可运行 <code>ollama list</code> 确认模型已经存在。
            </p>
            <p class="help-page__tip">最小验证命令：</p>
            <div class="help-page__code-block">
              <code>ollama run qwen2.5:7b "请用一句话回答：你好"</code>
            </div>
            <p class="help-page__tip">如果终端能返回中文回答，说明 Ollama 和模型都可以正常生成。</p>
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
                <strong>测试连接</strong>：点击「测试连接」按钮，状态显示为
                <NText type="success">✓ 已连接</NText> 表示应用已经能访问本机 Ollama。
              </li>
              <li>
                <strong>模型名称</strong>：连接成功后会加载可用模型列表。建议选择或保留
                <code>qwen2.5:7b</code>。
              </li>
            </ol>
          </div>

          <div class="help-page__section">
            <h3 class="help-page__section-title">第五步：生成 AI 月度报告</h3>
            <ol class="help-page__config-steps">
              <li>先在「投资标的」「交易计划」「交易记录」「仓位快照」中录入本月数据。</li>
              <li>进入「月度报告」页面，点击「生成本月报告」或空状态中的「生成 AI 报告」。</li>
              <li>
                应用会先聚合本月交易次数、买入/卖出金额、已实现盈亏、计划执行率、情绪分布和近期计划。
              </li>
              <li>
                如果 Ollama 可用，会调用本机模型生成 Markdown 月度复盘；如果 Ollama
                不可用，会自动降级生成规则摘要。
              </li>
              <li>
                生成后可点击「查看」阅读详情，也可以点击「导出」保存 Markdown 文件到下载目录。
              </li>
            </ol>
          </div>

          <div class="help-page__section">
            <h3 class="help-page__section-title">常见问题</h3>
            <NSpace vertical size="small">
              <div class="help-page__faq">
                <p><strong>Q：连接失败，提示「无法连接 Ollama」？</strong></p>
                <p>
                  请确认 Ollama 服务已启动。在终端运行 <code>ollama list</code> 检查服务状态。 macOS
                  可在菜单栏确认 Ollama 图标是否存在。
                </p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：模型列表为空？</strong></p>
                <p>
                  请先运行 <code>ollama pull qwen2.5:7b</code> 下载模型。下载完成后重新测试连接。
                </p>
              </div>
              <div class="help-page__faq">
                <p>
                  <strong>Q：生成失败，提示 HTTP 500 或 llama-server binary not found？</strong>
                </p>
                <p>
                  通常是 macOS 安装了缺少运行组件的 Ollama formula 版。建议卸载 formula 后安装官方
                  App 版： <code>brew uninstall ollama</code>，然后运行
                  <code>brew install --cask ollama-app</code>。
                </p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：第一次生成很慢？</strong></p>
                <p>
                  正常。首次生成需要加载模型到内存，可能耗时十几秒到一分钟；后续同一模型通常会更快。
                </p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：AI 生成速度很慢？</strong></p>
                <p>
                  可尝试使用更小的模型（如
                  <code>qwen2.5:3b</code>）。模型越大，效果通常越好，但需要更多内存和计算时间。
                </p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：生成的是规则摘要，不是 AI 深度分析？</strong></p>
                <p>
                  说明应用没有成功调用 Ollama。请检查 Ollama
                  是否启动、模型是否已下载，并在「设置」页面重新测试连接。
                </p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：不配置 AI 也能使用软件吗？</strong></p>
                <p>
                  可以。AI
                  功能仅在生成月度报告时使用，其他功能（投资标的、交易计划、交易记录、仓位快照、交易复盘等）均不依赖
                  AI，可正常使用。
                </p>
              </div>
              <div class="help-page__faq">
                <p><strong>Q：AI 会把我的投资数据上传到外部服务吗？</strong></p>
                <p>
                  不会。应用只连接本机 <code>localhost</code> 上的 Ollama 服务，AI
                  推理在您的电脑上完成。请不要把 Ollama 地址改成远程服务器。
                </p>
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
            <li>
              <strong>恢复数据库</strong>：从备份文件恢复数据（会覆盖当前数据，操作不可撤销）。
            </li>
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
