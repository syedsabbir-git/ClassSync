// src/components/dashboard/Settings/SettingsPage.jsx - Mobile Responsive
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  LogOut,
  UserX,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  Shield,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import sectionService from '../../../services/sectionService';
import authService from '../../../services/authService';

const SettingsPage = ({ onNavigate }) => {
  const { userData, userRole, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [enrolledSections, setEnrolledSections] = useState([]);
  const [managedSections, setManagedSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);
  
  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Profile form data
  const [profileData, setProfileData] = useState({
    name: userData?.name || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    studentId: userData?.studentId || ''
  });

  // Password form data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const isCR = userRole === 'cr';

  // Update profile data when userData changes
  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        studentId: userData.studentId || ''
      });
    }
  }, [userData]);

  // Load sections based on user role
  useEffect(() => {
    const loadSections = async () => {
      if (!userData) return;
      
      setSectionsLoading(true);
      try {
        if (isCR) {
          const result = await sectionService.getCRSections(userData.uid);
          if (result.success) {
            setManagedSections(result.sections || []);
          } else {
            setManagedSections([]);
          }
        } else {
          const result = await sectionService.getStudentSections(userData.uid);
          if (result.success) {
            setEnrolledSections(result.sections || []);
          } else {
            setEnrolledSections([]);
          }
        }
      } catch (err) {
        console.error('Error loading sections:', err);
      } finally {
        setSectionsLoading(false);
      }
    };

    loadSections();
  }, [userData, isCR]);

  // Clear messages when switching tabs
  useEffect(() => {
    setErrors({});
    setSuccess('');
    setShowMobileMenu(false); // Close mobile menu when tab changes
  }, [activeTab]);

  // Enhanced form validation
  const validateProfile = () => {
    const newErrors = {};
    
    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (profileData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters long';
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (profileData.phone && !/^[\+]?[0-9\-\(\)\s]+$/.test(profileData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    return newErrors;
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      const newErrors = validateProfile();
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      const result = await authService.updateProfile({
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        studentId: profileData.studentId.trim()
      });

      if (result.success) {
        setSuccess('Profile updated successfully!');
        
        // Refresh user data in AuthContext
        await refreshUserData();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setErrors({ submit: result.error });
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced password validation
  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    } else if (passwordData.newPassword === passwordData.currentPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      const newErrors = validatePassword();

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setLoading(false);
        return;
      }

      const result = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        setSuccess('Password changed successfully! You may need to sign in again.');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setErrors({ submit: result.error });
      }
    } catch (err) {
      console.error('Password change error:', err);
      setErrors({ submit: 'Failed to change password. Please check your current password and try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle logout with confirmation
  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to sign out?')) {
      return;
    }

    try {
      await authService.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
      window.location.href = '/login';
    }
  };

  // Handle student unenroll from section
  const handleUnenrollFromSection = async (sectionId, sectionName) => {
    const confirmMessage = `⚠️ IMPORTANT: Unenrolling from "${sectionName}" will:\n\n` +
      `• Remove your access to all tasks and materials\n` +
      `• Delete your progress and submissions\n` +
      `• Sign you out immediately\n\n` +
      `This action cannot be undone. Are you sure you want to continue?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const result = await sectionService.unenrollStudent(sectionId, userData.uid);
      if (result.success) {
        setEnrolledSections(prev => prev.filter(s => s.id !== sectionId));
        setSuccess('Successfully unenrolled from section. Signing out in 3 seconds...');
        
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            setSuccess(`Successfully unenrolled from section. Signing out in ${countdown} seconds...`);
          } else {
            clearInterval(countdownInterval);
          }
        }, 1000);
        
        setTimeout(async () => {
          try {
            await authService.signOut();
          } catch (err) {
            console.error('Error signing out:', err);
            window.location.href = '/login';
          }
        }, 3000);
        
      } else {
        setErrors({ unenroll: result.error });
      }
    } catch (err) {
      console.error('Unenroll error:', err);
      setErrors({ unenroll: 'Failed to unenroll from section. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Handle CR delete section
  const handleDeleteSection = async (sectionId, sectionName) => {
    const confirmMessage = `🚨 DANGER: Deleting "${sectionName}" will:\n\n` +
      `• Permanently remove ALL activities and assignments\n` +
      `• Unenroll ALL students from this section\n` +
      `• Delete ALL student progress and submissions\n` +
      `• Sign you out immediately\n\n` +
      `⚠️ THIS ACTION CANNOT BE UNDONE ⚠️\n\n` +
      `Type "DELETE" to confirm (case-sensitive):`;
    
    const userInput = prompt(confirmMessage);
    if (userInput !== 'DELETE') {
      if (userInput !== null) {
        alert('Section deletion cancelled. You must type "DELETE" exactly to confirm.');
      }
      return;
    }

    const finalConfirm = window.confirm(
      `Final confirmation: Are you absolutely sure you want to delete "${sectionName}" and all its data? This action is irreversible.`
    );
    
    if (!finalConfirm) {
      return;
    }

    setLoading(true);
    try {
      const result = await sectionService.deleteSection(sectionId, userData.uid);
      if (result.success) {
        setManagedSections(prev => prev.filter(s => s.id !== sectionId));
        setSuccess('Section deleted successfully. Signing out in 3 seconds...');
        
        let countdown = 3;
        const countdownInterval = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            setSuccess(`Section deleted successfully. Signing out in ${countdown} seconds...`);
          } else {
            clearInterval(countdownInterval);
          }
        }, 1000);
        
        setTimeout(async () => {
          try {
            await authService.signOut();
          } catch (err) {
            console.error('Error signing out:', err);
            window.location.href = '/login';
          }
        }, 3000);
        
      } else {
        setErrors({ deleteSection: result.error });
      }
    } catch (err) {
      console.error('Delete section error:', err);
      setErrors({ deleteSection: 'Failed to delete section. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Get password strength indicator
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: '', color: '' };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return { strength, text: 'Weak', color: 'text-red-600' };
    if (strength <= 4) return { strength, text: 'Medium', color: 'text-yellow-600' };
    return { strength, text: 'Strong', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'password', name: 'Password', icon: Lock },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'sections', name: 'My Sections', icon: UserX }
  ];

  // Get current tab info
  const currentTab = tabs.find(tab => tab.id === activeTab);
  const CurrentTabIcon = currentTab?.icon;

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        
        {/* Mobile Header */}
        <div className="sm:hidden mb-4">
          {/* Mobile Tab Selector */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center space-x-3">
                {CurrentTabIcon && <CurrentTabIcon className="h-5 w-5 text-gray-600" />}
                <span className="font-medium text-gray-900">{currentTab?.name}</span>
              </div>
              {showMobileMenu ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            
            {showMobileMenu && (
              <div className="border-t border-gray-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setErrors({});
                        setSuccess('');
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
                
                {/* Mobile Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            
            {/* Desktop Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <nav className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setErrors({});
                        setSuccess('');
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                          : 'text-gray-600 hover:bg-white hover:text-gray-900'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
                
                {/* Desktop Logout Button */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    Sign Out
                  </button>
                </div>
              </nav>
            </div>

            {/* Desktop Content */}
            <div className="flex-1 p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="sm:hidden bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );

  // Render tab content function
  function renderTabContent() {
    return (
      <>
        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm text-green-700 font-medium">Success!</p>
                <p className="text-xs sm:text-sm text-green-600 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {(errors.submit || errors.unenroll || errors.deleteSection) && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm text-red-700 font-medium">Error</p>
                <p className="text-xs sm:text-sm text-red-600 mt-1">{errors.submit || errors.unenroll || errors.deleteSection}</p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            <div className="flex items-center mb-4 sm:mb-6">
              <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2 sm:mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Profile Information</h2>
            </div>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.name && <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {errors.name}
                </p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed pr-10"
                  />
                  <Shield className="absolute right-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <p className="mt-2 text-xs sm:text-sm text-gray-500">Email cannot be changed for security reasons</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                  className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                    errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {errors.phone}
                </p>}
              </div>

              {!isCR && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                  <input
                    type="text"
                    value={profileData.studentId}
                    onChange={(e) => setProfileData({...profileData, studentId: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your student ID"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div>
            <div className="flex items-center mb-4 sm:mb-6">
              <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2 sm:mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Change Password</h2>
            </div>
            
            <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password *</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.currentPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 sm:top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {errors.currentPassword}
                </p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password *</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.newPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 sm:top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </div>
                {passwordData.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 sm:h-2">
                        <div 
                          className={`h-1.5 sm:h-2 rounded-full transition-all ${
                            passwordStrength.strength <= 2 ? 'bg-red-500' :
                            passwordStrength.strength <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
                {errors.newPassword && <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {errors.newPassword}
                </p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors.confirmPassword ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 sm:top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-xs sm:text-sm text-red-600 flex items-center">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  {errors.confirmPassword}
                </p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Change Password
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Notifications Tab - Coming Soon */}
        {activeTab === 'notifications' && (
          <div>
            <div className="flex items-center mb-4 sm:mb-6">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2 sm:mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Notification Preferences</h2>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
              <div className="flex items-start">
                <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mr-3 sm:mr-4 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-yellow-800">Coming Soon</h3>
                  <p className="text-sm sm:text-base text-yellow-700 mt-1">
                    Notification preferences will be available in a future update. 
                    Currently, you'll receive notifications for all important activities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Sections Tab */}
        {activeTab === 'sections' && (
          <div>
            <div className="flex items-center mb-4 sm:mb-6">
              <UserX className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 mr-2 sm:mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {isCR ? 'My Managed Sections' : 'My Enrolled Sections'}
              </h2>
            </div>

            {sectionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mr-2 sm:mr-3"></div>
                <span className="text-sm sm:text-base text-gray-600">Loading sections...</span>
              </div>
            ) : (
              isCR ? (
                <>
                  {managedSections.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                      <UserX className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Managed Sections</h3>
                      <p className="text-sm text-gray-500 mb-4">You don't manage any sections yet.</p>
                      <button
                        onClick={() => onNavigate && onNavigate('overview')}
                        className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-red-800">⚠️ Danger Zone</h4>
                            <p className="text-xs sm:text-sm text-red-700 mt-2">
                              Deleting a section will permanently remove:
                            </p>
                            <ul className="text-xs sm:text-sm text-red-700 mt-2 list-disc list-inside ml-4">
                              <li>All activities and assignments</li>
                              <li>All student enrollments and progress</li>
                              <li>All related data and files</li>
                            </ul>
                            <p className="text-xs sm:text-sm text-red-700 mt-2 font-medium">
                              You will be automatically signed out after deletion.
                            </p>
                          </div>
                        </div>
                      </div>

                      {managedSections.map((section) => (
                        <div key={section.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-sm transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{section.departmentName}</h3>
                              <p className="text-sm text-gray-600 mt-1">Batch: {section.batchNumber}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 text-xs sm:text-sm text-gray-500 space-y-1 sm:space-y-0">
                                <span>👥 {section.studentCount || 0} students</span>
                                <span>📋 {section.activityCount || 0} activities</span>
                                <span className="hidden sm:inline">🗓️ Created {new Date(section.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteSection(section.id, section.departmentName)}
                              disabled={loading}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Delete Section
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {enrolledSections.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg">
                      <UserX className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Enrolled Sections</h3>
                      <p className="text-sm text-gray-500 mb-4">You are not enrolled in any sections yet.</p>
                      <button
                        onClick={() => onNavigate && onNavigate('overview')}
                        className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Go to Dashboard
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                          <div>
                            <h4 className="text-sm font-medium text-blue-800">📋 Important Information</h4>
                            <p className="text-xs sm:text-sm text-blue-700 mt-2">
                              Unenrolling from a section will:
                            </p>
                            <ul className="text-xs sm:text-sm text-blue-700 mt-2 list-disc list-inside ml-4">
                              <li>Remove access to all tasks and materials</li>
                              <li>Delete your progress and submissions</li>
                              <li>Sign you out immediately</li>
                            </ul>
                            <p className="text-xs sm:text-sm text-blue-700 mt-2 font-medium">
                              This action cannot be undone.
                            </p>
                          </div>
                        </div>
                      </div>

                      {enrolledSections.map((section) => (
                        <div key={section.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-sm transition-shadow">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{section.departmentName}</h3>
                              <p className="text-sm text-gray-600 mt-1">Batch: {section.batchNumber}</p>
                              <p className="text-sm text-gray-500 mt-1">👨‍🏫 CR: {section.crName}</p>
                              <p className="text-xs sm:text-sm text-gray-500 mt-1">🗓️ Enrolled {new Date(section.createdAt).toLocaleDateString()}</p>
                            </div>
                            <button
                              onClick={() => handleUnenrollFromSection(section.id, section.departmentName)}
                              disabled={loading}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <UserX className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Unenroll
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )
            )}
          </div>
        )}
      </>
    );
  }
};

export default SettingsPage;
