---
name: setup
description: Kiểm tra kết nối Logidata đã chạy chưa — in ra gói, hạn dùng, các nền tảng đang kết nối và hạn mức còn lại. Chỉ chạy khi người dùng gõ tay.
disable-model-invocation: true
---

# Kiểm tra kết nối Logidata

Trả lời đúng một câu hỏi: **"tôi cắm xong chưa, có chạy không?"** — trong ba giây,
không hỏi lại gì.

## Việc cần làm

1. Gọi `check_quota` — lấy gói, hạn mức tháng, đã dùng bao nhiêu.
2. Gọi `list_endpoints` — lấy danh sách nền tảng và các kết nối (`account_id`) mà
   key này thực sự có.

Cả hai **không tính vào hạn mức**. Gọi cả hai, đừng gọi `call_endpoint` để "thử
cho chắc" — đó là 1 request tính tiền khách mà không thêm thông tin gì.

## In ra cho người dùng

Một bảng ngắn, không diễn giải:

```
Gói           : <tên gói> — còn <n> ngày (hoặc "không giới hạn thời gian")
Hạn mức tháng : <đã dùng> / <tổng> request
Kết nối       : <nền tảng> — <tên gợi nhớ> (<account_id>)
                <nền tảng> — <tên gợi nhớ> (<account_id>)
```

Rồi một dòng kết luận: **đang chạy** hoặc **chưa chạy, lý do là …**

Sau bảng, gợi ý đúng một câu hỏi mẫu khớp với nền tảng khách đang có — ví dụ có
TikTok Ads thì *"7 ngày qua tôi tiêu bao nhiêu tiền quảng cáo?"*, có YouTube thì
*"người ta tìm gì để ra video của tôi?"*. Đừng liệt kê cả mười câu.

## Khi có lỗi — chẩn theo đúng nguyên nhân, không nói chung chung

| Gặp gì | Nói gì với người dùng |
|---|---|
| 401 và người dùng chắc chắn key đúng | Key có thể đang đặt **giới hạn IP**. Kết nối MCP đi qua hạ tầng Logidata nên máy chủ không thấy IP thật của bạn, key giới hạn IP luôn bị từ chối. Tạo key mới ở https://portal.logidata.vn/keys và **để trống phần giới hạn IP**. |
| 401 với key vừa tạo xong | Có bộ nhớ đệm 60 giây. Chờ một phút rồi chạy lại. |
| Không có kết nối nào | Key chưa gắn kết nối nền tảng. Vào https://portal.logidata.vn/keys, mở key này, gắn kết nối vào. Nếu chưa cấp quyền nền tảng nào thì làm ở https://portal.logidata.vn/connections trước. |
| Gói hết hạn / bị tạm dừng | https://portal.logidata.vn/upgrade |
| Hạn mức tháng đã cạn | Còn gọi được các tool tra danh mục nhưng không lấy được dữ liệu. Mua thêm block ở https://portal.logidata.vn/upgrade |

Lỗi khác 401/429 thì **đừng đoán** — bảo người dùng chạy `/logidata:doctor` và dán
mã lỗi vào, skill đó có bảng đầy đủ.

## Riêng nền tảng Google

Ứng dụng Google của Logidata hiện còn ở trạng thái *Testing*, nghĩa là quyền truy
cập **hết hiệu lực sau 7 ngày** và khách phải cấp lại. Nếu thấy kết nối Google
trong danh sách, thêm một dòng nhắc:

> Kết nối Google cần cấp quyền lại sau mỗi 7 ngày trong giai đoạn này. Nếu đang
> chạy mà báo lỗi quyền, vào /connections cấp lại — không phải lỗi của bạn.

Nói bằng giọng bình thường, đừng làm khách tưởng hệ thống hỏng.
