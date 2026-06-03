#!/bin/bash

# merge-prompts.sh
# 一键合并 Codex Prompt 库文件，生成完整 prompt
# 
# 使用方式：
#   ./merge-prompts.sh vue-form "[具体需求]"
#   ./merge-prompts.sh pinia-store "[具体需求]"
#   ./merge-prompts.sh full-crud "[具体需求]"

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CODEX_DIR="$SCRIPT_DIR"
TEMPLATE_DIR="$CODEX_DIR/templates"
SYSTEM_PROMPT="$CODEX_DIR/system/system-prompt.txt"
EXAMPLES_DIR="$CODEX_DIR/examples"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 帮助信息
show_help() {
    cat << EOF
${BLUE}=== Codex Prompt 合并工具 ===${NC}

用途：一键生成完整 prompt，避免手动 cat 命令

${GREEN}基本用法${NC}
  ./merge-prompts.sh <template> "<需求说明>"

${GREEN}模板选项${NC}
  vue-form          Vue 表单组件生成
  vue-table         Vue 表格组件生成
  vue-page          Vue 页面（组件组装）生成
  pinia-store       Pinia Store 生成
  sqlite-repo       TypeScript Repository 生成
  rust-command      单个 Rust 命令生成
  rust-main         Rust 命令注册和 main.rs 集成
  ollama-integration Ollama AI 离线集成
  full-crud         完整 CRUD（Form + Table + Page + Store + Repo）
  full-module       完整功能模块（+ Rust 命令）

${GREEN}示例${NC}
  # 生成资产表单
  ./merge-prompts.sh vue-form "生成资产管理表单组件，包括字段：代码、名称、类型、风险等级"

  # 生成完整资产 CRUD 模块
  ./merge-prompts.sh full-crud "生成资产完整 CRUD 模块"

  # 生成 Ollama 集成
  ./merge-prompts.sh ollama-integration "生成月度复盘报告生成模块"

  # 生成 Rust 命令
  ./merge-prompts.sh rust-command "生成资产 CRUD Rust 命令"

${GREEN}输出${NC}
  生成的 prompt 会输出到控制台并保存到 merged-prompt.txt
  可直接复制到 Codex 或粘贴到 API 调用

${GREEN}高级用法${NC}
  # 使用特定的参考示例
  ./merge-prompts.sh vue-form --example asset-form "[需求]"

  # 只输出到文件，不显示
  ./merge-prompts.sh vue-form --quiet "[需求]"

  # 自动复制到剪贴板（macOS）
  ./merge-prompts.sh vue-form "[需求]" | pbcopy

${YELLOW}提示${NC}
  1. 如果需求中包含特殊字符，用引号包围
  2. 提示词会自动添加版本号和时间戳
  3. 生成的 prompt 会保存供后续参考

EOF
}

# 检查必要的文件
check_files() {
    if [ ! -f "$SYSTEM_PROMPT" ]; then
        echo -e "${RED}❌ 错误：找不到系统提示文件${NC}"
        echo "   期望位置：$SYSTEM_PROMPT"
        exit 1
    fi
}

# 合并 prompt
merge_template() {
    local template=$1
    local requirement=$2
    local example=$3
    
    local output=""
    
    # 1. 添加头部
    output+="# Codex AI 代码生成 Prompt\n"
    output+="\n**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')\n"
    output+="\n**模板**: $template\n"
    output+="\n---\n\n"
    
    # 2. 系统提示词
    output+="## 系统提示词\n\n"
    output+="$(cat "$SYSTEM_PROMPT")\n\n"
    
    # 3. 模板内容
    case $template in
        vue-form)
            output+="$(cat "$TEMPLATE_DIR/vue-form.prompt.md")\n\n"
            ;;
        vue-table)
            output+="$(cat "$TEMPLATE_DIR/vue-table.prompt.md")\n\n"
            ;;
        vue-page)
            output+="$(cat "$TEMPLATE_DIR/vue-page.prompt.md")\n\n"
            ;;
        pinia-store)
            output+="$(cat "$TEMPLATE_DIR/pinia-store.prompt.md")\n\n"
            ;;
        sqlite-repo)
            output+="$(cat "$TEMPLATE_DIR/sqlite-repo.prompt.md")\n\n"
            ;;
        rust-command)
            output+="$(cat "$TEMPLATE_DIR/rust-command.prompt.md")\n\n"
            ;;
        rust-main)
            output+="$(cat "$TEMPLATE_DIR/rust-main.prompt.md")\n\n"
            ;;
        ollama-integration)
            output+="$(cat "$TEMPLATE_DIR/ollama-integration.prompt.md")\n\n"
            ;;
        full-crud)
            output+="$(cat "$TEMPLATE_DIR/vue-form.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/vue-table.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/vue-page.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/pinia-store.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/sqlite-repo.prompt.md")\n\n"
            ;;
        full-module)
            output+="$(cat "$TEMPLATE_DIR/vue-form.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/vue-table.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/vue-page.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/pinia-store.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/sqlite-repo.prompt.md")\n\n"
            output+="$(cat "$TEMPLATE_DIR/rust-main.prompt.md")\n\n"
            ;;
        *)
            echo -e "${RED}❌ 未知模板：$template${NC}"
            echo "使用 '-h' 查看支持的模板"
            exit 1
            ;;
    esac
    
    # 4. 参考示例（如果有）
    if [ -n "$example" ] && [ -f "$EXAMPLES_DIR/$example" ]; then
        output+="\n## 参考示例\n\n"
        output+="$(cat "$EXAMPLES_DIR/$example")\n\n"
    fi
    
    # 5. 具体需求
    output+="\n---\n\n## 您的具体需求\n\n"
    output+="$requirement\n"
    
    # 6. 成本和质量提示
    output+="\n---\n\n## 代码生成配置\n\n"
    output+="**推荐设置**:\n"
    output+="- Temperature: 0.2（低随机性，确保代码质量）\n"
    output+="- Top P: 0.9\n"
    output+="- Token Limit: 根据模板选择（见下表）\n\n"
    output+="**Token 预估**（基于模板）:\n"
    output+="- vue-form: 600-1000\n"
    output+="- vue-table: 800-1200\n"
    output+="- vue-page: 800-1200\n"
    output+="- pinia-store: 500-800\n"
    output+="- sqlite-repo: 600-1000\n"
    output+="- 完整 CRUD: 3000-4000\n\n"
    output+="**质量检查**:\n"
    output+="1. 是否使用了 \`any\` 类型？（应该没有）\n"
    output+="2. 是否遵循了命名约定？\n"
    output+="3. 是否有完整的错误处理？\n"
    output+="4. 是否包含注释和 JSDoc？\n"
    output+="5. 代码风格是否一致？\n"
    
    echo -e "$output"
}

# 保存到文件
save_to_file() {
    local content="$1"
    local output_file="$CODEX_DIR/merged-prompt.txt"
    echo -e "$content" > "$output_file"
    echo -e "\n${GREEN}✅ Prompt 已保存到：$output_file${NC}"
}

# 主函数
main() {
    if [ $# -lt 1 ]; then
        show_help
        exit 0
    fi
    
    case "$1" in
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            local template="$1"
            local requirement="${2:-}"
            local example=""
            
            if [ -z "$requirement" ]; then
                echo -e "${YELLOW}⚠️  缺少需求说明${NC}"
                echo "用法: ./merge-prompts.sh <template> \"<需求说明>\""
                echo "例如: ./merge-prompts.sh vue-form \"生成资产表单组件\""
                exit 1
            fi
            
            check_files
            
            # 检查 --example 参数
            if [[ "$requirement" == "--example"* ]]; then
                example="${requirement#--example }"
                example="${example%% *}"
                requirement="${requirement#--example $example }"
            fi
            
            local merged=$(merge_template "$template" "$requirement" "$example")
            echo -e "$merged"
            save_to_file "$merged"
            
            ;;
    esac
}

main "$@"
