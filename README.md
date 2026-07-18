# Mini E-Commerce API

This project is a backend API for a mini e-commerce application built with Node.js and Express.

## Features
- User authentication with JWT (Access Token + Refresh Token)
- Role-based access control (Admin, User)
- User registration and login
- Cart management
- Error handling
- MongoDB integration

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd mini_E-commerce
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

## Usage

Start the development server:
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

## API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register

Body:
{
  "email": "[EMAIL_ADDRESS]",
  "password": "password123",
  "name": "John Doe",
  "role": "user"
}
```

#### Login
```http
POST /api/auth/login

Body:
{
  "email": "[EMAIL_ADDRESS]",
  "password": "password123"
}
```

#### Logout
```http
POST /api/auth/logout

Headers:
Authorization: Bearer <access_token>
```

#### Refresh Access Token
```http
POST /api/auth/refresh

Body:
{
  "refreshToken": "<refresh_token>"
}
```

#### Protected Route Example
```http
GET /api/protected

Headers:
Authorization: Bearer <access_token>
```

## Error Handling

Errors are handled using centralized middleware:
- 404 - Not Found
- 401 - Unauthorized
- 403 - Forbidden
- 500 - Server Error

## Technologies Used

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- bcrypt (for password hashing)
- dotenv (for environment variables)