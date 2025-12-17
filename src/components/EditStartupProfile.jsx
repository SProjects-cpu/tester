import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Building2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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

const Input = ({ label, name, type = 'text', required = false, value, onChange, ...props }) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
      {...props}
    />
  </div>
);

const Select = ({ label, name, options, required = false, value, onChange }) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base"
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const Textarea = ({ label, name, required = false, value, onChange }) => (
  <div>
    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      rows={3}
      className="w-full px-3 sm:px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-magic-500 focus:border-magic-500 outline-none transition-all text-sm sm:text-base resize-none"
    />
  </div>
);

export default function EditStartupProfile({ startup, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    // Images
    logo: startup.logo || null,
    officePhoto: startup.officePhoto || null,
    
    // Startup Information
    magicCode: startup.magicCode || '',
    companyName: startup.companyName || '',
    dpiitNo: startup.dpiitNo || '',
    recognitionDate: startup.recognitionDate || '',
    bhaskarId: startup.bhaskarId || '',
    city: startup.city || '',
    sector: startup.sector || '',
    stageOfIdea: startup.stageOfIdea || '',
    problemSolving: startup.problemSolving || '',
    solution: startup.solution || '',
    hasPatent: startup.hasPatent || 'No',
    patentNumber: startup.patentNumber || '',
    isRegistered: startup.isRegistered || 'No',
    registrationDate: startup.registrationDate || '',
    website: startup.website || '',
    socialMedia: startup.socialMedia || '',
    teamSize: startup.teamSize || '',
    
    // Founder Information
    founderName: startup.founderName || '',
    founderAge: startup.founderAge || '',
    founderGender: startup.founderGender || '',
    college: startup.college || '',
    email: startup.email || '',
    mobile: startup.mobile || '',
    address: startup.address || '',
    referredFrom: startup.referredFrom || '',
    
    // Registration Info
    sessionNumber: startup.sessionNumber || '',
    date: startup.date || '',
    month: startup.month || '',
    timeSlot: startup.timeSlot || '',
    clinicalMentoring: startup.clinicalMentoring || false,
    followUpRemark: startup.followUpRemark || '',
    registeredDate: startup.registeredDate || ''
  });

  const [expandedSections, setExpandedSections] = useState({
    images: true,
    startup: false,
    founder: false,
    registration: false
  });

  const [logoPreview, setLogoPreview] = useState(startup.logo || null);
  const [officePreview, setOfficePreview] = useState(startup.officePhoto || null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData(prev => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOfficePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOfficePreview(reader.result);
        setFormData(prev => ({ ...prev, officePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: null }));
  };

  const handleRemoveOfficePhoto = () => {
    setOfficePreview(null);
    setFormData(prev => ({ ...prev, officePhoto: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedStartup = {
      ...startup,
      ...formData
    };
    onUpdate(updatedStartup);
    onClose();
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
          <div>
            <h2 className="text-xl sm:text-2xl font-bold magic-text-gradient">
              Edit Startup Profile
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {startup.companyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Images Section */}
          <Section title="📷 Images" section="images" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Startup Logo
                </label>
                {logoPreview ? (
                  <div className="relative">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                      <img src={logoPreview} alt="Logo" className="max-h-32 mx-auto object-contain rounded-lg" />
                    </div>
                    <button type="button" onClick={handleRemoveLogo} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-magic-500 transition-all bg-gray-50 dark:bg-gray-800">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Click to upload</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                  </label>
                )}
              </div>

              {/* Office Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Office Photo
                </label>
                {officePreview ? (
                  <div className="relative">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border-2 border-gray-200 dark:border-gray-700">
                      <img src={officePreview} alt="Office" className="max-h-32 w-full object-cover rounded-lg" />
                    </div>
                    <button type="button" onClick={handleRemoveOfficePhoto} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:border-magic-500 transition-all bg-gray-50 dark:bg-gray-800">
                      <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                      <p className="text-xs text-gray-600 dark:text-gray-400">Click to upload</p>
                    </div>
                    <input type="file" accept="image/*" onChange={handleOfficePhotoChange} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </Section>

          {/* Startup Information */}
          <Section title="🚀 Startup Information" section="startup" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Magic Code" name="magicCode" value={formData.magicCode} onChange={handleChange} required />
              <Input label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} required />
              <Input label="DPIIT No." name="dpiitNo" value={formData.dpiitNo} onChange={handleChange} placeholder="Enter DPIIT Number" />
              <Input label="Recognition Date" name="recognitionDate" type="date" value={formData.recognitionDate} onChange={handleChange} />
              <Input label="Bhaskar ID" name="bhaskarId" value={formData.bhaskarId} onChange={handleChange} placeholder="Enter Bhaskar ID" />
              <Input label="City" name="city" value={formData.city} onChange={handleChange} required />
              <Input label="Sector" name="sector" value={formData.sector} onChange={handleChange} required />
              <Input label="Stage of Startup Idea" name="stageOfIdea" value={formData.stageOfIdea} onChange={handleChange} />
              <Input label="Team Size" name="teamSize" type="number" value={formData.teamSize} onChange={handleChange} />
            </div>
            <Textarea label="What Problem Are You Solving" name="problemSolving" value={formData.problemSolving} onChange={handleChange} required />
            <Textarea label="What Is Your Solution" name="solution" value={formData.solution} onChange={handleChange} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Do You Have a Patent" name="hasPatent" value={formData.hasPatent} onChange={handleChange} options={['Yes', 'No']} />
              {formData.hasPatent === 'Yes' && (
                <Input label="Patent Number" name="patentNumber" value={formData.patentNumber} onChange={handleChange} />
              )}
              <Select label="Is Startup Registered" name="isRegistered" value={formData.isRegistered} onChange={handleChange} options={['Yes', 'No']} />
              {formData.isRegistered === 'Yes' && (
                <Input label="Registration Date" name="registrationDate" type="date" value={formData.registrationDate} onChange={handleChange} />
              )}
              <Input label="Website" name="website" type="url" value={formData.website} onChange={handleChange} />
              <Input label="Social Media" name="socialMedia" value={formData.socialMedia} onChange={handleChange} />
            </div>
          </Section>

          {/* Founder Information */}
          <Section title="👤 Founder Information" section="founder" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Founder Name" name="founderName" value={formData.founderName} onChange={handleChange} required />
              <Input label="Founder Age" name="founderAge" type="number" value={formData.founderAge} onChange={handleChange} />
              <Select label="Founder Gender" name="founderGender" value={formData.founderGender} onChange={handleChange} options={['Male', 'Female', 'Other']} />
              <Input label="College" name="college" value={formData.college} onChange={handleChange} />
              <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
              <Input label="Mobile Number" name="mobile" type="tel" value={formData.mobile} onChange={handleChange} required />
              <Input label="Referred From" name="referredFrom" value={formData.referredFrom} onChange={handleChange} />
            </div>
            <Textarea label="Address" name="address" value={formData.address} onChange={handleChange} />
          </Section>

          {/* Registration Info */}
          <Section title="📋 Registration Info" section="registration" expandedSections={expandedSections} toggleSection={toggleSection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Session Number" name="sessionNumber" value={formData.sessionNumber} onChange={handleChange} />
              <Input label="Date" name="date" type="date" value={formData.date} onChange={handleChange} />
              <Input label="Month" name="month" value={formData.month} onChange={handleChange} />
              <Select label="Time Slot" name="timeSlot" value={formData.timeSlot} onChange={handleChange} options={['10 AM', '11 AM', '2 PM', '3 PM']} />
              <Input label="Registered Date" name="registeredDate" type="date" value={formData.registeredDate} onChange={handleChange} />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="clinicalMentoring"
                checked={formData.clinicalMentoring}
                onChange={handleChange}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Clinical Mentoring
              </label>
            </div>
            <Textarea label="Follow-Up Remark" name="followUpRemark" value={formData.followUpRemark} onChange={handleChange} />
          </Section>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="px-5 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 sm:px-6 py-2.5 sm:py-3 magic-gradient text-white rounded-xl font-semibold shadow-magic hover:shadow-magic-lg transition-all text-sm sm:text-base"
            >
              Save Changes
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
