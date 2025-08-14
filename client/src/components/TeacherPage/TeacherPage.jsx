import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import Chat from '../Chat/Chat.jsx';
import './TeacherPage.css';

const TeacherPage = ({ quizSession, teacher, onBackToDashboard, onLogout }) => {
  const { socket, connected } = useSocket();
  const [question, setQuestion] = useState('');
  const [timer, setTimer] = useState(60);
  const [options, setOptions] = useState(['', '']);
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [pollActive, setPollActive] = useState(false);
  const [students, setStudents] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pollResults, setPollResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [studentResults, setStudentResults] = useState([]);
  const [showStudentResults, setShowStudentResults] = useState(false);

  const handleCopyQuizCode = async () => {
    try {
      await navigator.clipboard.writeText(quizSession?.quizCode || '');
      alert('Quiz code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy quiz code:', err);
      alert('Failed to copy quiz code');
    }
  };

  // Auto-join teacher to quiz session
  useEffect(() => {
    if (socket && connected && quizSession && quizSession.quizCode) {
      socket.emit('teacher-join', { quizCode: quizSession.quizCode });
    }
  }, [socket, connected, quizSession]);

  useEffect(() => {
    if (!socket) return;

    // Listen for socket events
    socket.on('teacher-joined', (data) => {
      console.log('Teacher joined:', data.message);
      if (data.students) {
        setStudents(data.students);
        setTotalStudents(data.students.length);
      }
    });

    socket.on('teacher-join-error', (data) => {
      console.error('Teacher join error:', data.message);
      alert('Failed to join quiz session: ' + data.message);
    });

    socket.on('students-update', (data) => {
      setStudents(data.students);
      setTotalStudents(data.totalStudents);
    });

    socket.on('poll-results', (results) => {
      setPollResults(results);
      setPollActive(false);
      setTimeLeft(0);
    });

    socket.on('student-answer-update', (data) => {
      // Update student results with their answer data
      setStudentResults(prevResults => {
        const existingIndex = prevResults.findIndex(r => r.studentId === data.studentId);
        if (existingIndex >= 0) {
          const updated = [...prevResults];
          updated[existingIndex] = {
            ...updated[existingIndex],
            totalScore: data.totalScore,
            totalAnswered: data.totalAnswered,
            lastAnswer: data.lastAnswer,
            isCorrect: data.isCorrect,
            timestamp: data.timestamp
          };
          return updated;
        } else {
          return [...prevResults, {
            studentId: data.studentId,
            studentName: data.studentName,
            totalScore: data.totalScore,
            totalAnswered: data.totalAnswered,
            lastAnswer: data.lastAnswer,
            isCorrect: data.isCorrect,
            timestamp: data.timestamp
          }];
        }
      });
    });

    return () => {
      socket.off('teacher-joined');
      socket.off('teacher-join-error');
      socket.off('students-update');
      socket.off('poll-results');
      socket.off('student-answer-update');
    };
  }, [socket]);

  // Timer countdown when poll is active
  useEffect(() => {
    if (pollActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (pollActive && timeLeft === 0) {
      if (socket && pollActive) {
        socket.emit('end-poll', { quizCode: quizSession.quizCode });
      }
    }
  }, [timeLeft, pollActive, socket, quizSession.quizCode]);

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
      // Reset correct answer if it was pointing to removed option
      if (parseInt(correctAnswer) >= newOptions.length) {
        setCorrectAnswer('');
      }
    }
  };

  const handleAskQuestion = () => {
    if (question.trim() && options.every(opt => opt.trim()) && correctAnswer !== '' && socket) {
      const pollData = {
        quizCode: quizSession.quizCode,
        question: question.trim(),
        options: options.filter(opt => opt.trim()),
        correctAnswer: parseInt(correctAnswer),
        timer
      };
      
      socket.emit('create-poll', pollData);
      setPollActive(true);
      setTimeLeft(timer);
      setPollResults(null);
    }
  };

  const handleSaveQuestion = () => {
    if (question.trim() && options.every(opt => opt.trim()) && correctAnswer !== '') {
      const newQuestion = {
        question: question.trim(),
        options: options.filter(opt => opt.trim()),
        correctAnswer: parseInt(correctAnswer),
        timer
      };
      
      setQuestions(prev => [...prev, newQuestion]);
      
      // Clear form
      setQuestion('');
      setOptions(['', '']);
      setCorrectAnswer('');
      setTimer(60);
      
      alert('Question saved to quiz bank!');
    }
  };

  const handleAskSavedQuestion = (questionIndex) => {
    if (socket && questions[questionIndex]) {
      const questionData = questions[questionIndex];
      const pollData = {
        quizCode: quizSession.quizCode,
        question: questionData.question,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        timer: questionData.timer,
        questionIndex
      };
      
      socket.emit('create-poll', pollData);
      setPollActive(true);
      setTimeLeft(questionData.timer);
      setPollResults(null);
      setCurrentQuestionIndex(questionIndex);
    }
  };

  const handleEndPoll = () => {
    if (socket && pollActive) {
      socket.emit('end-poll', { quizCode: quizSession.quizCode });
    }
  };

  const handleNewPoll = () => {
    setQuestion('');
    setOptions(['', '']);
    setCorrectAnswer('');
    setPollActive(false);
    setPollResults(null);
    setTimeLeft(0);
  };

  const isFormValid = question.trim() && options.every(opt => opt.trim()) && correctAnswer !== '';
  const answeredStudents = students.filter(s => s.hasAnswered).length;

  if (!connected) {
    return (
      <div className="teacher-container">
        <div className="teacher-content">
          <div className="connection-status">
            <h2>Connecting to server...</h2>
            <div className="loading-animation">
              <div className="pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-container">
      <div className="teacher-content">
        {/* Header */}
        <div className="teacher-header">
          <div className="header-left">
            <div className="brand-logo">
              <span className="logo-icon">📊</span>
              <span className="brand-text">Intervue Poll</span>
            </div>
            <div className="quiz-info">
              <h2 className="quiz-title">{quizSession?.title || 'Live Quiz'}</h2>
              <div className="quiz-meta">
                <span 
                  className="quiz-code clickable"
                  onClick={handleCopyQuizCode}
                  title="Click to copy quiz code"
                >
                  Code: {quizSession?.quizCode}
                </span>
                <span className="teacher-name">Teacher: {teacher?.firstName} {teacher?.lastName}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <div className="students-info">
              <span className="students-count">👥 {totalStudents} Students Online</span>
              {pollActive && (
                <span className="answered-count">
                  ✅ {answeredStudents}/{totalStudents} Answered
                </span>
              )}
            </div>
            <button 
              className="chat-btn"
              onClick={() => setShowChat(true)}
            >
              💬 Chat
            </button>
            <button 
              className={`nav-btn ${!showQuestions && !showStudentResults ? 'active' : ''}`}
              onClick={() => {
                setShowQuestions(false);
                setShowStudentResults(false);
              }}
            >
              📝 Live Poll
            </button>
            <button 
              className={`nav-btn ${showQuestions && !showStudentResults ? 'active' : ''}`}
              onClick={() => {
                setShowQuestions(true);
                setShowStudentResults(false);
              }}
            >
              📚 Question Bank
            </button>
            <button 
              className={`nav-btn ${showStudentResults ? 'active' : ''}`}
              onClick={() => {
                setShowQuestions(false);
                setShowStudentResults(true);
              }}
            >
              📊 Student Results
            </button>
            <button 
              className="dashboard-btn"
              onClick={onBackToDashboard}
            >
              📋 Dashboard
            </button>
            <button 
              className="logout-btn"
              onClick={onLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Poll Results */}
        {pollResults && (
          <div className="poll-results-section">
            <h2 className="results-title">📊 Poll Results</h2>
            <p className="results-question">{pollResults.question}</p>
            
            <div className="results-chart">
              {pollResults.results.map((result, index) => (
                <div key={index} className="result-bar">
                  <div className="result-info">
                    <span className="result-option">{result.option}</span>
                    <span className="result-stats">{result.count} votes ({result.percentage}%)</span>
                  </div>
                  <div className="result-bar-container">
                    <div 
                      className={`result-bar-fill ${index === pollResults.correctAnswer ? 'correct' : ''}`}
                      style={{ width: `${result.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="results-summary">
              <p>Total Responses: {pollResults.totalResponses} / {pollResults.totalStudents}</p>
              <p className="correct-answer">
                ✅ Correct Answer: {pollResults.options[pollResults.correctAnswer]}
              </p>
            </div>

            <button className="new-poll-btn" onClick={handleNewPoll}>
              Create New Poll
            </button>
          </div>
        )}

        {/* Poll Creation Form */}
        {!pollActive && !pollResults && !showQuestions && !showStudentResults && (
          <div className="poll-creation">
            {/* Question Input Section */}
            <div className="form-section">
              <div className="question-section">
                <div className="question-header">
                  <label className="section-label">Enter your question</label>
                  <div className="timer-dropdown">
                    <select 
                      value={timer} 
                      onChange={(e) => setTimer(Number(e.target.value))}
                      className="timer-select"
                    >
                      <option value={30}>30 seconds</option>
                      <option value={60}>60 seconds</option>
                      <option value={90}>90 seconds</option>
                      <option value={120}>120 seconds</option>
                    </select>
                  </div>
                </div>
                
                <textarea
                  className="question-input"
                  placeholder="Enter your question here..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                />
                <div className="character-count">{question.length}/200</div>
              </div>

              {/* Options and Correct Answer Section */}
              <div className="options-section">
                <div className="options-row">
                  {/* Edit Options */}
                  <div className="options-column">
                    <h3 className="section-title">Edit Options</h3>
                    {options.map((option, index) => (
                      <div key={index} className="option-item">
                        <div className="option-number">{index + 1}</div>
                        <input
                          type="text"
                          className="option-input"
                          placeholder="Enter option"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                        />
                        {options.length > 2 && (
                          <button 
                            className="remove-option"
                            onClick={() => handleRemoveOption(index)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button className="add-option-btn" onClick={handleAddOption}>
                      + Add More option
                    </button>
                  </div>

                  {/* Correct Answer */}
                  <div className="correct-answer-column">
                    <h3 className="section-title">Is it Correct?</h3>
                    {options.map((option, index) => (
                      <div key={index} className="correct-option">
                        <label className="radio-label">
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={index}
                            checked={correctAnswer === index.toString()}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="radio-input"
                          />
                          <span className="radio-custom"></span>
                          <span className="radio-text">
                            {index === 0 ? 'Yes' : index === 1 ? 'No' : `Option ${index + 1}`}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  className={`ask-question-btn ${isFormValid ? 'active' : 'disabled'}`}
                  onClick={handleAskQuestion}
                  disabled={!isFormValid}
                >
                  🚀 Ask Now
                </button>
                <button 
                  className={`save-question-btn ${isFormValid ? 'active' : 'disabled'}`}
                  onClick={handleSaveQuestion}
                  disabled={!isFormValid}
                >
                  💾 Save Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question Bank */}
        {showQuestions && !pollActive && !pollResults && !showStudentResults && (
          <div className="question-bank">
            <div className="question-bank-header">
              <h2>📚 Question Bank</h2>
              <p>Manage your saved questions ({questions.length} questions)</p>
            </div>
            
            {questions.length === 0 ? (
              <div className="empty-questions">
                <span className="empty-icon">📝</span>
                <h3>No questions saved yet</h3>
                <p>Create and save questions to build your question bank!</p>
                <button 
                  className="switch-to-create-btn"
                  onClick={() => setShowQuestions(false)}
                >
                  Create First Question
                </button>
              </div>
            ) : (
              <div className="questions-list">
                {questions.map((q, index) => (
                  <div key={index} className="question-card">
                    <div className="question-card-header">
                      <h3 className="question-text">{q.question}</h3>
                      <span className="question-timer">⏰ {q.timer}s</span>
                    </div>
                    
                    <div className="question-options">
                      {q.options.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`question-option ${optIndex === q.correctAnswer ? 'correct' : ''}`}
                        >
                          <span className="option-letter">{String.fromCharCode(65 + optIndex)}</span>
                          <span className="option-text">{option}</span>
                          {optIndex === q.correctAnswer && <span className="correct-mark">✓</span>}
                        </div>
                      ))}
                    </div>
                    
                    <div className="question-actions">
                      <button 
                        className="ask-saved-btn"
                        onClick={() => handleAskSavedQuestion(index)}
                      >
                        🚀 Ask This Question
                      </button>
                      <button 
                        className="delete-question-btn"
                        onClick={() => {
                          if (window.confirm('Delete this question?')) {
                            setQuestions(prev => prev.filter((_, i) => i !== index));
                          }
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student Results Dashboard */}
        {showStudentResults && !pollActive && !pollResults && (
          <div className="student-results-dashboard">
            <div className="results-dashboard-header">
              <h2>📊 Student Results Dashboard</h2>
              <p>Track student performance and quiz completion</p>
            </div>

            {studentResults.length === 0 ? (
              <div className="no-results">
                <span className="no-results-icon">📈</span>
                <h3>No student results yet</h3>
                <p>Results will appear here when students start answering questions!</p>
              </div>
            ) : (
              <>
                {/* Overall Statistics */}
                <div className="overall-stats">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <div className="stat-number">{studentResults.length}</div>
                      <div className="stat-label">Active Students</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <div className="stat-number">
                        {studentResults.reduce((sum, student) => sum + student.totalScore, 0)}
                      </div>
                      <div className="stat-label">Total Correct</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-content">
                      <div className="stat-number">
                        {studentResults.reduce((sum, student) => sum + student.totalAnswered, 0)}
                      </div>
                      <div className="stat-label">Total Answers</div>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-number">
                        {studentResults.length > 0 
                          ? Math.round((studentResults.reduce((sum, student) => sum + student.totalScore, 0) / 
                              studentResults.reduce((sum, student) => sum + student.totalAnswered, 0)) * 100) || 0
                          : 0}%
                      </div>
                      <div className="stat-label">Class Average</div>
                    </div>
                  </div>
                </div>

                {/* Individual Student Results */}
                <div className="student-results-list">
                  <h3>Individual Student Performance</h3>
                  <div className="results-table">
                    <div className="table-header">
                      <div className="header-cell">Student</div>
                      <div className="header-cell">Score</div>
                      <div className="header-cell">Accuracy</div>
                      <div className="header-cell">Last Answer</div>
                      <div className="header-cell">Status</div>
                    </div>
                    
                    {studentResults
                      .sort((a, b) => b.totalScore - a.totalScore)
                      .map((student, index) => {
                        const accuracy = student.totalAnswered > 0 
                          ? Math.round((student.totalScore / student.totalAnswered) * 100) 
                          : 0;
                        
                        return (
                          <div key={student.studentId} className="table-row">
                            <div className="table-cell student-info">
                              <span className="student-rank">#{index + 1}</span>
                              <span className="student-name">{student.studentName}</span>
                            </div>
                            <div className="table-cell score-cell">
                              <span className="score">{student.totalScore}</span>
                              <span className="total">/{student.totalAnswered}</span>
                            </div>
                            <div className="table-cell accuracy-cell">
                              <div className="accuracy-badge" style={{
                                backgroundColor: accuracy >= 80 ? '#4CAF50' : 
                                               accuracy >= 60 ? '#FF9800' : '#F44336'
                              }}>
                                {accuracy}%
                              </div>
                            </div>
                            <div className="table-cell last-answer-cell">
                              {student.lastAnswer ? (
                                <span className={`answer-result ${student.isCorrect ? 'correct' : 'incorrect'}`}>
                                  {student.isCorrect ? '✅' : '❌'} {student.lastAnswer}
                                </span>
                              ) : (
                                <span className="no-answer">No answers yet</span>
                              )}
                            </div>
                            <div className="table-cell status-cell">
                              <span className={`status-badge ${student.totalAnswered > 0 ? 'active' : 'waiting'}`}>
                                {student.totalAnswered > 0 ? '🟢 Active' : '⏸️ Waiting'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="performance-insights">
                  <h3>Performance Insights</h3>
                  <div className="insights-grid">
                    <div className="insight-card">
                      <div className="insight-icon">🏆</div>
                      <div className="insight-content">
                        <h4>Top Performer</h4>
                        <p>
                          {studentResults.length > 0 
                            ? studentResults
                                .sort((a, b) => (b.totalScore / Math.max(b.totalAnswered, 1)) - (a.totalScore / Math.max(a.totalAnswered, 1)))[0]?.studentName
                            : 'No data yet'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="insight-card">
                      <div className="insight-icon">⚡</div>
                      <div className="insight-content">
                        <h4>Most Active</h4>
                        <p>
                          {studentResults.length > 0 
                            ? studentResults
                                .sort((a, b) => b.totalAnswered - a.totalAnswered)[0]?.studentName
                            : 'No data yet'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="insight-card">
                      <div className="insight-icon">📈</div>
                      <div className="insight-content">
                        <h4>Class Engagement</h4>
                        <p>
                          {studentResults.filter(s => s.totalAnswered > 0).length}/{studentResults.length} students active
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Poll Active State */}
        {pollActive && (
          <div className="poll-active-section">
            <div className="poll-active-header">
              <h2>📊 Poll is Live!</h2>
              <div className="poll-timer">
                <span className="timer-text">⏰ {timeLeft}s remaining</span>
              </div>
            </div>
            
            <div className="active-poll-info">
              <h3 className="active-question">{question}</h3>
              <div className="active-options">
                {options.filter(opt => opt.trim()).map((option, index) => (
                  <div key={index} className="active-option">
                    <span className="option-number">{index + 1}</span>
                    <span className="option-text">{option}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="poll-controls">
              <button className="end-poll-btn" onClick={handleEndPoll}>
                End Poll Now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Component */}
      {showChat && (
        <Chat 
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          isTeacher={true}
          userName={`${teacher.firstName} ${teacher.lastName} (Teacher)`}
          quizCode={quizSession.quizCode}
        />
      )}
    </div>
  );
};

export default TeacherPage;
