const express = require('express');

const router = express.Router();

router.post('/analyze', async (req, res) => {

  try {

    const {
      platform,
      spend,
      revenue,
      clicks,
      conversions
    } = req.body;

    const roas = revenue / spend;

    const ctr = (clicks / 10000) * 100;

    let insights = [];
    let recommendations = [];

if (roas < 2) {
  recommendations.push(
    'Pause low-performing campaigns and improve ad creatives.'
  );
}

if (ctr < 1) {
  recommendations.push(
    'Use stronger headlines and short-form videos to improve engagement.'
  );
}

if (conversions < 50) {
  recommendations.push(
    'Improve landing pages to increase customer conversions.'
  );
}

if (spend > 5000 && roas > 4) {
  recommendations.push(
    'Increase budget on high-performing campaigns to maximize revenue.'
  );
}

recommendations.push(
  'Focus more budget on Instagram Reels campaigns.'
);

recommendations.push(
  'Retarget existing website visitors for better ROAS.'
);

    if (roas > 4) {
      insights.push(
        `Excellent performance detected. Your ${platform} campaigns generated strong profit returns.`
      );
    }

    if (ctr > 2) {
      insights.push(
        `Audience engagement is performing above average this month.`
      );
    }

    if (conversions > 100) {
      insights.push(
        `Campaigns are generating a high number of customer conversions.`
      );
    }

    if (spend > 5000) {
      insights.push(
        `Higher advertising investment is helping increase campaign reach.`
      );
    }

    insights.push(
      `Business revenue reached $${revenue} this month.`
    );

    res.json({
  success: true,
  summary: {
    spend,
    revenue,
    roas,
    clicks,
    conversions,
    ctr
  },
  insights,
  recommendations
});

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: 'Analysis failed'
    });

  }

});

module.exports = router;