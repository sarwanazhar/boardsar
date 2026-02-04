# BoardSar

A collaborative whiteboard application built with Next.js and Go, featuring real-time drawing capabilities and user authentication.

![Next.js](https://img.shields.io/badge/Next.js-2026-black?style=for-the-badge&logo=nextdotjs)
![Go](https://img.shields.io/badge/Go-1.24-blue?style=for-the-badge&logo=go)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4-green?style=for-the-badge&logo=mongodb)
![React](https://img.shields.io/badge/React-19-orange?style=for-the-badge&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-blue?style=for-the-badge&logo=tailwind-css)

## Features

- 🎨 **Real-time Drawing**: Collaborative whiteboard with multiple drawing tools
- 👤 **User Authentication**: Secure JWT-based authentication system
- 📊 **Board Management**: Create, view, update, and delete boards
- 🔒 **Cross-User Security**: Users can only access their own boards
- 🌐 **Modern UI**: Built with Next.js 16 and Tailwind CSS
- 🎯 **Type Safety**: Full TypeScript support on the frontend
- 🧪 **Comprehensive Testing**: Integration test suite for backend API

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Konva** - Canvas library for drawing
- **Zustand** - State management
- **Axios** - HTTP client

### Backend
- **Go 1.24** - Backend programming language
- **Gin** - HTTP web framework
- **MongoDB** - NoSQL database
- **JWT** - JSON Web Token authentication
- **Gorilla CORS** - Cross-Origin Resource Sharing

## Project Structure

```
BoardSar/
├── backend/                    # Go backend API
│   ├── main.go                # Application entry point
│   ├── controllers/           # API controllers
│   │   ├── auth.go           # Authentication logic
│   │   └── board.controller.go # Board operations
│   ├── models/               # Data models
│   │   ├── user.go           # User model
│   │   └── board.model.go    # Board model
│   ├── routes/               # API routes
│   │   ├── mainRoutes.go     # Route definitions
│   │   └── board.routes.go   # Board-specific routes
│   ├── database/             # Database connection
│   │   └── mongo.go          # MongoDB setup
│   ├── libs/                 # Utility libraries
│   │   ├── auth.go           # JWT utilities
│   │   └── middleware.go     # Authentication middleware
│   ├── test/                 # Test files
│   ├── .env.example          # Environment variables template
│   ├── go.mod               # Go module definition
│   └── README_TEST.md       # Test documentation
├── client/                   # Next.js frontend
│   ├── app/                  # App Router pages
│   ├── components/           # React components
│   ├── lib/                  # Utility functions
│   ├── public/               # Static assets
│   ├── .env.local.example    # Environment variables template
│   ├── next.config.ts        # Next.js configuration
│   ├── tsconfig.json         # TypeScript configuration
│   └── package.json          # Dependencies
└── README.md                # This file
```

## Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18 or higher)
- **Go** (v1.24 or higher)
- **MongoDB** (local or cloud instance)
- **Git**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/sarwanazhar/boardsar.git
cd boardsar
```

### 2. Backend Setup

#### Install Go dependencies
```bash
cd backend
go mod download
```

#### Configure environment variables
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
PORT=8080
MONGODB_URI=mongodb://localhost:27017/boardsar
JWT_SECRET=your-super-secret-jwt-key-here
```

### 3. Frontend Setup

#### Install dependencies
```bash
cd ../client
pnpm install
```

#### Configure environment variables
```bash
cp .env.local.example .env.local
```

Edit the `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Running the Application

### Start MongoDB
Ensure MongoDB is running locally or update the connection string in your `.env` file.

### Start the Backend
```bash
cd backend
go run main.go
```
The backend will start on `http://localhost:8080`

### Start the Frontend
```bash
cd ../client
pnpm dev
```
The frontend will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /me` - Get current user profile

### Boards
- `GET /api/boards` - List all user's boards
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get specific board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

## Testing

### Backend Integration Tests

The backend includes a comprehensive integration test suite:

```bash
cd backend
# Run with virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 TestIntegrationBackend.py

# Or with pytest
python3 -m pytest TestIntegrationBackend.py -v
```

#### Test Categories
- **User Authentication** (11 tests) - Registration, login, JWT validation
- **Board CRUD Operations** (13 tests) - Create, read, update, delete boards
- **Security & Edge Cases** (6 tests) - Cross-user access prevention, CORS, validation

#### Prerequisites for Testing
```bash
# Required Python packages
pip install requests pymongo python-dotenv

# Environment variables for testing
export TEST_BASE_URL=http://localhost:8080
export MONGODB_URI=mongodb://localhost:27017/boardsar_test
export JWT_SECRET=your-jwt-secret-key
```

## Environment Variables

### Backend (.env)
```env
PORT=8080                    # Server port
MONGODB_URI=mongodb://localhost:27017/boardsar  # MongoDB connection string
JWT_SECRET=your-secret-key  # JWT signing secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080  # Backend API URL
```

## Development

### Code Style
- **Go**: Follow standard Go conventions
- **TypeScript**: Strict mode enabled
- **Tailwind**: Use utility classes for styling

### Adding New Features
1. Create database models in `backend/models/`
2. Implement controllers in `backend/controllers/`
3. Add routes in `backend/routes/`
4. Create React components in `client/components/`
5. Update API calls in `client/lib/`

## Deployment

### Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Build the frontend: `cd client && pnpm build`
2. Deploy backend: `cd backend && go build -o boardsar`
3. Set environment variables for production
4. Run the compiled binary

### Vercel (Frontend)
The frontend is optimized for Vercel deployment:
```bash
cd client
vercel
```

### Production Considerations
- Use environment variables for secrets
- Enable HTTPS in production
- Set up proper CORS configuration
- Monitor application performance
- Implement proper error handling

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `cd backend && python3 TestIntegrationBackend.py`
5. Commit your changes: `git commit -m 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Code Review Guidelines
- Ensure all tests pass
- Follow existing code style
- Add appropriate comments for complex logic
- Update documentation for new features

## Security

### JWT Authentication
- Tokens are signed with HMAC using the JWT_SECRET
- Tokens expire after 24 hours
- All protected routes require valid JWT tokens sent via `Authorization: Bearer <token>` header

### Data Validation
- Input validation on all API endpoints
- Password strength requirements
- Email format validation

### CORS Configuration
- Configured for localhost development
- Update for production domains

## Troubleshooting

### Common Issues

#### MongoDB Connection
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

#### Port Conflicts
```bash
# Check if ports are in use
lsof -i :8080
lsof -i :3000

# Kill processes using ports
kill -9 <PID>
```

#### Dependency Issues
```bash
# Backend
cd backend
go mod tidy

# Frontend
cd client
pnpm install --force
```

### Getting Help
- Check the [Issues](https://github.com/sarwanazhar/boardsar/issues) section
- Review the test suite for expected behavior
- Check console logs for error details

## Contact

- **Repository**: [https://github.com/sarwanazhar/boardsar](https://github.com/sarwanazhar/boardsar)
- **Issues**: [GitHub Issues](https://github.com/sarwanazhar/boardsar/issues)

## Acknowledgments

- [Next.js](https://nextjs.org) for the excellent React framework
- [Gin](https://gin-gonic.com) for the fast Go web framework
- [React Konva](https://konvajs.org) for the canvas drawing capabilities
- [MongoDB](https://www.mongodb.com) for the database

---

**BoardSar** - Collaborative whiteboarding made simple. 🎨