# Mini E-Commerce - Project Overview

This document provides a comprehensive overview of the `mini_E-commerce` project structure and its contents. 

The project is a full-stack e-commerce application divided into two main parts: a Node.js/Express Backend and an Angular Frontend.

## Project Structure

```
d:\mini_E-commerce
├── Backend/                 # Node.js & Express API backend
├── Frontend/                # Angular frontend application
├── .git/                    # Git repository data
├── .gitignore               # Git ignored files configuration
└── README.md                # General project documentation and setup instructions
```

---

## 1. Backend (`/Backend`)

The backend is built with Node.js, Express, and MongoDB. It follows an MVC-like architecture (Models, Controllers, Routes) with Repositories and Middlewares.

### Directory Breakdown:
- **`Config/`**: Contains configuration files (e.g., database connection setups, environment variable loaders).
- **`Controllers/`**: Contains the business logic for handling incoming API requests and sending responses.
- **`Middlewares/`**: Contains custom Express middlewares (e.g., authentication, session management, error handling). 
- **`Models/`**: Contains Mongoose schemas and models defining the database structure (Users, Products, Cart, etc.).
- **`Repos/`**: Repository layer that abstracts database operations (including MongoDB for persistent storage and a Redis Repository Layer for high-performance caching) away from the controllers, providing a cleaner separation of concerns.
- **`Utils/`**: Contains utility functions and helpers used across the backend.
- **`routes/`**: Defines all the Express API routes (endpoints) and maps them to their respective controllers.

### Key Files:
- **`server.js`**: The main entry point for the backend server. It configures the Express app, applies global middlewares, connects to the database, and starts listening on a port.
- **`seed.js`**: A script likely used for populating the database with initial dummy data (products, admin users, etc.).
- **`.env` / `.env.example`**: Environment variable configurations (Port, MongoDB URI, JWT secrets).
- **`package.json` / `package-lock.json`**: Node.js dependencies and npm scripts for the backend.
- **`vercel.json`**: Configuration file for deploying the backend to Vercel.

---

## 2. Frontend (`/Frontend/mini-E-commerce`)

The frontend is a Single Page Application (SPA) built with Angular (v21). 

### Directory Breakdown:
- **`src/`**: The main source code folder for the Angular application.
  - Contains Angular components, services, modules, routing configurations, and assets.
- **`public/`**: Static assets that are served directly.
- **`.vscode/`**: VS Code specific workspace settings.

### Key Files:
- **`angular.json`**: The main configuration file for the Angular CLI workspace and project-specific settings.
- **`package.json` / `package-lock.json`**: Node.js dependencies and npm scripts for the frontend.
- **`tsconfig.json` / `tsconfig.app.json` / `tsconfig.spec.json`**: TypeScript compiler configurations for the app and tests.
- **`update-theme.js`**: A custom script likely used for managing or updating the application's UI theme.
- **`README.md`**: Angular CLI generated readme with common commands for running the frontend.

## Summary

This project is a well-structured modern web application. The backend is designed with a clear separation of concerns using controllers, models, and a repository pattern, secured with JWT authentication. The frontend utilizes Angular's component-based architecture to deliver a dynamic user experience for e-commerce activities.

## Libraries & Dependencies

### Backend Dependencies
- **bcrypt**: Password hashing.
- **connect-redis**: Redis session store for Express.
- **cors**: CORS middleware.
- **dotenv**: Environment variable loader.
- **express**: Fast, unopinionated web framework for Node.js.
- **express-session**: Simple session middleware for Express.
- **helmet**: Secure Express apps by setting HTTP response headers.
- **jsonwebtoken**: JWT generation and verification.
- **mongoose**: MongoDB object modeling tool.
- **nodemailer**: Module for sending emails.
- **redis**: Redis client.

### Frontend Dependencies (Angular)
- **@angular/common**, **@angular/core**, **@angular/forms**, **@angular/platform-browser**, **@angular/router**, **@angular/compiler**: Core Angular packages for building the UI, forms, and routing.
- **rxjs**: Reactive programming library for JavaScript.
- **tslib**: Runtime library for TypeScript helper functions.

#### Frontend DevDependencies
- **@angular/cli**, **@angular/build**, **@angular/compiler-cli**: Angular CLI tools.
- **jsdom**: A JavaScript implementation of various web standards.
- **prettier**: Code formatter.
- **typescript**: Typed superset of JavaScript.
- **vitest**: Next generation testing framework.
