// src/services/pollService.js - Firebase Realtime Database for polls with notifications
import {
  ref,
  push,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  serverTimestamp
} from 'firebase/database';
import { realtimeDb } from '../config/firebase'; // Make sure you have this
import notificationService from './notificationService';
import sectionService from './sectionService';

class PollService {
  constructor() {
    this.pollsPath = 'polls';
    this.responsesPath = 'poll_responses';
  }

  // Create new poll (for CRs)
  async createPoll({ sectionId, crId, question, options, crName, allowMultiple = false }) {
    try {
      console.log('Creating poll:', { sectionId, crId, question, options });

      // Validate required fields
      if (!question || !question.trim()) {
        throw new Error('Poll question is required');
      }

      if (!options || options.length < 2) {
        throw new Error('Poll must have at least 2 options');
      }

      if (!sectionId || !crId) {
        throw new Error('Section ID and CR ID are required');
      }

      // Create poll data
      const pollData = {
        sectionId: sectionId,
        crId: crId,
        crName: crName || 'Unknown CR',
        question: question.trim(),
        options: options.map((option, index) => ({
          id: index,
          text: option.trim(),
          votes: 0
        })),
        allowMultiple: allowMultiple,
        status: 'active', // 'active', 'closed', 'draft'
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalResponses: 0,
        respondedUsers: [] // Array of user IDs who have responded
      };

      // Push to Firebase Realtime Database
      const pollRef = push(ref(realtimeDb, this.pollsPath));
      await set(pollRef, pollData);

      console.log('Poll created successfully with ID:', pollRef.key);

      // Create notifications for students
      try {
        // Get section data to retrieve student list
        const sectionResult = await sectionService.getSectionById(sectionId);

        if (sectionResult.success && sectionResult.section?.enrolledStudents?.length > 0) {
          // In pollService.js, update the notification creation
          await notificationService.createNotificationForSection({
            sectionId: sectionId,
            crId: crId,
            crName: crName || 'Class Representative',
            title: 'New Poll Created',
            message: question.trim(),
            type: 'poll',
            relatedId: pollRef.key,
            studentIds: sectionResult.section.enrolledStudents,
            notifyCR: true // Add this line
          });


          console.log('Notifications created for new poll');
        }
      } catch (notificationError) {
        // Log notification error but don't fail the poll creation
        console.error('Error creating notifications for poll:', notificationError);
      }

      return { success: true, pollId: pollRef.key, poll: { ...pollData, id: pollRef.key } };

    } catch (error) {
      console.error('Error creating poll:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get polls for a section
  async getPollsBySection(sectionId, includeInactive = false) {
    try {
      console.log('Loading polls for section:', sectionId);

      if (!sectionId) {
        console.log('No section ID provided');
        return { success: true, polls: [] };
      }

      const pollsRef = ref(realtimeDb, this.pollsPath);
      const snapshot = await get(pollsRef);

      if (!snapshot.exists()) {
        return { success: true, polls: [] };
      }

      const pollsData = snapshot.val();
      const polls = [];

      // Filter polls by section
      Object.keys(pollsData).forEach(pollId => {
        const poll = pollsData[pollId];
        if (poll.sectionId === sectionId) {
          if (includeInactive || poll.status === 'active') {
            polls.push({
              ...poll,
              id: pollId
            });
          }
        }
      });

      // Sort by creation date (newest first)
      polls.sort((a, b) => {
        const aTime = a.createdAt || 0;
        const bTime = b.createdAt || 0;
        return bTime - aTime;
      });

      console.log('Found polls:', polls.length);
      return { success: true, polls };

    } catch (error) {
      console.error('Error getting polls:', error);
      return { success: false, error: this.getErrorMessage(error), polls: [] };
    }
  }

  // Submit poll response (for students)
  async submitPollResponse({ pollId, studentId, studentName, selectedOptions }) {
    try {
      console.log('Submitting poll response:', { pollId, studentId, selectedOptions });

      // Validate input
      if (!pollId || !studentId || !selectedOptions || selectedOptions.length === 0) {
        throw new Error('Missing required data for poll response');
      }

      // Get current poll data
      const pollRef = ref(realtimeDb, `${this.pollsPath}/${pollId}`);
      const pollSnapshot = await get(pollRef);

      if (!pollSnapshot.exists()) {
        throw new Error('Poll not found');
      }

      const pollData = pollSnapshot.val();

      // Check if poll is active
      if (pollData.status !== 'active') {
        throw new Error('This poll is no longer active');
      }

      // Check if user already responded
      const respondedUsers = pollData.respondedUsers || [];
      if (respondedUsers.includes(studentId)) {
        throw new Error('You have already responded to this poll');
      }

      // Validate selected options
      if (!pollData.allowMultiple && selectedOptions.length > 1) {
        throw new Error('This poll allows only one selection');
      }

      // Update poll with new response
      const updates = {};

      // Update vote counts for selected options
      selectedOptions.forEach(optionId => {
        const currentVotes = pollData.options[optionId]?.votes || 0;
        updates[`${this.pollsPath}/${pollId}/options/${optionId}/votes`] = currentVotes + 1;
      });

      // Add user to responded users list
      updates[`${this.pollsPath}/${pollId}/respondedUsers`] = [...respondedUsers, studentId];

      // Increment total responses
      updates[`${this.pollsPath}/${pollId}/totalResponses`] = (pollData.totalResponses || 0) + 1;

      // Update timestamp
      updates[`${this.pollsPath}/${pollId}/updatedAt`] = serverTimestamp();

      // Store individual response
      const responseData = {
        pollId: pollId,
        studentId: studentId,
        studentName: studentName,
        selectedOptions: selectedOptions,
        respondedAt: serverTimestamp()
      };

      const responseRef = push(ref(realtimeDb, `${this.responsesPath}/${pollId}`));
      updates[`${this.responsesPath}/${pollId}/${responseRef.key}`] = responseData;

      // Apply all updates atomically
      await update(ref(realtimeDb), updates);

      console.log('Poll response submitted successfully');
      return { success: true };

    } catch (error) {
      console.error('Error submitting poll response:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Update poll status (close/reopen poll)
  async updatePollStatus(pollId, status) {
    try {
      const pollRef = ref(realtimeDb, `${this.pollsPath}/${pollId}`);

      const updates = {
        status: status,
        updatedAt: serverTimestamp()
      };

      await update(pollRef, updates);

      console.log('Poll status updated successfully');
      return { success: true };

    } catch (error) {
      console.error('Error updating poll status:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Delete poll (for CRs)
  async deletePoll(pollId) {
    try {
      console.log('Deleting poll:', pollId);

      const updates = {};
      updates[`${this.pollsPath}/${pollId}`] = null;
      updates[`${this.responsesPath}/${pollId}`] = null;

      await update(ref(realtimeDb), updates);

      console.log('Poll deleted successfully');
      return { success: true };

    } catch (error) {
      console.error('Error deleting poll:', error);
      return { success: false, error: this.getErrorMessage(error) };
    }
  }

  // Get poll responses (for CRs)
  async getPollResponses(pollId) {
    try {
      const responsesRef = ref(realtimeDb, `${this.responsesPath}/${pollId}`);
      const snapshot = await get(responsesRef);

      if (!snapshot.exists()) {
        return { success: true, responses: [] };
      }

      const responsesData = snapshot.val();
      const responses = Object.keys(responsesData).map(responseId => ({
        id: responseId,
        ...responsesData[responseId]
      }));

      return { success: true, responses };
    } catch (error) {
      console.error('Error getting poll responses:', error);
      return { success: false, error: this.getErrorMessage(error), responses: [] };
    }
  }

  // Real-time listener for polls
  subscribeToPollsBySection(sectionId, callback, includeInactive = false) {
    try {
      const pollsRef = ref(realtimeDb, this.pollsPath);

      const unsubscribe = onValue(pollsRef, (snapshot) => {
        if (!snapshot.exists()) {
          callback({ success: true, polls: [] });
          return;
        }

        const pollsData = snapshot.val();
        const polls = [];

        // Filter polls by section
        Object.keys(pollsData).forEach(pollId => {
          const poll = pollsData[pollId];
          if (poll.sectionId === sectionId) {
            if (includeInactive || poll.status === 'active') {
              polls.push({
                ...poll,
                id: pollId
              });
            }
          }
        });

        // Sort by creation date (newest first)
        polls.sort((a, b) => {
          const aTime = a.createdAt || 0;
          const bTime = b.createdAt || 0;
          return bTime - aTime;
        });

        callback({ success: true, polls });
      }, (error) => {
        console.error('Error in polls subscription:', error);
        callback({ success: false, error: this.getErrorMessage(error) });
      });

      return () => off(pollsRef, 'value', unsubscribe);
    } catch (error) {
      console.error('Error setting up polls subscription:', error);
      return null;
    }
  }

  // Helper method to format error messages
  getErrorMessage(error) {
    console.error('Firebase Realtime Database error details:', error);

    if (error.code) {
      switch (error.code) {
        case 'PERMISSION_DENIED':
          return 'Permission denied. Please make sure you are logged in and have the right permissions.';
        case 'NETWORK_ERROR':
          return 'Network error. Please check your connection and try again.';
        case 'UNAVAILABLE':
          return 'Service is temporarily unavailable. Please try again later.';
        default:
          return `An error occurred: ${error.message || 'Unknown error'}`;
      }
    }

    return error.message || 'An unexpected error occurred. Please try again.';
  }
}

export default new PollService();
