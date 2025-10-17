# Time Tracker Backend API

A Node.js backend API for the Time Tracker React Native application, providing authentication, session tracking, financial management, and task/goal management.

## 🚀 Features

- **User Authentication** - JWT-based authentication with secure password hashing
- **Session Tracking** - Start, stop, and manage time tracking sessions
- **Financial Management** - Income and expense tracking with analytics
- **Task & Goals** - Daily habits, tasks, and goal tracking
- **Vision Board** - Visual goal representation for motivation
- **Analytics** - Comprehensive statistics and trends
- **Security** - Rate limiting, CORS, input validation, and secure headers

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Environment**: dotenv

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## ⚡ Quick Start

### 1. Clone and Setup

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/timetracker

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=30d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET | `/api/auth/me` | Get current user profile | ✅ |
| PUT | `/api/auth/profile` | Update user profile | ✅ |
| PUT | `/api/auth/password` | Change password | ✅ |
| POST | `/api/auth/logout` | Logout user | ✅ |

### Session Tracking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/sessions/start` | Start new session | ✅ |
| PUT | `/api/sessions/:id/stop` | Stop session with notes | ✅ |
| GET | `/api/sessions` | Get all sessions | ✅ |
| GET | `/api/sessions/active` | Get active session | ✅ |
| PUT | `/api/sessions/:id` | Update session | ✅ |
| DELETE | `/api/sessions/:id` | Delete session | ✅ |
| GET | `/api/sessions/stats` | Get session statistics | ✅ |

### Finance Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/finance` | Add income/expense | ✅ |
| GET | `/api/finance` | Get all transactions | ✅ |
| GET | `/api/finance/summary` | Get financial summary | ✅ |
| GET | `/api/finance/breakdown/expenses` | Expense categories | ✅ |
| GET | `/api/finance/breakdown/income` | Income sources | ✅ |
| GET | `/api/finance/trends` | Monthly trends | ✅ |
| GET | `/api/finance/stats` | Comprehensive stats | ✅ |
| PUT | `/api/finance/:id` | Update transaction | ✅ |
| DELETE | `/api/finance/:id` | Delete transaction | ✅ |

### Task & Goals Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/tasks/habits` | Create habit | ✅ |
| GET | `/api/tasks/habits` | Get all habits | ✅ |
| PUT | `/api/tasks/habits/:id/complete` | Complete habit | ✅ |
| DELETE | `/api/tasks/habits/:id` | Delete habit | ✅ |
| POST | `/api/tasks/daily` | Create daily task | ✅ |
| GET | `/api/tasks/daily` | Get daily tasks | ✅ |
| PUT | `/api/tasks/daily/:id/toggle` | Toggle task | ✅ |
| DELETE | `/api/tasks/daily/:id` | Delete task | ✅ |
| POST | `/api/goals` | Create goal | ✅ |
| GET | `/api/goals` | Get goals | ✅ |
| PUT | `/api/goals/:id/progress` | Update progress | ✅ |
| DELETE | `/api/goals/:id` | Delete goal | ✅ |
| GET | `/api/goals/vision` | Get vision board | ✅ |
| PUT | `/api/goals/:id/vision` | Add vision image | ✅ |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📊 Data Models

### User Model
```javascript
{
  name: String (required),
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, hashed),
  avatar: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Session Model
```javascript
{
  userId: ObjectId (required),
  sessionNumber: Number (auto-increment),
  startDateTime: Date (required),
  endDateTime: Date,
  duration: Number (calculated),
  experience: String,
  status: String (active/completed),
  createdAt: Date,
  updatedAt: Date
}
```

### Finance Model
```javascript
{
  userId: ObjectId (required),
  type: String (income/expense),
  amount: Number (required),
  category: String (required),
  notes: String,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Models

#### Habit Model
```javascript
{
  userId: ObjectId (required),
  name: String (required),
  icon: String,
  currentStreak: Number,
  longestStreak: Number,
  completedDates: [Date],
  isCompletedToday: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Daily Task Model
```javascript
{
  userId: ObjectId (required),
  title: String (required),
  description: String,
  isCompleted: Boolean,
  date: Date (required),
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Goal Model
```javascript
{
  userId: ObjectId (required),
  type: String (weekly/monthly/yearly),
  title: String (required),
  description: String,
  targetValue: Number (required),
  currentValue: Number,
  unit: String (required),
  progress: Number (calculated),
  startDate: Date (required),
  endDate: Date (required),
  isCompleted: Boolean,
  imageUrl: String (for vision board),
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

### Production Setup

1. Set `NODE_ENV=production` in environment variables
2. Use a process manager like PM2:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "timetracker-backend"
   ```

3. Set up MongoDB Atlas or production MongoDB instance
4. Configure environment variables for production

### Environment Variables for Production

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/timetracker
JWT_SECRET=your_production_jwt_secret_key
PORT=5000
FRONTEND_URL=https://yourdomain.com
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents API abuse
- **CORS**: Configured for React Native app
- **Input Validation**: Express validator middleware
- **Security Headers**: Helmet.js protection
- **Error Handling**: Comprehensive error responses

## 📝 Development

### Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js           # User schema
│   ├── Session.js        # Session schema
│   ├── Finance.js        # Finance schema
│   └── Task.js           # Task/Goal schemas
├── routes/
│   ├── auth.js           # Auth routes
│   ├── sessions.js       # Session routes
│   ├── finance.js        # Finance routes
│   └── tasks.js          # Task routes
├── controllers/
│   ├── authController.js     # Auth logic
│   ├── sessionController.js  # Session logic
│   ├── financeController.js  # Finance logic
│   └── taskController.js     # Task logic
├── middleware/
│   ├── auth.js           # JWT middleware
│   └── errorHandler.js   # Error handling
├── server.js             # Main server file
├── .env                  # Environment variables
└── package.json          # Dependencies
```

### Adding New Features

1. Define schema in appropriate model file
2. Create controller with business logic
3. Add routes in routes directory
4. Import and mount routes in server.js
5. Add authentication middleware if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation above
- Review the error handling in the codebase

---

**Happy coding! 🎉**
