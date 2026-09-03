---
name: doctor
description: Chẩn lỗi Logidata API từ mã lỗi hoặc X-Request-Id — chỉ ra nguyên nhân và hành động cụ thể. Chỉ chạy khi người dùng gõ tay.
disable-model-invocation: true
---

# Chẩn lỗi Logidata

Nhận mã lỗi, thông báo lỗi hoặc `X-Request-Id` từ người dùng, tra bảng dưới, in ra
**một nguyên nhân và một hành động**. Không giải thích lý thuyết, không đưa ba khả
năng để người dùng tự chọn.

Nếu người dùng chỉ nói "bị lỗi" mà không có mã: hỏi họ dán nguyên văn thông báo,
hoặc chạy `/logidata:setup` trước — đừng đoán.

## Xác thực (401)

| Triệu chứng | Nguyên nhân | Hành động |
|---|---|---|
| 401 `invalid_api_key` nhưng `curl` với cùng key thì chạy | key có **`ip_allowlist`** | Tạo key mới ở `/keys`, **không** đặt giới hạn IP. MCP đi qua Traefik nên gateway không thấy IP thật; xác thực fail closed. |
| 401 với key vừa cấp | bộ nhớ đệm 60 giây | Chờ một phút. |
| 401 sau khi trước đó chạy tốt | key đã bị **Thu hồi** ở `/keys` | Cấp key mới, hoặc (nếu qua OAuth) đăng nhập & đồng ý lại. |

## Gói và quyền (403)

| Triệu chứng | Nguyên nhân | Hành động |
|---|---|---|
| 403 `provider_not_in_plan` | gói chưa mở nền tảng đó | `/upgrade`. Nếu vừa mở nền tảng phía Logidata thì admin cần chạy `manage_keys.py sync-plans`. |
| 403 `account_not_allowed` | key chưa gắn kết nối | `/keys` → mở key → gắn kết nối. |
| 403 `path_not_allowed` | endpoint ngoài allowlist chỉ-đọc | Liệt kê endpoint hợp lệ của nền tảng đó (`list_endpoints`). Cần ghi thì phải bật `full_access` — thoả thuận riêng với Logidata. |
| 403 `subscription_expired` / `suspended` | hết hạn gói | `/upgrade`. |

## Tham số (400)

| Triệu chứng | Nguyên nhân | Hành động |
|---|---|---|
| 400 `missing_account_id` | key có nhiều kết nối, không biết dùng cái nào | Truyền `X-Account-Id` / `account_id`. Lấy danh sách ở `list_endpoints`. |
| 400 `ambiguous_shop` | một `open_id` gắn nhiều shop TikTok Shop | Chọn `shop_id` **từ danh sách gateway trả kèm** — tuyệt đối không đoán. |

## Nền tảng phía trên (429 / 502)

| Triệu chứng | Nguyên nhân | Hành động |
|---|---|---|
| 429 `quota_exceeded` | cạn hạn mức tháng của khách | Mua block add-on ở `/upgrade`. |
| 429 `upstream_rate_limited` | chạm trần app phía nền tảng | Chờ. **Không retry gấp** — vượt QPM thì TikTok trả `40100` và chặn cả hệ thống 5 phút. |
| 502 `upstream_unreachable` | nền tảng không phản hồi | Thử lại sau. **Không tính vào hạn mức.** |
| `truncated: true` trong phản hồi | phản hồi bị cắt cho vừa ngữ cảnh | Thu hẹp khoảng ngày hoặc giảm `page_size`. **Không kết luận trên phần đã cắt.** |

## Nền tảng Google — cơ chế quyền khác hẳn

Google dùng OAuth có thời hạn, gateway tự làm mới token. Khác với TikTok/Shopee ở
chỗ quyền có thể **chết vĩnh viễn** chứ không chỉ tạm lỗi:

| Triệu chứng | Nguyên nhân | Hành động |
|---|---|---|
| 401 `token_revoked` / `invalid_grant` | khách đã thu hồi quyền, đổi mật khẩu Google, hoặc app Logidata còn ở *Testing* (quyền chết sau 7 ngày) | Cấp quyền lại ở `/connections`. **Không retry** — làm mới token sẽ không bao giờ cứu được. |
| 429 khi hỏi YouTube | quota **unit dùng chung** của mọi khách chạm trần ngày | Chờ tới nửa đêm **giờ Thái Bình Dương**. Giảm tần suất. Mua thêm hạn mức Logidata **không giúp gì**. |
| 403 `DEVELOPER_TOKEN_*` (Google Ads) | lỗi cấu hình phía Logidata | **Không phải lỗi của khách.** Báo Logidata, đừng bảo khách đi cấp quyền lại. |
| GAQL `INVALID_QUERY` | cú pháp sai, hoặc `FROM` ngoài danh sách trắng | In lại câu GAQL hợp lệ. Không tự đoán tên resource. |
| Search Console: 403 hoặc rỗng với `site_url` "đúng" | sai **dạng** site | `sc-domain:vidu.vn` và `https://vidu.vn/` là hai site khác nhau, không hoán đổi. Dùng đúng chuỗi đã verify. |

## Nếu bạn đang ở ChatGPT hoặc Codex

Ở đó người dùng **không cầm API key thô** — key do luồng đăng nhập tự sinh. Nên
hai ca đầu bảng 401 ở trên (`ip_allowlist`, "key vừa cấp") **không áp dụng**. Thay
vào đó:

| Triệu chứng | Nguyên nhân | Hành động |
|---|---|---|
| Không thấy tool Logidata nào / "app not found" | trình kết nối chưa đăng ký, hoặc đã xoá phía ChatGPT | Đăng ký lại: Cài đặt → Trình kết nối → Chế độ nhà phát triển. Xem `docs.logidata.vn/mcp`. |
| 401 dù đã bấm Đồng ý | key "ChatGPT (OAuth)" đã bị **Thu hồi** ở portal `/keys` | Đăng nhập & đồng ý lại. Key mới được phát, key cũ tự chết. |
| Lỗi xác thực kèm chuỗi `${user_config.api_key}` xuất hiện nguyên văn | plugin cấu hình sai (khai MCP server thay vì app connector) | Lỗi phía Logidata — báo lại, đừng thử cấu hình tay. |

Đừng bảo người dùng ChatGPT đi "tạo key không giới hạn IP" — họ không có chỗ để
làm việc đó, và câu đó làm họ đi lạc.

## Không có trong bảng?

Nói thẳng là chưa rõ nguyên nhân, rồi đưa `X-Request-Id` (nếu có) cùng nguyên văn
lỗi cho Logidata. Đoán một nguyên nhân nghe hợp lý là cách nhanh nhất để người
dùng mất buổi chiều đi sai đường.
