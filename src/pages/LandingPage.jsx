import React, { useState } from 'react';
import { User, Users, BookOpen, CheckCircle, ArrowRight, Eye, EyeOff, Mail, Lock, UserPlus, AlertCircle, Loader } from 'lucide-react';
import { useAuthActions } from '../hooks/useAuth';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, isValidStudentId, isStrongPassword } from '../utils/helpers';

const LandingPage = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [userType, setUserType] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    studentId: '',
    confirmPassword: ''
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const { signUp, signIn, resetPassword, loading, error, clearError } = useAuthActions();
  const { currentUser, userRole, userData } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
    
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (activeTab === 'signup' && !isStrongPassword(formData.password)) {
      errors.password = 'Password must be at least 6 characters with letters and numbers';
    }

    if (activeTab === 'signup') {
      if (!formData.name.trim()) {
        errors.name = 'Full name is required';
      }

      if (userType === 'student' && !formData.studentId) {
        errors.studentId = 'Student ID is required';
      } else if (userType === 'student' && !isValidStudentId(formData.studentId)) {
        errors.studentId = 'Please enter a valid student ID (4-10 digits)';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSuccessMessage('');
    
    try {
      if (activeTab === 'login') {
        const result = await signIn({
          email: formData.email,
          password: formData.password
        });
        
        if (result.success) {
          setSuccessMessage('Login successful! Redirecting...');
          // The auth context will handle the redirect automatically
        }
      } else {
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          name: formData.name.trim(),
          userType: userType,
          studentId: userType === 'student' ? formData.studentId : null
        });
        
        if (result.success) {
          setSuccessMessage('Account created successfully! Welcome to ClassSync!');
          // Clear form
          setFormData({
            email: '',
            password: '',
            name: '',
            studentId: '',
            confirmPassword: ''
          });
          // The auth context will handle the redirect automatically
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setValidationErrors({ email: 'Please enter your email address' });
      return;
    }
    
    if (!isValidEmail(formData.email)) {
      setValidationErrors({ email: 'Please enter a valid email address' });
      return;
    }

    const result = await resetPassword(formData.email);
    if (result.success) {
      setSuccessMessage('Password reset email sent! Check your inbox.');
    }
  };

  // If user is authenticated, call the callback to handle routing
  React.useEffect(() => {
    if (currentUser && userRole && userData) {
      onAuthSuccess && onAuthSuccess(userData);
    }
  }, [currentUser, userRole, userData, onAuthSuccess]);

  const features = [
    {
      icon: <BookOpen className="w-8 h-8 text-blue-500" />,
      title: "Manage Activities",
      description: "CRs can easily upload and manage assignments, quizzes, and lab tasks"
    },
    {
      icon: <Users className="w-8 h-8 text-green-500" />,
      title: "Section Management", 
      description: "Create sections with unique keys for student enrollment"
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-purple-500" />,
      title: "Priority System",
      description: "Organize activities by priority and track completion status"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ClassSync
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Hero Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Streamline Your
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Class Management
                </span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Connect Class Representatives and Students in one unified platform. 
                Manage assignments, track activities, and stay organized effortlessly.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4 p-4 rounded-2xl bg-white/50 backdrop-blur-sm border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Auth Form */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl shadow-blue-100 border border-gray-200/50 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex bg-gray-50 border-b border-gray-200">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    clearError();
                    setValidationErrors({});
                    setSuccessMessage('');
                  }}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === 'login'
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setActiveTab('signup');
                    clearError();
                    setValidationErrors({});
                    setSuccessMessage('');
                  }}
                  className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                    activeTab === 'signup'
                      ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              <div className="p-8">
                {/* Success Message */}
                {successMessage && (
                  <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{successMessage}</span>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* User Type Selection */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    I am a:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setUserType('student')}
                      className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${
                        userType === 'student'
                          ? 'border-blue-500 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="font-medium">Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserType('cr')}
                      className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 transition-all ${
                        userType === 'cr'
                          ? 'border-purple-500 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Class Rep</span>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  {activeTab === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <UserPlus className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Enter your full name"
                        />
                      </div>
                      {validationErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                      )}
                    </div>
                  )}

                  {activeTab === 'signup' && userType === 'student' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Student ID
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="studentId"
                          value={formData.studentId}
                          onChange={handleInputChange}
                          className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.studentId ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Enter your student ID"
                        />
                      </div>
                      {validationErrors.studentId && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.studentId}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          validationErrors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {validationErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                    )}
                  </div>

                  {activeTab === 'signup' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`block w-full pl-10 pr-10 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            validationErrors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                          }`}
                          placeholder="Confirm your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {validationErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                      userType === 'student'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-200'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-200'
                    } shadow-lg`}
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                        </span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {activeTab === 'login' && (
                    <div className="text-center">
                      <button 
                        type="button"
                        onClick={handleForgotPassword}
                        disabled={loading}
                        className="text-sm text-blue-600 hover:text-blue-500 transition-colors disabled:opacity-50"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 ClassSync. Built for seamless class management.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
