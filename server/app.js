const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Database connection
const connectDB = require('./config/database');

// Models
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Poll = require('./models/Poll');

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// CORS origins configuration
const allowedOrigins = [
  'http://localhost:3000',  // Development frontend
  'https://live-poll-345s.onrender.com',  // Production frontend
  process.env.CLIENT_URL  // Environment variable (if different)
].filter(Boolean); // Remove any undefined values

// Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Express middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for active connections (still needed for socket management)
const activeTeachers = new Map(); // socketId -> teacher data
const activeStudents = new Map(); // socketId -> student data
const quizSessions = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    database: 'Connected to MongoDB Atlas',
    timestamp: new Date().toISOString()
  });
});

// Test database connection endpoint
app.get('/api/db-test', async (req, res) => {
  try {
    const teacherCount = await Teacher.countDocuments();
    const studentCount = await Student.countDocuments();
    const pollCount = await Poll.countDocuments();
    
    res.json({
      status: 'Database Connected',
      collections: {
        teachers: teacherCount,
        students: studentCount,
        polls: pollCount
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'Database Error',
      error: error.message
    });
  }
});

// Authentication routes
app.post('/api/auth/teacher/register', async (req, res) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;
    
    // Basic validation
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Check if teacher already exists
    const existingTeacher = await Teacher.findOne({
      $or: [{ email }, { name: username }]
    });
    
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    
    // Create new teacher
    const teacher = new Teacher({
      name: `${firstName} ${lastName}`,
      email,
      password, // In production, hash this password!
      room: null,
      socketId: null,
      isActive: false
    });
    
    await teacher.save();
    
    // Generate a simple token (use JWT in production)
    const token = Buffer.from(`${teacher._id}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          room: teacher.room,
          isActive: teacher.isActive
        },
        token
      }
    });
  } catch (error) {
    console.error('Teacher registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/api/auth/teacher/login', async (req, res) => {
  try {
    const { login, password } = req.body;
    
    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login and password are required'
      });
    }
    
    // Find teacher by email or name
    const teacher = await Teacher.findOne({
      $or: [{ email: login }, { name: login }]
    });
    
    if (!teacher || teacher.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate a simple token
    const token = Buffer.from(`${teacher._id}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      data: {
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          room: teacher.room,
          isActive: teacher.isActive
        },
        token
      }
    });
  } catch (error) {
    console.error('Teacher login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Quiz management endpoints
app.get('/api/auth/teacher/quizzes', (req, res) => {
  try {
    // Simple token validation (implement proper JWT validation in production)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // For demo purposes, return empty array
    res.json({
      success: true,
      data: {
        quizzes: []
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching quizzes'
    });
  }
});

app.post('/api/auth/quiz/create', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const { title, description, timeLimit, maxStudents, allowLateJoin } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Quiz title is required'
      });
    }

    const quizSession = {
      id: Date.now().toString(),
      title,
      description: description || '',
      timeLimit: timeLimit || 60,
      maxStudents: maxStudents || 50,
      allowLateJoin: allowLateJoin !== false,
      code: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
      isActive: true,
      students: []
    };

    quizSessions.set(quizSession.code, quizSession);

    res.json({
      success: true,
      data: {
        quizSession
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error creating quiz'
    });
  }
});

app.delete('/api/auth/quiz/:quizId', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const { quizId } = req.params;
    
    // For demo purposes, just return success
    res.json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting quiz'
    });
  }
});

// Student endpoints
app.post('/api/auth/student/join', (req, res) => {
  try {
    const { studentName, quizCode } = req.body;
    
    if (!studentName || !quizCode) {
      return res.status(400).json({
        success: false,
        message: 'Student name and quiz code are required'
      });
    }

    const quizSession = quizSessions.get(quizCode.toUpperCase());
    
    if (!quizSession) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found. Please check the code.'
      });
    }

    if (!quizSession.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This quiz is no longer active'
      });
    }

    if (quizSession.students.length >= quizSession.maxStudents) {
      return res.status(400).json({
        success: false,
        message: 'Quiz is full'
      });
    }

    res.json({
      success: true,
      data: {
        quiz: {
          title: quizSession.title,
          description: quizSession.description,
          code: quizSession.code
        },
        student: {
          name: studentName
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error joining quiz'
    });
  }
});

// Store for active polls and participants
const activePollsMap = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Teacher creates a room
  socket.on('teacher-create-room', (data) => {
    const { teacherName, roomCode } = data;
    
    socket.join(roomCode);
    activeTeachers.set(roomCode, {
      teacherId: socket.id,
      teacherName,
      students: new Map()
    });
    
    socket.emit('room-created', { roomCode, teacherName });
    console.log(`Teacher ${teacherName} created room ${roomCode}`);
  });

  // Student joins a room
  socket.on('student-join-room', (data) => {
    const { studentName, roomCode } = data;
    
    if (activeTeachers.has(roomCode)) {
      socket.join(roomCode);
      
      const roomData = activeTeachers.get(roomCode);
      roomData.students.set(socket.id, studentName);
      
      socket.emit('room-joined', { roomCode, studentName });
      socket.to(roomCode).emit('student-joined', { studentName, studentId: socket.id });
      
      console.log(`Student ${studentName} joined room ${roomCode}`);
    } else {
      socket.emit('room-not-found');
    }
  });

  // Teacher starts a poll
  socket.on('start-poll', (data) => {
    const { roomCode, question, options } = data;
    
    const pollData = {
      question,
      options: options.map(option => ({ text: option, votes: 0 })),
      responses: new Map()
    };
    
    activePollsMap.set(roomCode, pollData);
    
    io.to(roomCode).emit('poll-started', { question, options });
    console.log(`Poll started in room ${roomCode}: ${question}`);
  });

  // Student submits poll response
  socket.on('submit-response', (data) => {
    const { roomCode, optionIndex } = data;
    
    if (activePollsMap.has(roomCode)) {
      const poll = activePollsMap.get(roomCode);
      
      // Check if student already voted
      if (!poll.responses.has(socket.id)) {
        poll.options[optionIndex].votes++;
        poll.responses.set(socket.id, optionIndex);
        
        // Send updated results to teacher
        const teacherRoom = activeTeachers.get(roomCode);
        if (teacherRoom) {
          io.to(teacherRoom.teacherId).emit('poll-results', {
            results: poll.options,
            totalResponses: poll.responses.size
          });
        }
        
        socket.emit('response-submitted');
        console.log(`Response submitted for room ${roomCode}`);
      } else {
        socket.emit('already-voted');
      }
    }
  });

  // Teacher ends poll
  socket.on('end-poll', (data) => {
    const { roomCode } = data;
    
    if (activePollsMap.has(roomCode)) {
      const poll = activePollsMap.get(roomCode);
      
      io.to(roomCode).emit('poll-ended', {
        results: poll.options,
        totalResponses: poll.responses.size
      });
      
      activePollsMap.delete(roomCode);
      console.log(`Poll ended in room ${roomCode}`);
    }
  });

  // Teacher kicks out student
  socket.on('kick-student', (data) => {
    const { roomCode, studentId } = data;
    
    if (activeTeachers.has(roomCode)) {
      const roomData = activeTeachers.get(roomCode);
      const studentName = roomData.students.get(studentId);
      
      if (studentName) {
        roomData.students.delete(studentId);
        io.to(studentId).emit('kicked-out');
        socket.to(roomCode).emit('student-kicked', { studentId, studentName });
        
        console.log(`Student ${studentName} was kicked from room ${roomCode}`);
      }
    }
  });

  // Chat message
  socket.on('send-message', (data) => {
    const { roomCode, message, senderName, senderType } = data;
    
    socket.to(roomCode).emit('receive-message', {
      message,
      senderName,
      senderType,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove from active teachers
    for (const [roomCode, roomData] of activeTeachers) {
      if (roomData.teacherId === socket.id) {
        // Notify all students that teacher left
        socket.to(roomCode).emit('teacher-left');
        activeTeachers.delete(roomCode);
        activePollsMap.delete(roomCode);
        console.log(`Teacher left room ${roomCode}`);
        break;
      }
      
      // Remove from students
      if (roomData.students.has(socket.id)) {
        const studentName = roomData.students.get(socket.id);
        roomData.students.delete(socket.id);
        socket.to(roomCode).emit('student-left', { studentId: socket.id, studentName });
        console.log(`Student ${studentName} left room ${roomCode}`);
        break;
      }
    }
  });
});

// Basic routes
app.get('/', (req, res) => {
  res.send('Live Poll Server is running!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
