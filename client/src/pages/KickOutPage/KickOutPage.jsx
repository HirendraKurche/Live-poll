import React from 'react';
import { useNavigate } from 'react-router-dom';
import './KickOutPage.css';

const KickOutPage = () => {
  const navigate = useNavigate();

  const handleReturnToHome = () => {
    navigate('/');
  };

  return (
    <div className="kickout-container">
      <div className="kickout-content">
        <div className="kickout-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" fill="none"/>
            <path d="M15 9l-6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            <path d="M9 9l6 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        
        <h1 className="kickout-title">You have been removed</h1>
        
        <p className="kickout-message">
          You have been removed from the live polling session by the teacher.
        </p>
        
        <div className="kickout-details">
          <p>This could be due to:</p>
          <ul>
            <li>Inappropriate behavior</li>
            <li>Violation of session rules</li>
            <li>Technical issues</li>
            <li>Other administrative reasons</li>
          </ul>
        </div>
        
        <div className="kickout-actions">
          <button 
            onClick={handleReturnToHome}
            className="return-home-btn"
          >
            Return to Home
          </button>
        </div>
        
        <div className="kickout-footer">
          <p>If you believe this was a mistake, please contact your teacher.</p>
        </div>
      </div>
    </div>
  );
};

export default KickOutPage;
