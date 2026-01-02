// src/components/dashboard/StudyHelper/StudyHelperPage.jsx - Quiz System
import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, FileText, CheckCircle, XCircle, AlertCircle, Library } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import activityService from '../../../services/dashboard/activityService';
import resourceService from '../../../services/resourceService';
import studyHelperService from '../../../services/studyHelperService';
import LoadingSpinner from '../Shared/LoadingSpinner';

const StudyHelperPage = () => {
  const { userData } = useAuth();
  
  // Task management
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState(null);
  
  // Quiz setup
  const [questionType, setQuestionType] = useState('mcq'); // 'mcq' or 'short'
  const [userContext, setUserContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);
  
  // Quiz state
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  
  // Resources
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);
  
  // Fetch tasks on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (userData?.uid) {
      fetchStudentTasks();
    }
  }, [userData?.uid]);

  const fetchStudentTasks = async () => {
    try {
      setLoadingTasks(true);
      setError(null);
      
      const sections = userData?.role === 'cr' 
        ? (userData?.managedSections || [])
        : (userData?.enrolledSections || []);
      
      if (!sections || sections.length === 0) {
        setError('No sections found.');
        setTasks([]);
        setLoadingTasks(false);
        return;
      }

      let allTasks = [];

      for (const sectionId of sections) {
        try {
          const result = await activityService.getActivitiesBySection(sectionId);
          let sectionActivities = Array.isArray(result) ? result : (result?.activities || []);
          
          if (!Array.isArray(sectionActivities)) continue;
          
          const now = new Date();
          
          const upcomingTasks = sectionActivities
            .filter(activity => {
              if (!activity) return false;
              const dueDate = activity.dueDate?.toDate?.() || new Date(activity.dueDate);
              return dueDate > now;
            })
            .map(activity => {
              const dueDate = activity.dueDate?.toDate?.() || new Date(activity.dueDate);
              const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
              return {
                ...activity,
                daysLeft: Math.max(0, daysLeft),
                sectionId,
                dueDate
              };
            });

          allTasks = [...allTasks, ...upcomingTasks];
        } catch (err) {
          console.error(`Error fetching activities for section ${sectionId}:`, err);
        }
      }

      allTasks.sort((a, b) => a.dueDate - b.dueDate);
      setTasks(allTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to load tasks.');
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleSelectTask = async (task) => {
    setSelectedTask(task);
    setQuiz(null);
    setAnswers({});
    setQuizSubmitted(false);
    setQuizResults(null);
    setUserContext('');
    setShowContextInput(false);
    
    // Fetch resources for this topic
    await fetchRelatedResources(task.title);
  };

  const fetchRelatedResources = async (topic) => {
    try {
      setLoadingResources(true);
      
      // Get all resources globally
      const result = await resourceService.getResources();
      
      if (!result.success || !result.resources) {
        console.warn('Failed to fetch resources:', result.error);
        setResources([]);
        return;
      }
      
      // Filter by topic keywords
      const topicLower = topic.toLowerCase();
      const filtered = result.resources.filter(resource => 
        resource.title?.toLowerCase().includes(topicLower) ||
        resource.description?.toLowerCase().includes(topicLower) ||
        resource.topic?.toLowerCase().includes(topicLower) ||
        resource.tags?.some(tag => topicLower.includes(tag.toLowerCase()))
      );
      
      // Show filtered results if found, otherwise show recent resources
      setResources(filtered.length > 0 ? filtered : result.resources.slice(0, 5));
    } catch (err) {
      console.error('Error fetching resources:', err);
      setResources([]);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!selectedTask) return;
    
    try {
      setLoadingQuiz(true);
      setError(null);
      
      const quizData = await studyHelperService.generateQuiz(
        selectedTask.title,
        selectedTask.description || '',
        questionType,
        userContext
      );
      
      setQuiz(quizData);
      setAnswers({});
      setQuizSubmitted(false);
      setQuizResults(null);
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!quiz) return;
    
    setQuizSubmitted(true);
    
    try {
      if (questionType === 'mcq') {
        // Grade MCQ locally
        let correct = 0;
        const results = quiz.questions.map(q => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.correctAnswer;
          if (isCorrect) correct++;
          
          return {
            questionId: q.id,
            isCorrect,
            userAnswer,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
          };
        });
        
        setQuizResults({
          type: 'mcq',
          correct,
          total: quiz.questions.length,
          percentage: Math.round((correct / quiz.questions.length) * 100),
          results
        });
      } else {
        // Grade short answers with AI
        const answerArray = quiz.questions.map(q => answers[q.id] || '');
        const gradingResults = await studyHelperService.gradeShortAnswers(
          quiz.questions,
          answerArray
        );
        
        setQuizResults({
          type: 'short',
          ...gradingResults
        });
      }
    } catch (err) {
      console.error('Error grading quiz:', err);
      setError('Failed to grade quiz. Please try again.');
    }
  };

  // If still loading tasks
  if (loadingTasks) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Task selection view
  if (!selectedTask) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">AI Quiz Helper</h1>
          </div>
          <p className="text-gray-600">Select a task to generate an AI-powered practice quiz</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Upcoming Tasks</h3>
            <p className="text-gray-600">You don't have any upcoming tasks or quizzes.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleSelectTask(task)}
                className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{task.title}</h3>
                    <p className="text-gray-600 text-sm">{task.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.daysLeft <= 3 ? 'bg-red-100 text-red-800' :
                    task.daysLeft <= 7 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.daysLeft} days left
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="capitalize">{task.type}</span>
                  <span>•</span>
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Quiz interface view
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => setSelectedTask(null)}
            className="text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Tasks
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h1>
          <p className="text-gray-600">{selectedTask.description}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Quiz Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quiz Setup */}
            {!quiz && !loadingQuiz && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Generate Practice Quiz</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setQuestionType('mcq')}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          questionType === 'mcq'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <div className="font-medium">MCQ</div>
                        <div className="text-sm text-gray-600">15 Questions</div>
                      </button>
                      <button
                        onClick={() => setQuestionType('short')}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          questionType === 'short'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <BookOpen className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <div className="font-medium">Short Answer</div>
                        <div className="text-sm text-gray-600">3 Questions (5 marks each)</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => setShowContextInput(!showContextInput)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {showContextInput ? '- Hide' : '+ Add'} additional context (optional)
                    </button>
                    
                    {showContextInput && (
                      <textarea
                        value={userContext}
                        onChange={(e) => setUserContext(e.target.value)}
                        placeholder="Add any specific topics or areas you want to focus on..."
                        className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                      />
                    )}
                  </div>

                  <button
                    onClick={handleGenerateQuiz}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-colors"
                  >
                    Generate Quiz
                  </button>
                </div>
              </div>
            )}

            {/* Loading Quiz */}
            {loadingQuiz && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <LoadingSpinner />
                <p className="mt-4 text-gray-600">Generating your quiz...</p>
              </div>
            )}

            {/* Quiz Questions */}
            {quiz && !quizSubmitted && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-6">
                  {questionType === 'mcq' ? 'Multiple Choice Questions' : 'Short Answer Questions'}
                </h2>
                
                <div className="space-y-6">
                  {quiz.questions.map((q, idx) => (
                    <div key={q.id} className="pb-6 border-b border-gray-200 last:border-0">
                      <div className="font-medium text-gray-900 mb-3">
                        {idx + 1}. {q.question}
                      </div>
                      
                      {questionType === 'mcq' ? (
                        <div className="space-y-2">
                          {q.options.map((option, optIdx) => (
                            <label
                              key={optIdx}
                              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                answers[q.id] === optIdx
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${q.id}`}
                                checked={answers[q.id] === optIdx}
                                onChange={() => handleAnswerChange(q.id, optIdx)}
                                className="mr-3"
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <textarea
                            value={answers[q.id] || ''}
                            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                            placeholder="Write your answer here..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows="4"
                          />
                          <div className="mt-2 text-sm text-gray-600">
                            {q.marks} marks
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(answers).length === 0}
                  className="mt-6 w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Submit Quiz
                </button>
              </div>
            )}

            {/* Quiz Results */}
            {quizSubmitted && quizResults && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                    <CheckCircle className="w-12 h-12 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
                  
                  {quizResults.type === 'mcq' ? (
                    <div>
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {quizResults.percentage}%
                      </div>
                      <p className="text-gray-600">
                        {quizResults.correct} out of {quizResults.total} correct
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl font-bold text-blue-600 mb-2">
                        {quizResults.totalScore}/{quizResults.totalPossible}
                      </div>
                      <p className="text-gray-600">Total Score</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {quizResults.type === 'mcq' ? (
                    quiz.questions.map((q, idx) => {
                      const result = quizResults.results[idx];
                      return (
                        <div key={q.id} className="p-4 rounded-lg bg-gray-50">
                          <div className="flex items-start gap-3 mb-2">
                            {result.isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 mb-2">{q.question}</div>
                              <div className="text-sm text-gray-600 mb-1">
                                Your answer: <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                                  {q.options[result.userAnswer] || 'Not answered'}
                                </span>
                              </div>
                              {!result.isCorrect && (
                                <div className="text-sm text-green-600 mb-2">
                                  Correct answer: {q.options[result.correctAnswer]}
                                </div>
                              )}
                              <div className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                                {q.explanation}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div>
                      {quizResults.results?.map((result, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-gray-50 mb-4">
                          <div className="font-medium text-gray-900 mb-2">
                            Question {idx + 1}: {result.marksAwarded}/{result.totalMarks} marks
                          </div>
                          <div className="text-sm text-gray-700 p-2 bg-white rounded">
                            {result.feedback}
                          </div>
                        </div>
                      ))}
                      {quizResults.overallFeedback && (
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="font-medium text-blue-900 mb-2">Overall Feedback</div>
                          <div className="text-sm text-blue-800">{quizResults.overallFeedback}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setQuiz(null);
                    setQuizSubmitted(false);
                    setQuizResults(null);
                    setAnswers({});
                  }}
                  className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Generate New Quiz
                </button>
              </div>
            )}
          </div>

          {/* Resources Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Library className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Related Resources</h3>
              </div>
              
              {loadingResources ? (
                <LoadingSpinner />
              ) : resources.length === 0 ? (
                <p className="text-sm text-gray-600">No resources available</p>
              ) : (
                <div className="space-y-3">
                  {resources.map(resource => {
                    // Use file_url for all resources (PDFs, YouTube, etc)
                    const href = resource.file_url || resource.fileURL;
                    return (
                      <a
                        key={resource.id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900 text-sm mb-1">
                          {resource.title}
                        </div>
                        {resource.description && (
                          <div className="text-xs text-gray-600 line-clamp-2">
                            {resource.description}
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyHelperPage;
