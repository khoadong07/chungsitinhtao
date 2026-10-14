# SSI iBoard Market Data Provider

**Status:** Documented — implement REST adapter in Phase 2. Phase 1 uses mock provider.

## Endpoint

```
GET https://iboard-api.ssi.com.vn/statistics/charts/history
```

### Query parameters

| Parameter  | Value           | Notes                          |
|------------|-----------------|--------------------------------|
| resolution | `1D`            | Daily candles                  |
| symbol     | `ACB`, `MBB`…   | Vietnamese stock ticker        |
| from       | Unix timestamp  | Epoch seconds (inclusive)      |
| to         | Unix timestamp  | Epoch seconds (inclusive)      |

### Required request headers

```
accept: application/json, text/plain, */*
origin: https://iboard.ssi.com.vn
referer: https://iboard.ssi.com.vn/
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36
```

No API key required — this is a public endpoint used by the SSI iBoard web app.

## Sample response

```json
{
  "code": "SUCCESS",
  "message": "Get chart history data success",
  "data": {
    "t": [1771804800, 1771891200],
    "c": [20.72, 20.68],
    "o": [20.68, 20.76],
    "h": [20.76, 20.76],
    "l": [20.55, 20.68],
    "v": [11535400, 13798400],
    "s": "ok",
    "nextTime": null
  },
  "status": "ok"
}
```

## Normalization rules (to implement in Phase 2)

1. **Timestamps:** `data.t[i]` is Unix epoch seconds in `Asia/Ho_Chi_Minh` — convert to ISO 8601 string preserving the local date.
2. **Prices:** Values are in thousands of VND (e.g. `20.72` = 20,720 VND). Store the raw value; document the unit in the API response `dataSource.priceUnit = "thousands_vnd"`.
3. **Pagination:** If `data.nextTime` is not null, issue another request with `from=nextTime` to fetch earlier candles.
4. **OHLCV arrays:** All arrays are parallel — index `i` corresponds to the same candle across all fields.
5. **Sort:** Sort ascending by timestamp after fetching.
6. **Validation:**
   - `high >= open, close, low` for each candle
   - `low <= open, close, high`
   - `volume >= 0`
   - Reject candles with any NaN/null numeric field
7. **Deduplication:** Use unique constraint `(symbol, timeframe, timestamp, provider)` on storage.
8. **Error codes:** Check `data.s === "ok"` and `code === "SUCCESS"`. Any other value is an error.

## Environment variables (Phase 2)

```env
MARKET_DATA_PROVIDER=rest
MARKET_DATA_BASE_URL=https://iboard-api.ssi.com.vn
# No API key needed — leave blank
MARKET_DATA_API_KEY=
```

## Rate limits

Unknown — this is an undocumented public API. Implement request throttling and respect 429 responses. Start with no more than 1 request/second per symbol.
