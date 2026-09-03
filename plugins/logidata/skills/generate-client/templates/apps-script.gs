/**
 * Logidata API trong Google Sheets — Apps Script.
 *
 * TẠI SAO KHÔNG DÙNG IMPORTDATA / IMPORTJSON:
 *   Hai hàm đó không gửi được HTTP header, nên không mang được X-API-Key —
 *   chúng sẽ không bao giờ chạy được với Logidata. Và chúng tự chạy lại mỗi lần
 *   sheet tính lại, nên nếu lách được thì cũng đốt hạn mức rất nhanh.
 *   Apps Script là đường duy nhất đúng.
 *
 * CÀI ĐẶT (một lần):
 *   1. Trong Sheet: Tiện ích mở rộng → Apps Script, dán file này vào.
 *   2. Chạy hàm `luuApiKey` một lần (sửa key trong hàm đó trước), rồi XOÁ key
 *      khỏi source. Key sẽ nằm trong PropertiesService, không nằm trong file.
 *   3. Chạy `capNhatBaoCao`. Đặt trigger theo giờ nếu muốn tự động.
 *
 * KHÔNG gọi Logidata từ một custom function (=LOGIDATA(...)): custom function
 * chạy lại mỗi lần sheet tính lại và không giữ được key an toàn.
 */

var BASE_URL = 'https://api.logidata.vn';
var QUOTA_FLOOR = 50;   // còn ít hơn thì dừng

/** Chạy MỘT LẦN rồi xoá key khỏi đây. */
function luuApiKey() {
  PropertiesService.getUserProperties()
    .setProperty('LOGIDATA_API_KEY', 'ld_live_DAN_KEY_VAO_DAY');
}

function getApiKey_() {
  var key = PropertiesService.getUserProperties().getProperty('LOGIDATA_API_KEY');
  if (!key) throw new Error('Chưa lưu key — chạy hàm luuApiKey một lần.');
  return key;
}

/**
 * Một request tới /v1/<provider><path>.
 * opts: { method, params, body, accountId }
 */
function goiLogidata_(provider, path, opts) {
  opts = opts || {};
  var query = [];
  var params = opts.params || {};
  for (var k in params) {
    if (params[k] !== undefined && params[k] !== null) {
      query.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    }
  }

  var url = BASE_URL + '/v1/' + provider + path + (query.length ? '?' + query.join('&') : '');
  var headers = { 'X-API-Key': getApiKey_() };
  if (opts.accountId) headers['X-Account-Id'] = opts.accountId;

  var request = {
    method: opts.method || 'get',
    headers: headers,
    muteHttpExceptions: true,   // để tự đọc envelope lỗi thay vì ném HTML
    followRedirects: false
  };
  if (opts.body) {
    request.contentType = 'application/json';
    request.payload = JSON.stringify(opts.body);
  }

  var maxTries = 4;
  for (var attempt = 1; attempt <= maxTries; attempt++) {
    var res = UrlFetchApp.fetch(url, request);
    var status = res.getResponseCode();
    var text = res.getContentText();

    // Tự phanh theo hạn mức còn lại
    var remaining = res.getHeaders()['X-Quota-Remaining'];
    if (remaining && Number(remaining) < QUOTA_FLOOR) {
      Logger.log('Hạn mức còn ' + remaining + ' request — nên dừng.');
    }

    if (status >= 200 && status < 300) return JSON.parse(text);

    var code = 'unknown', message = text.substring(0, 300);
    try {
      var err = JSON.parse(text).error || {};
      code = err.code || code;
      message = err.message || message;
    } catch (e) { /* phản hồi không phải JSON */ }

    // Lỗi vĩnh viễn: dừng ngay, retry chỉ đốt hạn mức
    var fatal = ['quota_exceeded', 'token_revoked', 'invalid_grant',
                 'token_not_found'].indexOf(code) >= 0;
    var tamThoi = [502, 503, 504].indexOf(status) >= 0
      || code === 'upstream_rate_limited' || code === 'upstream_unreachable';

    if (fatal || !tamThoi) {
      throw new Error('[' + status + ' ' + code + '] ' + message);
    }
    if (attempt < maxTries) {
      Utilities.sleep(Math.min(Math.pow(2, attempt), 30) * 1000);
    }
  }
  throw new Error('Hết lần thử.');
}

/** Ghi một mảng object vào sheet, tự dựng dòng tiêu đề. */
function ghiVaoSheet_(tenSheet, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tenSheet) || ss.insertSheet(tenSheet);
  sheet.clear();

  if (!rows || !rows.length) {
    sheet.getRange(1, 1).setValue('Không có dữ liệu');
    return;
  }

  var cols = Object.keys(rows[0]);
  var data = [cols];
  for (var i = 0; i < rows.length; i++) {
    var line = [];
    for (var j = 0; j < cols.length; j++) {
      var v = rows[i][cols[j]];
      line.push(v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : v));
    }
    data.push(line);
  }
  sheet.getRange(1, 1, data.length, cols.length).setValues(data);
  sheet.setFrozenRows(1);
}

/** Ví dụ: chi tiêu TikTok Ads 7 ngày kết thúc HÔM QUA (hôm nay chưa chốt số). */
function capNhatBaoCao() {
  var tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  var homQua = new Date(Date.now() - 24 * 3600 * 1000);
  var truoc7 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  var fmt = function (d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd'); };

  var res = goiLogidata_('tiktok-ads', '/v1.3/report/integrated/get/', {
    params: {
      advertiser_id: '123',        // lấy ở /v1.3/oauth2/advertiser/get/
      report_type: 'BASIC',
      start_date: fmt(truoc7),
      end_date: fmt(homQua)
    }
  });

  var rows = (res.data && res.data.list) || [];
  ghiVaoSheet_('TikTok Ads', rows);
}
