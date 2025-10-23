const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const recurringExpenseScheduler = require('../services/recurringExpenseScheduler');

// @desc    Get recurring expense scheduler status
// @route   GET /api/scheduler/status
// @access  Private/Admin
router.get('/status', protect, authorize('admin', 'manager'), (req, res) => {
  try {
    const status = recurringExpenseScheduler.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        description: 'Recurring expense scheduler status',
        schedule: 'Daily at 2:00 AM UTC'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
});

// @desc    Manually trigger recurring expense processing
// @route   POST /api/scheduler/trigger
// @access  Private/Admin
router.post('/trigger', protect, authorize('admin'), async (req, res) => {
  try {
    console.log(`🔧 Manual scheduler trigger requested by ${req.user.name} (${req.user.email})`);
    
    // Trigger processing asynchronously
    recurringExpenseScheduler.triggerManualRun()
      .catch(error => {
        console.error('Error in manual scheduler trigger:', error);
      });
    
    res.json({
      success: true,
      message: 'Recurring expense processing triggered successfully',
      data: {
        triggeredBy: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email
        },
        triggeredAt: new Date().toISOString(),
        note: 'Processing is running in the background. Check status endpoint for results.'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger recurring expense processing',
      error: error.message
    });
  }
});

// @desc    Stop recurring expense scheduler
// @route   POST /api/scheduler/stop
// @access  Private/Admin
router.post('/stop', protect, authorize('admin'), (req, res) => {
  try {
    if (!recurringExpenseScheduler.getStatus().isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Scheduler is not running'
      });
    }

    recurringExpenseScheduler.stop();
    
    res.json({
      success: true,
      message: 'Recurring expense scheduler stopped successfully',
      data: {
        stoppedBy: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email
        },
        stoppedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error.message
    });
  }
});

// @desc    Start recurring expense scheduler
// @route   POST /api/scheduler/start
// @access  Private/Admin
router.post('/start', protect, authorize('admin'), (req, res) => {
  try {
    if (recurringExpenseScheduler.getStatus().isRunning) {
      return res.status(400).json({
        success: false,
        message: 'Scheduler is already running'
      });
    }

    recurringExpenseScheduler.start();
    
    res.json({
      success: true,
      message: 'Recurring expense scheduler started successfully',
      data: {
        startedBy: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email
        },
        startedAt: new Date().toISOString(),
        status: recurringExpenseScheduler.getStatus()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
      error: error.message
    });
  }
});

module.exports = router;
