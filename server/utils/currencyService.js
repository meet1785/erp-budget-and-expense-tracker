const axios = require('axios');

// Default exchange rates (fallback)
const defaultRates = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.0,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  INR: 74.5,
  BRL: 5.2
};

// Supported currencies
const supportedCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' }
];

// Cache for exchange rates
let exchangeRatesCache = {
  rates: defaultRates,
  lastUpdated: null,
  baseCurrency: 'USD'
};

// Cache duration (1 hour)
const CACHE_DURATION = 60 * 60 * 1000;

// Get exchange rates from API
const fetchExchangeRates = async (baseCurrency = 'USD') => {
  try {
    const apiKey = process.env.CURRENCY_API_KEY;
    const apiUrl = process.env.CURRENCY_API_URL || 'https://api.exchangerate-api.com/v4/latest';
    
    let url = `${apiUrl}/${baseCurrency}`;
    if (apiKey) {
      url += `?access_key=${apiKey}`;
    }

    console.log(`Fetching exchange rates for base currency: ${baseCurrency}`);
    const response = await axios.get(url, { timeout: 5000 });
    
    if (response.data && response.data.rates) {
      return {
        rates: response.data.rates,
        baseCurrency,
        lastUpdated: new Date(),
        source: 'API'
      };
    } else {
      throw new Error('Invalid response format from currency API');
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates from API:', error.message);
    console.log('Using default exchange rates');
    
    return {
      rates: defaultRates,
      baseCurrency: 'USD',
      lastUpdated: new Date(),
      source: 'DEFAULT'
    };
  }
};

// Update exchange rates cache
const updateExchangeRates = async (baseCurrency = 'USD') => {
  try {
    const newRates = await fetchExchangeRates(baseCurrency);
    exchangeRatesCache = newRates;
    console.log(`✅ Exchange rates updated successfully (${newRates.source})`);
    return true;
  } catch (error) {
    console.error('❌ Failed to update exchange rates:', error);
    return false;
  }
};

// Get current exchange rates
const getExchangeRates = async (forceRefresh = false) => {
  try {
    const now = new Date();
    const cacheAge = exchangeRatesCache.lastUpdated 
      ? now - exchangeRatesCache.lastUpdated 
      : CACHE_DURATION + 1;

    // Update cache if it's old or force refresh is requested
    if (forceRefresh || cacheAge > CACHE_DURATION) {
      await updateExchangeRates();
    }

    return exchangeRatesCache;
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    return exchangeRatesCache; // Return cached rates even if update fails
  }
};

// Convert amount from one currency to another
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rates = await getExchangeRates();
    
    // Convert to base currency first (usually USD)
    let amountInBase = amount;
    if (fromCurrency !== rates.baseCurrency) {
      if (!rates.rates[fromCurrency]) {
        throw new Error(`Exchange rate not available for ${fromCurrency}`);
      }
      amountInBase = amount / rates.rates[fromCurrency];
    }

    // Convert from base currency to target currency
    let convertedAmount = amountInBase;
    if (toCurrency !== rates.baseCurrency) {
      if (!rates.rates[toCurrency]) {
        throw new Error(`Exchange rate not available for ${toCurrency}`);
      }
      convertedAmount = amountInBase * rates.rates[toCurrency];
    }

    return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw error;
  }
};

// Format currency amount with symbol
const formatCurrency = (amount, currencyCode = 'USD', locale = 'en-US') => {
  try {
    const currency = supportedCurrencies.find(c => c.code === currencyCode);
    
    if (!currency) {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }

    // Use Intl.NumberFormat for proper formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return formatter.format(amount);
  } catch (error) {
    console.error('Currency formatting error:', error);
    const currency = supportedCurrencies.find(c => c.code === currencyCode);
    const symbol = currency ? currency.symbol : currencyCode;
    return `${symbol}${amount.toFixed(2)}`;
  }
};

// Get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const currency = supportedCurrencies.find(c => c.code === currencyCode);
  return currency ? currency.symbol : currencyCode;
};

// Get currency name
const getCurrencyName = (currencyCode) => {
  const currency = supportedCurrencies.find(c => c.code === currencyCode);
  return currency ? currency.name : currencyCode;
};

// Validate currency code
const isValidCurrency = (currencyCode) => {
  return supportedCurrencies.some(c => c.code === currencyCode);
};

// Get all supported currencies
const getSupportedCurrencies = () => {
  return supportedCurrencies.map(currency => ({
    ...currency,
    rate: exchangeRatesCache.rates[currency.code] || null
  }));
};

// Convert expense amounts for multi-currency display
const convertExpenseAmounts = async (expenses, targetCurrency = 'USD') => {
  try {
    const convertedExpenses = await Promise.all(
      expenses.map(async (expense) => {
        if (expense.currency && expense.currency !== targetCurrency) {
          const convertedAmount = await convertCurrency(
            expense.amount, 
            expense.currency, 
            targetCurrency
          );
          
          return {
            ...expense.toObject ? expense.toObject() : expense,
            originalAmount: expense.amount,
            originalCurrency: expense.currency,
            convertedAmount,
            targetCurrency
          };
        }
        
        return {
          ...expense.toObject ? expense.toObject() : expense,
          convertedAmount: expense.amount,
          targetCurrency
        };
      })
    );

    return convertedExpenses;
  } catch (error) {
    console.error('Error converting expense amounts:', error);
    throw error;
  }
};

// Get exchange rate between two currencies
const getExchangeRate = async (fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rates = await getExchangeRates();
    
    // Both currencies relative to base
    const fromRate = fromCurrency === rates.baseCurrency ? 1 : rates.rates[fromCurrency];
    const toRate = toCurrency === rates.baseCurrency ? 1 : rates.rates[toCurrency];
    
    if (!fromRate || !toRate) {
      throw new Error(`Exchange rate not available for ${fromCurrency} to ${toCurrency}`);
    }

    return toRate / fromRate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    throw error;
  }
};

// Initialize currency service
const initializeCurrencyService = async () => {
  console.log('🌍 Initializing Currency Service...');
  await updateExchangeRates();
  
  // Set up periodic updates (every hour)
  setInterval(async () => {
    await updateExchangeRates();
  }, CACHE_DURATION);
  
  console.log('✅ Currency Service initialized successfully');
};

module.exports = {
  supportedCurrencies,
  getExchangeRates,
  convertCurrency,
  formatCurrency,
  getCurrencySymbol,
  getCurrencyName,
  isValidCurrency,
  getSupportedCurrencies,
  convertExpenseAmounts,
  getExchangeRate,
  initializeCurrencyService
};