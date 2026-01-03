# Automated Assessment and Feedback System

A comprehensive web-based platform for automated assessment and feedback on language learning activities including speaking, writing, and quiz submissions.

## 📋 Project Overview

This system provides AI-powered evaluation and feedback for students, with teacher review capabilities and comprehensive analytics. Built with React (frontend) and Node.js/Express (backend), following a clean 3-layer architecture.

## ✨ Features Implemented

### Phase 1: Foundation (COMPLETED)

#### Database Layer
- ✅ **11 MongoDB Models** with full validation and indexing:
  - User (authentication and roles)
  - Student & Teacher (role-specific profiles)
  - Activity (assignments for students)
  - Submission (student work submissions)
  - Evaluation (AI-generated assessments)
  - Mistake (error identification)
  - Feedback (personalized recommendations)
  - Rubric (evaluation criteria)
  - ProgressReport (weekly analytics)
  - Notification (system alerts)
  - AuditLog (security and compliance)

#### Backend Infrastructure
- ✅ **Express.js Server** with proper error handling
- ✅ **MongoDB Integration** with connection pooling
- ✅ **Configuration Management** (database, JWT, constants)
- ✅ **Logging System** (Winston) with file rotation
- ✅ **Request Validation** (express-validator)
- ✅ **CORS Configuration** for frontend integration

#### Security & Authentication (FR1)
- ✅ **JWT Authentication** with access and refresh tokens
- ✅ **Role-Based Access Control (RBAC)** for Student/Teacher/Admin
- ✅ **Password Hashing** (bcrypt with 10 rounds)
- ✅ **Token Expiration** (1 hour access, 7 days refresh)
- ✅ **Auth Middleware** for route protection
- ✅ **Audit Logging** for all authentication events

#### Repository Pattern
- ✅ **UserRepository** - user CRUD and search
- ✅ **SubmissionRepository** - submission management
- ✅ **EvaluationRepository** - assessment data access
- ✅ **FeedbackRepository** - feedback management
- ✅ **AuditLogRepository** - audit trail queries

#### API Endpoints (Auth)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/change-password` - Change password

## 🏗️ Architecture

### Three-Layer Architecture
```
┌─────────────────────────────────────┐
│     Presentation Layer (Routes)     │
├─────────────────────────────────────┤
│    Business Logic (Controllers)     │
│         Service Layer (AI)          │
├─────────────────────────────────────┤
│   Data Access (Repositories)        │
│       Domain Layer (Models)         │
└─────────────────────────────────────┘
```

### Project Structure
```
automated-assessment-system/
├── backend/
│   ├── src/
│   │   ├── models/           # Domain Layer (11 models)
│   │   ├── repositories/     # Data Access Layer
│   │   ├── services/         # Business Logic (Mock AI)
│   │   ├── controllers/      # Request Handlers
│   │   ├── routes/           # API Endpoints
│   │   ├── middleware/       # Auth, RBAC, Error, Audit
│   │   ├── config/           # Configuration
│   │   ├── utils/            # Helpers & Validators
│   │   ├── app.js            # Express App
│   │   └── server.js         # Server Entry Point
│   ├── logs/                 # Application Logs
│   ├── .env                  # Environment Variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React Components
│   │   ├── pages/            # Page Components
│   │   ├── contexts/         # State Management
│   │   ├── services/         # API Clients
│   │   ├── hooks/            # Custom Hooks
│   │   ├── utils/            # Utilities
│   │   └── styles/           # CSS Styles
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, CORS, helmet
- **Validation**: express-validator
- **Logging**: Winston
- **File Upload**: Multer

### Frontend
- **Framework**: React 18+
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Charts**: Recharts
- **State**: Context API + useReducer

### Development Tools
- **Code Quality**: ESLint, Prettier
- **Version Control**: Git
- **Environment**: dotenv

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- MongoDB 6 or higher
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd automated-assessment-system
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

4. **Configure Environment Variables**

Create `.env` file in backend directory (use `.env.example` as template):
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/assessment-system
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000
```

5. **Start MongoDB**
```bash
mongod
```

6. **Start Backend Server**
```bash
cd backend
npm run dev
```

7. **Start Frontend Development Server**
```bash
cd frontend
npm start
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/health

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "student"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "email": "student@example.com",
      "name": "John Doe",
      "role": "student"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer {accessToken}
```

## 🔐 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: Signed with RS256 algorithm
- **Token Expiration**: 1 hour for access, 7 days for refresh
- **Role-Based Access**: Student, Teacher, Admin roles
- **Audit Logging**: All actions tracked with IP and user agent
- **Input Validation**: Comprehensive validation on all endpoints
- **Error Handling**: Secure error messages in production

## 👥 User Roles

### Student
- Submit speaking, writing, and quiz activities
- View own submissions and evaluations
- Receive AI-generated feedback
- Track progress over time

### Teacher
- Review student submissions
- Override AI evaluations
- Create and manage rubrics
- Create activities
- View student analytics

### Admin
- Manage all users
- Access system-wide analytics
- View audit logs
- Configure system settings

## 📊 Database Schema

### Key Collections
- **users**: Authentication and role information
- **students**: Student-specific profiles
- **teachers**: Teacher-specific profiles
- **activities**: Assignments created by teachers
- **submissions**: Student work submissions
- **evaluations**: AI-generated assessments
- **mistakes**: Identified errors with suggestions
- **feedback**: Personalized feedback
- **progressreports**: Weekly progress analytics
- **notifications**: System alerts
- **auditlogs**: Security and compliance tracking

## 🔄 Development Workflow

### Current Phase: Phase 1 - Foundation ✅
- [x] Project setup and configuration
- [x] Database models with validation
- [x] Authentication system (FR1)
- [x] JWT middleware and RBAC
- [x] Repository layer
- [x] Error handling and logging

### Next Phase: Phase 2 - Submission Features
- [ ] Submission controllers (FR2-FR4)
- [ ] File upload handling
- [ ] Frontend submission forms

### Upcoming Phases
- Phase 3: Mock AI Evaluation System (FR5-FR8)
- Phase 4: Progress & Analytics (FR9-FR10, FR20)
- Phase 5: Teacher Features (FR11-FR12)
- Phase 6: Admin & System Features (FR13-FR19)
- Phase 7: Testing & Refinement
- Phase 8: Documentation & Deployment

## 📝 Code Quality

### ESLint Configuration
- Follows recommended ESLint rules
- Node.js best practices
- Consistent code style with Prettier

### Code Standards
- ES6+ modules
- Async/await for asynchronous operations
- Error-first callbacks
- Repository pattern for data access
- Service layer for business logic

## 🧪 Testing (Planned)

- **Unit Tests**: Jest for service layer
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Cypress for user flows
- **Coverage Goal**: 80%+

## 📖 Contributing

This project follows strict guidelines:
- All 20 Functional Requirements must be implemented
- Adherence to UML diagrams (Use Case, Sequence, Class)
- Compliance with 14 evaluation criteria categories
- Complete documentation for all features

## 📄 License

MIT License

## 👨‍💻 Development Team

Developed according to specifications from SENG Project documentation with contributions across all 20 functional requirements.

---

**Status**: Phase 1 Complete | Backend Foundation Ready | Frontend Setup Complete
**Next**: Implementing Submission Features (FR2-FR4)
