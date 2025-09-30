import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from './services';
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    try {
      const response = await authService.login(formData);
      onLogin(response.user, response.token);
      navigate(`/${response.user.role}`);
    } catch (error) {
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-5">
      <div className="bg-white/95 p-12 rounded-3xl shadow-2xl w-full max-width-md backdrop-blur-sm border border-amber-100">
        {/* Icon Header */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl shadow-lg">
            <Lock className="w-10 h-10 text-white" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-center mb-8 text-gray-800 text-4xl font-bold">
          Welcome Back
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div className="mb-6">
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
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-6">
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
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl text-base transition-all bg-white/80 focus:border-orange-600 focus:bg-orange-50/30 focus:outline-none"
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
            <LogIn className="w-5 h-5" strokeWidth={2} />
            {loading ? 'Logging in...' : 'Login to Dashboard'}
          </button>
        </form>

        {/* Register Link */}
        <p className="text-center mt-8 text-gray-600">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            className="text-orange-600 font-semibold transition-all hover:text-orange-800 hover:underline"
          >
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;