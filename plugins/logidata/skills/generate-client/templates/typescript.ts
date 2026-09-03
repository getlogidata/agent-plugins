/**
 * Client gọi Logidata API — bản mẫu, chỉnh theo nhu cầu rồi dùng.
 *
 * Chạy được trên Node 18+ (fetch có sẵn) và trên Deno/Bun.
 * Key đọc từ biến môi trường LOGIDATA_API_KEY — đừng hardcode.
 */

const BASE_URL = "https://api.logidata.vn";

/** Còn ít hơn mức này thì dừng, để job dài không bị cắt giữa đường. */
const QUOTA_FLOOR = 50;

const RETRY_STATUS = new Set([502, 503, 504]);
const RETRY_CODES = new Set(["upstream_rate_limited", "upstream_unreachable"]);

/** Lỗi vĩnh viễn — retry không bao giờ cứu được. */
const FATAL_CODES = new Set([
  "quota_exceeded",
  "token_revoked",
  "invalid_grant",
  "token_not_found",
]);

export class LogidataError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId = "",
  ) {
    super(`[${status} ${code}] ${message}${requestId ? ` (request_id=${requestId})` : ""}`);
    this.name = "LogidataError";
  }

  /** true = dừng hẳn. quota_exceeded và token_revoked không tự khỏi. */
  get fatal(): boolean {
    return FATAL_CODES.has(this.code);
  }
}

export interface CallOptions {
  method?: "GET" | "POST";
  params?: Record<string, string | number | undefined>;
  body?: unknown;
}

export class LogidataClient {
  private readonly headers: Record<string, string>;
  quotaRemaining: number | null = null;
  lastRequestId: string | null = null;

  constructor(
    apiKey = process.env.LOGIDATA_API_KEY,
    accountId?: string,
    private readonly maxTries = 4,
  ) {
    if (!apiKey) throw new Error("Thiếu LOGIDATA_API_KEY");
    this.headers = { "X-API-Key": apiKey };
    if (accountId) this.headers["X-Account-Id"] = accountId;
  }

  /**
   * Một request tới /v1/<provider><path>.
   * `path` là path của chính nền tảng, ví dụ "/v1.3/report/integrated/get/".
   */
  async call<T = unknown>(
    provider: string,
    path: string,
    opts: CallOptions = {},
  ): Promise<T> {
    if (this.quotaRemaining !== null && this.quotaRemaining < QUOTA_FLOOR) {
      throw new LogidataError(
        429,
        "quota_guard",
        `còn ${this.quotaRemaining} request, dừng để an toàn`,
      );
    }

    const url = new URL(`/v1/${provider}${path}`, BASE_URL);
    for (const [k, v] of Object.entries(opts.params ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }

    const method = opts.method ?? "GET";
    const headers = { ...this.headers };
    if (opts.body !== undefined) headers["Content-Type"] = "application/json";

    let last: LogidataError | undefined;

    for (let attempt = 1; attempt <= this.maxTries; attempt++) {
      const res = await fetch(url, {
        method,
        headers,
        body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
        redirect: "error",
      });

      this.readQuota(res);
      if (res.ok) return (await res.json()) as T;

      const err = await this.asError(res);

      // Lỗi vĩnh viễn hoặc lỗi cấu hình: ném ngay, đừng tiêu thêm hạn mức.
      if (err.fatal || (!RETRY_STATUS.has(res.status) && !RETRY_CODES.has(err.code))) {
        throw err;
      }

      last = err;
      if (attempt < this.maxTries) {
        // Jitter: nhiều worker retry đồng loạt sẽ lại đâm vào trần cùng lúc.
        const wait = Math.min(2 ** attempt, 30) * 1000 * (0.5 + Math.random());
        await new Promise((r) => setTimeout(r, wait));
      }
    }

    throw last ?? new Error("hết lần thử mà không có lỗi cụ thể");
  }

  private readQuota(res: Response): void {
    this.lastRequestId = res.headers.get("X-Request-Id");
    const raw = res.headers.get("X-Quota-Remaining");
    if (raw && /^\d+$/.test(raw)) this.quotaRemaining = Number(raw);
  }

  private async asError(res: Response): Promise<LogidataError> {
    const requestId = res.headers.get("X-Request-Id") ?? "";
    try {
      const payload = (await res.json()) as {
        error?: { code?: string; message?: string; request_id?: string };
      };
      const e = payload.error ?? {};
      return new LogidataError(
        res.status,
        e.code ?? "unknown",
        e.message ?? res.statusText,
        e.request_id ?? requestId,
      );
    } catch {
      return new LogidataError(res.status, "unknown", res.statusText, requestId);
    }
  }
}

// ---------------------------------------------------------------------------
// Ví dụ
//
// const c = new LogidataClient();
//
// // 1. Khám phá trước
// await c.call("tiktok-ads", "/v1.3/oauth2/advertiser/get/");
//
// // 2. Số tiền CHỈ có ở report/integrated
// await c.call("tiktok-ads", "/v1.3/report/integrated/get/", {
//   params: { advertiser_id: "123", report_type: "BASIC",
//             start_date: "2026-09-01", end_date: "2026-09-07" },
// });
//
// // 3. Google Ads: GAQL là chuỗi trong body, cost_micros phải CHIA 1_000_000
// await c.call("google-ads", "/customers/1234567890/googleAds:searchStream", {
//   method: "POST",
//   body: { query: "SELECT campaign.name, metrics.cost_micros FROM campaign " +
//                  "WHERE segments.date DURING LAST_7_DAYS" },
// });
