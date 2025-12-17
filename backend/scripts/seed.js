import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { usersDB, startupsDB, smcSchedulesDB, oneOnOneSessionsDB } from '../utils/db.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Clear existing data
    usersDB.clear();
    startupsDB.clear();
    smcSchedulesDB.clear();
    oneOnOneSessionsDB.clear();
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('magic2024', 10);
    const admin = usersDB.create({
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      email: 'admin@magic.com',
      isActive: true
    });
    console.log('👤 Created admin user');

    // Create sample guest user
    const guestPassword = await bcrypt.hash('guest123', 10);
    const guest = usersDB.create({
      username: 'guest',
      password: guestPassword,
      role: 'guest',
      email: 'guest@magic.com',
      isActive: true
    });
    console.log('👤 Created guest user');

    // Create sample startups
    const startups = [
      {
        magicCode: 'MAGIC001',
        companyName: 'TechVenture Solutions',
        city: 'Aurangabad',
        sector: 'Technology',
        stageOfIdea: 'MVP Ready',
        problemSolving: 'Small businesses struggle with digital transformation',
        solution: 'Cloud-based platform offering affordable digital tools',
        hasPatent: 'No',
        isRegistered: 'Yes',
        registrationDate: '2024-01-15',
        website: 'https://techventure.example.com',
        teamSize: '5',
        founderName: 'Rajesh Kumar',
        founderAge: '32',
        founderGender: 'Male',
        college: 'MIT Aurangabad',
        email: 'rajesh@techventure.example.com',
        mobile: '+91 9876543210',
        address: '123 Tech Park, Aurangabad',
        registeredDate: '2024-01-15',
        stage: 'S1',
        status: 'Active',
        pitchHistory: [{
          stage: 'S1',
          date: '2024-11-09',
          time: '10:30',
          panelistName: 'Dr. Sharma',
          feedback: 'Excellent presentation. Strong business model.'
        }],
        oneOnOneHistory: [],
        achievements: [],
        documents: []
      },
      {
        magicCode: 'MAGIC002',
        companyName: 'EcoGreen Innovations',
        city: 'Pune',
        sector: 'Environment',
        stageOfIdea: 'Prototype',
        problemSolving: 'Plastic waste management is inefficient',
        solution: 'Biodegradable packaging from agricultural waste',
        hasPatent: 'Yes',
        patentNumber: 'PAT2024001',
        isRegistered: 'Yes',
        registrationDate: '2024-02-20',
        website: 'https://ecogreen.example.com',
        teamSize: '8',
        founderName: 'Priya Deshmukh',
        founderAge: '28',
        founderGender: 'Female',
        college: 'COEP Pune',
        email: 'priya@ecogreen.example.com',
        mobile: '+91 9876543211',
        address: '456 Green Valley, Pune',
        registeredDate: '2024-02-20',
        stage: 'S0',
        status: 'Active',
        pitchHistory: [],
        oneOnOneHistory: [],
        achievements: [],
        documents: []
      },
      {
        magicCode: 'MAGIC003',
        companyName: 'HealthTech Plus',
        city: 'Mumbai',
        sector: 'Healthcare',
        stageOfIdea: 'Market Ready',
        problemSolving: 'Rural areas lack access to quality healthcare',
        solution: 'Telemedicine platform connecting rural patients with doctors',
        hasPatent: 'No',
        isRegistered: 'Yes',
        registrationDate: '2023-12-10',
        website: 'https://healthtechplus.example.com',
        teamSize: '12',
        founderName: 'Dr. Amit Patel',
        founderAge: '35',
        founderGender: 'Male',
        college: 'IIT Bombay',
        email: 'amit@healthtechplus.example.com',
        mobile: '+91 9876543212',
        address: '789 Medical Complex, Mumbai',
        registeredDate: '2023-12-10',
        stage: 'Onboarded',
        status: 'Onboarded',
        pitchHistory: [{
          stage: 'S1',
          date: '2024-11-02',
          time: '14:00',
          panelistName: 'Dr. Verma',
          feedback: 'Outstanding healthcare solution with proven traction'
        }],
        oneOnOneHistory: [{
          date: '2024-11-10',
          time: '15:00',
          mentorName: 'Mr. Kapoor',
          feedback: 'Strong team, ready for investment',
          progress: 'Completed funding preparation'
        }],
        achievements: [],
        documents: []
      }
    ];

    startups.forEach(startup => {
      startupsDB.create(startup);
    });

    console.log(`🚀 Created ${startups.length} sample startups`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📝 Login credentials:');
    console.log('   Admin - username: admin, password: magic2024');
    console.log('   Guest - username: guest, password: guest123');
    console.log('\n🎯 Start the server with: npm run dev');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
