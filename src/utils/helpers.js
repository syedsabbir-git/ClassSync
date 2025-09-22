// Generate random section key (8 characters)
export const generateSectionKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate student ID
export const isValidStudentId = (studentId) => {
  if (!studentId) return false;
  return true; // Assuming any non-empty string is valid for simplicity
};

// Validate password strength
export const isStrongPassword = (password) => {
  // At least 6 characters, contains letter and number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
};

// // Get priority color
// export const getPriorityColor = (priority) => {
//   switch (priority) {
//     case 'high':
//       return 'text-red-600 bg-red-100';
//     case 'medium':
//       return 'text-yellow-600 bg-yellow-100';
//     case 'low':
//       return 'text-green-600 bg-green-100';
//     default:
//       return 'text-gray-600 bg-gray-100';
//   }
// };