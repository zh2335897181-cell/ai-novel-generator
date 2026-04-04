# ⚡ 快速更新指南 - 5分钟学会

## 🎯 最简单的更新方式

### 3行命令完成所有更新

```bash
git add .
git commit -m "你的修改描述"
git push
```

**就这么简单！** 🎉

---

## 📝 修改描述怎么写？

### 简单修改
```bash
git commit -m "fix: 修复登录页面样式"
git commit -m "feat: 添加用户头像功能"
git commit -m "docs: 更新README文档"
```

### 复杂修改
```bash
git commit -m "feat: 实现用户认证系统

- 添加登录页面
- 实现JWT认证
- 添加用户数据库表
- 修复安全漏洞"
```

---

## 🔄 完整工作流 (日常使用)

### 早上
```bash
git pull    # 获取最新代码
```

### 工作中 (每完成一个小功能)
```bash
git add .
git commit -m "描述你的修改"
git push
```

### 下班前
```bash
git push    # 确保所有修改已推送
```

---

## 📊 常见场景

### 场景1: 修改单个文件

```bash
# 修改文件后
git add frontend/src/views/NovelList.vue
git commit -m "fix: 修复列表页面样式"
git push
```

### 场景2: 修改多个文件

```bash
# 修改多个文件后
git add .
git commit -m "feat: 添加新功能

- 修改前端UI
- 更新后端API
- 修复数据库脚本"
git push
```

### 场景3: 修改后悔了

```bash
# 撤销所有修改
git checkout .

# 或者撤销单个文件
git checkout frontend/src/views/NovelList.vue
```

---

## 🔍 查看修改

### 查看你修改了什么
```bash
git status          # 查看修改的文件列表
git diff            # 查看具体修改内容
```

### 查看提交历史
```bash
git log --oneline -5    # 查看最近5个提交
git log --oneline       # 查看所有提交
```

---

## 🌿 分支操作 (可选)

### 为大功能创建分支

```bash
# 创建分支
git checkout -b feature/new-feature

# 在分支上工作
git add .
git commit -m "feat: 新功能"
git push -u origin feature/new-feature

# 完成后合并回main
git checkout main
git pull
git merge feature/new-feature
git push
```

---

## ⚠️ 常见问题

### Q: 推送被拒绝怎么办？
```bash
# 解决: 先拉取最新代码
git pull
git push
```

### Q: 提交消息写错了怎么办？
```bash
# 修改最后一个提交的消息
git commit --amend -m "正确的消息"
git push --force-with-lease
```

### Q: 不小心删除了文件怎么办？
```bash
# 恢复文件
git checkout HEAD -- path/to/file.js
```

### Q: 想撤销最后一个提交怎么办？
```bash
# 撤销但保留修改
git reset --soft HEAD~1

# 撤销并丢弃修改
git reset --hard HEAD~1
```

---

## 📋 提交消息类型

| 类型 | 说明 | 例子 |
|------|------|------|
| feat | 新功能 | `feat: 添加用户登录` |
| fix | 修复bug | `fix: 修复白屏问题` |
| docs | 文档 | `docs: 更新README` |
| style | 代码格式 | `style: 格式化代码` |
| refactor | 重构 | `refactor: 优化查询` |
| perf | 性能 | `perf: 减少API调用` |
| test | 测试 | `test: 添加单元测试` |
| chore | 构建/依赖 | `chore: 更新依赖` |

---

## 🚀 一键更新脚本

### Windows (PowerShell)

创建文件 `update.ps1`:
```powershell
git add .
git commit -m $args[0]
git push
```

使用:
```bash
.\update.ps1 "feat: 新功能"
```

### Mac/Linux (Bash)

创建文件 `update.sh`:
```bash
#!/bin/bash
git add .
git commit -m "$1"
git push
```

使用:
```bash
chmod +x update.sh
./update.sh "feat: 新功能"
```

---

## 📚 详细指南

需要更详细的说明？查看:
- `docs/GIT_WORKFLOW_GUIDE.md` - 完整工作流指南
- `docs/GITHUB_UPLOAD_GUIDE.md` - GitHub上传指南

---

## ✅ 检查清单

每次更新前:
- [ ] 修改了文件
- [ ] 运行 `git status` 查看修改
- [ ] 运行 `git add .` 添加修改
- [ ] 运行 `git commit -m "描述"` 提交
- [ ] 运行 `git push` 推送

---

## 💡 记住这3个命令

```bash
git add .           # 添加修改
git commit -m "msg" # 提交
git push            # 推送
```

**就这么简单！** 🎉

