# agent-plugins

Plugin và marketplace chính thức của [Logidata](https://logidata.vn) — đưa dữ liệu
thương mại điện tử và quảng cáo của bạn vào trợ lý AI qua MCP.

> **Trạng thái: 0.1.0 — Plugin cho Claude Code và Codex đã dựng đủ, cài chạy được.**

## Cách hoạt động

Hai mảnh, cần cả hai:

| Mảnh | Cho bạn cái gì | Cài ở đâu |
|---|---|---|
| **Trình kết nối** (MCP qua OAuth) | **dữ liệu** — quyền gọi API nền tảng | một lần trên claude.ai / chatgpt.com |
| **Plugin** (repo này) | **kỹ năng** — trợ lý biết hỏi endpoint nào, dựng tham số ra sao | lệnh dưới đây |

Kết nối bằng OAuth trên web thì Claude Code và Codex CLI **tự thừa hưởng** — không
phải dán API key vào đâu. Hướng dẫn đầy đủ (kể cả cách cắm bằng API key cho Claude
Desktop / agent nội bộ): [docs.logidata.vn](https://docs.logidata.vn/mcp).

## Cài đặt

**Claude Code:**

```
/plugin marketplace add getlogidata/agent-plugins
/plugin install logidata@logidata
```

**Codex / ChatGPT:**

```
codex plugin marketplace add getlogidata/agent-plugins
codex plugin add logidata@logidata
```

Kiểm tra: gõ `/logidata:setup` (Claude Code) hoặc `$setup` (Codex).

> Codex trong VS Code / JetBrains không nạp plugin — cài kỹ năng bằng
> `install-skills.ps1` / `install-skills.sh`, xem
> [docs.logidata.vn/plugin-codex](https://docs.logidata.vn/plugin-codex/#phu-luc-a).

## Có gì trong plugin

11 skill, chia ba nhóm:

| Nhóm | Skill |
|---|---|
| **Vận hành** (gõ tay) | `setup` · `quota` · `doctor` |
| **Phân tích** (trợ lý tự gọi) | `analyze-ads` · `analyze-orders` · `reconcile-finance` · `unify-platforms` · `analyze-youtube` · `analyze-search` |
| **Tích hợp** | `generate-client` · `export-data` |

Kèm subagent `logidata-analyst` cho báo cáo nhiều bước — nó hấp thụ JSON thô để
ngữ cảnh chính chỉ nhận kết luận và file.

Nền tảng: TikTok Ads · TikTok Shop · Shopee (kèm Shopee Ads, Shopee Affiliate) ·
Google Ads · YouTube · Google Search Console · Google Sheets.

## Cấu trúc repo

```
.claude-plugin/marketplace.json     marketplace cho Claude Code
.agents/plugins/marketplace.json    marketplace cho Codex
install-skills.ps1 / .sh            cài skill USER cho Codex IDE (không nạp plugin)
plugins/logidata/
├── .claude-plugin/plugin.json      manifest Claude + userConfig (API key phương án phụ)
├── .codex-plugin/plugin.json       manifest Codex (skills + interface, KHÔNG khai mcpServers)
├── .mcp.json                       trỏ tới mcp.logidata.vn — chỉ Claude Code đọc
├── skills/                         11 skill, dùng chung cho Claude và Codex
│   └── {setup,quota,doctor}/agents/openai.yaml   chặn Codex tự gọi (Claude dùng frontmatter)
└── agents/logidata-analyst.md      subagent (chỉ Claude Code đọc)
```

`skills/*/SKILL.md` theo [Agent Skills open standard](https://agentskills.io) nên
dùng chung được cho Claude Code và Codex; chỉ manifest đóng gói là khác nhau.

⚠️ **Đừng cài cả plugin lẫn skill USER trên cùng máy** — mọi skill sẽ hiện hai lần.

## Đóng góp

Skill và tài liệu nhận PR. Nội dung nghiệp vụ (bảng mã lỗi, quy trình phân tích)
là nguồn sự thật duy nhất — đừng chép sang chỗ khác, sửa ở đây.

MIT — xem [LICENSE](LICENSE).
