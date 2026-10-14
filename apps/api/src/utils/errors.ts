export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class InvalidSymbolError extends AppError {
  constructor(symbol: string) {
    super('INVALID_SYMBOL', `Invalid stock symbol: ${symbol}`, 400);
  }
}

export class ProviderTimeoutError extends AppError {
  constructor() {
    super('PROVIDER_TIMEOUT', 'Market data provider timed out', 503);
  }
}

export class InsufficientDataError extends AppError {
  constructor(required: number, available: number) {
    super(
      'INSUFFICIENT_DATA',
      `Insufficient historical data: need ${required} candles, got ${available}`,
      422,
    );
  }
}
