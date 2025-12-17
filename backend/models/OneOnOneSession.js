import mongoose from 'mongoose';

const oneOnOneSessionSchema = new mongoose.Schema({
  startup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  date: { 
    type: String, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  mentorName: {
    type: String,
    required: true
  },
  status: { 
    type: String, 
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  feedback: {
    type: String,
    default: ''
  },
  progress: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

oneOnOneSessionSchema.index({ startup: 1 });
oneOnOneSessionSchema.index({ date: 1 });

export default mongoose.model('OneOnOneSession', oneOnOneSessionSchema);
