function generateInsight(data) {

  let insights = [];

  // ROAS Performance
  if (data.roas > 3) {

    insights.push(
      `Your ROAS improved by ${data.roasIncrease}% compared to last month.`
    );

  }

  // CTR Analysis
  if (data.ctr < 1) {

    insights.push(
      'Ads may need stronger creatives or audience targeting.'
    );

  }

  // Platform Comparison
  if (data.instagramROAS > data.facebookROAS) {

    insights.push(
      'Instagram campaigns are outperforming Facebook Feed ads.'
    );

  }

  // Lead Quality
  if (data.weekendLeads > data.weekdayLeads) {

    insights.push(
      'Weekend campaigns produced higher-quality leads.'
    );

  }

  // Cost Efficiency
  if (data.currentCPL < data.previousCPL) {

    const improvement =
      (
        (data.previousCPL - data.currentCPL)
        / data.previousCPL
      ) * 100;

    insights.push(
      `Your Ahmedabad campaign generated ${improvement.toFixed(0)}% cheaper leads this week.`
    );

  }

  // Revenue Growth
  if (data.revenue > 10000) {

    insights.push(
      'Revenue growth is performing very strongly this month.'
    );

  }

  // Conversion Drop
  if (
    data.spendIncrease > 20 &&
    data.conversionDrop > 10
  ) {

    insights.push(
      'Campaign spend increased but conversions dropped. Optimization is recommended.'
    );

  }

  return insights;
}

module.exports = generateInsight;