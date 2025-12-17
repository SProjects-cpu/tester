import mongoose from 'mongoose';

const smcScheduleSchema = new mongoose.Schema({
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  date: { 
    type: String, 
    required: true 
  },
  timeSlot: { 
    type: String, 
    required: true,
    enum: ['10 AM', '11 AM', '2 PM', '3 PM']
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  panelistName: {
    type: String,
    default: ''
  },
  feedback: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking
smcScheduleSchema.index({ date: 1, timeSlot: 1 }, { unique: true });
smcScheduleSchema.index({ startup: 1 });

export default mongoose.model('SMCSchedule', smcScheduleSchema);
