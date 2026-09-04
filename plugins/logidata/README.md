# Logidata API — plugin cho Claude Code

Hỏi dữ liệu nền tảng bằng tiếng Việt. Trợ lý tự chọn endpoint, tự dựng tham số,
trả dữ liệu thật của bạn.

Cần **hai mảnh**: trình kết nối (lo dữ liệu) + plugin này (lo kỹ năng).

## Cài trong 3 bước

**1. Kết nối Logidata trên [claude.ai](https://claude.ai)** → Cài đặt → Trình kết
nối → Thêm trình kết nối tuỳ chỉnh:

| Ô | Điền |
|---|---|
| Địa chỉ máy chủ MCP | `https://mcp.logidata.vn/mcp` |
| Client ID *(mục nâng cao)* | `claude-ai` |
| Client Secret | để trống |

Đăng nhập Logidata → Đồng ý. Claude Code trên máy tự thừa hưởng — không phải dán
key vào đâu. *(Cần gói Claude Pro/Max/Team/Enterprise.)*

**2. Cài plugin:**

```
/plugin marketplace add getlogidata/agent-plugins
/plugin install logidata@logidata
```

**3. Kiểm tra:** gõ `/logidata:setup`. Thấy đúng gói và tên kết nối của mình là xong.

> Không dùng tài khoản claude.ai? Cắm bằng API key: `claude mcp add logidata
> --transport http https://mcp.logidata.vn/mcp --header "Authorization: Bearer
> ld_live_..."`. Dùng key **không đặt giới hạn IP** — kết nối đi qua hạ tầng
> Logidata nên máy chủ không thấy IP thật của bạn.

## Nền tảng hỗ trợ

TikTok Ads · TikTok Shop · Shopee (kèm Shopee Ads, Shopee Affiliate) · Google Ads ·
YouTube · Google Search Console · Google Sheets

Mỗi API key chỉ thấy phần nền tảng bạn đã cấp quyền ở
[portal.logidata.vn/connections](https://portal.logidata.vn/connections).

## Lệnh gõ tay

| Lệnh | Việc |
|---|---|
| `/logidata:setup` | Gói, hạn dùng, kết nối đang hoạt động, hạn mức còn lại |
| `/logidata:quota` | Đã tiêu bao nhiêu, tốc độ, dự báo ngày cạn |
| `/logidata:doctor` | Dán mã lỗi vào — nhận nguyên nhân và hành động cụ thể |

## Còn lại thì cứ hỏi

Không cần gọi lệnh. Hỏi bình thường, trợ lý tự chọn skill:

- *"7 ngày qua tôi tiêu bao nhiêu tiền quảng cáo TikTok Ads?"*
- *"Doanh thu Shopee tháng này theo từng ngày"*
- *"Đối soát tiền về TikTok Shop kỳ gần nhất"*
- *"Người ta tìm gì để ra video của tôi?"*
- *"Viết cho tôi script Python kéo báo cáo này mỗi sáng"*

## Cần biết

- Mỗi lượt **lấy dữ liệu** tính 1 request vào hạn mức tháng, kể cả khi nền tảng
  trả lỗi. Các lượt tra danh mục thì miễn phí.
- Tất cả **chỉ đọc** — không có đường nào sửa hay xoá chiến dịch, đơn hàng.
- Phản hồi quá lớn bị cắt và đánh dấu `truncated`. Thu hẹp khoảng ngày rồi hỏi lại.

Hướng dẫn đầy đủ, gồm cả ChatGPT / claude.ai / Codex:
[docs.logidata.vn/mcp](https://docs.logidata.vn/mcp)

## Cả team dùng chung

Ghim vào `.claude/settings.json` của repo — `git clone` là có sẵn:

```json
{
  "extraKnownMarketplaces": {
    "logidata": {
      "source": { "source": "github", "repo": "getlogidata/agent-plugins" }
    }
  },
  "enabledPlugins": { "logidata@logidata": true }
}
```

Mỗi người vẫn nhập API key riêng — key không đi kèm repo.
