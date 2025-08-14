# Live-Poll

A real-time polling system built with MERN stack that allows teachers to create interactive quizzes and students to participate with live results.

## 🚀 Features

### Teacher Features
- Create new polls
- View live polling results
- Ask new questions (only when no question is active or all students have answered)

### Student Features
- Enter name on first visit (unique to each tab)
- Submit answers once a question is asked
- View live polling results after submission
- 60-second time limit to answer questions

## Technology Stack

- **Frontend**: React with Redux for state management
- **Backend**: Express.js with Socket.io for real-time communication
- **Real-time**: Socket.io for live polling functionality

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
2. Install dependencies for both client and server:
   ```bash
   npm run install-all
   ```

### Development

To run both client and server simultaneously:
```bash
npm run dev
```

To run individually:
```bash
# Run server only
npm run server

# Run client only
npm run client
```

## Project Structure

```
├── client/          # React frontend
├── server/          # Express.js backend
├── package.json     # Root package.json for scripts
└── README.md
```

## API Endpoints

- Backend server runs on `http://localhost:3001`
- Frontend runs on `http://localhost:3000`
- Socket.io connection for real-time communication

## Features Implementation Status

- [ ] Basic project setup ✅
- [ ] Teacher poll creation
- [ ] Student answer submission
- [ ] Real-time results display
- [ ] Timer functionality
- [ ] User interface design
- [ ] Socket.io integration
- [ ] Hosting setup

## Good to Have Features

- [ ] Configurable poll time limit by teacher
- [ ] Option for teacher to remove a student
- [ ] Well-designed user interface

## Bonus Features

- [ ] Chat popup for interaction between students and teachers
- [ ] Teacher can view past poll results (not stored locally)
"# Live-Poll" 
"# Live-poll" 
