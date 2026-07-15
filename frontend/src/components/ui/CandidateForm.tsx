import React, { useState } from 'react';
import { User, Mail, Link2, FileText, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

interface CandidateFormProps {
  onSubmit: (data: { name: string; email: string; linkedin: string; token: string }) => void;
  isLoading?: boolean;
}

export const CandidateForm: React.FC<CandidateFormProps> = ({ onSubmit, isLoading = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    linkedin: '',
    token: '',
    agreeToRecording: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.token.trim()) newErrors.token = 'Interview code/token is required';
    if (!formData.agreeToRecording) {
      newErrors.agreeToRecording = 'You must authorize video/audio analysis';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: formData.name,
        email: formData.email,
        linkedin: formData.linkedin,
        token: formData.token,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Jane Doe"
            className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border ${errors.name ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-accentPurple/50'
              } rounded-xl text-gray-100 placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm`}
          />
        </div>
        {errors.name && <p className="text-xs text-rose-600 mt-1.5">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="jane.doe@example.com"
            className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border ${errors.email ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-accentPurple/50'
              } rounded-xl text-gray-100 placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm`}
          />
        </div>
        {errors.email && <p className="text-xs text-rose-600 mt-1.5">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          LinkedIn Profile URL <span className="text-zinc-300">(Optional)</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <Link2 className="w-4 h-4" />
          </div>
          <input
            type="url"
            name="linkedin"
            value={formData.linkedin}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/username"
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 focus:border-accentPurple/50 rounded-xl text-gray-100 placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Interview Code
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
            <FileText className="w-4 h-4" />
          </div>
          <input
            type="text"
            name="token"
            value={formData.token}
            onChange={handleChange}
            placeholder="INV-XXXXXX"
            className={`w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border ${errors.token ? 'border-rose-500/50 focus:border-rose-500' : 'border-zinc-800 focus:border-accentPurple/50'
              } rounded-xl text-gray-100 placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-accentPurple/20 transition-all text-sm`}
          />
        </div>
        {errors.token && <p className="text-xs text-rose-600 mt-1.5">{errors.token}</p>}
      </div>

      <div className="pt-2">
        <label className="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            name="agreeToRecording"
            checked={formData.agreeToRecording}
            onChange={handleChange}
            className="sr-only"
          />
          <div className={`w-5 h-5 flex flex-shrink-0 items-center justify-center border rounded-md mr-3 transition-colors ${formData.agreeToRecording
              ? 'bg-accentPurple border-accentPurple text-white'
              : 'border-zinc-800 bg-zinc-900 group-hover:border-zinc-700'
            }`}>
            {formData.agreeToRecording && (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
              </svg>
            )}
          </div>
          <span className="text-xs text-gray-400 leading-normal select-none">
            I consent to video/audio recording and authorize Employites's transcription copilot to process and transcribe my responses for note-taking purposes.
          </span>
        </label>
        {errors.agreeToRecording && (
          <p className="text-xs text-rose-600 mt-1.5 ml-8">{errors.agreeToRecording}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="glow-btn w-full mt-4 py-3 bg-gradient-to-r from-accentPurple to-accentCyan text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying Credentials...
          </>
        ) : (
          <>
            Launch Interview Session <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
