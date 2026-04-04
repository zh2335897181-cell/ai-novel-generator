# 📚 Git工作流指南 - 如何更新代码到GitHub

## 🎯 快速开始

### 最简单的3步更新流程

```bash
# 1. 查看你修改了哪些文件
git status

# 2. 添加所有修改到暂存区
git add .

# 3. 创建提交并推送
git commit -m "描述你的修改"
git push
```

---

## 📖 详细工作流

### 场景1: 修改单个文件

```bash
# 1. 修改文件（在编辑器中修改）
# 例如: frontend/src/views/NovelList.vue

# 2. 查看修改
git diff frontend/src/views/NovelList.vue

# 3. 添加到暂存区
git add frontend/src/views/NovelList.vue

# 4. 提交
git commit -m "fix: 修复NovelList页面的样式问题"

# 5. 推送到GitHub
git push
```

### 场景2: 修改多个文件

```bash
# 1. 查看所有修改
git status

# 2. 添加所有修改
git add .

# 3. 查看将要提交的内容
git diff --cached

# 4. 提交
git commit -m "feat: 添加新功能

- 修改了前端UI
- 更新了后端API
- 修复了数据库脚本"

# 5. 推送
git push
```

### 场景3: 修改后悔了

```bash
# 查看修改但还未提交
git diff

# 撤销单个文件的修改
git checkout frontend/src/views/NovelList.vue

# 撤销所有修改
git checkout .

# 或者使用reset
git reset --hard HEAD
```

---

## 🔄 完整的日常工作流

### 早上开始工作

```bash
# 1. 更新本地代码（获取远程最新版本）
git pull

# 2. 查看分支
git branch -a

# 3. 创建新分支（可选，用于大功能）
git checkout -b feature/new-feature
```

### 工作中

```bash
# 1. 定期查看修改
git status

# 2. 查看具体修改内容
git diff

# 3. 添加修改
git add .

# 4. 提交（经常提交，保持历史清晰）
git commit -m "描述修改"
```

### 下班前

```bash
# 1. 推送所有提交
git push

# 2. 查看推送状态
git log --oneline -5

# 3. 验证远程仓库
git remote -v
```

---

## 📝 提交消息规范

### 好的提交消息格式

```
<type>: <subject>

<body>

<footer>
```

### Type 类型

| 类型 | 说明 | 例子 |
|------|------|------|
| feat | 新功能 | `feat: 添加用户登录功能` |
| fix | 修复bug | `fix: 修复白屏问题` |
| docs | 文档更新 | `docs: 更新README` |
| style | 代码风格 | `style: 格式化代码` |
| refactor | 代码重构 | `refactor: 优化数据库查询` |
| perf | 性能优化 | `perf: 减少API调用次数` |
| test | 测试相关 | `test: 添加单元测试` |
| chore | 构建/依赖 | `chore: 更新依赖包` |

### 提交消息示例

```bash
# 简单修改
git commit -m "fix: 修复登录页面的样式问题"

# 复杂修改
git commit -m "feat: 实现AI小说生成功能

- 添加生成API端点
- 实现流式响应
- 添加进度显示
- 修复错误处理"

# Bug修复
git commit -m "fix: 修复数据库连接泄漏

问题: 连接未正确释放导致连接池耗尽
解决: 添加finally块确保连接释放
相关: #123"
```

---

## 🌿 分支管理

### 创建分支（用于大功能）

```bash
# 创建新分支
git checkout -b feature/user-authentication

# 或者
git branch feature/user-authentication
git checkout feature/user-authentication

# 查看所有分支
git branch -a

# 删除本地分支
git branch -d feature/user-authentication

# 删除远程分支
git push origin --delete feature/user-authentication
```

### 合并分支

```bash
# 切换到主分支
git checkout main

# 更新主分支
git pull

# 合并功能分支
git merge feature/user-authentication

# 推送合并结果
git push
```

### 分支工作流示例

```bash
# 1. 从main创建功能分支
git checkout main
git pull
git checkout -b feature/new-ui

# 2. 在功能分支上工作
# ... 修改文件 ...
git add .
git commit -m "feat: 新UI设计"
git push -u origin feature/new-ui

# 3. 完成后合并回main
git checkout main
git pull
git merge feature/new-ui
git push

# 4. 删除功能分支
git branch -d feature/new-ui
git push origin --delete feature/new-ui
```

---

## 🔍 查看历史

### 查看提交历史

```bash
# 查看最近5个提交
git log --oneline -5

# 查看详细信息
git log -5

# 查看某个文件的历史
git log --oneline frontend/src/views/NovelList.vue

# 查看谁修改了什么
git blame frontend/src/views/NovelList.vue

# 查看图形化历史
git log --graph --oneline --all
```

### 查看修改

```bash
# 查看未提交的修改
git diff

# 查看已暂存的修改
git diff --cached

# 查看两个提交之间的差异
git diff HEAD~1 HEAD

# 查看某个文件的修改
git diff frontend/src/views/NovelList.vue
```

---

## 🚀 常见操作

### 修改最后一个提交

```bash
# 修改提交消息
git commit --amend -m "新的提交消息"

# 添加遗漏的文件
git add forgotten_file.js
git commit --amend --no-edit

# 推送修改（注意：只能修改未推送的提交）
git push --force-with-lease
```

### 撤销提交

```bash
# 撤销最后一个提交，保留修改
git reset --soft HEAD~1

# 撤销最后一个提交，丢弃修改
git reset --hard HEAD~1

# 撤销已推送的提交（创建新提交）
git revert HEAD
git push
```

### 暂存修改

```bash
# 暂存当前修改
git stash

# 查看暂存列表
git stash list

# 恢复暂存
git stash pop

# 删除暂存
git stash drop
```

---

## 📊 实际场景示例

### 场景1: 修复Bug

```bash
# 1. 更新代码
git pull

# 2. 创建bug修复分支
git checkout -b fix/white-screen-issue

# 3. 修改文件
# ... 修改 frontend/src/App.vue ...

# 4. 测试修改
# ... 测试代码 ...

# 5. 提交
git add frontend/src/App.vue
git commit -m "fix: 修复白屏问题

问题: 路由过渡动画导致页面白屏
解决: 移除过渡动画配置
测试: 已验证页面正常加载"

# 6. 推送
git push -u origin fix/white-screen-issue

# 7. 合并回main
git checkout main
git pull
git merge fix/white-screen-issue
git push

# 8. 删除分支
git branch -d fix/white-screen-issue
git push origin --delete fix/white-screen-issue
```

### 场景2: 添加新功能

```bash
# 1. 创建功能分支
git checkout -b feature/user-profile

# 2. 添加前端代码
# ... 修改 frontend/src/views/UserProfile.vue ...

# 3. 添加后端代码
# ... 修改 backend/src/controllers/userController.js ...

# 4. 添加数据库脚本
# ... 修改 database/schema.sql ...

# 5. 提交
git add .
git commit -m "feat: 添加用户资料页面

- 创建UserProfile组件
- 添加用户API端点
- 更新数据库schema
- 添加样式和验证"

# 6. 推送
git push -u origin feature/user-profile

# 7. 合并
git checkout main
git pull
git merge feature/user-profile
git push
```

### 场景3: 更新文档

```bash
# 1. 修改文档
# ... 修改 docs/README.md ...

# 2. 提交
git add docs/README.md
git commit -m "docs: 更新项目文档

- 添加新功能说明
- 更新安装步骤
- 修复错别字"

# 3. 推送
git push
```

---

## ⚠️ 常见错误和解决方案

### 错误1: 推送被拒绝

```bash
# 问题: 远程有新提交，本地版本过旧
# 解决:
git pull
git push

# 或者强制推送（谨慎使用）
git push --force-with-lease
```

### 错误2: 提交到了错误的分支

```bash
# 问题: 在main分支上提交了应该在feature分支上的代码
# 解决:

# 1. 撤销提交
git reset --soft HEAD~1

# 2. 创建新分支
git checkout -b feature/correct-branch

# 3. 提交到新分支
git commit -m "feat: 正确的功能"

# 4. 推送
git push -u origin feature/correct-branch
```

### 错误3: 意外删除了文件

```bash
# 问题: 删除了重要文件
# 解决:

# 1. 查看历史
git log --oneline

# 2. 找到文件存在的提交
git show <commit>:path/to/file.js

# 3. 恢复文件
git checkout <commit> -- path/to/file.js

# 4. 提交恢复
git commit -m "fix: 恢复误删的文件"
```

### 错误4: 合并冲突

```bash
# 问题: 合并时出现冲突
# 解决:

# 1. 查看冲突
git status

# 2. 编辑冲突文件，手动解决

# 3. 标记为已解决
git add conflicted_file.js

# 4. 完成合并
git commit -m "merge: 解决合并冲突"
```

---

## 🔐 安全建议

### 不要提交的文件

```bash
# 已在.gitignore中排除:
backend/.env              # 数据库密码
node_modules/             # 依赖包
.git/                     # Git配置
*.log                     # 日志文件
.DS_Store                 # 系统文件
```

### 敏感信息处理

```bash
# 如果不小心提交了敏感信息:

# 1. 从历史记录中删除
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch backend/.env' \
  --prune-empty --tag-name-filter cat -- --all

# 2. 强制推送
git push -u origin main --force

# 3. 立即撤销token/密钥
```

---

## 📋 日常检查清单

### 每次提交前

- [ ] 运行 `git status` 检查修改
- [ ] 运行 `git diff` 查看具体修改
- [ ] 确保没有提交敏感信息
- [ ] 编写清晰的提交消息
- [ ] 测试代码是否正常工作

### 每次推送前

- [ ] 运行 `git log --oneline -5` 查看提交
- [ ] 确保提交消息清晰
- [ ] 运行 `git push --dry-run` 模拟推送
- [ ] 检查是否有冲突

### 每周检查

- [ ] 查看 `git log --graph --oneline --all` 了解项目进度
- [ ] 清理已删除的分支
- [ ] 更新本地代码 `git pull`
- [ ] 检查是否有未推送的提交

---

## 🎓 学习资源

### 常用命令速查

```bash
# 基础命令
git status              # 查看状态
git add .              # 添加所有修改
git commit -m "msg"    # 提交
git push               # 推送
git pull               # 拉取

# 分支命令
git branch             # 查看分支
git checkout -b name   # 创建分支
git merge name         # 合并分支
git branch -d name     # 删除分支

# 历史命令
git log                # 查看历史
git diff               # 查看修改
git show commit        # 查看提交

# 撤销命令
git reset              # 撤销提交
git revert             # 反向提交
git checkout           # 恢复文件
```

### 推荐阅读

- [Git官方文档](https://git-scm.com/doc)
- [GitHub指南](https://guides.github.com/)
- [Git分支模型](https://nvie.com/posts/a-successful-git-branching-model/)

---

## 💡 最佳实践

### 提交频率
- ✅ 经常提交（每个小功能一次）
- ❌ 不要等到完成大功能才提交

### 提交大小
- ✅ 小而专注的提交
- ❌ 混合多个不相关的修改

### 提交消息
- ✅ 清晰、描述性的消息
- ❌ 模糊的消息如"fix bug"

### 分支策略
- ✅ 为大功能创建分支
- ✅ 定期合并回main
- ❌ 长期不合并的分支

### 代码审查
- ✅ 在合并前进行审查
- ✅ 使用Pull Request
- ❌ 直接推送到main

---

## 🚀 快速参考

### 最常用的5个命令

```bash
# 1. 查看状态
git status

# 2. 添加修改
git add .

# 3. 提交
git commit -m "描述"

# 4. 推送
git push

# 5. 拉取
git pull
```

### 一行命令完成更新

```bash
# 添加、提交、推送一步完成
git add . && git commit -m "更新" && git push
```

---

## 📞 需要帮助？

如果遇到问题，查看这些文件：
- `docs/GIT_WORKFLOW_GUIDE.md` - 本文件
- `docs/GITHUB_UPLOAD_GUIDE.md` - GitHub上传指南
- GitHub官方文档: https://docs.github.com/

