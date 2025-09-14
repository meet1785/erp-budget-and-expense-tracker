import api from './api';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate?: number;
}

export interface ExchangeRates {
  rates: Record<string, number>;
  baseCurrency: string;
  lastUpdated: string;
  source: string;
}

export interface CurrencyConversion {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  targetCurrency: string;
  exchangeRate: number;
  formattedOriginal: string;
  formattedConverted: string;
}

class CurrencyService {
  // Get supported currencies
  async getSupportedCurrencies(): Promise<{ success: boolean; data: Currency[] }> {
    const response = await api.get('/currency/supported');
    return response.data;
  }

  // Get current exchange rates
  async getExchangeRates(forceRefresh = false): Promise<{ success: boolean; data: ExchangeRates }> {
    const response = await api.get('/currency/rates', {
      params: { forceRefresh }
    });
    return response.data;
  }

  // Convert currency amount
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<{ success: boolean; data: CurrencyConversion }> {
    const response = await api.post('/currency/convert', {
      amount,
      fromCurrency,
      toCurrency
    });
    return response.data;
  }

  // Get exchange rate between two currencies
  async getExchangeRate(fromCurrency: string, toCurrency: string) {
    const response = await api.get(`/currency/rate/${fromCurrency}/${toCurrency}`);
    return response.data;
  }

  // Format currency amount
  async formatCurrency(amount: number, currency: string, locale = 'en-US') {
    const response = await api.post('/currency/format', {
      amount,
      currency,
      locale
    });
    return response.data;
  }

  // Bulk convert multiple amounts
  async bulkConvert(conversions: Array<{ amount: number; fromCurrency: string; id?: string }>, targetCurrency: string) {
    const response = await api.post('/currency/convert/bulk', {
      conversions,
      targetCurrency
    });
    return response.data;
  }

  // Client-side currency formatting (faster for UI)
  formatCurrencyClient(amount: number, currencyCode: string, locale = 'en-US'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback formatting
      const symbols: Record<string, string> = {
        USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$',
        AUD: 'A$', CHF: 'CHF', CNY: '¥', INR: '₹', BRL: 'R$'
      };
      const symbol = symbols[currencyCode] || currencyCode;
      return `${symbol}${amount.toFixed(2)}`;
    }
  }

  // Get currency symbol
  getCurrencySymbol(currencyCode: string): string {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', JPY: '¥', CAD: 'C$',
      AUD: 'A$', CHF: 'CHF', CNY: '¥', INR: '₹', BRL: 'R$'
    };
    return symbols[currencyCode] || currencyCode;
  }

  // Get currency name
  getCurrencyName(currencyCode: string): string {
    const names: Record<string, string> = {
      USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
      CAD: 'Canadian Dollar', AUD: 'Australian Dollar', CHF: 'Swiss Franc',
      CNY: 'Chinese Yuan', INR: 'Indian Rupee', BRL: 'Brazilian Real'
    };
    return names[currencyCode] || currencyCode;
  }

  // Check if currency is supported
  isValidCurrency(currencyCode: string): boolean {
    const supportedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
    return supportedCurrencies.includes(currencyCode);
  }

  // Get default currency (from user preferences or system default)
  getDefaultCurrency(): string {
    return localStorage.getItem('defaultCurrency') || 'USD';
  }

  // Set default currency
  setDefaultCurrency(currencyCode: string): void {
    localStorage.setItem('defaultCurrency', currencyCode);
  }
}

export default new CurrencyService();