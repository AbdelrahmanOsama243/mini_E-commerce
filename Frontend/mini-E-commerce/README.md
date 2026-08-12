# Mini E-Commerce Frontend

This is the Angular-based Single Page Application (SPA) for the Mini E-Commerce platform. It was generated with [Angular CLI](https://github.com/angular/angular-cli) version 21.2.19.

## Project Architecture

The frontend is designed with a clean separation of concerns, heavily utilizing Angular's component-based architecture and reactive programming (RxJS). 

### Core Concepts:
- **Services (`src/app/core/Services`)**: Manages business logic and API communication. E.g., `AuthService` handles all user authentication, login/logout flows, and session management using strongly typed models.
- **Models (`src/app/Models`)**: Contains TypeScript interfaces mapping precisely to the backend API responses (e.g., `iauth.ts` defining `User`, `LoginResponse`, etc.). This guarantees type safety across HTTP calls.
- **Components (`src/app/Feather` & others)**: Modular UI components dividing the application into distinct, reusable pieces (Authentication views, Email Verification, Product Listings, etc.).
- **Guards (`src/app/core/guards`)**: Route guards protecting authenticated routes from unauthorized access.

## Development Server

To start a local development server, run:

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Environment Variables

Make sure to configure your `src/environments/environment.ts` (and `environment.prod.ts`) with the correct backend API URL.
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api' // Replace with your backend URL
};
```

## Running tests

- **Unit tests**: Run `ng test` to execute unit tests via [Vitest](https://vitest.dev/).
- **End-to-End**: Run `ng e2e` for end-to-end tests (requires setting up a framework like Cypress or Playwright).

## Building for Production

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory, fully optimized for production deployment.
