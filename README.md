# Smart Lead Dashboard CRM

A full-stack Lead Management and Customer Relationship Management (CRM) dashboard built using the MERN stack and TypeScript. The application helps manage leads, track sales pipelines, analyze performance, and organize customer interactions through a modern, responsive interface.

## Project Overview

Smart Lead Dashboard CRM is designed to simplify lead management and improve sales workflow efficiency. It provides secure authentication, role-based access control, lead tracking, interactive analytics, and CSV import/export functionality.

The application features a modern dashboard with light and dark modes, an interactive Kanban pipeline, and an automated lead-scoring algorithm.

## Tech Stack

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Vite
- Axios
- Lucide Icons

### Backend
- Node.js
- Express.js 5
- TypeScript
- MongoDB
- Mongoose

### Authentication and Security
- JSON Web Tokens (JWT)
- bcryptjs password hashing
- Role-Based Access Control (RBAC)
- Protected frontend and backend routes

### DevOps
- Docker
- Docker Compose

## Key Features

### 1. Authentication and Authorization
- User registration and login.
- JWT-based authentication.
- Secure password hashing with bcryptjs.
- Protected routes and API endpoints.
- Role-based permissions for administrators and sales representatives.

### 2. Lead Management
- Create, view, update, and delete leads.
- Manage lead details, contact information, status, source, and deal value.
- View detailed lead information and activity history.
- Track lead progress through different sales stages.
- Restrict lead deletion to administrators.

### 3. Search, Filtering, and Sorting
- Search leads by name, email, company, phone, and tags.
- Filter leads by status and source.
- Sort by creation date, deal value, AI score, or name.
- Combine multiple filters.
- Debounced search to reduce unnecessary API requests.

### 4. Dashboard and Analytics
- KPI summary cards.
- Sales pipeline and funnel analytics.
- Lead source analysis.
- Interactive dashboard views.
- Paginated lead listing.

### 5. Interactive Kanban Board
- Visualize leads across sales pipeline stages.
- Track progress from new leads to completed or lost opportunities.
- Update lead stages through interactive controls.

### 6. Automated Lead Scoring
- Assign lead scores from 0 to 100.
- Evaluate deal value, engagement history, priority, and acquisition channel.
- Classify leads as:
  - **Hot:** 75 and above
  - **Warm:** 45–74
  - **Cold:** Below 45

### 7. CSV Import and Export
- Import multiple leads using CSV files.
- Export filtered or complete lead lists.
- Validate imported data.
- Use column mapping and a downloadable CSV template.

### 8. Activity Timeline
- Add notes to lead records.
- Record calls and email interactions.
- Maintain timestamped activity history.
- Track changes to lead stages.

### 9. User Interface
- Responsive layouts for desktop, tablet, and mobile.
- Light and dark mode.
- Reusable React components.
- Loading indicators and skeleton screens.
- Form validation and toast notifications.
- Keyboard shortcuts for common actions.

### 10. Database Support
- MongoDB Atlas integration.
- Mongoose-based data models.
- In-memory fallback with sample CRM leads, as described in the project implementation.

## Role-Based Access Control

| Feature | Admin Manager | Sales User |
|---|---|---|
| View and search leads | Yes | Yes |
| Create leads | Yes | Yes |
| Update leads and stages | Yes | Yes |
| Add notes and call logs | Yes | Yes |
| Import and export CSV | Yes | Yes |
| View analytics and Kanban | Yes | Yes |
| Delete individual leads | Yes | No |
| Bulk delete leads | Yes | No |

## Project Structure

```text
Smart_Lead_Dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── leadController.ts
│   │   ├── middlewares/
│   │   │   ├── authMiddleware.ts
│   │   │   └── errorHandler.ts
│   │   ├── models/
│   │   │   ├── Lead.ts
│   │   │   └── User.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── leadRoutes.ts
│   │   ├── services/
│   │   │   ├── db.ts
│   │   │   └── leadScorer.ts
│   │   └── index.ts
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── api.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Prerequisites

Before running the application, ensure that you have installed:

- Node.js and npm
- MongoDB Atlas account or a compatible MongoDB setup
- Git
- Docker and Docker Compose (optional)

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Sunil152005/Smart_Lead_Dashboard.git
cd Smart_Lead_Dashboard
```

### 2. Set Up the Backend

Open a terminal and run:

```bash
cd backend
npm install
```

Configure the environment variables using the provided `.env.example` file. Add the required MongoDB connection string and other variables expected by the backend configuration.

Build and start the backend:

```bash
npm run build
npm start
```

The backend is expected to run at:

`http://localhost:5000`

Health check:

`http://localhost:5000/api/health`

### 3. Set Up the Frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend in your browser:

`http://localhost:5173`

**Note:** Ensure that the environment variables, scripts, and API configuration match the current project files.

## Running with Docker

If Docker and Docker Compose are installed, run the following command from the project root:

```bash
docker compose up --build
```

The application is configured to use the following local addresses:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Demo Accounts

The original project documentation provides the following demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin Manager | `rahul@gmail.com` | `123456` |
| Sales Representative | `priya@sales.com` | `123456` |

Use these credentials only if the demo accounts are available in your current application environment. Change or remove publicly documented demo credentials if they provide access to a shared or production database.
<<<<<<< HEAD

## API Documentation

### Authentication Endpoints

Base path: `/api/auth`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Register a user | No |
| POST | `/api/auth/login` | Authenticate a user | No |
| GET | `/api/auth/me` | Retrieve the current user profile | Yes |

### Lead Management Endpoints

Base path: `/api/leads`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/api/leads` | Retrieve leads with search, filters, sorting, and pagination | Yes |
| GET | `/api/leads/:id` | Retrieve a specific lead | Yes |
| POST | `/api/leads` | Create a lead | Yes |
| PUT | `/api/leads/:id` | Update a lead | Yes |
| DELETE | `/api/leads/:id` | Delete a lead | Admin |
| POST | `/api/leads/:id/notes` | Add notes or activity records | Yes |
| GET | `/api/leads/analytics` | Retrieve analytics and KPI summaries | Yes |
| POST | `/api/leads/import` | Import leads from CSV | Yes |
| POST | `/api/leads/bulk-delete` | Delete multiple leads | Admin |
| POST | `/api/leads/bulk-update` | Update multiple lead stages | Yes |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` or `Ctrl + K` | Focus the search field |
| `N` | Open the new lead form |
| `Esc` | Close an open modal or drawer |

## Security Considerations

- Passwords are hashed using bcryptjs.
- JWT authentication protects restricted routes.
- Role-based authorization limits sensitive operations.
- Environment variables should be used for database credentials and secrets.
- Never commit `.env` files, database credentials, JWT secrets, or private access tokens.
- Demo credentials should not be reused in production environments.

## Future Improvements

Potential enhancements include:

- Email notifications for lead updates.
- Advanced reporting and analytics.
- Lead assignment and team collaboration.
- Automated follow-up reminders.
- Integration with external communication tools.
- Expanded automated testing and monitoring.

## Author

**Sunil Jadhav**

- GitHub: [@Sunil152005](https://github.com/Sunil152005)
- Repository: [Smart Lead Dashboard](https://github.com/Sunil152005/Smart_Lead_Dashboard)
=======

## API Documentation

### Authentication Endpoints

Base path: `/api/auth`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/api/auth/register` | Register a user | No |
| POST | `/api/auth/login` | Authenticate a user | No |
| GET | `/api/auth/me` | Retrieve the current user profile | Yes |

### Lead Management Endpoints

Base path: `/api/leads`

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/api/leads` | Retrieve leads with search, filters, sorting, and pagination | Yes |
| GET | `/api/leads/:id` | Retrieve a specific lead | Yes |
| POST | `/api/leads` | Create a lead | Yes |
| PUT | `/api/leads/:id` | Update a lead | Yes |
| DELETE | `/api/leads/:id` | Delete a lead | Admin |
| POST | `/api/leads/:id/notes` | Add notes or activity records | Yes |
| GET | `/api/leads/analytics` | Retrieve analytics and KPI summaries | Yes |
| POST | `/api/leads/import` | Import leads from CSV | Yes |
| POST | `/api/leads/bulk-delete` | Delete multiple leads | Admin |
| POST | `/api/leads/bulk-update` | Update multiple lead stages | Yes |

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` or `Ctrl + K` | Focus the search field |
| `N` | Open the new lead form |
| `Esc` | Close an open modal or drawer |

## Security Considerations

- Passwords are hashed using bcryptjs.
- JWT authentication protects restricted routes.
- Role-based authorization limits sensitive operations.
- Environment variables should be used for database credentials and secrets.
- Never commit `.env` files, database credentials, JWT secrets, or private access tokens.
- Demo credentials should not be reused in production environments.

## Future Improvements

Potential enhancements include:

- Email notifications for lead updates.
- Advanced reporting and analytics.
- Lead assignment and team collaboration.
- Automated follow-up reminders.
- Integration with external communication tools.
- Expanded automated testing and monitoring.

## Author

**Sunil Jadhav**

- GitHub: [@Sunil152005](https://github.com/Sunil152005)
- Repository: [Smart Lead Dashboard](https://github.com/Sunil152005/Smart_Lead_Dashboard)

---
