import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Card,
  CardContent,
  Alert,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  SwapHoriz,
  Refresh,
  ExpandMore,
  ExpandLess,
  TrendingUp,
} from '@mui/icons-material';
import CurrencySelector from './CurrencySelector';
import currencyService from '../../services/currencyService';
import toast from 'react-hot-toast';

interface CurrencyConverterProps {
  defaultFromCurrency?: string;
  defaultToCurrency?: string;
  defaultAmount?: number;
  onConversionComplete?: (result: any) => void;
  compact?: boolean;
}

const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  defaultFromCurrency = 'USD',
  defaultToCurrency = 'EUR',
  defaultAmount = 100,
  onConversionComplete,
  compact = false
}) => {
  const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency);
  const [toCurrency, setToCurrency] = useState(defaultToCurrency);
  const [amount, setAmount] = useState(defaultAmount.toString());
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showDetails, setShowDetails] = useState(!compact);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      handleConvert();
    }
  }, [fromCurrency, toCurrency]);

  const handleConvert = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await currencyService.convertCurrency(
        numAmount,
        fromCurrency,
        toCurrency
      );

      setResult(response.data);
      onConversionComplete?.(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Conversion failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleRefresh = () => {
    handleConvert();
  };

  const formatAmount = (value: number, currency: string) => {
    return currencyService.formatCurrencyClient(value, currency);
  };

  const getExchangeRateDirection = () => {
    if (!result) return '';
    const rate = result.exchangeRate;
    return `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`;
  };

  const getInverseRate = () => {
    if (!result) return '';
    const inverseRate = 1 / result.exchangeRate;
    return `1 ${toCurrency} = ${inverseRate.toFixed(4)} ${fromCurrency}`;
  };

  if (compact) {
    return (
      <Card elevation={1}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Currency Converter
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid xs={12} sm={4}>
              <TextField
                fullWidth
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                size="small"
                error={!!error}
              />
            </Grid>
            
            <Grid xs={12} sm={3}>
              <CurrencySelector
                value={fromCurrency}
                onChange={setFromCurrency}
                label="From"
              />
            </Grid>
            
            <Grid xs={12} sm={1} sx={{ textAlign: 'center' }}>
              <IconButton onClick={handleSwapCurrencies} size="small">
                <SwapHoriz />
              </IconButton>
            </Grid>
            
            <Grid xs={12} sm={3}>
              <CurrencySelector
                value={toCurrency}
                onChange={setToCurrency}
                label="To"
              />
            </Grid>
            
            <Grid xs={12} sm={1}>
              <Button
                variant="contained"
                onClick={handleConvert}
                disabled={loading}
                size="small"
                fullWidth
              >
                {loading ? '...' : 'Convert'}
              </Button>
            </Grid>
          </Grid>

          {result && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="h6" color="primary.contrastText">
                {formatAmount(result.originalAmount, result.originalCurrency)} = {' '}
                {formatAmount(result.convertedAmount, result.targetCurrency)}
              </Typography>
              <Typography variant="caption" color="primary.contrastText">
                {getExchangeRateDirection()}
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Currency Converter
        </Typography>
        <IconButton onClick={handleRefresh} disabled={loading}>
          <Refresh />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {/* Amount Input */}
        <Grid xs={12}>
          <TextField
            fullWidth
            label="Amount to Convert"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputProps={{ min: 0, step: 0.01 }}
            error={!!error}
            helperText={error}
          />
        </Grid>

        {/* From Currency */}
        <Grid xs={12} md={5}>
          <CurrencySelector
            value={fromCurrency}
            onChange={setFromCurrency}
            label="From Currency"
            showRates
          />
        </Grid>

        {/* Swap Button */}
        <Grid xs={12} md={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={handleSwapCurrencies}
            startIcon={<SwapHoriz />}
            fullWidth
          >
            Swap
          </Button>
        </Grid>

        {/* To Currency */}
        <Grid xs={12} md={5}>
          <CurrencySelector
            value={toCurrency}
            onChange={setToCurrency}
            label="To Currency"
            showRates
          />
        </Grid>

        {/* Convert Button */}
        <Grid xs={12}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleConvert}
            disabled={loading || !amount || parseFloat(amount) <= 0}
            sx={{ py: 1.5 }}
          >
            {loading ? 'Converting...' : 'Convert Currency'}
          </Button>
        </Grid>
      </Grid>

      {/* Conversion Result */}
      {result && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Typography variant="h4" align="center" gutterBottom>
                {result.formattedOriginal} = {result.formattedConverted}
              </Typography>
              
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <Typography variant="body1">
                  {getExchangeRateDirection()}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {getInverseRate()}
                </Typography>
              </Box>

              {/* Expandable Details */}
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  onClick={() => setShowDetails(!showDetails)}
                  endIcon={showDetails ? <ExpandLess /> : <ExpandMore />}
                  sx={{ color: 'inherit' }}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              </Box>

              <Collapse in={showDetails}>
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                  <Grid container spacing={2}>
                    <Grid xs={6}>
                      <Typography variant="body2">
                        <strong>Original Amount:</strong><br />
                        {result.originalAmount} {result.originalCurrency}
                      </Typography>
                    </Grid>
                    <Grid xs={6}>
                      <Typography variant="body2">
                        <strong>Converted Amount:</strong><br />
                        {result.convertedAmount} {result.targetCurrency}
                      </Typography>
                    </Grid>
                    <Grid xs={6}>
                      <Typography variant="body2">
                        <strong>Exchange Rate:</strong><br />
                        {result.exchangeRate.toFixed(6)}
                      </Typography>
                    </Grid>
                    <Grid xs={6}>
                      <Typography variant="body2">
                        <strong>Inverse Rate:</strong><br />
                        {(1 / result.exchangeRate).toFixed(6)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        </Box>
      )}

      {error && !result && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default CurrencyConverter;