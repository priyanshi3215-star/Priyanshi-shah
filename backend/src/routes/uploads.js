const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const db = require('../db');
const { authenticate } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {

    const dir = path.join(__dirname, '../../data/uploads');

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    cb(null, dir);

  },

  filename: (req, file, cb) => {

    const unique =
      `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    cb(
      null,
      `${unique}${path.extname(file.originalname)}`
    );

  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 50 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const allowed = [
      '.csv',
      '.xlsx',
      '.xls',
      '.pdf',
      '.png',
      '.jpg',
      '.jpeg'
    ];

    const ext =
      path.extname(file.originalname).toLowerCase();

    cb(null, allowed.includes(ext));

  },
});

router.use(authenticate);


// ===============================
// FILE UPLOAD
// ===============================

router.post(
  '/',
  upload.single('file'),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          error: 'No file uploaded'
        });

      }

      const {
        clientId,
        platform
      } = req.body;

      if (!clientId) {

        return res.status(400).json({
          error: 'Client ID required'
        });

      }

      const filePath = req.file.path;

      const rows = [];

      fs.createReadStream(filePath)

        .pipe(csv())

        .on('data', (data) => {

          rows.push(data);

        })

        .on('end', async () => {

          try {

            let totalSpend = 0;

            let totalClicks = 0;

            let totalImpressions = 0;

            let totalLeads = 0;

            let totalRevenue = 0;

            let campaignInsights = [];

            let recommendations = [];

            // ===============================
            // LOOP THROUGH EACH CAMPAIGN
            // ===============================

            for (const row of rows) {

              const spend = parseFloat(
                row['Amount spent (INR)'] || 0
              );

              const clicks = parseFloat(
                row['Link clicks'] || 0
              );

              const impressions = parseFloat(
                row['Impressions'] || 0
              );

              const leads = parseFloat(
                row['Leads'] || 0
              );

              const ctr = parseFloat(
                row['CTR (all)'] || 0
              );

              const revenue = parseFloat(
                row['Website purchases conversion value'] || 0
              );

              const campaignName =
                row['Campaign name'] || 'Unknown Campaign';

              const roas =
                spend > 0
                  ? revenue / spend
                  : 0;

              const cpc =
                clicks > 0
                  ? spend / clicks
                  : 0;

              const cpa =
                leads > 0
                  ? spend / leads
                  : 0;

              totalSpend += spend;

              totalClicks += clicks;

              totalImpressions += impressions;

              totalLeads += leads;

              totalRevenue += revenue;

              // ===============================
              // SAVE CAMPAIGN
              // ===============================

              let campaignId = null;

              const campaignResult =
                await db.query(

                  `INSERT INTO campaigns
                  (client_id, name, platform)
                  VALUES ($1,$2,$3)
                  ON CONFLICT DO NOTHING
                  RETURNING id`,

                  [
                    clientId,
                    campaignName,
                    platform || 'meta'
                  ]
                );

              if (campaignResult.rows.length) {

                campaignId =
                  campaignResult.rows[0].id;

              } else {

                const existing =
                  await db.query(

                    `SELECT id
                    FROM campaigns
                    WHERE client_id=$1
                    AND name=$2`,

                    [clientId, campaignName]
                  );

                campaignId =
                  existing.rows[0]?.id;

              }

              // ===============================
              // STORE PERFORMANCE DATA
              // ===============================

              await db.query(

                `INSERT INTO performance_data
                (
                  client_id,
                  campaign_id,
                  platform,
                  report_month,
                  spend,
                  impressions,
                  clicks,
                  ctr,
                  cpc,
                  conversions,
                  cpa,
                  roas,
                  revenue,
                  reach,
                  raw_data
                )

                VALUES
                (
                  $1,$2,$3,$4,
                  $5,$6,$7,$8,$9,
                  $10,$11,$12,$13,
                  $14,$15
                )`,

                [
                  clientId,
                  campaignId,
                  platform || 'meta',
                  new Date(),

                  spend,
                  impressions,
                  clicks,
                  ctr,
                  cpc,

                  leads,
                  cpa,
                  roas,

                  revenue,

                  impressions,

                  JSON.stringify(row)
                ]
              );

              // ===============================
              // BUSINESS INSIGHTS
              // ===============================

              if (roas > 4) {

                campaignInsights.push(
                  `${campaignName} generated excellent profit returns.`
                );

              }

              if (ctr > 2) {

                campaignInsights.push(
                  `${campaignName} achieved strong audience engagement.`
                );

              }

              if (ctr < 1) {

                campaignInsights.push(
                  `${campaignName} has low audience engagement.`
                );

              }

              if (spend > 3000 && leads < 5) {

                campaignInsights.push(
                  `${campaignName} is overspending with weak lead generation.`
                );

              }

              if (leads > 20) {

                campaignInsights.push(
                  `${campaignName} generated high-quality customer leads.`
                );

              }

              // ===============================
              // RECOMMENDATIONS
              // ===============================

              if (roas < 2) {

                recommendations.push(
                  `Improve targeting for ${campaignName} to increase ROAS.`
                );

              }

              if (ctr < 1) {

                recommendations.push(
                  `Improve creatives and headlines for ${campaignName}.`
                );

              }

              if (cpa > 300) {

                recommendations.push(
                  `${campaignName} has high cost per acquisition. Refine audience targeting.`
                );

              }

              if (roas > 4 && leads > 20) {

                recommendations.push(
                  `${campaignName} is performing strongly. Consider increasing budget.`
                );

              }

            }

            // ===============================
            // OVERALL METRICS
            // ===============================

            const overallCTR =
              totalImpressions > 0
                ? (totalClicks / totalImpressions) * 100
                : 0;

            const overallROAS =
              totalSpend > 0
                ? totalRevenue / totalSpend
                : 0;

            const overallCPA =
              totalLeads > 0
                ? totalSpend / totalLeads
                : 0;

            // ===============================
            // RESPONSE
            // ===============================

            res.json({

              success: true,

              message:
                'Marketing report analyzed successfully',

              summary: {

                spend: totalSpend,

                clicks: totalClicks,

                impressions: totalImpressions,

                conversions: totalLeads,

                revenue: totalRevenue,

                ctr: overallCTR,

                roas: overallROAS,

                cpa: overallCPA

              },

              insights: campaignInsights,

              recommendations

            });

          } catch (error) {

            console.log(error);

            res.status(500).json({
              error: 'Processing failed'
            });

          }

        });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        error: 'Upload failed'
      });

    }

  }
);

module.exports = router;