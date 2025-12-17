'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Plus, Trash2, Eye, Save, Upload } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Type definitions for better type safety
interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
}

interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  graduationYear: string;
}

interface CVData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string;
}

// Default empty data
const defaultCVData: CVData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    address: '',
  },
  summary: '',
  experience: [{
    id: Date.now().toString(),
    jobTitle: '',
    company: '',
    startDate: '',
    endDate: '',
    description: '',
  }],
  education: [{
    id: Date.now().toString() + '1',
    degree: '',
    institution: '',
    graduationYear: '',
  }],
  skills: '',
};


export default function CVBuilder() {
   const handleSendCV = async () => {
  if (!emailToSend.trim()) {
    toast.error('Please enter a recipient email');
    return;
  }

  setSending(true);
  const toastId = toast.loading('Sending CV...');

  try {
    const response = await fetch('/api/cv/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailToSend, cvData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send CV');
    }

    toast.success('CV sent successfully!', { id: toastId });
    setEmailToSend('');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to send CV', { id: toastId });
  } finally {
    setSending(false);
  }
};


  const [cvData, setCvData] = useState<CVData>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cv-builder-data');
      return saved ? JSON.parse(saved) : defaultCVData;
    }
    return defaultCVData;
  });
  
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  // Dans ton composant CVBuilder, en haut avec les autres useState
    const [emailToSend, setEmailToSend] = useState<string>('');
    const [sending, setSending] = useState<boolean>(false);


  // Save to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cv-builder-data', JSON.stringify(cvData));
    }
  }, [cvData]);

  // Add new experience
  const addExperience = () => {
    setCvData(prev => ({
      ...prev,
      experience: [...prev.experience, {
        id: Date.now().toString(),
        jobTitle: '',
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      }]
    }));
    toast.success('Added new experience entry');
  };

  // Remove experience
  const removeExperience = (index: number) => {
    if (cvData.experience.length <= 1) {
      toast.error('At least one experience entry is required');
      return;
    }
    
    setCvData(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
    toast.success('Experience entry removed');
  };

  // Add new education
  const addEducation = () => {
    setCvData(prev => ({
      ...prev,
      education: [...prev.education, {
        id: Date.now().toString(),
        degree: '',
        institution: '',
        graduationYear: '',
      }]
    }));
    toast.success('Added new education entry');
  };

  // Remove education
  const removeEducation = (index: number) => {
    if (cvData.education.length <= 1) {
      toast.error('At least one education entry is required');
      return;
    }
    
    setCvData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
    toast.success('Education entry removed');
  };

  // Reset form
  const resetForm = () => {
    if (confirm('Are you sure you want to reset all data?')) {
      setCvData(defaultCVData);
      localStorage.removeItem('cv-builder-data');
      toast.success('Form reset successfully');
    }
  };

  // Export data
  const exportData = () => {
    const dataStr = JSON.stringify(cvData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cvData.personalInfo.fullName || 'cv'}_data.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  // Import data
  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setCvData(data);
          toast.success('Data imported successfully');
        } catch (error) {
          toast.error('Invalid data file');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    if (!cvData.personalInfo.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    
    if (!cvData.personalInfo.email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Generating PDF...');

    try {
      const response = await fetch('/api/cv/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cvData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cvData.personalInfo.fullName.replace(/\s+/g, '_')}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!', { id: toastId });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate PDF', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Calculate skills count
  const skillsCount = cvData.skills.split(',').filter(s => s.trim()).length;

  // Character counter for summary
  const summaryLength = cvData.summary.length;

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
          },
        }}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
        {/* Header */}
        <header className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Professional CV Builder
              </h1>
              <p className="text-gray-600 mt-2">Create, customize, and download your professional resume in minutes</p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full lg:w-auto">
              <button
                onClick={importData}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Upload size={18} />
                Import
              </button>
              <button
                onClick={exportData}
                disabled={loading}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                Export
              </button>
              <button
                onClick={resetForm}
                disabled={loading}
                className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={18} />
                Reset
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={loading || !cvData.personalInfo.fullName.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-200"
              >
                <Download size={20} />
                {loading ? 'Generating...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Form */}
            <div className="flex-1">
              {/* Personal Information Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
                  <span className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Required</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {([
                    { key: 'fullName', label: 'Full Name *', type: 'text', placeholder: 'John Doe' },
                    { key: 'email', label: 'Email *', type: 'email', placeholder: 'john@example.com' },
                    { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 123-4567' },
                    { key: 'address', label: 'Address', type: 'text', placeholder: 'City, Country' },
                  ] as const).map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>
                      <input
                        type={type}
                        value={cvData.personalInfo[key]}
                        onChange={(e) => setCvData({
                          ...cvData,
                          personalInfo: { ...cvData.personalInfo, [key]: e.target.value }
                        })}
                        className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder={placeholder}
                        required={label.includes('*')}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Professional Summary</h2>
                  <span className={`text-sm ${summaryLength > 500 ? 'text-red-500' : 'text-gray-500'}`}>
                    {summaryLength}/500
                  </span>
                </div>
                <textarea
                  value={cvData.summary}
                  onChange={(e) => setCvData({ ...cvData, summary: e.target.value.slice(0, 500) })}
                  className="w-full p-3.5 border border-gray-300 rounded-xl h-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200"
                  placeholder="Describe your professional experience, skills, and career objectives. Aim for 2-3 concise paragraphs."
                  maxLength={500}
                />
                <p className="text-sm text-gray-500 mt-3">Tip: Keep it concise and highlight your key achievements</p>
              </div>

              {/* Experience Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Work Experience</h2>
                    <p className="text-gray-600 text-sm mt-1">List your relevant work history, starting with the most recent</p>
                  </div>
                  <button
                    onClick={addExperience}
                    className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 shadow-lg shadow-green-200"
                  >
                    <Plus size={18} />
                    Add Experience
                  </button>
                </div>
                
                {cvData.experience.map((exp, index) => (
                  <div key={exp.id} className="border-2 border-gray-100 rounded-xl p-6 mb-6 hover:border-blue-100 transition-all duration-200">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-blue-600">{index + 1}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">Experience #{index + 1}</h3>
                      </div>
                      <button
                        onClick={() => removeExperience(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={cvData.experience.length <= 1}
                        title="Remove this experience"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      {([
                        { key: 'jobTitle', label: 'Job Title', placeholder: 'Senior Developer' },
                        { key: 'company', label: 'Company', placeholder: 'Tech Corp Inc.' },
                        { key: 'startDate', label: 'Start Date', placeholder: 'Jan 2020' },
                        { key: 'endDate', label: 'End Date', placeholder: 'Present or Dec 2023' },
                      ] as const).map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>
                          <input
                            type="text"
                            value={exp[key]}
                            onChange={(e) => {
                              const updated = [...cvData.experience];
                              updated[index][key] = e.target.value;
                              setCvData({ ...cvData, experience: updated });
                            }}
                            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">
                        Description & Achievements
                      </label>
                      <textarea
                        value={exp.description}
                        onChange={(e) => {
                          const updated = [...cvData.experience];
                          updated[index].description = e.target.value;
                          setCvData({ ...cvData, experience: updated });
                        }}
                        className="w-full p-3.5 border border-gray-300 rounded-xl h-40 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe your responsibilities and key achievements. Use bullet points in your mind."
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Education Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Education</h2>
                    <p className="text-gray-600 text-sm mt-1">List your educational background</p>
                  </div>
                  <button
                    onClick={addEducation}
                    className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 flex items-center gap-2 shadow-lg shadow-purple-200"
                  >
                    <Plus size={18} />
                    Add Education
                  </button>
                </div>
                
                {cvData.education.map((edu, index) => (
                  <div key={edu.id} className="border-2 border-gray-100 rounded-xl p-6 mb-6 hover:border-purple-100 transition-all duration-200">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="font-bold text-purple-600">{index + 1}</span>
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">Education #{index + 1}</h3>
                      </div>
                      <button
                        onClick={() => removeEducation(index)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={cvData.education.length <= 1}
                        title="Remove this education"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {([
                        { key: 'degree', label: 'Degree/Certificate', placeholder: 'Bachelor of Science' },
                        { key: 'institution', label: 'Institution', placeholder: 'University of Technology' },
                        { key: 'graduationYear', label: 'Graduation Year', placeholder: '2020' },
                      ] as const).map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <label className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>
                          <input
                            type="text"
                            value={edu[key]}
                            onChange={(e) => {
                              const updated = [...cvData.education];
                              updated[index][key] = e.target.value;
                              setCvData({ ...cvData, education: updated });
                            }}
                            className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Skills Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Skills & Competencies</h2>
                <textarea
                  value={cvData.skills}
                  onChange={(e) => setCvData({ ...cvData, skills: e.target.value })}
                  className="w-full p-3.5 border border-gray-300 rounded-xl h-48 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="List your technical and soft skills separated by commas. Example: JavaScript, React, Project Management, Leadership, Communication, Agile Methodology"
                />
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-blue-600">{skillsCount}</span> skills added
                  </p>
                  <p className="text-sm text-gray-500">Separate with commas</p>
                </div>
              </div>
            </div>

            {/* Right Column - Preview & Actions */}
            <div className="lg:w-96">
              {/* Stats Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 sticky top-6">
                <h2 className="text-xl font-bold mb-6 text-gray-800">CV Preview</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <span className="text-gray-700">Name</span>
                    <span className="font-semibold text-blue-600">
                      {cvData.personalInfo.fullName || 'Not entered'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                    <span className="text-gray-700">Experience Entries</span>
                    <span className="font-semibold text-green-600">{cvData.experience.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl">
                    <span className="text-gray-700">Education Entries</span>
                    <span className="font-semibold text-purple-600">{cvData.education.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                    <span className="text-gray-700">Skills Listed</span>
                    <span className="font-semibold text-amber-600">{skillsCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-700">Summary Length</span>
                    <span className={`font-semibold ${summaryLength > 500 ? 'text-red-600' : 'text-gray-600'}`}>
                      {summaryLength} chars
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => setPreviewMode(!previewMode)}
                    className="w-full py-3.5 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 font-semibold transition-all"
                  >
                    <Eye size={20} />
                    {previewMode ? 'Hide Preview' : 'Quick Preview'}
                  </button>
                  
                  <button
                    onClick={handleGeneratePDF}
                    disabled={loading || !cvData.personalInfo.fullName.trim()}
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg shadow-blue-200"
                  >
                    <Download size={20} />
                    {loading ? 'Generating PDF...' : 'Download Professional CV'}
                  </button>
                </div>

                {previewMode && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-700 mb-3">Quick Preview</h3>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><span className="font-semibold">Name:</span> {cvData.personalInfo.fullName}</p>
                      <p><span className="font-semibold">Contact:</span> {cvData.personalInfo.email}</p>
                      <p><span className="font-semibold">Latest Role:</span> {cvData.experience[0]?.jobTitle || 'Not specified'}</p>
                      <p><span className="font-semibold">Top Skills:</span> {cvData.skills.split(',').slice(0, 3).join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tips Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
                  Pro Tips
                </h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    Use action verbs (Led, Developed, Implemented)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    Quantify achievements with numbers
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    Keep summary under 500 characters
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    Include relevant keywords for your industry
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    Save regularly, data auto-saves locally
                  </li>
                </ul>
              </div>
            </div>
          </div>

        {/* --- Nouveau Bloc : Send CV by Email --- */}
  <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6"></div>
    <h2 className="text-xl font-bold text-gray-800 mb-4">Send CV by Email</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
      <div className="md:col-span-2">
        <label className="block text-sm font-semibold mb-2 text-gray-700">Recipient Email</label>
        <input
          type="email"
          value={emailToSend}
          onChange={(e) => setEmailToSend(e.target.value)}
          placeholder="recipient@example.com"
          className="w-full p-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
        />
      </div>
    </div>
    <button
      onClick={handleSendCV}
      disabled={sending || !emailToSend.trim() || !cvData.personalInfo.fullName.trim()}
      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-200"
    >
      {sending ? 'Sending...' : 'Send CV'}
    </button>
    </div>
              {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Professional CV Builder • Your data is saved locally in your browser</p>
            <p className="mt-1">Designed for modern job seekers • PDF generation powered by jsPDF</p>
          </footer>
        </div>
    </div>
    </>
    
  );
}