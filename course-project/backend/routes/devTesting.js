const express = require('express');
const router = express.Router();

// Simple mock endpoint for the frontend dev-testing page
router.get('/', (_req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not available in production' });
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    samples: [
      { id: 1, label: 'Primary Button', states: ['default', 'withIcon', 'outlined', 'disabled'] },
      { id: 2, label: 'Secondary Button', states: ['default', 'withIcon', 'disabled'] }
    ],
    symbols: [
      'Check Mark Symbol.svg',
      'Plus Symbol.svg',
      'Warning Symbol.svg'
    ],
    demoTransactions: [
      { id: 1, type: 'purchase', remark: 'good deal', amount: 20, promotionIds: [1], spent: 5 },
      { id: 2, type: 'transfer', remark: 'pizza', amount: -15, sender: 'abcd123', recipient: 'plmn0987' },
      { id: 3, type: 'redemption', amount: -20, suspicious: true, redeemed: true },
      { id: 4, type: 'adjustment', amount: 5, relatedId: 2 },
      { id: 5, type: 'event', amount: 10, relatedId: 3 }
    ]
  });
});

module.exports = router;