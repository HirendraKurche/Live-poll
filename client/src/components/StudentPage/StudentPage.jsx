import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import { useNavigate } from 'react-router-dom';
import Chat from '../Chat/Chat.jsx';
import './StudentPage.css';

const StudentPage = ({ studentData, quizInfo }) => {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const joinAttempted = useRef(false);
  const [isJoined, setIsJoined] = useState(false);
  const [currentPoll, setCurrentPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [pollResults, setPollResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [error, setError] = useState('');
  const [studentScore, setStudentScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Redirect if no student data
  useEffect(() => {
    if (!studentData || !studentData.name || !studentData.quizCode) {
      navigate('/student/join');
    }
  }, [studentData, navigate]);

  // Auto-join when component mounts if data is available
  useEffect(() => {
    if (socket && connected && studentData && studentData.name && studentData.quizCode && !isJoined) {
      const joinKey = `joined_${studentData.quizCode}_${studentData.name}`;
      const hasAlreadyJoined = sessionStorage.getItem(joinKey);
      
      if (!hasAlreadyJoined && !joinAttempted.current) {
        console.log('🚀 Attempting to join quiz:', studentData.name, '->', studentData.quizCode);
        joinAttempted.current = true;
        sessionStorage.setItem(joinKey, 'true');
        
        socket.emit('student-join', { 
          studentName: studentData.name,
          quizCode: studentData.quizCode 
        });
        setIsJoined(true);
      }
    }
  }, [socket, connected, studentData, isJoined]);

  useEffect(() => {
    if (!socket) return;

    // Listen for socket events
    socket.on('student-joined', (data) => {
      setMessage(data.message);
      if (data.currentPoll) {
        setCurrentPoll(data.currentPoll);
        if (data.currentPoll.active) {
          const elapsed = (Date.now() - data.currentPoll.startTime) / 1000;
          const remaining = Math.max(0, data.currentPoll.timer - elapsed);
          setTimeLeft(Math.ceil(remaining));
        }
      }
    });

    socket.on('join-error', (data) => {
      setError(data.message);
      setTimeout(() => {
        navigate('/student/join');
      }, 3000);
    });

    socket.on('new-poll', (poll) => {
      setCurrentPoll(poll);
      setSelectedOption(null);
      setHasAnswered(false);
      setPollResults(null);
      setTimeLeft(poll.timer);
      setMessage('New poll started!');
    });

    socket.on('answer-submitted', (data) => {
      setHasAnswered(true);
      setMessage(data.message);
      if (data.score !== undefined) {
        setStudentScore(data.score);
      }
      if (data.totalAnswered !== undefined) {
        setTotalAnswered(data.totalAnswered);
      }
    });

    socket.on('poll-results', (results) => {
      setPollResults(results);
      setCurrentPoll(null);
      setMessage('Poll ended! Here are the results:');
    });

    socket.on('error', (error) => {
      setMessage(error.message);
    });

    socket.on('student-kicked', (data) => {
      navigate('/kicked-out');
    });

    return () => {
      socket.off('student-joined');
      socket.off('new-poll');
      socket.off('answer-submitted');
      socket.off('poll-results');
      socket.off('error');
      socket.off('student-kicked');
      
      // Clean up session storage on unmount
      if (studentData && studentData.name && studentData.quizCode) {
        const joinKey = `joined_${studentData.quizCode}_${studentData.name}`;
        sessionStorage.removeItem(joinKey);
      }
    };
  }, [socket, navigate, studentData]);

  // Timer countdown
  useEffect(() => {
    if (currentPoll && timeLeft > 0 && !hasAnswered) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, currentPoll, hasAnswered]);

  const handleOptionSelect = (optionIndex) => {
    if (!hasAnswered && currentPoll && currentPoll.active) {
      setSelectedOption(optionIndex);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption !== null && socket && !hasAnswered) {
      socket.emit('submit-answer', { selectedOption });
    }
  };

  if (!connected) {
    return (
      <div className="student-container">
        <div className="student-content">
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

  // Show error if joining failed
  if (error) {
    return (
      <div className="student-container">
        <div className="student-content">
          <div className="error-section">
            <span className="error-icon">⚠️</span>
            <h2>Unable to Join Quiz</h2>
            <p>{error}</p>
            <p>Redirecting back to join page...</p>
          </div>
        </div>
      </div>
    );
  }

  // Main student dashboard
  if (!studentData) {
    return (
      <div className="student-container">
        <div className="student-content">
          <div className="loading-section">
            <span className="loading-icon">🔄</span>
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  return (
    <div className="student-container">
      <div className="student-content">
        <div className="student-header">
          <div className="brand-logo">
            <span className="logo-icon">📊</span>
            <span className="brand-text">Intervue Poll</span>
          </div>
          <div className="student-info">
            <span>Welcome, {studentData.name}!</span>
            <div className="student-stats">
              <span className="score-display">Score: {studentScore}/{totalAnswered}</span>
              <button 
                className="results-btn"
                onClick={() => setShowResults(!showResults)}
              >
                📊 {showResults ? 'Hide' : 'Show'} Results
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="message-alert">
            {message}
          </div>
        )}

        {/* Student Results Dashboard */}
        {showResults && (
          <div className="results-dashboard">
            <div className="results-header">
              <h2>📊 Your Quiz Performance</h2>
            </div>
            
            <div className="results-stats">
              <div className="stat-card">
                <div className="stat-number">{studentScore}</div>
                <div className="stat-label">Correct Answers</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalAnswered}</div>
                <div className="stat-label">Total Questions</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">
                  {totalAnswered > 0 ? Math.round((studentScore / totalAnswered) * 100) : 0}%
                </div>
                <div className="stat-label">Accuracy</div>
              </div>
            </div>
            
            <div className="performance-message">
              {totalAnswered === 0 ? (
                <p>🎯 Start answering questions to see your performance!</p>
              ) : studentScore === totalAnswered ? (
                <p>🏆 Perfect score! You're doing amazing!</p>
              ) : (studentScore / totalAnswered) >= 0.8 ? (
                <p>🌟 Great job! You're performing excellently!</p>
              ) : (studentScore / totalAnswered) >= 0.6 ? (
                <p>👍 Good work! Keep it up!</p>
              ) : (
                <p>💪 Keep practicing! You're improving!</p>
              )}
            </div>
          </div>
        )}

        {/* Active Poll */}
        {currentPoll && currentPoll.active && (
          <div className="poll-section">
            <div className="poll-header">
              <div className="poll-question">{currentPoll.question}</div>
              {timeLeft > 0 && !hasAnswered && (
                <div className="timer-display">
                  <span className="timer-text">⏰ {timeLeft}s</span>
                </div>
              )}
            </div>

            {!hasAnswered && timeLeft > 0 ? (
              <div className="poll-options">
                {currentPoll.options.map((option, index) => {
                  const optionNumber = index + 1; // 1, 2, 3, 4
                  return (
                    <div
                      key={index}
                      className={`poll-option ${selectedOption === index ? 'selected' : ''}`}
                      onClick={() => handleOptionSelect(index)}
                    >
                      <div className="option-number">{optionNumber}</div>
                      <span className="option-text">{option}</span>
                    </div>
                  );
                })}

                <button
                  className={`submit-answer-btn ${selectedOption !== null ? 'active' : 'disabled'}`}
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null}
                >
                  Submit
                </button>
              </div>
            ) : hasAnswered ? (
              <div className="waiting-results">
                <h3>✅ Answer Submitted!</h3>
                <p>Waiting for other students to answer...</p>
                <div className="loading-animation">
                  <div className="pulse"></div>
                </div>
              </div>
            ) : (
              <div className="time-up">
                <h3>⏰ Time's Up!</h3>
                <p>Waiting for results...</p>
              </div>
            )}
          </div>
        )}

        {/* Poll Results */}
        {pollResults && (
          <div className="results-section">
            <div className="results-title">
              <span>Question 1</span>
              <span className="timer-display">⏰ 00:15</span>
            </div>
            <div className="results-question">{pollResults.question}</div>
            
            <div className="results-chart">
              {pollResults.results.map((result, index) => {
                const optionNumber = index + 1; // 1, 2, 3, 4
                const isHighest = result.percentage === Math.max(...pollResults.results.map(r => r.percentage));
                return (
                  <div key={index} className="result-bar">
                    <div className="result-info">
                      <span className="result-option">
                        <span className="option-letter">{optionNumber}</span>
                        {result.option}
                      </span>
                      <span className="result-stats">{result.percentage}%</span>
                    </div>
                    <div className="result-bar-container">
                      <div 
                        className={`result-bar-fill ${isHighest ? 'highest' : ''} ${index === pollResults.correctAnswer ? 'correct' : ''}`}
                        style={{ width: `${result.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="waiting-message">
              <h3>Wait for the teacher to ask a new question..</h3>
            </div>
          </div>
        )}

        {/* Waiting for Poll */}
        {!currentPoll && !pollResults && (
          <div className="waiting-area">
            <h2>Waiting for Teacher to Start Poll...</h2>
            <div className="loading-animation">
              <div className="pulse"></div>
            </div>
            <p>You'll be able to answer questions once the teacher starts a poll.</p>
          </div>
        )}
      </div>

      {/* Floating Chat Button */}
      <button 
        className="floating-chat-btn"
        onClick={() => setShowChat(true)}
      >
        💬
      </button>

      {/* Chat Component */}
      {showChat && (
        <Chat 
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          isTeacher={false}
          userName={studentData.name}
          quizCode={studentData.quizCode}
        />
      )}
    </div>
  );
};

export default StudentPage;
