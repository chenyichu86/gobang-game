# 文档目录结构规范

**版本**: v1.0
**生效日期**: 2026-03-25
**适用范围**: 所有项目文档管理

---

## 📁 目录结构定义

### 根目录
```
C:\Users\cheny\Documents\五子棋\gobang-game\    # 本地开发根目录
https://github.com/chenyichu86/gobang-game    # 远程仓库
```

### 目录组织结构

```
gobang-game/                    # 项目根目录
│
├── docs/                        # Week 开发文档目录
│   ├── week-1-WO.md            # Week 1 工作对象定义
│   ├── week-1-PL.md            # Week 1 产品逻辑规范
│   ├── week-1-test-cases.md   # Week 1 测试用例
│   ├── week-1-test-report.md  # Week 1 测试报告
│   ├── week-1-acceptance-report.md  # Week 1 验收报告
│   │
│   ├── week-2-*.md             # Week 2 文档...
│   ├── ...
│   ├── week-9-*.md             # Week 9 文档...
│   │
│   ├── TDD-CHECKLIST.md        # TDD 流程检核清单（跨文档）
│   └── schedule-analysis.md    # 项目计划分析（可选）
│
├── project/                     # 项目级核心文档目录
│   ├── ARCHITECTURE.md         # 技术架构设计 ⭐
│   ├── PRD.md                  # 产品需求文档 ⭐
│   ├── PROJECT_STATUS.md       # 项目状态追踪 ⭐
│   ├── PROJECT_STATUS_WEEK4_BACKUP.md  # 历史备份
│   └── WEEK_3_TEST_REPORT.md   # 历史测试报告
│
├── src/                         # 源代码目录
├── tests/                       # E2E 测试目录
├── CLAUDE.md                    # Claude Code 指导文档
└── README.md                    # 项目说明文档
```

---

## 📝 文档类型定义

### 1. 项目级核心文档 (project/)

**定义**: 贯穿整个项目周期的全局性文档，是开发和决策的唯一事实源。

**文档列表**:
- **PRD.md**: 产品需求文档
  - 功能定义和用户故事
  - 需求优先级和验收标准
  - 更新频率: 需求变更时

- **ARCHITECTURE.md**: 技术架构设计
  - 技术选型和决策依据
  - 系统架构和模块设计
  - 更新频率: 架构决策变更时

- **PROJECT_STATUS.md**: 项目状态追踪
  - 进度和里程碑
  - 测试统计和质量指标
  - 下一步行动
  - 更新频率: 每个 Week 完成后

**特征**:
- ⭐ 唯一事实源 (Single Source of Truth)
- 🔄 持续更新
- 📋 需要版本控制

---

### 2. Week 开发文档 (docs/)

**定义**: 每个 Week 开发过程中产生的文档，记录该阶段的计划、实现和验收。

**文档类型**:
- **WO (Work Object)**: 工作对象定义
  - 任务范围和目标
  - 验收标准
  - 估算时间

- **PL (Product Logic)**: 产品逻辑详细设计
  - 功能详细规格
  - 技术实现方案
  - 代码示例

- **test-cases**: 测试用例设计
  - 测试场景和步骤
  - 预期结果

- **test-report**: 测试报告
  - 测试执行结果
  - 覆盖率统计
  - 问题分析

- **acceptance-report**: 验收报告
  - 功能验收结果
  - 质量评估
  - 改进建议

**命名规范**:
```
week-N-{类型}-{描述}.md
例如: week-9-WO.md, week-9-test-report.md
```

---

## 🔄 文档引用规范

### 正确的路径引用

**在代码注释中**:
```typescript
/**
 * 游戏状态管理
 * 参考: project/ARCHITECTURE.md 状态管理层
 */
```

**在 CLAUDE.md 中**:
```markdown
- 参考需求: project/PRD.md
- 查看架构: project/ARCHITECTURE.md
```

**在周文档中**:
```markdown
- 需求定义: project/PRD.md#章节名
- 架构设计: project/ARCHITECTURE.md#章节名
```

### 禁止的路径引用

❌ **旧路径** (已废弃):
```typescript
// ❌ 错误 - 相对路径不清晰
import { something } from '../../../PRD.md'
```

❌ **根目录路径** (已废弃):
```markdown
- ❌ ../PRD.md
- ❌ ../ARCHITECTURE.md
- ❌ ../PROJECT_STATUS.md
```

✅ **新路径** (正确):
```typescript
// ✅ 正确 - 明确的绝对路径
// 参考: project/PRD.md 第X章
```

```markdown
- ✅ project/PRD.md
- ✅ project/ARCHITECTURE.md
- ✅ project/PROJECT_STATUS.md
```

---

## 📋 文档管理原则

### 1. 唯一事实源原则 (Single Source of Truth)

每个领域只有一个唯一的文档是权威的：

| 领域 | 唯一事实源 |
|------|-----------|
| 产品需求 | project/PRD.md |
| 技术架构 | project/ARCHITECTURE.md |
| 项目状态 | project/PROJECT_STATUS.md |
| Week 工作 | docs/week-N-WO.md (每个 N) |

### 2. 文档同步原则

**更新触发条件**:
- 每个 Week 完成后 → 更新 PROJECT_STATUS.md
- 架构决策变更后 → 更新 ARCHITECTURE.md
- 需求变更后 → 更新 PRD.md
- 文档更新与代码提交同步

### 3. 文档命名规范

**通用规则**:
- 使用小写字母
- 使用连字符 `-` 分隔单词
- 描述性文件名
- 避免空格和特殊字符

**Week 文档命名**:
```
week-N-{类型}.md
例如: week-9-WO.md, week-9-test-report.md
```

**类型缩写**:
- WO: Work Object (工作对象)
- PL: Product Logic (产品逻辑)
- RP: Review Process (评审流程)
- AR: Acceptance Report (验收报告)

### 4. 文档版本控制

**Git 提交**:
- 所有文档纳入 Git 版本控制
- 文档更新与代码提交同步
- 提交信息: `docs: {描述}`

**历史保留**:
- 重要文档保留历史版本
- 命名格式: `{文件名}_v{版本}_backup_{日期}.md`
- 例如: `PROJECT_STATUS_v1_backup_2026-03-24.md`

---

## 🔄 文档更新流程

### Week 开发文档生命周期

```
Week 开始
   ↓
1. PO 创建 WO 和 PL 文档
   ├─ docs/week-N-WO.md
   └─ docs/week-N-PL.md
   ↓
2. QA 设计测试用例
   └─ docs/week-N-test-cases.md
   ↓
3. DEV 实现功能 (TDD)
   ↓
4. QA 生成测试报告
   └─ docs/week-N-test-report.md
   ↓
5. PO 验收功能
   └─ docs/week-N-acceptance-report.md
   ↓
Week 结束
   ↓
6. PM 更新项目状态
   ├─ 更新 project/PROJECT_STATUS.md
   └─ 更新 CLAUDE.md (Standard Procedure)
```

### 文档更新检查清单

**Week 开始前**:
- [ ] WO 文档已创建
- [ ] PL 文档已创建
- [ ] 测试用例已设计

**Week 进行中**:
- [ ] 测试报告已生成
- [ ] 验收报告已生成

**Week 结束后**:
- [ ] PROJECT_STATUS.md 已更新
- [ ] CLAUDE.md 已更新
- [ ] 所有文档已提交到 Git

---

## ⚠️ 常见错误和纠正

### 错误 1: 使用错误的路径

❌ **错误**:
```typescript
// 引用了不存在的旧路径
参见: ../PRD.md#功能定义
```

✅ **正确**:
```typescript
// 使用新的规范路径
参见: project/PRD.md#功能定义
```

### 错误 2: 忘记更新唯一事实源

❌ **错误**: 修改了 PRD 但没有更新 PROJECT_STATUS.md

✅ **正确**: 同步更新所有相关文档

### 错误 3: 文档放在错误位置

❌ **错误**: Week 文档放在根目录

✅ **正确**: Week 文档统一放在 `docs/` 目录

---

## 📚 快速参考

### 常用文档路径

| 文档 | 路径 |
|------|------|
| 产品需求 | `project/PRD.md` |
| 技术架构 | `project/ARCHITECTURE.md` |
| 项目状态 | `project/PROJECT_STATUS.md` |
| Week N WO | `docs/week-N-WO.md` |
| Week N PL | `docs/week-N-PL.md` |
| TDD 检核清单 | `docs/TDD-CHECKLIST.md` |

### 文档查找命令

```bash
# 列出所有 Week 文档
ls docs/week-*

# 列出项目级文档
ls project/

# 查找特定文档
find . -name "*WO.md" -type f
find . -name "*test-report*" -type f
```

---

**文档所有者**: PM
**维护者**: PM + PO
**最后更新**: 2026-03-25
**下次评审**: Week 10 开始前
