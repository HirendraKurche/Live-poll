import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext.jsx';
import LandingPage from './components/LandingPage/LandingPage.jsx';
import StudentPage from './components/StudentPage/StudentPage.jsx';
import TeacherPage from './components/TeacherPage/TeacherPage.jsx';
import TeacherAuth from './components/Auth/TeacherAuth.jsx';
import StudentJoin from './components/Auth/StudentJoin.jsx';
import TeacherDashboard from './components/Auth/TeacherDashboard.jsx';
import KickOutPage from './pages/KickOutPage/KickOutPage.jsx';
import './App.css';

function App() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    userType: null,
    userData: null,
    token: null,
    quizSession: null
  });

  // Check for existing authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('teacherToken');
    const userData = localStorage.getItem('teacherData');
    
    if (token && userData) {
      setAuthState({
        isAuthenticated: true,
        userType: 'teacher',
        userData: JSON.parse(userData),
        token: token,
        quizSession: null
      });
    }
  }, []);

  const handleTeacherAuth = (teacher, token) => {
    setAuthState({
      isAuthenticated: true,
      userType: 'teacher',
      userData: teacher,
      token: token,
      quizSession: null
    });
  };

  const handleStudentJoin = (joinData) => {
    setAuthState({
      isAuthenticated: true,
      userType: 'student',
      userData: {
        name: joinData.studentName,
        quizCode: joinData.quizCode
      },
      token: null,
      quizSession: joinData.quizInfo
    });
  };

  const handleQuizSelect = (quizSession) => {
    setAuthState(prev => ({
      ...prev,
      quizSession: quizSession
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('teacherData');
    setAuthState({
      isAuthenticated: false,
      userType: null,
      userData: null,
      token: null,
      quizSession: null
    });
  };

  const handleBackToDashboard = () => {
    setAuthState(prev => ({
      ...prev,
      quizSession: null
    }));
  };

  return (
    <SocketProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Landing page route */}
            <Route 
              path="/" 
              element={
                authState.isAuthenticated ? (
                  authState.userType === 'teacher' ? (
                    authState.quizSession ? (
                      <TeacherPage 
                        quizSession={authState.quizSession}
                        teacher={authState.userData}
                        onBackToDashboard={handleBackToDashboard}
                        onLogout={handleLogout}
                      />
                    ) : (
                      <TeacherDashboard
                        teacher={authState.userData}
                        token={authState.token}
                        onQuizSelect={handleQuizSelect}
                        onLogout={handleLogout}
                      />
                    )
                  ) : (
                    <StudentPage 
                      studentData={authState.userData}
                      quizInfo={authState.quizSession}
                    />
                  )
                ) : (
                  <LandingPage />
                )
              } 
            />

            {/* Teacher authentication route */}
            <Route 
              path="/teacher/auth" 
              element={
                authState.isAuthenticated && authState.userType === 'teacher' ? (
                  authState.quizSession ? (
                    <TeacherPage 
                      quizSession={authState.quizSession}
                      teacher={authState.userData}
                      onBackToDashboard={handleBackToDashboard}
                      onLogout={handleLogout}
                    />
                  ) : (
                    <TeacherDashboard
                      teacher={authState.userData}
                      token={authState.token}
                      onQuizSelect={handleQuizSelect}
                      onLogout={handleLogout}
                    />
                  )
                ) : (
                  <TeacherAuth onAuthSuccess={handleTeacherAuth} />
                )
              } 
            />

            {/* Student join route */}
            <Route 
              path="/student/join" 
              element={
                authState.isAuthenticated && authState.userType === 'student' ? (
                  <StudentPage 
                    studentData={authState.userData}
                    quizInfo={authState.quizSession}
                  />
                ) : (
                  <StudentJoin onJoinSuccess={handleStudentJoin} />
                )
              } 
            />

            {/* Legacy routes for backward compatibility */}
            <Route 
              path="/student" 
              element={
                authState.isAuthenticated && authState.userType === 'student' ? (
                  <StudentPage 
                    studentData={authState.userData}
                    quizInfo={authState.quizSession}
                  />
                ) : (
                  <StudentJoin onJoinSuccess={handleStudentJoin} />
                )
              } 
            />

            <Route 
              path="/teacher" 
              element={
                authState.isAuthenticated && authState.userType === 'teacher' ? (
                  authState.quizSession ? (
                    <TeacherPage 
                      quizSession={authState.quizSession}
                      teacher={authState.userData}
                      onBackToDashboard={handleBackToDashboard}
                      onLogout={handleLogout}
                    />
                  ) : (
                    <TeacherDashboard
                      teacher={authState.userData}
                      token={authState.token}
                      onQuizSelect={handleQuizSelect}
                      onLogout={handleLogout}
                    />
                  )
                ) : (
                  <TeacherAuth onAuthSuccess={handleTeacherAuth} />
                )
              } 
            />

            {/* Kick out page */}
            <Route path="/kicked-out" element={<KickOutPage />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;
