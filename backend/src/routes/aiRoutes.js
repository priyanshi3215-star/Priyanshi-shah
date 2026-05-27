const express = require('express');

const router = express.Router();

const generateInsight = require('../services/aiInsights');

router.post('/insights', (req, res) => {

  const data = req.body;

  const insights = generateInsight(data);

  res.json({
    insights
  });

});

module.exports = router;