# TaskFlow - Modern Task Management Application

## 📋 Overview

TaskFlow is a full-stack MERN (MongoDB, Express.js, React, Node.js) task management application that provides a comprehensive solution for organizing and tracking tasks. The application features role-based authentication, real-time task management, administrative controls, and detailed user activity logging.

## ✨ Features

### 🔐 Authentication System
- **JWT-Based Authentication**: Secure token-based authentication system
- **Role-Based Access Control**: User and Admin roles with different permissions
- **Protected Routes**: Authentication-first routing with automatic redirects
- **Password Reset**: Forgot password functionality with email verification
- **Session Management**: Automatic token refresh and logout handling

### 📝 Task Management
- **CRUD Operations**: Create, read, update, and delete tasks
- **Task Filtering**: Filter tasks by status (completed/incomplete), priority, and search by title
- **Task Analytics**: Visual progress tracking and completion statistics
- **Due Date Management**: Set and track task deadlines
- **Priority Levels**: High, Medium, Low priority classification
- **Real-time Updates**: Instant task status updates across the application

### 👨‍💼 Admin Dashboard
- **User Management**: View and manage all registered users
- **Task Analytics**: Comprehensive task statistics and insights
- **User Activity Logs**: Track user login/logout times, IP addresses, and JWT tokens
- **Bulk Operations**: Delete multiple user logs simultaneously
- **Advanced Filtering**: Filter logs by action, role, email, and date ranges

### 🎨 User Interface
- **Modern Design**: Clean, responsive UI built with TailwindCSS
- **Dark/Light Mode**: Adaptive theme support
- **Mobile Responsive**: Optimized for all device sizes
- **Interactive Components**: Modal dialogs, notifications, and real-time feedback
- **Intuitive Navigation**: Sidebar navigation with role-based menu items

## 🛠 Tech Stack

### Frontend
- **React 18**: Modern React with Hooks and Context API
- **React Router**: Client-side routing with protected routes
- **TailwindCSS**: Utility-first CSS framework
- **React Icons**: Comprehensive icon library
- **React Toastify**: Toast notifications
- **Axios**: HTTP client for API requests

### Backend
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing and encryption
- **CORS**: Cross-origin resource sharing middleware
- **dotenv**: Environment variable management

## 🚀 Quick Start

### Prerequisites
- Node.js (v20.14.0 or higher)
- npm (v10.7.0 or higher)
- MongoDB (local installation or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react_node_test
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Environment Configuration**
   
   Create a `.env` file in the `server` directory:
   ```env
   PORT=5050
   MONGODB_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET=your_super_secure_jwt_secret_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system:
   ```bash
   # For macOS with Homebrew
   brew services start mongodb-community
   
   # For Linux
   sudo systemctl start mongod
   
   # For Windows
   net start MongoDB
   ```

6. **Run the application**
   
   Start the backend server:
   ```bash
   cd server
   npm run dev
   ```
   
   In a new terminal, start the frontend:
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5050

## 📁 Project Structure

```
react_node_test/
├── public/                     # Static assets
├── src/                        # Frontend source code
│   ├── components/             # Reusable React components
│   │   ├── admin/             # Admin-specific components
│   │   ├── auth/              # Authentication components
│   │   ├── common/            # Shared UI components
│   │   ├── tasks/             # Task-related components
│   │   └── user/              # User-specific components
│   ├── contexts/              # React Context providers
│   ├── hooks/                 # Custom React hooks
│   ├── pages/                 # Page components
│   │   ├── AdminPages/        # Admin dashboard pages
│   │   └── UserPages/         # User dashboard pages
│   ├── utils/                 # Utility functions and API calls
│   └── main.jsx               # Application entry point
├── server/                     # Backend source code
│   ├── src/
│   │   ├── controller/        # Request handlers
│   │   ├── middleware/        # Custom middleware
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API route definitions
│   │   └── index.js           # Server entry point
│   └── package.json           # Backend dependencies
└── README.md                  # Project documentation
```

## 🔌 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | `{ email, password, firstName, lastName }` |
| POST | `/api/auth/login` | User login | `{ email, password }` |
| POST | `/api/auth/logout` | User logout | `{}` |
| POST | `/api/auth/forgot-password` | Request password reset | `{ email }` |
| POST | `/api/auth/reset-password` | Reset password | `{ token, newPassword }` |

### Task Management Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tasks` | Get user tasks with filters | Yes |
| GET | `/api/tasks/:id` | Get specific task | Yes |
| POST | `/api/tasks` | Create new task | Yes |
| PUT | `/api/tasks/:id` | Update task | Yes |
| PATCH | `/api/tasks/:id/status` | Update task status | Yes |
| DELETE | `/api/tasks/:id` | Delete task | Yes |
| GET | `/api/tasks/stats/summary` | Get task statistics | Yes |

### Query Parameters for Tasks
- `status`: Filter by completion status (`completed`, `pending`)
- `priority`: Filter by priority level (`high`, `medium`, `low`)
- `search`: Search tasks by title
- `page`: Pagination page number
- `limit`: Number of results per page

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users` | Get all users | Admin only |
| GET | `/api/admin/tasks` | Get all tasks | Admin only |
| GET | `/api/user-logs` | Get user activity logs | Admin only |
| DELETE | `/api/user-logs/:id` | Delete specific log | Admin only |
| DELETE | `/api/user-logs/bulk` | Delete multiple logs | Admin only |

## 🎯 Usage

### For Regular Users
1. **Registration/Login**: Create an account or login with existing credentials
2. **Task Creation**: Use the "+" button to create new tasks with title, description, priority, and due date
3. **Task Management**: Mark tasks as complete, edit details, or delete tasks
4. **Filtering**: Use the filter options to view tasks by status or search by title
5. **Profile**: View and update your profile information

### For Administrators
1. **Admin Dashboard**: Access comprehensive analytics and user management
2. **User Management**: View all registered users and their activity
3. **Task Analytics**: Monitor task completion rates and user productivity
4. **User Logs**: Track user login/logout activities, session durations, and IP addresses
5. **Bulk Operations**: Manage multiple user logs efficiently

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Stateless authentication with secure tokens
- **CORS Protection**: Configured cross-origin resource sharing
- **Input Validation**: Server-side validation for all inputs
- **Protected Routes**: Authentication middleware on sensitive endpoints
- **Role-Based Access**: Admin-only endpoints and features

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
npm run build
# Deploy to Vercel or your preferred platform
```

### Backend Deployment (Heroku/Railway)
```bash
# Set environment variables on your platform
# Deploy using your platform's CLI or Git integration
```

### Environment Variables for Production
```env
PORT=5050
MONGODB_URI=<your-mongodb-atlas-uri>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -m 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Tips
- Use MongoDB Compass for database visualization
- Install React Developer Tools for debugging
- Use Postman for API testing
- Check browser console for frontend errors
