import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import './StudentJoin.css';

const StudentJoin = ({ onJoinSuccess }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    quizCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizInfo, setQuizInfo] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // For quiz code, convert to uppercase and limit to 6 characters
    if (name === 'quizCode') {
      setFormData({
        ...formData,
        [name]: value.toUpperCase().slice(0, 6)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    setError('');
  };

  const validateQuizCode = async () => {
    if (formData.quizCode.length !== 6) {
      setError('Quiz code must be exactly 6 characters');
      return false;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/student/join`, {
        studentName: formData.studentName,
        quizCode: formData.quizCode
      });

      if (response.data.success) {
        setQuizInfo(response.data.data);
        return true;
      }
    } catch (error) {
      console.error('Quiz validation error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        setError(error.response.data.errors.map(err => err.msg).join(', '));
      } else {
        setError('Failed to validate quiz code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.studentName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.quizCode.trim()) {
      setError('Please enter the quiz code');
      return;
    }

    const isValid = await validateQuizCode();
    if (isValid && quizInfo) {
      onJoinSuccess({
        studentName: formData.studentName,
        quizCode: formData.quizCode,
        quizInfo: quizInfo
      });
    }
  };

  const handleReset = () => {
    setFormData({ studentName: '', quizCode: '' });
    setQuizInfo(null);
    setError('');
  };

  return (
    <div className="student-join-container">
      <div className="student-join-card">
        <div className="join-header">
          <div className="brand-logo">
            <span className="logo-icon">📊</span>
            <span className="brand-text">Intervue Poll</span>
          </div>
          <h2 className="join-title">Join Quiz</h2>
          <p className="join-subtitle">
            Enter your name and the quiz code provided by your teacher
          </p>
        </div>

        {quizInfo ? (
          <div className="quiz-info-section">
            <div className="quiz-found-message">
              <span className="success-icon">✅</span>
              <h3>Quiz Found!</h3>
            </div>
            
            <div className="quiz-details">
              <div className="quiz-detail-item">
                <span className="detail-label">Quiz Title:</span>
                <span className="detail-value">{quizInfo.title}</span>
              </div>
              
              {quizInfo.description && (
                <div className="quiz-detail-item">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{quizInfo.description}</span>
                </div>
              )}
              
              <div className="quiz-detail-item">
                <span className="detail-label">Teacher:</span>
                <span className="detail-value">{quizInfo.teacher}</span>
              </div>
              
              <div className="quiz-detail-item">
                <span className="detail-label">Participants:</span>
                <span className="detail-value">
                  {quizInfo.participants} / {quizInfo.maxStudents}
                </span>
              </div>
            </div>

            <div className="join-actions">
              <button 
                type="button" 
                className="join-quiz-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading-spinner">🔄</span>
                ) : (
                  'Join Quiz'
                )}
              </button>
              
              <button 
                type="button" 
                className="change-code-btn"
                onClick={handleReset}
              >
                Change Code
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="join-form">
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="studentName">Your Name</label>
              <input
                type="text"
                id="studentName"
                name="studentName"
                value={formData.studentName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                maxLength={50}
                required
              />
              <small className="input-hint">
                This name will be visible to your teacher and classmates
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="quizCode">Quiz Code</label>
              <input
                type="text"
                id="quizCode"
                name="quizCode"
                value={formData.quizCode}
                onChange={handleInputChange}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="quiz-code-input"
                required
              />
              <small className="input-hint">
                Ask your teacher for the 6-character quiz code
              </small>
            </div>

            <button 
              type="submit" 
              className="validate-btn"
              disabled={loading || formData.quizCode.length !== 6 || !formData.studentName.trim()}
            >
              {loading ? (
                <span className="loading-spinner">🔄</span>
              ) : (
                'Find Quiz'
              )}
            </button>
          </form>
        )}

        <div className="join-footer">
          <p className="help-text">
            <span className="help-icon">💡</span>
            Need help? Ask your teacher for the quiz code
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentJoin;
