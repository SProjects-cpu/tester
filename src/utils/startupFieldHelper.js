/**
 * Helper utility to handle field name variations in startup data
 * This handles both database field names and Excel import field names
 */

/**
 * Safely get a field value from a startup object, trying multiple field name variations
 * @param {Object} startup - The startup object
 * @param {...string} fields - Field names to try in order
 * @returns {any} The first non-empty value found, or empty string
 */
export const getStartupField = (startup, ...fields) => {
  if (!startup) return '';
  
  for (const field of fields) {
    const value = startup[field];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return '';
};

/**
 * Field mapping for common startup fields
 * Maps display names to possible field name variations
 */
export const STARTUP_FIELD_MAPPINGS = {
  // Company Information
  companyName: ['companyName', 'name'],
  magicCode: ['magicCode'],
  city: ['city'],
  sector: ['sector'],
  domain: ['domain'],
  stage: ['stage'],
  status: ['status'],
  teamSize: ['teamSize'],
  stageOfIdea: ['stageOfIdea', 'stage_of_idea'],
  isRegistered: ['isRegistered', 'is_registered'],
  registrationDate: ['registrationDate', 'registration_date'],
  hasPatent: ['hasPatent', 'has_patent'],
  patentNumber: ['patentNumber', 'patent_number'],
  website: ['website'],
  socialMedia: ['socialMedia', 'social_media', 'socialMediaPlatform'],
  pitchDeck: ['pitchDeck', 'pitch_deck'],
  targetCustomer: ['targetCustomer', 'target_customer'],
  hasPayingCustomers: ['hasPayingCustomers', 'has_paying_customers'],
  
  // Founder Information
  founderName: ['founderName', 'founder'],
  founderAge: ['founderAge', 'founder_age', 'age'],
  founderGender: ['founderGender', 'founder_gender', 'gender'],
  founderEmail: ['founderEmail', 'founder_email', 'email'],
  founderMobile: ['founderMobile', 'founder_mobile', 'mobile', 'phone'],
  education: ['education'],
  college: ['college', 'institution'],
  address: ['address'],
  
  // Problem & Solution
  problemSolving: ['problemSolving', 'problem_solving', 'problem'],
  solution: ['solution'],
  
  // Registration Info
  referredFrom: ['referredFrom', 'referred_from'],
  registeredAt: ['registeredAt', 'registered_at'],
  registrationReferredFrom: ['registrationReferredFrom', 'registration_referred_from'],
  followUpRemark: ['followUpRemark', 'follow_up_remark'],
  registeredDate: ['registeredDate', 'registered_date'],
  sessionNumber: ['sessionNumber', 'session_number'],
  date: ['date'],
  month: ['month'],
  timeSlot: ['timeSlot', 'time_slot'],
  clinicalMentoring: ['clinicalMentoring', 'clinical_mentoring'],
  
  // Status & Dates
  onboardedDate: ['onboardedDate', 'onboarded_date'],
  graduatedDate: ['graduatedDate', 'graduated_date'],
  rejectedDate: ['rejectedDate', 'rejected_date'],
  rejectedFromStage: ['rejectedFromStage', 'rejected_from_stage'],
  rejectionRemark: ['rejectionRemark', 'rejection_remark'],
  
  // Onboarding
  onboardingDescription: ['onboardingDescription', 'onboarding_description'],
  agreementDate: ['agreementDate', 'agreement_date'],
  engagementMedium: ['engagementMedium', 'engagement_medium'],
  agreementCopy: ['agreementCopy', 'agreement_copy'],
  
  // Additional fields
  logo: ['logo'],
  officePhoto: ['officePhoto', 'office_photo'],
  dpiitNo: ['dpiitNo', 'dpiit_no'],
  recognitionDate: ['recognitionDate', 'recognition_date'],
  bhaskarId: ['bhaskarId', 'bhaskar_id'],
  
  // Arrays
  achievements: ['achievements'],
  pitchHistory: ['pitchHistory', 'pitch_history'],
  oneOnOneHistory: ['oneOnOneHistory', 'one_on_one_history'],
  revenueHistory: ['revenueHistory', 'revenue_history'],
  
  // Revenue
  revenueGenerated: ['revenueGenerated', 'revenue_generated', 'totalRevenue', 'total_revenue']
};

/**
 * Get a startup field using the predefined mappings
 * @param {Object} startup - The startup object
 * @param {string} fieldKey - The field key from STARTUP_FIELD_MAPPINGS
 * @returns {any} The field value or empty string
 */
export const getField = (startup, fieldKey) => {
  const fieldVariations = STARTUP_FIELD_MAPPINGS[fieldKey];
  if (!fieldVariations) {
    // If no mapping exists, try the field key directly
    return getStartupField(startup, fieldKey);
  }
  return getStartupField(startup, ...fieldVariations);
};

/**
 * Get all startup data with normalized field names
 * @param {Object} startup - The startup object with any field name variations
 * @returns {Object} Normalized startup object with standard field names
 */
export const normalizeStartupFields = (startup) => {
  if (!startup) return {};
  
  const normalized = { ...startup };
  
  // Normalize each field using the mappings
  Object.keys(STARTUP_FIELD_MAPPINGS).forEach(standardField => {
    const value = getField(startup, standardField);
    if (value !== '') {
      normalized[standardField] = value;
    }
  });
  
  return normalized;
};

/**
 * Format a startup for display, ensuring all fields are accessible
 * @param {Object} startup - The startup object
 * @returns {Object} Startup object with guaranteed field access
 */
export const formatStartupForDisplay = (startup) => {
  if (!startup) return null;
  
  return {
    ...startup,
    // Ensure critical fields are always accessible
    displayName: getField(startup, 'companyName'),
    displayFounder: getField(startup, 'founderName'),
    displayEmail: getField(startup, 'founderEmail'),
    displayMobile: getField(startup, 'founderMobile'),
    displayProblem: getField(startup, 'problemSolving'),
    displaySolution: getField(startup, 'solution')
  };
};
