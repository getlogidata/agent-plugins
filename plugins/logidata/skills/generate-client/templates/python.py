"""Client gọi Logidata API — bản mẫu, chỉnh theo nhu cầu rồi dùng.

Cần: pip install httpx

Đã xử lý sẵn bốn chỗ mà bản viết tay thường sai:
  1. đọc header hạn mức và tự phanh trước khi bị 429
  2. retry CHỈ cho lỗi tạm thời, không retry 401/403/400/quota_exceeded
  3. key đọc từ biến môi trường, không nằm trong source
  4. lỗi nêu cả `code` của gateway, không chỉ HTTP status
"""

from __future__ import annotations

import os
import random
import time

import httpx

BASE_URL = "https://api.logidata.vn"

# Còn ít hơn mức này thì dừng, để người dùng không bị cắt giữa một job dài.
QUOTA_FLOOR = 50

# Lỗi tạm thời — retry có ý nghĩa. Mọi mã khác thì không.
RETRY_STATUS = {502, 503, 504}
RETRY_CODES = {"upstream_rate_limited", "upstream_unreachable"}


class LogidataError(RuntimeError):
    """Lỗi từ gateway. `code` là thứ đáng đọc, không phải `status`."""

    def __init__(self, status: int, code: str, message: str, request_id: str = ""):
        super().__init__(f"[{status} {code}] {message}"
                         + (f" (request_id={request_id})" if request_id else ""))
        self.status, self.code, self.message, self.request_id = (
            status, code, message, request_id)


class QuotaExhausted(LogidataError):
    """Hạn mức tháng đã cạn. Retry không cứu được — mua thêm block ở /upgrade."""


class AuthRevoked(LogidataError):
    """Quyền truy cập nền tảng đã chết (Google `token_revoked`/`invalid_grant`).

    Lỗi VĨNH VIỄN: phải cấp quyền lại ở portal /connections. Vòng lặp retry ở đây
    là cách chắc chắn nhất để đốt hết hạn mức tháng trong một đêm.
    """


class LogidataClient:
    def __init__(self, api_key: str | None = None, account_id: str | None = None,
                 *, timeout: float = 60.0, max_tries: int = 4):
        key = api_key or os.environ.get("LOGIDATA_API_KEY")
        if not key:
            raise RuntimeError("Thiếu LOGIDATA_API_KEY")
        self._headers = {"X-API-Key": key}
        if account_id:
            self._headers["X-Account-Id"] = account_id
        self._http = httpx.Client(base_url=BASE_URL, timeout=timeout,
                                  follow_redirects=False)
        self._max_tries = max_tries
        self.quota_remaining: int | None = None
        self.last_request_id: str | None = None

    def close(self) -> None:
        self._http.close()

    def __enter__(self):
        return self

    def __exit__(self, *_exc):
        self.close()

    # ------------------------------------------------------------------
    def call(self, provider: str, path: str, *, method: str = "GET",
             params: dict | None = None, json_body: dict | None = None) -> dict:
        """Một request tới `/v1/<provider><path>`.

        `path` phải bắt đầu bằng "/" và là path của chính nền tảng, ví dụ
        "/v1.3/report/integrated/get/".
        """
        if self.quota_remaining is not None and self.quota_remaining < QUOTA_FLOOR:
            raise QuotaExhausted(429, "quota_guard",
                                 f"còn {self.quota_remaining} request, dừng để an toàn")

        url = f"/v1/{provider}{path}"
        last: LogidataError | None = None

        for attempt in range(1, self._max_tries + 1):
            r = self._http.request(method.upper(), url, headers=self._headers,
                                   params=params, json=json_body)
            self._read_quota(r)

            if r.is_success:
                return r.json()

            err = self._as_error(r)

            # Lỗi vĩnh viễn: ném ngay, đừng tiêu thêm hạn mức.
            if isinstance(err, (QuotaExhausted, AuthRevoked)):
                raise err
            if r.status_code not in RETRY_STATUS and err.code not in RETRY_CODES:
                raise err

            last = err
            if attempt < self._max_tries:
                # Backoff có jitter: nhiều worker cùng retry đồng loạt sẽ lại
                # đâm vào trần tần suất cùng lúc.
                time.sleep(min(2 ** attempt, 30) * (0.5 + random.random()))

        raise last if last else RuntimeError("hết lần thử mà không có lỗi cụ thể")

    def paginate(self, provider: str, path: str, *, params: dict | None = None,
                 rows_key: str, cursor_in: str | None = None,
                 cursor_out: str | None = None, max_pages: int = 20):
        """Lặp qua các trang, `yield` từng dòng.

        Phân trang KHÔNG giống nhau giữa các nền tảng: TikTok Shop dùng cursor,
        Shopee dùng offset/`more`. Truyền đúng tên khoá cho endpoint đang gọi —
        tra `describe_endpoint` hoặc tài liệu nền tảng, đừng giả định.
        """
        params = dict(params or {})
        for _ in range(max_pages):
            body = self.call(provider, path, params=params)
            rows = _dig(body, rows_key) or []
            for row in rows:
                yield row

            if not cursor_in or not cursor_out:
                return
            nxt = _dig(body, cursor_out)
            if not nxt or not rows:
                return
            params[cursor_in] = nxt

    # ------------------------------------------------------------------
    def _read_quota(self, r: httpx.Response) -> None:
        self.last_request_id = r.headers.get("X-Request-Id")
        raw = r.headers.get("X-Quota-Remaining")
        if raw and raw.isdigit():
            self.quota_remaining = int(raw)

    def _as_error(self, r: httpx.Response) -> LogidataError:
        code, message = "unknown", r.text[:300]
        request_id = r.headers.get("X-Request-Id", "")
        try:
            payload = r.json().get("error") or {}
            code = payload.get("code") or code
            message = payload.get("message") or message
            request_id = payload.get("request_id") or request_id
        except Exception:  # noqa: BLE001 - phản hồi không phải JSON
            pass

        cls = LogidataError
        if code == "quota_exceeded":
            cls = QuotaExhausted
        elif code in {"token_revoked", "invalid_grant", "token_not_found"}:
            cls = AuthRevoked
        return cls(r.status_code, code, message, request_id)


def _dig(body: dict, dotted: str):
    """"data.list" -> body["data"]["list"]. None nếu không có."""
    node = body
    for part in dotted.split("."):
        if not isinstance(node, dict):
            return None
        node = node.get(part)
    return node


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    with LogidataClient() as c:
        # 1. Khám phá trước: advertiser nào key này thấy được
        advertisers = c.call("tiktok-ads", "/v1.3/oauth2/advertiser/get/")
        print(advertisers)

        # 2. Số tiền CHỈ có ở report/integrated — campaign/get không có tiền
        report = c.call("tiktok-ads", "/v1.3/report/integrated/get/", params={
            "advertiser_id": "123",
            "report_type": "BASIC",
            "start_date": "2026-09-01",
            "end_date": "2026-09-07",
        })
        print(report, "| còn lại:", c.quota_remaining)

        # 3. Endpoint đọc bằng POST (TikTok Shop) — time_* là UNIX GIÂY
        orders = c.call("tiktok-shop", "/order/202309/orders/search",
                        method="POST",
                        params={"page_size": 50},
                        json_body={"create_time_ge": 1756684800,
                                   "create_time_lt": 1757289600})
        print(orders)
