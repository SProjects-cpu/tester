import prisma from './utils/prisma.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration Script: LocalStorage Data → PostgreSQL
 * 
 * This script helps you migrate data from your frontend's localStorage
 * (exported as JSON) into the PostgreSQL database.
 * 
 * Usage:
 * 1. Export your data from the website (Settings → Export All Data)
 * 2. Save the JSON file in the backend folder
 * 3. Run: node migrate-localstorage-to-db.js <filename.json>
 */

async function migrateData(jsonFilePath) {
  console.log('🔄 Starting Migration: LocalStorage → PostgreSQL\n');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    // Read JSON file
    console.log(`📖 Reading file: ${jsonFilePath}`);
    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    console.log('✅ File loaded successfully\n');

    // Statistics
    const stats = {
      startups: 0,
      achievements: 0,
      progressHistory: 0,
      oneOnOneMeetings: 0,
      smcMeetings: 0,
      errors: []
    };

    // Migrate Startups
    if (data.startups && Array.isArray(data.startups)) {
      console.log(`📊 Found ${data.startups.length} startups to migrate\n`);

      for (const startup of data.startups) {
        try {
          console.log(`   Processing: ${startup.companyName || startup.name || 'Unknown'}...`);

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
                { name: startupData.name, founder: startupData.founder }
              ]
            }
          });

          let createdStartup;
          if (existing) {
            console.log(`      ⚠️  Already exists, updating...`);
            createdStartup = await prisma.startup.update({
              where: { id: existing.id },
              data: startupData
            });
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
              } catch (error) {
                console.log(`      ⚠️  Achievement error: ${error.message}`);
              }
            }
          }

          // Migrate Revenue History as Progress
          if (startup.revenueHistory && Array.isArray(startup.revenueHistory)) {
            for (const rev of startup.revenueHistory) {
              try {
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
              } catch (error) {
                console.log(`      ⚠️  Revenue history error: ${error.message}`);
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
                } catch (error) {
                  // Ignore duplicates
                }
              }
            }
          }

          console.log(`      ✅ Migrated successfully`);

        } catch (error) {
          console.log(`      ❌ Error: ${error.message}`);
          stats.errors.push({
            startup: startup.companyName || startup.name,
            error: error.message
          });
        }
      }
    }

    // Migrate SMC Schedules
    if (data.smcSchedules && Array.isArray(data.smcSchedules)) {
      console.log(`\n📅 Found ${data.smcSchedules.length} SMC schedules to migrate\n`);

      for (const schedule of data.smcSchedules) {
        try {
          // Find startup by ID or name
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
        } catch (error) {
          // Ignore duplicates
        }
      }
    }

    // Migrate One-on-One Sessions
    if (data.oneOnOneSchedules && Array.isArray(data.oneOnOneSchedules)) {
      console.log(`\n👥 Found ${data.oneOnOneSchedules.length} One-on-One sessions to migrate\n`);

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
        } catch (error) {
          // Ignore duplicates
        }
      }
    }

    // Print Summary
    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 Migration Complete!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Startups migrated: ${stats.startups}`);
    console.log(`   ✅ Achievements migrated: ${stats.achievements}`);
    console.log(`   ✅ Progress records migrated: ${stats.progressHistory}`);
    console.log(`   ✅ SMC meetings migrated: ${stats.smcMeetings}`);
    console.log(`   ✅ One-on-One meetings migrated: ${stats.oneOnOneMeetings}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n   ⚠️  Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach(err => {
        console.log(`      - ${err.startup}: ${err.error}`);
      });
    }

    console.log('\n✨ Your data is now in PostgreSQL!');
    console.log('   Run "npm run prisma:studio" to view it\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

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

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node migrate-localstorage-to-db.js <json-file>');
  console.log('\nExample:');
  console.log('  node migrate-localstorage-to-db.js MAGIC-Full-Export-2024-12-12.json');
  console.log('\nSteps:');
  console.log('  1. Go to your website Settings page');
  console.log('  2. Click "Export All Data"');
  console.log('  3. Save the JSON file in the backend folder');
  console.log('  4. Run this script with the filename');
  process.exit(1);
}

const jsonFile = path.resolve(args[0]);
if (!fs.existsSync(jsonFile)) {
  console.error(`❌ File not found: ${jsonFile}`);
  process.exit(1);
}

migrateData(jsonFile);
