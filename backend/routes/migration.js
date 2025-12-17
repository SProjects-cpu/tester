import express from 'express';
import prisma from '../utils/prisma.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Helper functions
function parseDate(dateString) {
  if (!dateString) return new Date();
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
}

function mapStage(stage) {
  const stageMap = {
    'S0': 'Onboarded',
    'S1': 'Onboarded',
    'S2': 'Onboarded',
    'S3': 'Onboarded',
    'Active': 'Onboarded',
    'Onboarded': 'Onboarded',
    'Graduated': 'Graduated',
    'Inactive': 'Inactive',
    'Rejected': 'Inactive'
  };
  return stageMap[stage] || 'Onboarded';
}

// @route   POST /api/migration/migrate-localstorage
// @desc    Migrate localStorage data to PostgreSQL
// @access  Private (Admin only)
router.post('/migrate-localstorage', [protect, adminOnly], async (req, res) => {
  try {
    const data = req.body;

    const stats = {
      startups: 0,
      startupsUpdated: 0,
      achievements: 0,
      progressHistory: 0,
      oneOnOneMeetings: 0,
      smcMeetings: 0,
      errors: []
    };

    // Migrate Startups
    if (data.startups && Array.isArray(data.startups)) {
      for (const startup of data.startups) {
        try {
          // Map localStorage fields to database fields
          const startupData = {
            name: startup.companyName || startup.name || 'Unknown',
            founder: startup.founderName || startup.founder || 'Unknown',
            email: startup.founderEmail || startup.email || null,
            phone: startup.founderMobile || startup.phone || null,
            sector: startup.sector || 'Other',
            stage: mapStage(startup.stage || startup.status),
            description: startup.problemSolving || startup.solution || startup.description || null,
            website: startup.website || null,
            fundingReceived: parseFloat(startup.fundingReceived || 0),
            employeeCount: parseInt(startup.teamSize || startup.employeeCount || 0),
            revenueGenerated: parseFloat(startup.totalRevenue || 0),
            onboardedDate: parseDate(startup.onboardedDate || startup.registeredDate || startup.createdAt),
            graduatedDate: startup.graduatedDate ? parseDate(startup.graduatedDate) : null
          };

          // Check if startup already exists
          const existing = await prisma.startup.findFirst({
            where: {
              OR: [
                { email: startupData.email },
                { 
                  AND: [
                    { name: startupData.name },
                    { founder: startupData.founder }
                  ]
                }
              ]
            }
          });

          let createdStartup;
          if (existing) {
            createdStartup = await prisma.startup.update({
              where: { id: existing.id },
              data: startupData
            });
            stats.startupsUpdated++;
          } else {
            createdStartup = await prisma.startup.create({
              data: startupData
            });
            stats.startups++;
          }

          // Migrate Achievements
          if (startup.achievements && Array.isArray(startup.achievements)) {
            for (const ach of startup.achievements) {
              try {
                // Check if achievement already exists
                const existingAch = await prisma.achievement.findFirst({
                  where: {
                    startupId: createdStartup.id,
                    title: ach.title || 'Achievement',
                    date: parseDate(ach.date)
                  }
                });

                if (!existingAch) {
                  await prisma.achievement.create({
                    data: {
                      startupId: createdStartup.id,
                      title: ach.title || 'Achievement',
                      description: ach.description || null,
                      type: ach.type || 'milestone',
                      date: parseDate(ach.date),
                      mediaUrl: ach.mediaUrl || ach.media || null,
                      isGraduated: ach.isGraduated || false
                    }
                  });
                  stats.achievements++;
                }
              } catch (error) {
                // Skip duplicate achievements
              }
            }
          }

          // Migrate Revenue History as Progress
          if (startup.revenueHistory && Array.isArray(startup.revenueHistory)) {
            for (const rev of startup.revenueHistory) {
              try {
                const existingProgress = await prisma.progressHistory.findFirst({
                  where: {
                    startupId: createdStartup.id,
                    metric: 'revenue',
                    value: parseFloat(rev.amount || 0),
                    date: parseDate(rev.date)
                  }
                });

                if (!existingProgress) {
                  await prisma.progressHistory.create({
                    data: {
                      startupId: createdStartup.id,
                      metric: 'revenue',
                      value: parseFloat(rev.amount || 0),
                      date: parseDate(rev.date),
                      notes: rev.source || rev.description || null
                    }
                  });
                  stats.progressHistory++;
                }
              } catch (error) {
                // Skip duplicates
              }
            }
          }

          // Migrate Progress Tracking
          if (startup.progressTracking) {
            const tracking = startup.progressTracking;
            const metrics = [
              { key: 'revenue', value: tracking.revenue },
              { key: 'funding', value: tracking.funding },
              { key: 'employees', value: tracking.employees },
              { key: 'customers', value: tracking.customers }
            ];

            for (const metric of metrics) {
              if (metric.value !== undefined && metric.value !== null) {
                try {
                  const existingMetric = await prisma.progressHistory.findFirst({
                    where: {
                      startupId: createdStartup.id,
                      metric: metric.key,
                      value: parseFloat(metric.value)
                    }
                  });

                  if (!existingMetric) {
                    await prisma.progressHistory.create({
                      data: {
                        startupId: createdStartup.id,
                        metric: metric.key,
                        value: parseFloat(metric.value),
                        date: new Date(),
                        notes: 'Migrated from localStorage'
                      }
                    });
                    stats.progressHistory++;
                  }
                } catch (error) {
                  // Skip duplicates
                }
              }
            }
          }

        } catch (error) {
          stats.errors.push({
            startup: startup.companyName || startup.name,
            error: error.message
          });
        }
      }
    }

    // Migrate SMC Schedules
    if (data.smcSchedules && Array.isArray(data.smcSchedules)) {
      for (const schedule of data.smcSchedules) {
        try {
          const startup = data.startups?.find(s => s.id === schedule.startupId);
          if (!startup) continue;

          const dbStartup = await prisma.startup.findFirst({
            where: {
              OR: [
                { name: startup.companyName || startup.name },
                { email: startup.founderEmail || startup.email }
              ]
            }
          });

          if (dbStartup) {
            const existingMeeting = await prisma.sMCMeeting.findFirst({
              where: {
                startupId: dbStartup.id,
                date: parseDate(schedule.date)
              }
            });

            if (!existingMeeting) {
              await prisma.sMCMeeting.create({
                data: {
                  startupId: dbStartup.id,
                  date: parseDate(schedule.date),
                  agenda: schedule.agenda || null,
                  decisions: schedule.completionData?.feedback || null,
                  attendees: schedule.completionData?.panelistName || null,
                  status: schedule.status === 'Completed' ? 'completed' : 'scheduled'
                }
              });
              stats.smcMeetings++;
            }
          }
        } catch (error) {
          // Skip duplicates
        }
      }
    }

    // Migrate One-on-One Sessions
    if (data.oneOnOneSchedules && Array.isArray(data.oneOnOneSchedules)) {
      for (const session of data.oneOnOneSchedules) {
        try {
          const startup = data.startups?.find(s => s.id === session.startupId);
          if (!startup) continue;

          const dbStartup = await prisma.startup.findFirst({
            where: {
              OR: [
                { name: startup.companyName || startup.name },
                { email: startup.founderEmail || startup.email }
              ]
            }
          });

          if (dbStartup) {
            const existingSession = await prisma.oneOnOneMeeting.findFirst({
              where: {
                startupId: dbStartup.id,
                date: parseDate(session.date)
              }
            });

            if (!existingSession) {
              await prisma.oneOnOneMeeting.create({
                data: {
                  startupId: dbStartup.id,
                  date: parseDate(session.date),
                  mentor: session.completionData?.mentorName || null,
                  topic: session.topic || null,
                  notes: session.completionData?.feedback || null,
                  actionItems: session.completionData?.progress || null,
                  status: session.status === 'Completed' ? 'completed' : 'scheduled'
                }
              });
              stats.oneOnOneMeetings++;
            }
          }
        } catch (error) {
          // Skip duplicates
        }
      }
    }

    res.json({
      success: true,
      message: 'Migration completed successfully!',
      stats: {
        startupsCreated: stats.startups,
        startupsUpdated: stats.startupsUpdated,
        achievementsMigrated: stats.achievements,
        progressRecordsMigrated: stats.progressHistory,
        smcMeetingsMigrated: stats.smcMeetings,
        oneOnOneMeetingsMigrated: stats.oneOnOneMeetings,
        errors: stats.errors.length
      },
      errors: stats.errors
    });

  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// @route   GET /api/migration/status
// @desc    Get migration status and database stats
// @access  Private (Admin only)
router.get('/status', [protect, adminOnly], async (req, res) => {
  try {
    const [
      startupCount,
      achievementCount,
      progressCount,
      smcCount,
      oneOnOneCount
    ] = await Promise.all([
      prisma.startup.count(),
      prisma.achievement.count(),
      prisma.progressHistory.count(),
      prisma.sMCMeeting.count(),
      prisma.oneOnOneMeeting.count()
    ]);

    res.json({
      success: true,
      database: {
        startups: startupCount,
        achievements: achievementCount,
        progressRecords: progressCount,
        smcMeetings: smcCount,
        oneOnOneMeetings: oneOnOneCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
