import React, { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { TrendingUp, Update } from '@mui/icons-material';
import currencyService, { Currency } from '../../services/currencyService';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  label?: string;
  disabled?: boolean;
  showRates?: boolean;
  baseCurrency?: string;
  error?: boolean;
  helperText?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  label = 'Currency',
  disabled = false,
  showRates = false,
  baseCurrency = 'USD',
  error = false,
  helperText
}) => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      
      // Load supported currencies
      const currenciesResponse = await currencyService.getSupportedCurrencies();
      
      if (showRates) {
        // Load exchange rates if needed
        const ratesResponse = await currencyService.getExchangeRates();
        const currenciesWithRates = currenciesResponse.data.map(currency => ({
          ...currency,
          rate: ratesResponse.data.rates[currency.code] || null
        }));
        setCurrencies(currenciesWithRates);
        setLastUpdated(ratesResponse.data.lastUpdated);
      } else {
        setCurrencies(currenciesResponse.data);
      }
    } catch (error) {
      console.error('Failed to load currencies:', error);
      // Fallback to default currencies
      setCurrencies([
        { code: 'USD', name: 'US Dollar', symbol: '$' },
        { code: 'EUR', name: 'Euro', symbol: '€' },
        { code: 'GBP', name: 'British Pound', symbol: '£' },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatExchangeRate = (rate: number, code: string) => {
    if (code === baseCurrency) return '1.0000';
    return rate.toFixed(4);
  };

  const getCurrencyDisplay = (currency: Currency) => {
    return `${currency.symbol} ${currency.code} - ${currency.name}`;
  };

  const renderMenuItem = (currency: Currency) => (
    <MenuItem key={currency.code} value={currency.code}>
      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography variant="body1" component="span" sx={{ mr: 1, fontWeight: 'bold' }}>
            {currency.symbol}
          </Typography>
          <Typography variant="body1" component="span" sx={{ mr: 1 }}>
            {currency.code}
          </Typography>
          <Typography variant="body2" color="textSecondary" component="span">
            {currency.name}
          </Typography>
        </Box>
        {showRates && currency.rate && currency.code !== baseCurrency && (
          <Chip
            size="small"
            label={formatExchangeRate(currency.rate, currency.code)}
            color="primary"
            variant="outlined"
            icon={<TrendingUp />}
          />
        )}
      </Box>
    </MenuItem>
  );

  const renderValue = (selectedValue: string) => {
    const selectedCurrency = currencies.find(c => c.code === selectedValue);
    if (!selectedCurrency) return selectedValue;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="body1" component="span" sx={{ mr: 1, fontWeight: 'bold' }}>
          {selectedCurrency.symbol}
        </Typography>
        <Typography variant="body1" component="span">
          {selectedCurrency.code}
        </Typography>
        {showRates && selectedCurrency.rate && selectedCurrency.code !== baseCurrency && (
          <Chip
            size="small"
            label={formatExchangeRate(selectedCurrency.rate, selectedCurrency.code)}
            color="primary"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <FormControl fullWidth disabled={disabled} error={error}>
        <InputLabel>{label}</InputLabel>
        <Select
          value=""
          label={label}
          endAdornment={<CircularProgress size={20} />}
        >
          <MenuItem value="">Loading...</MenuItem>
        </Select>
      </FormControl>
    );
  }

  return (
    <Box>
      <FormControl fullWidth disabled={disabled} error={error}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          label={label}
          onChange={(e) => onChange(e.target.value)}
          renderValue={renderValue}
          MenuProps={{
            PaperProps: {
              sx: { maxHeight: 300 }
            }
          }}
        >
          {currencies.map(renderMenuItem)}
        </Select>
        {helperText && (
          <Typography variant="caption" color={error ? 'error' : 'textSecondary'} sx={{ mt: 0.5, ml: 1 }}>
            {helperText}
          </Typography>
        )}
      </FormControl>
      
      {showRates && lastUpdated && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Update fontSize="small" color="action" />
          <Typography variant="caption" color="textSecondary" sx={{ ml: 0.5 }}>
            Exchange rates updated: {new Date(lastUpdated).toLocaleString()}
            {baseCurrency !== 'USD' && ` (Base: ${baseCurrency})`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default CurrencySelector;