import mongoose from 'mongoose';

const landingPageSchema = new mongoose.Schema({
  hero: {
    title: String,
    subtitle: String,
    ctaText: String
  },
  features: [{
    icon: String,
    title: String,
    description: String
  }],
  stats: [{
    value: String,
    label: String
  }],
  testimonials: [{
    name: String,
    role: String,
    company: String,
    content: String,
    avatar: String
  }],
  contact: {
    email: String,
    phone: String,
    address: String
  }
}, {
  timestamps: true
});

export default mongoose.model('LandingPage', landingPageSchema);
