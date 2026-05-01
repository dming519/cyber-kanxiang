# 部署到 Cloudflare Workers（GitHub 集成路径）

本地 Windows 下 `wrangler dev` 模拟会触发 OpenNext 已知的路径兼容 bug（`Dynamic require ... middleware-manifest.json`）。
把构建放到 Cloudflare Workers Builds 的 Linux runner 上跑可以直接绕开。

---

## 一、把仓库推到 GitHub

仓库已 `git init` 并 stage 全部源码。下面三步在项目根目录执行：

```bash
# 1) 首次提交（消息可改）
git commit -m "feat: 初始化赛博看相 MVP（Next.js 15 + OpenNext + Workers）"

# 2) 在 GitHub 网页端创建一个空仓库 cyber-kanxiang（私有/公开均可），不要勾任何 README/.gitignore/license
# 然后回到本地 add remote（替换 USERNAME）
git remote add origin git@github.com:USERNAME/cyber-kanxiang.git
# 或 https：git remote add origin https://github.com/USERNAME/cyber-kanxiang.git

# 3) 推送
git push -u origin main
```

确认 GitHub 上看不到 `.env.local` / `.dev.vars` / `*.jpg` 这些被 gitignore 的文件。

---

## 二、在 Cloudflare 仪表板连接 GitHub

1. 打开 <https://dash.cloudflare.com/?to=/:account/workers-and-pages>
2. **Create → Workers → Connect to Git**（或 "Import a repository"）
3. 授权 Cloudflare GitHub App，选刚才推送的 `cyber-kanxiang` 仓库
4. 构建配置（默认大多正确）：
   - **Build command**：`npx opennextjs-cloudflare build`
   - **Deploy command**：`npx wrangler deploy`
   - **Root directory**：留空（仓库根）
   - **Branch**：`main`
5. 点击 **Save and Deploy** 触发首次构建

首次构建大约 3-6 分钟。Cloudflare 会用你 wrangler.jsonc 中的 `name: cyber-kanxiang` 作为 Worker 名，分配的 URL 是 `https://cyber-kanxiang.<你的子域>.workers.dev`。

---

## 三、配置环境变量（关键）

构建会成功，但**首次访问 `/api/divine` 会返回 500 + "服务器尚未配置 NEWCLI_API_KEY"**，因为 secret 还没注入。

在仪表板：**Workers → cyber-kanxiang → Settings → Variables and Secrets**：

| 变量名 | 类型 | 值 |
|---|---|---|
| `NEWCLI_API_KEY` | **Secret** | `sk-ant-oat01-BCnp4D98I3KTlz_HREnMNf5-_oxSYyYE7zoPi7dV_2olXEilFxnBkNob9EIPx9fLM-CEFOE6wuXhFvg6XJe9Jh6LWpO67AA` |
| `NEWCLI_BASE_URL` | Plain text | 已在 `wrangler.jsonc` 中 |

`NEWCLI_BASE_URL` 已经写在 `wrangler.jsonc` 的 `vars` 里，会随每次部署同步，不需要在仪表板重复配置。但 **API Key 一定要走 Secret 类型**——Cloudflare 会加密存储且不再回显，部署日志和环境列表都看不到原值。

加好 secret 后，仪表板顶部会出现 **Redeploy** 提示，点一下，让 Worker 拿到新的环境变量。

---

## 四、绑定自定义域名（可选）

仪表板：**Workers → cyber-kanxiang → Settings → Domains & Routes → Add Custom Domain**。
若域名已在你的 Cloudflare 账户下，几秒钟即可生效。

---

## 五、线上端到端验证

部署生效后，浏览器打开 `https://cyber-kanxiang.<子域>.workers.dev`：

- [ ] 首页三张霓虹卡片可见，hover 有光晕
- [ ] 点"看手相" → 上传一张手部图 → 等 30-90s → 看到生成的标注图
- [ ] 重复 face / mole（需要面部正面照、含痣面部照）
- [ ] 仪表板 → Workers → Logs 实时查看：无 `[divine] fetch failed` 错误日志

如果首次调用 `/api/divine` 返回 502 + "上游连接失败"，多半是中转 API 的 rate limit（中转响应过 "官方算力限制"），等几分钟再试。

---

## 六、后续迭代

- 改代码 → `git commit` → `git push` → Cloudflare 自动构建并部署（除非你关掉 Auto Deploy）
- 改 `wrangler.jsonc` 中的 `vars` 也会随推送生效
- 添加新 secret 仍需手动在仪表板配置 + 触发 Redeploy
- 想本地用 `pnpm dev`（Next.js dev 模式）开发是可以的，**只是不要再尝试本地 `wrangler dev`**——OpenNext 的 Windows 兼容问题暂时无解，除非用 WSL

---

## 七、回滚

仪表板：**Workers → cyber-kanxiang → Deployments**。
列表里每个版本都有 **Rollback** 按钮，可一键回到上一个稳定版本。
