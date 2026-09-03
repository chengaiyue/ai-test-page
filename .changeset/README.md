# Changesets

这个目录由 [changesets](https://github.com/changesets/changesets) 管理，用于组件包的版本与发布。

## 工作流

```bash
# 1. 改动组件后，记录一条变更（交互式选择包 + semver 级别 + 说明）
pnpm changeset

# 2. 发布前：消费变更集，自动 bump 版本号并生成 CHANGELOG.md
pnpm changeset version

# 3. 构建组件产物并发布到 registry
pnpm release
```

- 页面应用（`@ai-test/playground`、`@ai-test/upload-page`）是 private 包，已在
  `config.json` 的 `ignore` 中排除，不参与版本与发布。
- `*.md` 变更集文件随代码提交；`changeset version` 后会被清除并写入各包 CHANGELOG。
