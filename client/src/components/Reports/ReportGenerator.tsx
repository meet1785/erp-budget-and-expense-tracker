import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Card,
  CardContent,
  CardActions,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Download,
  PictureAsPdf,
  Assessment,
  DateRange,
  Category,
  Business,
  Person,
  Money,
  FilterList,
  Refresh,
} from '@mui/icons-material';
import moment from 'moment';
import reportService, { ReportFilters, ReportType } from '../../services/reportService';
import CurrencySelector from '../Currency/CurrencySelector';
import toast from 'react-hot-toast';

interface ReportGeneratorProps {
  onReportGenerated?: (report: any) => void;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  onReportGenerated
}) => {
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    currency: 'USD'
  });
  const [loading, setLoading] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filterPresets] = useState(reportService.getFilterPresets());

  useEffect(() => {
    loadReportTypes();
  }, []);

  const loadReportTypes = async () => {
    try {
      const response = await reportService.getReportTypes();
      setReportTypes(response.data);
      if (response.data.length > 0) {
        setSelectedReportType(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to load report types:', error);
      toast.error('Failed to load report types');
    }
  };

  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyPreset = (preset: any) => {
    setFilters(prev => ({
      ...prev,
      startDate: preset.startDate,
      endDate: preset.endDate
    }));
  };

  const generateReport = async () => {
    if (!selectedReportType) {
      toast.error('Please select a report type');
      return;
    }

    const validationErrors = reportService.validateFilters(filters);
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join('\n'));
      return;
    }

    setLoading(true);
    setReportResult(null);

    try {
      let response;
      switch (selectedReportType) {
        case 'expenses':
          response = await reportService.generateExpenseReport(filters);
          break;
        case 'budgets':
          response = await reportService.generateBudgetReport(filters);
          break;
        case 'financial':
          response = await reportService.generateFinancialReport(filters);
          break;
        default:
          throw new Error('Invalid report type');
      }

      setReportResult(response.data);
      onReportGenerated?.(response.data);
      toast.success('Report generated successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate report';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    if (!reportResult) return;

    try {
      const selectedReport = reportTypes.find(rt => rt.id === selectedReportType);
      const filename = `${selectedReport?.name.toLowerCase().replace(/\s+/g, '-')}-${moment().format('YYYY-MM-DD')}.pdf`;
      
      await reportService.downloadAndSaveReport(reportResult.filename, filename);
      toast.success('Report downloaded successfully!');
    } catch (error: any) {
      toast.error('Failed to download report');
    }
  };

  const getReportIcon = (reportType: string) => {
    switch (reportType) {
      case 'expenses':
        return <Money />;
      case 'budgets':
        return <Assessment />;
      case 'financial':
        return <Business />;
      default:
        return <PictureAsPdf />;
    }
  };

  const selectedReport = reportTypes.find(rt => rt.id === selectedReportType);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        📊 Report Generator
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Generate comprehensive reports for expenses, budgets, and financial analysis
      </Typography>

      <Grid container spacing={3}>
        {/* Report Type Selection */}
        <Grid xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Report Type
            </Typography>
            <Grid container spacing={2}>
              {reportTypes.map((reportType) => (
                <Grid xs={12} sm={6} md={4} key={reportType.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedReportType === reportType.id ? 2 : 1,
                      borderColor: selectedReportType === reportType.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                        elevation: 4
                      }
                    }}
                    onClick={() => setSelectedReportType(reportType.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getReportIcon(reportType.id)}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {reportType.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {reportType.description}
                      </Typography>
                      <Chip
                        size="small"
                        label={`Requires ${reportType.requiredRole} role`}
                        color="primary"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Filters */}
        <Grid xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <FilterList sx={{ mr: 1 }} />
              <Typography variant="h6">
                Report Filters
              </Typography>
            </Box>

            {/* Quick Presets */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quick Date Presets:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(filterPresets).map(([key, preset]) => (
                  <Chip
                    key={key}
                    label={preset.name}
                    onClick={() => applyPreset(preset)}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* Date Range */}
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Currency */}
              <Grid xs={12} sm={6}>
                <CurrencySelector
                  value={filters.currency || 'USD'}
                  onChange={(currency) => handleFilterChange('currency', currency)}
                  label="Report Currency"
                  showRates
                />
              </Grid>

              {/* Category Filter */}
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Category (Optional)"
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  placeholder="Leave empty for all categories"
                />
              </Grid>

              {/* Status Filter */}
              <Grid xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status (Optional)</InputLabel>
                  <Select
                    value={filters.status || ''}
                    label="Status (Optional)"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                    <MenuItem value="reimbursed">Reimbursed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Department Filter */}
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department (Optional)"
                  value={filters.department || ''}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  placeholder="Leave empty for all departments"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Generate Button */}
        <Grid xs={12}>
          <Box sx={{ textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={generateReport}
              disabled={loading || !selectedReportType}
              startIcon={loading ? <CircularProgress size={20} /> : <Assessment />}
              sx={{ px: 4, py: 1.5 }}
            >
              {loading ? 'Generating Report...' : 'Generate Report'}
            </Button>
          </Box>
        </Grid>

        {/* Report Result */}
        {reportResult && (
          <Grid xs={12}>
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📄 Report Generated Successfully
              </Typography>
              
              <Alert severity="success" sx={{ mb: 3 }}>
                Your {selectedReport?.name} has been generated successfully!
              </Alert>

              <Grid container spacing={2} alignItems="center">
                <Grid xs={12} sm={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <PictureAsPdf color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Report Details"
                        secondary={
                          <Box>
                            <Typography variant="body2">
                              Size: {reportService.formatFileSize(reportResult.fileSize)}
                            </Typography>
                            {reportResult.recordCount && (
                              <Typography variant="body2">
                                Records: {reportResult.recordCount}
                              </Typography>
                            )}
                            {reportResult.expenseCount && (
                              <Typography variant="body2">
                                Expenses: {reportResult.expenseCount}
                              </Typography>
                            )}
                            {reportResult.budgetCount && (
                              <Typography variant="body2">
                                Budgets: {reportResult.budgetCount}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </List>
                </Grid>
                
                <Grid xs={12} sm={6}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      onClick={downloadReport}
                      size="large"
                    >
                      Download PDF
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => setShowPreview(true)}
                      size="large"
                    >
                      Preview
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Preview Dialog */}
      <Dialog
        open={showPreview}
        onClose={() => setShowPreview(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Report Preview
        </DialogTitle>
        <DialogContent>
          <Alert severity="info">
            PDF preview will be available in a future update. 
            Please download the report to view it.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreview(false)}>
            Close
          </Button>
          <Button variant="contained" onClick={downloadReport}>
            Download Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReportGenerator;