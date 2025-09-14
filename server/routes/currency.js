const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSupportedCurrencies,
  getExchangeRates,
  convertCurrency,
  formatCurrency,
  getExchangeRate
} = require('../utils/currencyService');

// @desc    Get all supported currencies
// @route   GET /api/currency/supported
// @access  Private
router.get('/supported', protect, async (req, res) => {
  try {
    const currencies = getSupportedCurrencies();
    
    res.json({
      success: true,
      message: 'Supported currencies retrieved successfully',
      data: currencies
    });
  } catch (error) {
    console.error('Error getting supported currencies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported currencies',
      error: error.message
    });
  }
});

// @desc    Get current exchange rates
// @route   GET /api/currency/rates
// @access  Private
router.get('/rates', protect, async (req, res) => {
  try {
    const { base, forceRefresh } = req.query;
    const rates = await getExchangeRates(forceRefresh === 'true');
    
    res.json({
      success: true,
      message: 'Exchange rates retrieved successfully',
      data: {
        rates: rates.rates,
        baseCurrency: rates.baseCurrency,
        lastUpdated: rates.lastUpdated,
        source: rates.source
      }
    });
  } catch (error) {
    console.error('Error getting exchange rates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exchange rates',
      error: error.message
    });
  }
});

// @desc    Convert currency amount
// @route   POST /api/currency/convert
// @access  Private
router.post('/convert', protect, async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    // Validation
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Amount, fromCurrency, and toCurrency are required'
      });
    }

    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency);
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency);

    res.json({
      success: true,
      message: 'Currency conversion completed successfully',
      data: {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount,
        targetCurrency: toCurrency,
        exchangeRate,
        formattedOriginal: formatCurrency(amount, fromCurrency),
        formattedConverted: formatCurrency(convertedAmount, toCurrency)
      }
    });
  } catch (error) {
    console.error('Error converting currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to convert currency',
      error: error.message
    });
  }
});

// @desc    Get exchange rate between two currencies
// @route   GET /api/currency/rate/:from/:to
// @access  Private
router.get('/rate/:from/:to', protect, async (req, res) => {
  try {
    const { from, to } = req.params;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Both from and to currencies are required'
      });
    }

    const exchangeRate = await getExchangeRate(from.toUpperCase(), to.toUpperCase());

    res.json({
      success: true,
      message: 'Exchange rate retrieved successfully',
      data: {
        fromCurrency: from.toUpperCase(),
        toCurrency: to.toUpperCase(),
        exchangeRate,
        inverseRate: 1 / exchangeRate,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get exchange rate',
      error: error.message
    });
  }
});

// @desc    Format currency amount
// @route   POST /api/currency/format
// @access  Private
router.post('/format', protect, (req, res) => {
  try {
    const { amount, currency, locale = 'en-US' } = req.body;

    if (!amount || !currency) {
      return res.status(400).json({
        success: false,
        message: 'Amount and currency are required'
      });
    }

    if (isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid number'
      });
    }

    const formattedAmount = formatCurrency(parseFloat(amount), currency, locale);

    res.json({
      success: true,
      message: 'Currency formatted successfully',
      data: {
        originalAmount: amount,
        currency,
        locale,
        formattedAmount
      }
    });
  } catch (error) {
    console.error('Error formatting currency:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to format currency',
      error: error.message
    });
  }
});

// @desc    Bulk convert multiple amounts
// @route   POST /api/currency/convert/bulk
// @access  Private
router.post('/convert/bulk', protect, async (req, res) => {
  try {
    const { conversions, targetCurrency } = req.body;

    if (!conversions || !Array.isArray(conversions)) {
      return res.status(400).json({
        success: false,
        message: 'Conversions array is required'
      });
    }

    if (!targetCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Target currency is required'
      });
    }

    const results = await Promise.all(
      conversions.map(async (conversion, index) => {
        try {
          const { amount, fromCurrency, id } = conversion;

          if (!amount || !fromCurrency) {
            throw new Error('Amount and fromCurrency are required for each conversion');
          }

          const convertedAmount = await convertCurrency(amount, fromCurrency, targetCurrency);
          const exchangeRate = await getExchangeRate(fromCurrency, targetCurrency);

          return {
            id: id || index,
            success: true,
            originalAmount: amount,
            originalCurrency: fromCurrency,
            convertedAmount,
            targetCurrency,
            exchangeRate,
            formattedOriginal: formatCurrency(amount, fromCurrency),
            formattedConverted: formatCurrency(convertedAmount, targetCurrency)
          };
        } catch (error) {
          return {
            id: conversion.id || index,
            success: false,
            error: error.message,
            originalAmount: conversion.amount,
            originalCurrency: conversion.fromCurrency
          };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      message: `Bulk conversion completed: ${successCount} successful, ${errorCount} failed`,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          failed: errorCount,
          targetCurrency
        }
      }
    });
  } catch (error) {
    console.error('Error in bulk currency conversion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform bulk currency conversion',
      error: error.message
    });
  }
});

// @desc    Get currency conversion history (for analytics)
// @route   GET /api/currency/history
// @access  Private (Admin only)
router.get('/history', protect, authorize('admin'), async (req, res) => {
  try {
    // This would typically fetch from a conversion history collection
    // For now, we'll return sample data structure
    res.json({
      success: true,
      message: 'Currency conversion history retrieved successfully',
      data: {
        message: 'Currency conversion history feature is planned for future implementation',
        suggestion: 'Consider implementing a ConversionHistory model to track currency conversions'
      }
    });
  } catch (error) {
    console.error('Error getting currency history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get currency history',
      error: error.message
    });
  }
});

module.exports = router;