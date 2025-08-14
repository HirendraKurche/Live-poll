import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole === 'student') {
      navigate('/student/join');
    } else if (selectedRole === 'teacher') {
      navigate('/teacher/auth');
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        {/* Logo/Brand */}
        <div className="brand-logo">
          <span className="logo-icon">📊</span>
          <span className="brand-text">Intervue Poll</span>
        </div>

        {/* Main Heading */}
        <h1 className="main-heading">
          Welcome to the <span className="highlight">Live Polling System</span>
        </h1>

        {/* Subtitle */}
        <p className="subtitle">
          Please select the role that best describes you to begin using the live polling system
        </p>

        {/* Role Selection Cards */}
        <div className="role-selection">
          <div 
            className={`role-card ${selectedRole === 'student' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('student')}
          >
            <h3 className="role-title">I'm a Student</h3>
            <p className="role-description">
              Join live polls, answer questions, and participate in real-time classroom activities
            </p>
          </div>

          <div 
            className={`role-card ${selectedRole === 'teacher' ? 'selected' : ''}`}
            onClick={() => handleRoleSelect('teacher')}
          >
            <h3 className="role-title">I'm a Teacher</h3>
            <p className="role-description">
              Create polls, manage students, and view real-time results with analytics
            </p>
          </div>
        </div>

        {/* Continue Button */}
        <button 
          className={`continue-btn ${selectedRole ? 'active' : 'disabled'}`}
          onClick={handleContinue}
          disabled={!selectedRole}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
