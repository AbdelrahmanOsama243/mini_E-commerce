# Mini E-Commerce Platform

This repository contains a full-stack e-commerce application. It consists of a robust backend API built with Node.js, Express, MongoDB, and Redis, and a modern single-page frontend built with Angular (v21).

## 🌟 Features

### Backend
- **Authentication & Authorization**: Secure JWT-based authentication (Access + Refresh tokens). Role-based access control (Admin, User).
- **Session & Caching Management**: Redis integration for high-performance session management and data caching via a dedicated Repository Layer.
- **User Management**: Registration, login, email verification, password reset, and profile updates.
- **E-Commerce Core**: Cart management, order processing, and product catalog APIs.
- **Architecture**: MVC-like pattern with a clean Repository pattern abstracting database operations.
- **Security & Error Handling**: Centralized error handling, CORS, and Helmet for secure HTTP headers.

### Frontend
- **Modern Angular App**: Built with Angular 21 utilizing standalone components and RxJS for reactive state management.
- **Type Safety**: Full TypeScript integration with models strictly mirroring backend API responses.
- **Services & Guards**: Modular services for business logic and route guards for protecting authenticated views.
- **Clean UI**: Component-based architecture for a scalable and maintainable user interface.

## 📁 Project Structure

```
mini_E-commerce
├── Backend/                 # Node.js & Express API backend
│   ├── Config/              # Configuration files (DB, env)
│   ├── Controllers/         # Business logic and request handling
│   ├── Middlewares/         # Custom middlewares (auth, errors)
│   ├── Models/              # Mongoose schemas (Users, Products, Cart)
│   ├── Repos/               # Repository layer (MongoDB & Redis Cache)
│   ├── Utils/               # Helpers and utilities
│   └── routes/              # API endpoint definitions
├── Frontend/                # Angular frontend application
│   └── mini-E-commerce/
│       ├── src/             # Angular source code (Components, Services, Models)
│       └── public/          # Static assets
└── PROJECT_OVERVIEW.md      # Extended architectural details
```

## 🛠️ Technologies Used

### Backend Stack
- Node.js & Express.js
- MongoDB & Mongoose
- Redis (connect-redis, redis)
- JWT (jsonwebtoken) & bcrypt
- Express-Session, Helmet, CORS
- Nodemailer

### Frontend Stack
- Angular (v21)
- TypeScript
- RxJS
- HTML5 / CSS3
- Vitest (Testing)

## 🚀 Installation & Setup

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
Create a `.env` file in the `Backend` directory:
```env
PORT=3000
MONGO_URI=# Or your MongoDB Atlas URI
REDIS_URL=# Your Redis connection string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
```
Start the backend development server:
```bash
npm run dev
```

3. **Frontend Setup**
Open a new terminal window:
```bash
cd Frontend/mini-E-commerce
npm install
```
Start the Angular development server:
```bash
ng serve
```
Open your browser and navigate to `http://localhost:4200/`.

## 📚 API Endpoints Summary

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Authenticate and get tokens
- `POST /api/users/logout` - Invalidate session/tokens
- `POST /api/users/refresh` - Refresh access token
- `GET /api/users/verify-email/:token` - Verify email address
- `POST /api/users/forget-password` - Request password reset

### User Profile
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update user profile

*(Additional endpoints for Products, Cart, and Orders are structured under `/api/products`, `/api/cart`, and `/api/orders` respectively.)*

## 👥 Contributors

- AbdelrahmanOsama243
- hazem327
- Shamss05 (Shams Hesham)
- Mohamed-bakr009 (Mohamed bakr)
