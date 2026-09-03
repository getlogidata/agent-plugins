---
name: quota
description: Xem hạn mức Logidata — đã dùng bao nhiêu, tốc độ tiêu, dự báo ngày cạn. Chỉ chạy khi người dùng gõ tay.
disable-model-invocation: true
---

# Hạn mức Logidata

Biến hạn mức từ cái bẫy thành cái đồng hồ: người dùng phải biết mình đang ở đâu
**trước khi** cạn, không phải lúc bị chặn.

## Việc cần làm

Gọi `check_quota` (miễn phí). In ra:

```
Đã dùng   : <n> / <tổng> request  (<phần trăm>%)
Còn lại   : <n> request
Tốc độ    : ~<n> request/ngày trong tháng này
Dự báo    : hết vào khoảng ngày <dd/mm> (hoặc "đủ đến cuối tháng")
```

Tính tốc độ bằng `đã dùng / số ngày đã qua trong tháng`. Nếu tháng mới sang 1–2
ngày thì **nói rõ là dự báo chưa đáng tin**, đừng đưa con số như thể chắc chắn.

Nếu còn dưới 20%: thêm link https://portal.logidata.vn/upgrade và nói rõ mua thêm
block rẻ hơn nâng gói khi chỉ thiếu tạm thời.

## Điều gì tính vào hạn mức, điều gì không

- **Tính 1 request**: mỗi lần `call_endpoint` — **kể cả khi nền tảng trả lỗi**.
- **Miễn phí**: `find_endpoint`, `describe_endpoint`, `list_endpoints`,
  `check_quota`.

Nói câu này ra khi người dùng thắc mắc số tiêu nhanh hơn dự kiến: nguyên nhân phổ
biến nhất là dò thử endpoint sai tham số, mỗi lần dò vẫn tính tiền.

## Ba loại hạn mức KHÁC NHAU — đừng gộp

Đây là chỗ dễ làm khách hiểu sai nhất, và hiểu sai thì họ đi mua thứ không cần:

| Loại | Của ai | Cạn thì sao |
|---|---|---|
| **Hạn mức tháng Logidata** | riêng khách, theo gói | 429 `quota_exceeded` → mua thêm block ở `/upgrade` |
| **Giới hạn tần suất (RPS)** | riêng khách, theo gói | 429 tạm thời → chờ vài giây, giảm nhịp |
| **Quota YouTube (unit)** | **dùng chung mọi khách Logidata** | 429 → **mua thêm block KHÔNG giúp gì**; chờ tới nửa đêm giờ Thái Bình Dương |

Quota YouTube tính theo **unit** chứ không theo số request: một lần gọi có thể tốn
1 unit, `search.list` tốn 100. Nếu người dùng gặp 429 khi hỏi về YouTube, đừng
đẩy họ vào `/upgrade` — nói đúng nguyên nhân.

Quota của YouTube Analytics và YouTube Reporting là quota riêng của Google, không
dùng chung 10.000 unit của YouTube Data API.
