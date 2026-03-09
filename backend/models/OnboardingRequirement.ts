import mongoose from 'mongoose';

const requirementItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hint: { type: String, required: true },
  status: { type: String, enum: ['req', 'warn', 'info'], required: true },
  points: { type: Number, required: true, default: 15 }
}, { _id: false });

const onboardingRequirementSchema = new mongoose.Schema({
  countryCode: { type: String, required: true },
  role: { type: String, enum: ['trader', 'logistics', 'institutional'], required: true },
  operationType: { type: String, enum: ['export', 'import', 'both', 'domestic', 'none'], default: 'none' },
  industry: { type: String, default: 'general' },
  requirements: [requirementItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index to quickly find cached requirements
onboardingRequirementSchema.index({ countryCode: 1, role: 1, operationType: 1, industry: 1 }, { unique: true });

onboardingRequirementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const OnboardingRequirement = mongoose.model('OnboardingRequirement', onboardingRequirementSchema);
