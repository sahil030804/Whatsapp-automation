# WhatsApp Automation

A production-ready Node.js application for WhatsApp automation with enterprise-grade authentication, Redis-based session management, and comprehensive error handling.

## 🚀 Features

### Authentication & Session Management
- **Express Session Management** with Redis storage
- **User Registration & Login** with secure password hashing
- **Session-based Authentication** (30-day session duration)
- **Automatic Session Cleanup** on logout and expiration
- **User Profile Management** with cached data retrieval
- **Email Validation** and duplicate checking

### Caching & Performance
- **Redis-based User Caching** (5-minute TTL)
- **Cache-first Authentication** for reduced database load
- **Automatic Cache Invalidation** on user data changes
- **Graceful Fallback** to database on cache misses

### Error Handling & Validation
- **Centralized Error Codes** with consistent HTTP status codes
- **Professional Error Middleware** with proper response formatting
- **Joi-based Input Validation** for all API endpoints
- **Simplified API Response Format** for better frontend integration

### Security
- **Environment-based Configuration** with dotenv-safe
- **Secure Session Cookies** (HTTPOnly, SameSite, production HTTPS)
- **SQL Injection Prevention** with parameterized queries
- **XSS Protection** with secure cookie settings
- **Password Hashing** using bcrypt

### Development & Operations
- **Structured Logging** with Pino
- **Development Auto-restart** with Nodemon
- **Code Quality** with ESLint and Prettier
- **Graceful Shutdown** handling
- **Health Check Endpoints**

## 🛠 Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL with connection pooling
- **Cache**: Redis with connect-redis
- **Session**: express-session with Redis store
- **Validation**: Joi
- **Logging**: Pino
- **Security**: bcrypt, dotenv-safe

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **PostgreSQL** (v12 or higher)
- **Redis** (v6 or higher)
- **Git**

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sahil030804/Whatsapp-automation.git
   cd Whatsapp-automation
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## ⚙️ Environment Configuration

1. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables:**
   Edit the `.env` file with your specific configuration:

   ```env
   # Application Configuration
   NODE_ENV=development
   PORT=3120
   SESSION_SECRET=your_session_secret_key_change_in_production

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=whatsapp_automation
   DB_USER=postgres
   DB_PASSWORD=your_actual_password

   # Database Connection Pool Settings
   DB_MAX_CONNECTIONS=20
   DB_IDLE_TIMEOUT=30000
   DB_CONNECTION_TIMEOUT=2000

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   REDIS_KEY_PREFIX=whatsapp:
   USER_CACHE_TTL=300

   # JWT Configuration (for future use)
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h

   # Logging Configuration
   LOG_LEVEL=info
   ```

### Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Server port | `3120` |
| `SESSION_SECRET` | Session encryption key | - |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `whatsapp_automation` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `REDIS_HOST` | Redis server host | `localhost` |
| `REDIS_PORT` | Redis server port | `6379` |
| `REDIS_PASSWORD` | Redis password | - |
| `USER_CACHE_TTL` | Cache TTL in seconds | `300` |

## 🗄 Database Setup

### Option 1: Using PostgreSQL CLI

1. **Set postgres password (if needed):**
   ```bash
   sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
   ```

2. **Run the setup script:**
   ```bash
   PGPASSWORD=postgres psql -U postgres -h localhost -f database/setup.sql
   ```

### Option 2: Manual Database Setup

1. **Connect to PostgreSQL:**
   ```bash
   sudo -u postgres psql
   ```

2. **Create database and user:**
   ```sql
   CREATE DATABASE whatsapp_automation;
   CREATE USER whatsapp_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE whatsapp_automation TO whatsapp_user;
   \q
   ```

3. **Create the users table:**
   ```sql
   CREATE TABLE users (
       id SERIAL PRIMARY KEY,
       uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
       email VARCHAR(255) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       full_name VARCHAR(255) NOT NULL,
       first_name VARCHAR(100),
       last_name VARCHAR(100),
       phone VARCHAR(20),
       avatar_url VARCHAR(500),
       is_active BOOLEAN DEFAULT true,
       last_login_at TIMESTAMP,
       login_count INTEGER DEFAULT 0,
       role VARCHAR(50) DEFAULT 'user',
       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
       deleted_at TIMESTAMP
   );

   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_uuid ON users(uuid);
   CREATE INDEX idx_users_is_active ON users(is_active);
   CREATE INDEX idx_users_created_at ON users(created_at);
   CREATE INDEX idx_users_last_login_at ON users(last_login_at);
   ```

## 🔴 Redis Setup

### Install Redis

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Windows:**
Download and install Redis from the official website or use WSL.

### Verify Redis Installation
```bash
redis-cli ping
# Should return: PONG
```

## 🏃 Running the Application

### Development Mode

1. **Start the application with nodemon:**
   ```bash
   npm run dev
   ```

   The server will automatically restart on file changes.

### Production Mode

1. **Start the application:**
   ```bash
   npm start
   ```

### Expected Startup Output

```
[2024-01-01T12:00:00.000Z] INFO: Database connected successfully
[2024-01-01T12:00:00.001Z] INFO: Redis client connected
[2024-01-01T12:00:00.002Z] INFO: Server is running
    port: "3120"
    env: "development"
```

## 📁 Project Structure

```
Whatsapp-automation/
├── components/
│   ├── auth/
│   │   ├── auth.controller.js      # Authentication controllers
│   │   ├── auth.service.js         # Authentication business logic
│   │   ├── auth.validation.js      # Joi validation schemas
│   │   └── auth.routes.js          # Authentication routes
│   └── indexRoute.js               # Main route aggregator
├── config/
│   └── index.js                    # Configuration management
├── constants/
│   └── errorCodes.js               # Centralized error definitions
├── dbUtils/
│   ├── base.js                     # Base database operations
│   └── user.js                     # User-specific database operations
├── lib/
│   ├── database.js                 # PostgreSQL connection pool
│   ├── logger.js                   # Pino logging configuration
│   └── redis.js                    # Redis client and utilities
├── middleware/
│   ├── auth.js                     # Authentication middleware
│   ├── errorHandler.js             # Error handling middleware
│   └── validation.js               # Request validation middleware
├── database/
│   └── setup.sql                   # Database schema
├── migrations/
│   └── ...                         # Database migration files
├── .env.example                    # Environment variables template
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
└── server.js                       # Application entry point
```

### Key Files Explained

- **`config/index.js`**: Centralized configuration with environment variables
- **`lib/database.js`**: PostgreSQL connection pool with error handling
- **`lib/redis.js`**: Redis client with caching utilities
- **`middleware/auth.js`**: Session-based authentication middleware
- **`middleware/errorHandler.js`**: Professional error handling
- **`constants/errorCodes.js`**: Centralized error code definitions
- **`server.js`**: Main application with graceful startup/shutdown

## 📚 API Documentation

### Authentication Endpoints

#### POST `/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "isActive": true,
    "role": "user",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### POST `/auth/login`
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "isActive": true,
    "role": "user",
    "lastLoginAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### POST `/auth/logout`
Destroy user session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET `/auth/profile`
Get current user profile (requires authentication).

**Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "isActive": true,
    "role": "user",
    "createdAt": "2024-01-01T12:00:00.000Z",
    "lastLoginAt": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET `/auth/check-email/:email`
Check if email is available for registration.

**Response (200):**
```json
{
  "success": true,
  "message": "Email check completed",
  "email": "user@example.com",
  "exists": false
}
```

### System Endpoints

#### GET `/health-check`
Service health status check.

**Response (200):**
```json
{
  "message": "Welcome to the whatsapp automation tool!",
  "success": true
}
```

## 🔐 Authentication Flow

### Session-based Authentication

1. **User Login**: Credentials validated, session created in Redis
2. **Session Cookie**: `whatsapp.sid` cookie sent to client
3. **Authenticated Requests**: Middleware validates session and attaches user data
4. **User Caching**: User data cached in Redis for 5 minutes
5. **Session Expiration**: Sessions expire after 30 days
6. **Logout**: Session destroyed in Redis and cookie cleared

### Middleware Usage

```javascript
// Protect routes
router.get('/profile', isLoggedIn, getProfile);

// Access user data in controllers
const user = req.user;  // Cached user data
const userId = req.userId;  // User ID from session
```

## ⚠️ Error Handling

### Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `internal_error` | 500 | Internal server error |
| `database_error` | 500 | Database operation failed |
| `redis_error` | 500 | Cache service unavailable |
| `validation_error` | 400 | Invalid input data |
| `unauthorized` | 401 | Authentication required |
| `invalid_credentials` | 401 | Invalid email or password |
| `session_expired` | 401 | Session expired, login again |
| `account_disabled` | 401 | Account disabled |
| `forbidden` | 403 | Insufficient permissions |
| `user_not_found` | 404 | User not found |
| `user_exists` | 409 | User with email already exists |

### Error Response Format

```json
{
  "success": false,
  "error": "validation_error",
  "message": "Invalid input data"
}
```

## 🔒 Security Considerations

### Implemented Security Measures

- **Session Security**: HTTPOnly cookies, SameSite protection, HTTPS in production
- **Password Security**: bcrypt hashing with salt rounds
- **Input Validation**: Joi schemas for all API inputs
- **SQL Injection Prevention**: Parameterized queries only
- **Environment Variables**: Sensitive data in .env file
- **CORS Protection**: Configurable for production

### Best Practices

- Use strong session secrets in production
- Enable HTTPS in production environment
- Regularly update dependencies
- Monitor Redis and database connections
- Implement rate limiting for authentication endpoints

## 🛠 Development Guidelines

### Adding New Features

1. **Configuration**: Add environment variables to `.env.example` and `config/index.js`
2. **Validation**: Create Joi schemas in appropriate validation files
3. **Error Handling**: Use centralized error codes from `constants/errorCodes.js`
4. **Logging**: Use the configured logger: `logger.info('message')`
5. **Database**: Use utility classes in `dbUtils/` for database operations
6. **Caching**: Implement Redis caching for frequently accessed data

### Code Style

- Use ES6+ features and async/await
- Follow existing naming conventions and file structure
- Add JSDoc comments for functions
- Handle errors appropriately with try/catch blocks
- Use centralized error codes instead of manual responses

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Ensure PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database credentials in `.env`
   - Verify database exists: `\l` in psql

2. **Redis Connection Failed**
   - Ensure Redis is running: `sudo systemctl status redis`
   - Check Redis configuration in `.env`
   - Test Redis connection: `redis-cli ping`

3. **Session Issues**
   - Verify Redis is running for session storage
   - Check session secret in environment variables
   - Clear browser cookies if session problems persist

4. **Port Already in Use**
   - Change `PORT` in `.env` file
   - Kill process using the port: `sudo lsof -ti:3120 | xargs kill -9`

5. **Environment Variables Not Loading**
   - Ensure `.env` file exists in project root
   - Check file permissions
   - Verify variable names match `.env.example`

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

### Connection Testing

Test database connection:
```bash
node -e "
const { connectDatabase } = require('./lib/database');
connectDatabase().then(() => console.log('DB OK')).catch(console.error);
"
```

Test Redis connection:
```bash
node -e "
const { createRedisClient } = require('./lib/redis');
createRedisClient().then(() => console.log('Redis OK')).catch(console.error);
"
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the development guidelines
4. Test thoroughly including error scenarios
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

---

## 🎯 Quick Start Checklist

- [ ] Install Node.js, PostgreSQL, and Redis
- [ ] Clone repository and install dependencies
- [ ] Configure `.env` file with database and Redis credentials
- [ ] Set up PostgreSQL database using `database/setup.sql`
- [ ] Start Redis server
- [ ] Run `npm run dev` to start development server
- [ ] Test authentication endpoints using Postman or curl
- [ ] Verify session management and user caching