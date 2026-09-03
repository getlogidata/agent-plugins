# Logidata API — plugin cho Claude Code

Hỏi dữ liệu nền tảng bằng tiếng Việt. Trợ lý tự chọn endpoint, tự dựng tham số,
trả dữ liệu thật của bạn.

## Cài trong 3 bước

**1. Lấy API key** ở [portal.logidata.vn/keys](https://portal.logidata.vn/keys).

> Key **không đặt giới hạn IP**. Kết nối MCP đi qua hạ tầng Logidata nên máy chủ
> không thấy IP thật của bạn — key có giới hạn IP luôn bị từ chối.

**2. Cài plugin:**

```
/plugin marketplace add getlogidata/agent-plugins
/plugin install logidata@logidata
```

Claude hỏi API key **một lần** và lưu vào kho bảo mật của máy (Keychain trên
macOS). Key không nằm trong file cấu hình nào, không vào git.

**3. Kiểm tra:** gõ `/logidata:setup`. Thấy đúng gói và tên kết nối của mình là xong.

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
