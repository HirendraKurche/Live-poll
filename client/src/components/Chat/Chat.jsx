import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import './Chat.css';

const Chat = ({ isTeacher, userName, isOpen, onClose, quizCode }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState(isTeacher ? 'Participants' : 'Chat');
  const [students, setStudents] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    // Listen for existing messages when component mounts
    socket.on('teacher-joined', (data) => {
      console.log('🔔 Chat: Received teacher-joined:', data);
      if (data.chatMessages) {
        setMessages(data.chatMessages);
      }
      // Also get initial students list for teacher
      if (isTeacher && data.students) {
        console.log('🎯 Chat: Setting initial students list with', data.students.length, 'students');
        setStudents(data.students);
      }
    });

    socket.on('student-joined', (data) => {
      if (data.chatMessages) {
        setMessages(data.chatMessages);
      }
    });

    // Listen for students updates (for teacher)
    socket.on('students-update', (data) => {
      console.log('🔔 Chat: Received students-update:', data);
      if (isTeacher) {
        console.log('🎯 Chat: Updating students list with', data.students.length, 'students');
        setStudents(data.students);
      }
    });

    // Listen for new messages
    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.off('teacher-joined');
      socket.off('student-joined');
      socket.off('students-update');
      socket.off('new-message');
    };
  }, [socket, isTeacher]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() && socket) {
      socket.emit('send-message', {
        quizCode,
        message: newMessage.trim(),
        senderType: isTeacher ? 'teacher' : 'student'
      });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleKickStudent = (studentSocketId) => {
    if (socket && isTeacher) {
      socket.emit('kick-student', { quizCode, studentSocketId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="chat-overlay">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-tabs">
            <button 
              className={`chat-tab ${activeTab === 'Chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('Chat')}
            >
              Chat
            </button>
            {isTeacher && (
              <button 
                className={`chat-tab ${activeTab === 'Participants' ? 'active' : ''}`}
                onClick={() => setActiveTab('Participants')}
              >
                Participants
              </button>
            )}
          </div>
          <button className="chat-close" onClick={onClose}>×</button>
        </div>

        {/* Chat Content */}
        {activeTab === 'Chat' && (
          <div className="chat-content">
            {/* Messages */}
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div 
                  key={message.id || index} 
                  className={`message ${(message.senderType === 'teacher' && isTeacher) || (message.senderType === 'student' && !isTeacher && message.senderName === userName) ? 'own-message' : 'other-message'}`}
                >
                  <div className="message-header">
                    <span className="message-sender">
                      {message.senderType === 'teacher' ? 'Teacher' : message.senderName}
                    </span>
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="message-text">{message.message}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="chat-input-section">
              <div className="chat-input-container">
                <textarea
                  className="chat-input"
                  placeholder={isTeacher ? 'Message students...' : 'Ask a question...'}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={2}
                />
                <button 
                  className="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Tab (Teacher Only) */}
        {activeTab === 'Participants' && isTeacher && (
          <div className="participants-content">
            <div className="participants-header">
              <div className="participants-title-row">
                <span className="participants-title-name">Students ({students.length})</span>
                <span className="participants-title-action">Actions</span>
              </div>
            </div>
            <div className="participants-list">
              {students.map((student, index) => (
                <div key={student.socketId || index} className="participant-item">
                  <div className="participant-info">
                    <span className="participant-name">{student.name}</span>
                    <span className={`participant-status ${student.hasAnswered ? 'answered' : 'waiting'}`}>
                      {student.hasAnswered ? '✅ Answered' : '⏳ Waiting'}
                    </span>
                  </div>
                  <button 
                    className="kick-out-btn"
                    onClick={() => handleKickStudent(student.socketId)}
                    title="Remove student from quiz"
                  >
                    🚫 Kick Out
                  </button>
                </div>
              ))}
              {students.length === 0 && (
                <div className="no-participants">
                  <p>No students connected</p>
                  <p className="no-participants-help">Students will appear here when they join your quiz</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
