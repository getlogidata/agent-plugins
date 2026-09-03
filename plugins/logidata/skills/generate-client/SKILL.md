---
name: generate-client
description: Sinh code gọi REST API Logidata đúng chuẩn — Python hoặc TypeScript, có retry backoff cho 429, tự phanh theo hạn mức còn lại, phân trang, xử lý X-Account-Id, không hardcode key. Dùng khi người dùng muốn viết script, tích hợp vào hệ thống, hoặc hỏi cách gọi API Logidata bằng code.
---

# Sinh client gọi Logidata API

Đây là REST API thuần (`https://api.logidata.vn`), **không phải MCP**. Người dùng
muốn code chạy độc lập trong hệ thống của họ — không phụ thuộc vào trợ lý AI.

Bản mẫu đầy đủ ở `templates/`: [python.py](templates/python.py),
[typescript.ts](templates/typescript.ts), [apps-script.gs](templates/apps-script.gs).
Đọc file phù hợp rồi chỉnh theo nhu cầu người dùng — **đừng viết lại từ đầu**, các
mẫu này đã xử lý đúng những chỗ bản viết tay luôn sai.

## Hình dạng request

```
GET https://api.logidata.vn/v1/<provider>/<path nền tảng>?<params>
Headers:
  X-API-Key:    ld_live_...        (bắt buộc)
  X-Account-Id: <id kết nối>       (bỏ được nếu key chỉ có 1 kết nối)
```

`<provider>`: `tiktok-ads`, `tiktok-shop`, `shopee`, `shopee-ads`,
`shopee-affiliate`, `google-ads`, `youtube`, `youtube-analytics`,
`google-search-console`, `google-sheets`.

Một số endpoint là **POST dù chỉ để đọc** (TikTok Shop `orders/search`, Google Ads
`:searchStream`) — client phải gửi được body JSON, không chỉ GET.

## Bốn điều bản viết tay luôn sai

**1. Không đọc header hạn mức.** Mọi phản hồi có `X-Quota-Remaining`,
`X-Quota-Limit`, `X-RateLimit-Remaining`. Client phải **tự phanh** khi
`X-Quota-Remaining` xuống thấp, chứ không chạy tới lúc bị 429. Cũng nên log
`X-Request-Id` — không có nó thì báo lỗi cho Logidata là kể chuyện suông.

**2. Retry sai cách.** Retry có backoff cho `429 upstream_rate_limited` và
`502 upstream_unreachable`. **KHÔNG retry** cho `401`, `403`, `400` — chúng không
tự khỏi, retry chỉ đốt hạn mức. Riêng `429 quota_exceeded` cũng **không retry**:
hạn mức tháng đã cạn, thử lại không giúp gì.

**3. Hardcode key trong source.** Luôn đọc từ biến môi trường
(`LOGIDATA_API_KEY`). Key trong repo là key sẽ bị lộ.

**4. Không phân trang đúng.** TikTok Shop dùng **cursor**, không phải số trang —
lấy cursor từ phản hồi trước, đừng tăng biến `page`. Đọc `describe_endpoint` hoặc
tài liệu nền tảng cho từng endpoint, đừng giả định một kiểu cho tất cả.

## Envelope lỗi

```json
{"error": {"code": "provider_not_in_plan", "message": "...", "request_id": "..."}}
```

Client nên nêu `code` ra ngoài, không chỉ HTTP status — `403` một mình không nói
được là hết gói, chưa gắn kết nối, hay endpoint ngoài allowlist.

## Google Sheets: KHÔNG dùng `IMPORTDATA` / `IMPORTJSON`

Hai hàm đó **không gửi được header**, nên không mang được `X-API-Key` — chúng sẽ
không bao giờ chạy. Tệ hơn: chúng **tự chạy lại mỗi lần sheet tính lại**, nên nếu
có cách nào lách được thì cũng đốt hạn mức rất nhanh.

Luôn dùng **Apps Script** (`UrlFetchApp` + `PropertiesService` để giữ key). Mẫu ở
[templates/apps-script.gs](templates/apps-script.gs).

## Với nền tảng Google

Gateway tự làm mới token, client **không** phải xử lý refresh. Nhưng client **phải**
coi `token_revoked` / `invalid_grant` là **lỗi vĩnh viễn**: dừng job, báo người dùng
đi cấp quyền lại ở `/connections`. Retry vòng lặp ở đây là cách chắc chắn nhất để
đốt hết hạn mức tháng trong một đêm.

Riêng YouTube: tự giới hạn nhịp theo **unit budget**, không theo số request — quota
đó dùng chung mọi khách Logidata.

## n8n

Dùng node **HTTP Request**: URL như trên, header `X-API-Key` lấy từ Credential kiểu
*Header Auth* (đừng dán key vào node). Bật *Retry On Fail* nhưng đặt *Max Tries* 3
và *Wait Between Tries* ≥ 2000ms. Nếu cần phân trang, dùng node Loop với cursor lấy
từ phản hồi — n8n không tự phân trang hộ.
