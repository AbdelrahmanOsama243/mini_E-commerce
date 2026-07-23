# Mini E-Commerce

This repository contains a full-stack mini e-commerce application. It consists of a backend API built with Node.js and Express, and a frontend built with Angular.

## Features

### Backend
- User authentication with JWT (Access Token + Refresh Token)
- Role-based access control (Admin, User)
- User registration and login
- Cart management
- Error handling
- MongoDB integration

### Frontend
- Angular 21 based single page application
- User-friendly interface for e-commerce interactions
- Component-based architecture

## Installation & Setup

1. **Clone the repository**
```bash
git clone https://github.com/AbdelrahmanOsama243/mini_E-commerce.git
cd mini_E-commerce
```

2. **Backend Setup**
```bash
cd Backend
npm install
```
Create a `.env` file in the `Backend` directory with the following variables:
```env
PORT=3000
MONGO_URI=your db link from mongodb compass
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret 
```
Start the backend development server:
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

3. **Frontend Setup**
Open a new terminal window, then:
```bash
cd Frontend/mini-E-commerce
npm install
```
Start the Angular development server:
```bash
npm start or use `ng serve`
```
Open your browser and navigate to `http://localhost:4200/`.

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

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT (JSON Web Tokens)
- bcrypt (for password hashing)
- dotenv (for environment variables)

### Frontend
- Angular (v21)
- TypeScript
- RxJS
- HTML/CSS

## Contributors

- AbdelrahmanOsama243
- hazem327
- Shamss05 (Shams Hesham)
- Mohamed-bakr009 (Mohamed bakr)
