import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from './services';
import { UserPlus, User, Mail, Lock, Building2, MapPin, AlertCircle, Briefcase } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'vendor',
    organization: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData);
      navigate('/login');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-5">
      <div className="bg-white/95 p-12 rounded-3xl shadow-2xl w-full max-w-lg backdrop-blur-sm border border-amber-100">
        {/* Icon Header */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl shadow-lg">
            <UserPlus className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center mb-8 text-gray-800 text-4xl font-bold">
          Create Account
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-semibold text-sm">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-semibold text-sm">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Role */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-semibold text-sm">
              Role
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <select 
                name="role" 
                value={formData.role} 
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none cursor-pointer appearance-none"
              >
                <option value="vendor">Vendor</option>
                <option value="depot">Depot Staff</option>
                <option value="installation">Installation Crew</option>
                <option value="inspector">Inspector</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Organization */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-semibold text-sm">
              Organization
            </label>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="text"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                placeholder="Your Company"
              />
            </div>
          </div>

          {/* Location */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-semibold text-sm">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                placeholder="City, Country"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-semibold text-sm">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-5">
            <label className="block mb-2 text-gray-700 font-semibold text-sm">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" strokeWidth={1.5} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl mb-5 flex items-center gap-3 shadow-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl text-lg font-semibold cursor-pointer transition-all mt-3 shadow-xl shadow-orange-600/30 hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-600/40 hover:from-orange-700 hover:to-orange-800 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-3"
          >
            <UserPlus className="w-5 h-5" strokeWidth={2} />
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-8 text-gray-600">
          Already have an account?{' '}
          <Link 
            to="/login" 
            className="text-orange-600 font-semibold transition-all hover:text-orange-800 hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;