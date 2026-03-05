# Testing System Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher)
2. **PostgreSQL** (v12 or higher)
3. **npm** or **yarn**

## Database Setup

1. Install PostgreSQL and create a database:
```sql
CREATE DATABASE mydb;
CREATE USER admin WITH PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE mydb TO admin;
```

2. Verify connection string in server/.env:
```
DATABASE_URL=postgresql://admin:admin123@localhost:5432/mydb
```

## Installation

1. Install all dependencies:
```bash
npm run install-all
```

2. Initialize the database:
```bash
cd server
node scripts/init-db.js
```

## Running the Application

### Development Mode (Both servers)
```bash
npm run dev
```

### Individual Servers

**Backend only:**
```bash
npm run server
```

**Frontend only:**
```bash
npm run client
```

## Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | admin123 |
| Tester | tester@test.com | tester123 |
| QA Manager | qa@test.com | qa123 |
| Company | company@test.com | company123 |

## Project Structure

```
testing-system/
├── server/                 # Node.js Backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth & validation
│   ├── scripts/           # Database scripts
│   └── index.js           # Server entry point
├── client/                # React Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── store/         # State management
│   │   └── lib/           # Utilities & API
│   └── public/
└── package.json           # Root package.json
```

## Features by Phase

### ✅ Phase 1 - Authentication & Role System
- JWT-based authentication
- Role-based access control (Admin, Tester, QA Manager, Company)
- User management (Admin only)
- Password hashing & security

### 🚧 Phase 2 - Dynamic Test Template Builder
- Admin can create configurable test structures
- Multiple parameter types (Numeric, Text, Dropdown, Boolean)
- Validation rules and mandatory fields

### 🚧 Phase 3 - Test Assignment Module
- Admin assigns tests to specific testers
- Batch and product tracking
- Status workflow management

### 🚧 Phase 4 - Dynamic Test Execution Engine
- Auto-generated forms based on templates
- Real-time validation and evaluation
- Pass/Fail determination logic

### 🚧 Phase 5 - QA Approval Workflow
- QA review and approval process
- Record locking after approval
- Rejection with comments

### 🚧 Phase 6 - PDF Report Generation
- Standardized report format
- Auto-incrementing report numbers
- Downloadable PDF files

### 🚧 Phase 7 - Company Role Access
- Read-only dashboard for company users
- Access to all data without modification rights

### 🚧 Phase 8 - Dashboard & Analytics
- Role-based dashboards
- Basic statistics and metrics
- Recent activity tracking

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Verify database credentials in `.env`
3. Check if database `mydb` exists

### Port Conflicts
- Backend runs on port 5000
- Frontend runs on port 3000
- Change ports in respective package.json if needed

### Permission Issues
- Ensure proper role assignments in database
- Check JWT token validity
- Verify user is active

## Development Notes

- Backend uses Express.js with Sequelize ORM
- Frontend uses React with TailwindCSS and shadcn/ui
- Authentication via JWT tokens
- API follows RESTful conventions
- Database auto-syncs on server start
