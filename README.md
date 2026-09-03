# agent-plugins

Plugin và marketplace chính thức của [Logidata](https://logidata.vn) — đưa dữ liệu
thương mại điện tử và quảng cáo của bạn vào trợ lý AI qua MCP, bằng chính API key
Logidata.

> **Trạng thái: 0.1.0 — chưa thử với khách thật.** Đã dựng đủ manifest và skill,
> chưa qua vòng cài lại từ đầu như khách mới. Bản 1.0.0 sẽ ra sau vòng đó.

## Cài đặt

**Claude Code:**

```
/plugin marketplace add getlogidata/agent-plugins
/plugin install logidata@logidata
```

Claude hỏi API key một lần rồi lưu vào kho bảo mật của máy. Lấy key ở
[portal.logidata.vn/keys](https://portal.logidata.vn/keys) — **không đặt giới hạn
IP**, vì kết nối đi qua hạ tầng Logidata nên máy chủ không thấy IP thật của bạn.

Kiểm tra: gõ `/logidata:setup`.

**Codex / ChatGPT:** đang đóng gói (P3b). Hiện tại cắm trực tiếp bằng trình kết nối
tuỳ chỉnh — xem [docs.logidata.vn/mcp](https://docs.logidata.vn/mcp).

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
plugins/logidata/
├── .claude-plugin/plugin.json      manifest + userConfig (API key)
├── .mcp.json                       trỏ tới mcp.logidata.vn
├── skills/                         11 skill, dùng chung cho Claude và Codex
└── agents/logidata-analyst.md      subagent (chỉ Claude Code đọc)
```

`skills/*/SKILL.md` theo [Agent Skills open standard](https://agentskills.io) nên
dùng chung được cho Claude Code và Codex; chỉ manifest đóng gói là khác nhau.

## Đóng góp

Skill và tài liệu nhận PR. Nội dung nghiệp vụ (bảng mã lỗi, quy trình phân tích)
là nguồn sự thật duy nhất — đừng chép sang chỗ khác, sửa ở đây.

MIT — xem [LICENSE](LICENSE).
