import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Upload } from 'lucide-react';

// Move components outside to prevent re-creation on each render
const Section = ({ title, section, expandedSections, toggleSection, children }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-3 sm:p-4 magic-gradient text-white hover:magic-gradient-hover transition-all"
    >
      <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
      {expandedSections[section] ? <ChevronUp className="w-5 h-5 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 flex-shrink-0" />}
    </button>
    {expandedSections[section] && (
      <div className="p-4 sm:p-6 bg-white dark:bg-gray-800 space-y-3 sm:space-y-4">
        {children}
      </div>
    )}
  </div>
);

const Input = ({ label, name, type = 'text', required = false, value, onChange, error, ...props }) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-3 sm:px-4 py-2 border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base`}
      {...props}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Select = ({ label, name, options, required = false, value, onChange, error }) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full px-3 sm:px-4 py-2 border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base`}
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const Textarea = ({ label, name, required = false, value, onChange, error, rows = 3 }) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      rows={rows}
      className={`w-full px-3 sm:px-4 py-2 border-2 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base resize-none`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const FileUpload = ({ label, name, required = false, onChange, accept = "*" }) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500 font-bold">*</span>}
    </label>
    <div className="relative">
      <input
        type="file"
        name={name}
        onChange={onChange}
        accept={accept}
        required={required}
        className="hidden"
        id={name}
      />
      <label
        htmlFor={name}
        className="flex items-center justify-center space-x-2 w-full px-3 sm:px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-magic-500 cursor-pointer transition-all text-sm sm:text-base"
      >
        <Upload className="w-4 h-4" />
        <span>Choose File</span>
      </label>
    </div>
  </div>
);

export default function RegistrationForm({ onClose, onSubmit, initialData = null }) {
  // Auto-generate MAGIC code if not editing
  const getNextMagicCode = () => {
    if (initialData) return initialData.magicCode; // Keep existing code when editing
    const startups = JSON.parse(localStorage.getItem('startups') || '[]');
    return String(startups.length + 1);
  };

  const [formData, setFormData] = useState(initialData || {
    // Startup Information - Required
    magicCode: getNextMagicCode(),
    companyName: '',
    city: '',
    sector: '',
    domain: '',
    isRegistered: '',
    teamSize: '',
    stageOfIdea: '',
    problemSolving: '',
    solution: '',
    hasPatent: '',
    patentNumber: '',
    
    // Startup Information - Optional
    dpiitNo: '',
    recognitionDate: '',
    bhaskarId: '',
    referredFrom: '',
    sectorOther: '',
    website: '',
    pitchDeck: null,
    startupRegisteredDate: '',
    registeredAt: '', // New optional field
    targetCustomer: '',
    hasPayingCustomers: '',
    revenue: '',
    socialMediaPlatform: '',
    
    // Founder Information - Required
    founderName: '',
    founderAge: '',
    founderGender: '',
    founderEmail: '',
    founderMobile: '',
    
    // Founder Information - Optional
    education: '',
    college: '',
    address: '',
    
    // Registration Info
    registrationDate: new Date().toISOString().split('T')[0],
    registrationReferredFrom: '',
    followUpRemark: ''
  });

  const [errors, setErrors] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    startup: true,
    founder: true,
    registration: true
  });

  const sectorOptions = [
    'Agritech Innovation',
    'Smart Industry City Services',
    'Green Mobility',
    'Defense Sector',
    'Healthcare/Medicare',
    'Other'
  ];

  const socialMediaPlatforms = [
    'Facebook',
    'Instagram',
    'Twitter/X',
    'LinkedIn',
    'YouTube',
    'TikTok',
    'Other'
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          [name]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Startup Info - Required fields
    if (!formData.magicCode) newErrors.magicCode = 'Magic Code is required';
    if (!formData.companyName) newErrors.companyName = 'Company Name is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.sector) newErrors.sector = 'Sector is required';
    if (!formData.domain) newErrors.domain = 'Domain is required';
    if (!formData.isRegistered) newErrors.isRegistered = 'This field is required';
    if (!formData.teamSize) newErrors.teamSize = 'Team Size is required';
    if (!formData.stageOfIdea) newErrors.stageOfIdea = 'Stage of Startup Idea is required';
    if (!formData.problemSolving) newErrors.problemSolving = 'Problem description is required';
    if (!formData.solution) newErrors.solution = 'Solution description is required';
    if (!formData.hasPatent) newErrors.hasPatent = 'This field is required';
    if (formData.hasPatent === 'Yes' && !formData.patentNumber) {
      newErrors.patentNumber = 'Patent Number is required';
    }
    
    // Founder Info - Required fields
    if (!formData.founderName) newErrors.founderName = 'Founder Name is required';
    if (!formData.founderAge) newErrors.founderAge = 'Age is required';
    if (!formData.founderGender) newErrors.founderGender = 'Gender is required';
    if (!formData.founderEmail) newErrors.founderEmail = 'Email is required';
    if (!formData.founderMobile) newErrors.founderMobile = 'Mobile Number is required';
    
    // Registration Info - Required fields
    if (!formData.registrationDate) newErrors.registrationDate = 'Registration Date is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl my-8"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl magic-text-gradient">
            {initialData ? 'Edit Startup' : 'Register New Startup'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* SECTION 1 - Startup Information */}
          <Section title="SECTION 1 — Startup Info" section="startup" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Magic Code" 
                name="magicCode" 
                value={formData.magicCode} 
                onChange={handleChange} 
                error={errors.magicCode}
                required
                readOnly
                disabled
                title="Auto-generated based on total startups"
              />
              <Input 
                label="Name of Company" 
                name="companyName" 
                value={formData.companyName} 
                onChange={handleChange} 
                error={errors.companyName}
                required 
              />
              <Input 
                label="DPIIT No." 
                name="dpiitNo" 
                value={formData.dpiitNo} 
                onChange={handleChange} 
                placeholder="Enter DPIIT Number"
              />
              <Input 
                label="Recognition Date" 
                name="recognitionDate" 
                type="date"
                value={formData.recognitionDate} 
                onChange={handleChange} 
              />
              <Input 
                label="Bhaskar ID" 
                name="bhaskarId" 
                value={formData.bhaskarId} 
                onChange={handleChange} 
                placeholder="Enter Bhaskar ID"
              />
              <Input 
                label="City" 
                name="city" 
                value={formData.city} 
                onChange={handleChange} 
                error={errors.city}
                required 
              />
              <Select 
                label="Sector" 
                name="sector" 
                value={formData.sector} 
                onChange={handleChange} 
                options={sectorOptions}
                error={errors.sector}
                required 
              />
              {formData.sector === 'Other' && (
                <Input 
                  label="Specify Other Sector" 
                  name="sectorOther" 
                  value={formData.sectorOther} 
                  onChange={handleChange} 
                  placeholder="Enter sector name"
                />
              )}
              <Input 
                label="Domain" 
                name="domain" 
                value={formData.domain} 
                onChange={handleChange} 
                error={errors.domain}
                placeholder="e.g., AI, IoT, Fintech"
                required 
              />
              <Select 
                label="Is your Startup Registered?" 
                name="isRegistered" 
                value={formData.isRegistered} 
                onChange={handleChange} 
                options={['Yes', 'No']}
                error={errors.isRegistered}
                required 
              />
              <Input 
                label="Team Size" 
                name="teamSize" 
                type="number" 
                value={formData.teamSize} 
                onChange={handleChange} 
                error={errors.teamSize}
                min="1"
                required 
              />
              <Input 
                label="Stage of Startup Idea" 
                name="stageOfIdea" 
                value={formData.stageOfIdea} 
                onChange={handleChange} 
                error={errors.stageOfIdea}
                placeholder="e.g., Ideation, MVP, Growth"
                required 
              />
            </div>
            
            <div className="mt-4 space-y-4">
              <Textarea 
                label="What Problem Are You Solving?" 
                name="problemSolving" 
                value={formData.problemSolving} 
                onChange={handleChange} 
                error={errors.problemSolving}
                rows={4}
                required 
              />
              <Textarea 
                label="What Is Your Solution?" 
                name="solution" 
                value={formData.solution} 
                onChange={handleChange} 
                error={errors.solution}
                rows={4}
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Select 
                label="Do You Have a Patent?" 
                name="hasPatent" 
                value={formData.hasPatent} 
                onChange={handleChange} 
                options={['Yes', 'No']}
                error={errors.hasPatent}
                required 
              />
              {formData.hasPatent === 'Yes' && (
                <Input 
                  label="Provide Patent Number" 
                  name="patentNumber" 
                  value={formData.patentNumber} 
                  onChange={handleChange} 
                  error={errors.patentNumber}
                  required 
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input 
                label="Referred From" 
                name="referredFrom" 
                value={formData.referredFrom} 
                onChange={handleChange} 
                placeholder="Who referred you?"
              />
              <Input 
                label="Website" 
                name="website" 
                type="url" 
                value={formData.website} 
                onChange={handleChange} 
                placeholder="https://example.com"
              />
              <FileUpload 
                label="Pitch Deck" 
                name="pitchDeck" 
                onChange={handleFileChange}
                accept=".pdf,.ppt,.pptx"
              />
              {formData.isRegistered === 'Yes' && (
                <Input 
                  label="Startup Registered Date" 
                  name="startupRegisteredDate" 
                  type="date" 
                  value={formData.startupRegisteredDate} 
                  onChange={handleChange} 
                />
              )}
              <Input 
                label="Target Customer" 
                name="targetCustomer" 
                value={formData.targetCustomer} 
                onChange={handleChange} 
                placeholder="Who is your target audience?"
              />
              <Select 
                label="Do you have paying customers?" 
                name="hasPayingCustomers" 
                value={formData.hasPayingCustomers} 
                onChange={handleChange} 
                options={['Yes', 'No']}
              />
              {formData.hasPayingCustomers === 'Yes' && (
                <Input 
                  label="Revenue" 
                  name="revenue" 
                  type="number" 
                  value={formData.revenue} 
                  onChange={handleChange} 
                  placeholder="Annual revenue in ₹"
                />
              )}
              <Select 
                label="If social media, select platform" 
                name="socialMediaPlatform" 
                value={formData.socialMediaPlatform} 
                onChange={handleChange} 
                options={socialMediaPlatforms}
              />
            </div>
          </Section>

          {/* SECTION 2 - Founder Information */}
          <Section title="SECTION 2 — Founder Info" section="founder" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Founder Name" 
                name="founderName" 
                value={formData.founderName} 
                onChange={handleChange} 
                error={errors.founderName}
                required 
              />
              <Input 
                label="Age" 
                name="founderAge" 
                type="number" 
                value={formData.founderAge} 
                onChange={handleChange} 
                error={errors.founderAge}
                min="18"
                max="100"
                required 
              />
              <Select 
                label="Gender" 
                name="founderGender" 
                value={formData.founderGender} 
                onChange={handleChange} 
                options={['Male', 'Female', 'Other', 'Prefer not to say']}
                error={errors.founderGender}
                required 
              />
              <Input 
                label="Email" 
                name="founderEmail" 
                type="email" 
                value={formData.founderEmail} 
                onChange={handleChange} 
                error={errors.founderEmail}
                placeholder="founder@example.com"
                required 
              />
              <Input 
                label="Mobile Number" 
                name="founderMobile" 
                type="tel" 
                value={formData.founderMobile} 
                onChange={handleChange} 
                error={errors.founderMobile}
                placeholder="+91 XXXXXXXXXX"
                pattern="[0-9+\s-]+"
                required 
              />
              <Input 
                label="Education" 
                name="education" 
                value={formData.education} 
                onChange={handleChange} 
                placeholder="e.g., B.Tech, MBA"
              />
              <Input 
                label="College / Institution" 
                name="college" 
                value={formData.college} 
                onChange={handleChange} 
                placeholder="Institution name"
              />
            </div>
            <div className="mt-4">
                <Input 
                  label="Education" 
                  name="education" 
                  value={formData.education} 
                  onChange={handleChange} 
                  placeholder="e.g., B.Tech, MBA"
                />
                <Input 
                  label="College / Institution" 
                  name="college" 
                  value={formData.college} 
                  onChange={handleChange} 
                placeholder="Institution name"
              />
            </div>
            <div className="mt-4">
              <Textarea 
                label="Address" 
                name="address" 
                value={formData.address} 
                onChange={handleChange} 
                rows={2}
                placeholder="Full address"
              />
            </div>
          </Section>

          {/* SECTION 3 - Registration Info */}
          <Section title="SECTION 3 — Registration Info" section="registration" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Registration Date" 
                name="registrationDate" 
                type="date" 
                value={formData.registrationDate} 
                onChange={handleChange} 
                error={errors.registrationDate}
                required 
              />
              <Input 
                label="Registered At" 
                name="registeredAt" 
                value={formData.registeredAt} 
                onChange={handleChange} 
                placeholder="Location or event where registered"
              />
              <Input 
                label="Referred From" 
                name="registrationReferredFrom" 
                value={formData.registrationReferredFrom} 
                onChange={handleChange} 
                placeholder="Source of referral"
              />
            </div>
            <Textarea 
              label="Follow-up Remark" 
              name="followUpRemark" 
              value={formData.followUpRemark} 
              onChange={handleChange} 
              rows={3}
              placeholder="Any additional notes or remarks"
            />
          </Section>

          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 sm:px-6 py-2.5 sm:py-3 magic-gradient text-white rounded-xl shadow-magic hover:shadow-magic-lg transition-all text-sm sm:text-base"
            >
              {initialData ? 'Update' : 'Register'} Startup
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
