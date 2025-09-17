// src/components/dashboard/Students/StudentsPage.jsx - Mobile Responsive with Loading States
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserMinus, 
  Mail, 
  Phone, 
  Calendar,
  Users
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import sectionService from '../../../services/sectionService';

const StudentsPage = ({ onNavigate }) => {
  const { userData } = useAuth();
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Load CR sections
  useEffect(() => {
    const loadSections = async () => {
      if (!userData) return;
      
      try {
        const result = await sectionService.getCRSections(userData.uid);
        if (result.success && result.sections.length > 0) {
          setSections(result.sections);
          setSelectedSection(result.sections[0]);
        }
      } catch (err) {
        console.error('Error loading sections:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSections();
  }, [userData]);

  // Load students for selected section
  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedSection) return;
      
      setStudentsLoading(true);
      try {
        const result = await sectionService.getSectionStudents(selectedSection.id);
        if (result.success) {
          setStudents(result.students || []);
        }
      } catch (err) {
        console.error('Error loading students:', err);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    if (selectedSection) {
      loadStudents();
    }
  }, [selectedSection]);

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle unenroll student
  const handleUnenrollStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to unenroll ${studentName} from this section?`)) {
      return;
    }

    setActionLoading(studentId);
    try {
      const result = await sectionService.unenrollStudent(selectedSection.id, studentId);
      if (result.success) {
        setStudents(prev => prev.filter(s => s.uid !== studentId));
        // Update section student count
        setSelectedSection(prev => ({
          ...prev,
          studentCount: prev.studentCount - 1
        }));
      } else {
        alert('Failed to unenroll student: ' + result.error);
      }
    } catch (err) {
      alert('Error unenrolling student');
      console.error('Error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 text-sm">Loading sections...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
  

        {selectedSection && (
          <>
            {/* Section Info - Mobile Responsive */}
            <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {selectedSection.departmentName}
                  </h2>
                  <p className="text-sm text-gray-600">Batch: {selectedSection.batchNumber}</p>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="text-base sm:text-lg font-semibold">{students.length}</span>
                  <span className="text-sm">students enrolled</span>
                </div>
              </div>
            </div>

            {/* Search - Mobile Responsive */}
            <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Students List with Loading State */}
            {studentsLoading ? (
              <div className="bg-white rounded-lg p-6 sm:p-12 text-center border border-gray-200 shadow-sm">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="bg-white rounded-lg p-6 sm:p-12 text-center border border-gray-200 shadow-sm">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No matching students' : 'No students enrolled'}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Students will appear here once they enroll in this section'
                  }
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm sm:text-lg font-medium text-gray-900">
                    Enrolled Students ({filteredStudents.length})
                  </h3>
                </div>
                
                {/* Students List */}
                <div className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <div key={student.uid} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                      
                      {/* Mobile Layout */}
                      <div className="sm:hidden">
                        <div className="flex items-start space-x-3 mb-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-medium text-sm">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Name and Action */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-medium text-gray-900 truncate">
                                  {student.name}
                                </h4>
                                <p className="text-xs text-gray-600 mt-0.5">
                                  ID: {student.studentId}
                                </p>
                              </div>
                              
                              {/* Mobile Action Button */}
                              <button
                                onClick={() => handleUnenrollStudent(student.uid, student.name)}
                                disabled={actionLoading === student.uid}
                                className="flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-2 flex-shrink-0"
                              >
                                {actionLoading === student.uid ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                                ) : (
                                  <UserMinus className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Mobile Contact Info */}
                        <div className="ml-13 space-y-1">
                          <div className="flex items-center space-x-1 text-xs text-gray-600">
                            <Mail className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                          {student.enrolledAt && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>Enrolled {new Date(student.enrolledAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-lg">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Student Info */}
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">{student.name}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-4 w-4" />
                                <span>{student.email}</span>
                              </div>
                              {student.phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-4 w-4" />
                                  <span>{student.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">ID:</span>
                                <span>{student.studentId}</span>
                              </div>
                            </div>
                            {student.enrolledAt && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
                                <Calendar className="h-3 w-3" />
                                <span>Enrolled {new Date(student.enrolledAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Desktop Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUnenrollStudent(student.uid, student.name)}
                            disabled={actionLoading === student.uid}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {actionLoading === student.uid ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                            ) : (
                              <UserMinus className="h-4 w-4 mr-2" />
                            )}
                            Unenroll
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentsPage;
