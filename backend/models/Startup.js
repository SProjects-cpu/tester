import mongoose from 'mongoose';

const pitchHistorySchema = new mongoose.Schema({
  stage: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  panelistName: { type: String, required: true },
  feedback: { type: String, required: true }
}, { _id: false });

const oneOnOneHistorySchema = new mongoose.Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  mentorName: { type: String, required: true },
  feedback: { type: String, required: true },
  progress: { type: String, required: true }
}, { _id: false });

const achievementSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  icon: { type: String, required: true },
  category: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const startupSchema = new mongoose.Schema({
  magicCode: { type: String, required: true },
  companyName: { type: String, required: true },
  dpiitNo: { type: String, default: '' },
  recognitionDate: { type: String, default: '' },
  bhaskarId: { type: String, default: '' },
  city: { type: String, required: true },
  sector: { type: String, required: true },
  stageOfIdea: { type: String, required: true },
  problemSolving: { type: String, required: true },
  solution: { type: String, required: true },
  hasPatent: { type: String, enum: ['Yes', 'No'], default: 'No' },
  patentNumber: { type: String, default: '' },
  isRegistered: { type: String, enum: ['Yes', 'No'], default: 'No' },
  registrationDate: { type: String, default: '' },
  website: { type: String, default: '' },
  socialMedia: { type: String, default: '' },
  teamSize: { type: String, required: true },
  founderName: { type: String, required: true },
  founderAge: { type: String, required: true },
  founderGender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  college: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  referredFrom: { type: String, default: '' },
  sessionNumber: { type: String, default: '' },
  date: { type: String, default: '' },
  month: { type: String, default: '' },
  timeSlot: { type: String, default: '' },
  clinicalMentoring: { type: Boolean, default: false },
  followUpRemark: { type: String, default: '' },
  registeredDate: { type: String, required: true },
  stage: { 
    type: String, 
    enum: ['S0', 'S1', 'S2', 'S3', 'One-on-One', 'Onboarded', 'Graduated', 'Rejected'],
    default: 'S0'
  },
  status: { 
    type: String, 
    enum: ['Active', 'Onboarded', 'Graduated', 'Rejected'],
    default: 'Active'
  },
  pitchHistory: [pitchHistorySchema],
  oneOnOneHistory: [oneOnOneHistorySchema],
  achievements: [achievementSchema],
  documents: [{
    name: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
startupSchema.index({ magicCode: 1 }, { unique: true });
startupSchema.index({ stage: 1 });
startupSchema.index({ status: 1 });
startupSchema.index({ email: 1 });

export default mongoose.model('Startup', startupSchema);
