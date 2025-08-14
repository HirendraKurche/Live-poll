import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './TeacherDashboard.css';

const TeacherDashboard = ({ teacher, token, onQuizSelect, onLogout }) => {
  const [activeView, setActiveView] = useState('create');
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    maxStudents: 50,
    allowLateJoin: true
  });

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/auth/teacher/quizzes', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setQuizzes(response.data.data.quizzes);
      }
    } catch (error) {
      console.error('Fetch quizzes error:', error);
      setError('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeView === 'manage') {
      fetchQuizzes();
    }
  }, [activeView, fetchQuizzes]);

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/quiz/create', newQuiz, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const quizSession = response.data.data.quizSession;
        onQuizSelect(quizSession);
      }
    } catch (error) {
      console.error('Create quiz error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to create quiz');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinQuiz = (quiz) => {
    onQuizSelect(quiz);
  };

  const handleCopyQuizCode = async (quizCode) => {
    try {
      await navigator.clipboard.writeText(quizCode);
      // Show a temporary success message
      setSuccessMessage('Quiz code copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      console.error('Failed to copy quiz code:', err);
      setError('Failed to copy quiz code');
      setTimeout(() => setError(''), 2000);
    }
  };

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${quizTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5000/api/auth/quiz/${quizId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Remove the quiz from the list
        setQuizzes(prev => prev.filter(quiz => quiz._id !== quizId));
        setSuccessMessage('Quiz deleted successfully');
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (error) {
      console.error('Delete quiz error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to delete quiz');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewQuiz({
      ...newQuiz,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  return (
    <div className="teacher-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <div className="brand-logo">
            <span className="logo-icon">📊</span>
            <span className="brand-text">Intervue Poll</span>
          </div>
          <div className="teacher-welcome">
            <h1>Welcome, {teacher.firstName}!</h1>
            <p>Manage your live polling sessions</p>
          </div>
        </div>
        <div className="header-right">
          <div className="teacher-info">
            <span className="teacher-name">{teacher.firstName} {teacher.lastName}</span>
            <span className="teacher-email">{teacher.email}</span>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-nav">
        <button 
          className={`nav-btn ${activeView === 'create' ? 'active' : ''}`}
          onClick={() => setActiveView('create')}
        >
          <span className="nav-icon">➕</span>
          Create New Quiz
        </button>
        <button 
          className={`nav-btn ${activeView === 'manage' ? 'active' : ''}`}
          onClick={() => setActiveView('manage')}
        >
          <span className="nav-icon">📋</span>
          Manage Quizzes
        </button>
      </div>

      <div className="dashboard-content">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {successMessage}
          </div>
        )}

        {activeView === 'create' && (
          <div className="create-quiz-section">
            <div className="section-header">
              <h2>Create New Quiz Session</h2>
              <p>Set up a new live polling session for your students</p>
            </div>

            <form onSubmit={handleCreateQuiz} className="create-quiz-form">
              <div className="form-group">
                <label htmlFor="title">Quiz Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={newQuiz.title}
                  onChange={handleInputChange}
                  placeholder="Enter quiz title (e.g., Math Quiz Chapter 5)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  name="description"
                  value={newQuiz.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of what this quiz covers..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="maxStudents">Maximum Students</label>
                  <input
                    type="number"
                    id="maxStudents"
                    name="maxStudents"
                    value={newQuiz.maxStudents}
                    onChange={handleInputChange}
                    min="1"
                    max="200"
                    required
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="allowLateJoin"
                      checked={newQuiz.allowLateJoin}
                      onChange={handleInputChange}
                    />
                    <span className="checkbox-custom"></span>
                    Allow late joining
                  </label>
                  <small>Students can join even after the quiz has started</small>
                </div>
              </div>

              <button 
                type="submit" 
                className="create-btn"
                disabled={createLoading}
              >
                {createLoading ? (
                  <span className="loading-spinner">🔄</span>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    Create Quiz Session
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeView === 'manage' && (
          <div className="manage-quiz-section">
            <div className="section-header">
              <h2>Your Quiz Sessions</h2>
              <p>View and manage your existing quiz sessions</p>
            </div>

            {loading ? (
              <div className="loading-state">
                <span className="loading-spinner">🔄</span>
                Loading your quizzes...
              </div>
            ) : quizzes.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📝</span>
                <h3>No quiz sessions yet</h3>
                <p>Create your first quiz session to get started!</p>
                <button 
                  className="create-first-btn"
                  onClick={() => setActiveView('create')}
                >
                  Create First Quiz
                </button>
              </div>
            ) : (
              <div className="quiz-list">
                {quizzes.map((quiz) => (
                  <div key={quiz._id} className="quiz-card">
                    <div className="quiz-card-header">
                      <h3 className="quiz-title">{quiz.title}</h3>
                      <span className={`quiz-status ${quiz.isActive ? 'active' : 'inactive'}`}>
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {quiz.description && (
                      <p className="quiz-description">{quiz.description}</p>
                    )}
                    
                    <div className="quiz-details">
                      <div className="quiz-detail">
                        <span className="detail-label">Quiz Code:</span>
                        <span 
                          className="quiz-code clickable"
                          onClick={() => handleCopyQuizCode(quiz.quizCode)}
                          title="Click to copy quiz code"
                        >
                          {quiz.quizCode}
                        </span>
                      </div>
                      <div className="quiz-detail">
                        <span className="detail-label">Participants:</span>
                        <span>{quiz.participants.filter(p => p.isActive).length} / {quiz.maxStudents}</span>
                      </div>
                      <div className="quiz-detail">
                        <span className="detail-label">Created:</span>
                        <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="quiz-actions">
                      {quiz.isActive && (
                        <button 
                          className="join-quiz-btn"
                          onClick={() => handleJoinQuiz(quiz)}
                        >
                          <span className="btn-icon">🎯</span>
                          Join Session
                        </button>
                      )}
                      <button 
                        className="delete-quiz-btn"
                        onClick={() => handleDeleteQuiz(quiz._id, quiz.title)}
                        title="Delete quiz"
                      >
                        <span className="btn-icon">🗑️</span>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
