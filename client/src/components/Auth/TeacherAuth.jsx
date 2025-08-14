import React, { useState } from 'react';
import axios from 'axios';
import './TeacherAuth.css';

const TeacherAuth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    login: '',
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/teacher/login' : '/api/auth/teacher/register';
      const payload = isLogin 
        ? { login: formData.login, password: formData.password }
        : {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName
          };

      const response = await axios.post(`http://localhost:5000${endpoint}`, payload);

      if (response.data.success) {
        localStorage.setItem('teacherToken', response.data.data.token);
        localStorage.setItem('teacherData', JSON.stringify(response.data.data.teacher));
        onAuthSuccess(response.data.data.teacher, response.data.data.token);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data?.errors) {
        setError(error.response.data.errors.map(err => err.msg).join(', '));
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      login: '',
      email: '',
      username: '',
      password: '',
      firstName: '',
      lastName: ''
    });
    setError('');
  };

  return (
    <div className="teacher-auth-container">
      <div className="teacher-auth-card">
        <div className="auth-header">
          <div className="brand-logo">
            <span className="logo-icon">📊</span>
            <span className="brand-text">Intervue Poll</span>
          </div>
          <h2 className="auth-title">
            {isLogin ? 'Teacher Login' : 'Teacher Registration'}
          </h2>
          <p className="auth-subtitle">
            {isLogin 
              ? 'Welcome back! Please sign in to continue.' 
              : 'Create your teacher account to get started.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {isLogin ? (
            <>
              <div className="form-group">
                <label htmlFor="login">Username or Email</label>
                <input
                  type="text"
                  id="login"
                  name="login"
                  value={formData.login}
                  onChange={handleInputChange}
                  placeholder="Enter your username or email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Choose a password (min 6 characters)"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">🔄</span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              type="button" 
              className="toggle-mode-btn"
              onClick={toggleMode}
            >
              {isLogin ? 'Register here' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherAuth;
