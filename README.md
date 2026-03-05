# Testing System

A comprehensive web-based testing management system designed for quality assurance teams to manage test assignments, execute tests, and track results across multiple testers and projects.

## 🚀 Features

### Core Functionality
- **Multi-Tester Support**: Assign tests to multiple testers simultaneously
- **Role-Based Access Control**: Admin, QA Manager, Tester, and Company roles
- **Test Template Management**: Create and manage reusable test templates
- **Real-Time Dashboard**: Track test progress and statistics
- **Comprehensive Reporting**: Generate detailed test reports

### Key Features
- **Test Assignment Management**: Create, assign, and track test assignments
- **Test Execution**: Interactive test execution with real-time validation
- **QA Approval Workflow**: Review and approve/reject test submissions
- **Performance Metrics**: Track tester and QA performance
- **Trend Analysis**: Visualize testing trends over time
- **Multi-Company Support**: Isolated data for different companies

## 🏗️ Architecture

### Frontend (React)
- **React 18** with modern hooks
- **TailwindCSS** for styling
- **Lucide React** for icons
- **Axios** for API communication
- **React Router** for navigation
- **Zustand** for state management

### Backend (Node.js)
- **Express.js** REST API
- **Sequelize ORM** with PostgreSQL
- **JWT Authentication**
- **Role-based middleware**
- **Comprehensive error handling

### Database Schema
- **Users**: Authentication and role management
- **TestTemplates**: Reusable test templates with parameters
- **TestAssignments**: Test assignments with multi-tester support
- **TestExecutions**: Individual test execution records
- **TestResults**: Detailed test parameter results
- **Reports**: Generated test reports

## 🚦 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vibhu2208/testing-shoe-s.git
   cd testing-shoe-s
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb testing_system
   
   # Run migrations
   cd server
   npm run migrate
   ```

4. **Environment Configuration**
   
   Create `.env` files in both server and client directories:
   
   **Server `.env`**:
   ```env
   NODE_ENV=development
   PORT=5000
   DATABASE_URL=postgresql://username:password@localhost:5432/testing_system
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   ```
   
   **Client `.env`**:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

5. **Start the application**
   ```bash
   # Start server (from server directory)
   npm start
   
   # Start client (from client directory)
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 👥 User Roles & Permissions

### Admin
- Manage all users and companies
- Create and manage test templates
- Full access to all features
- System configuration

### QA Manager
- Review and approve test executions
- Generate reports
- View performance metrics
- Manage test assignments

### Tester
- Execute assigned tests
- Submit test results
- View own test history
- Update profile

### Company
- Manage company users
- Create test assignments
- View company-specific reports
- Manage test templates

## 📊 Key Workflows

### 1. Test Assignment Workflow
1. Admin/Company creates test template
2. Test assignment is created with template
3. Multiple testers can be assigned
4. Each tester receives notification
5. Testers execute tests independently

### 2. Test Execution Workflow
1. Tester starts assigned test
2. Parameters are filled with real-time validation
3. Results can be saved as draft or submitted
4. Automatic pass/fail evaluation
5. Submission triggers QA review

### 3. QA Approval Workflow
1. QA manager reviews submitted tests
2. Can approve, reject, or request changes
3. Comments can be added for feedback
4. Approved tests generate reports
5. Statistics are updated in real-time

## 🧪 Testing Features

### Test Template Types
- **Numeric Parameters**: Min/max value validation
- **Boolean Parameters**: Pass/fail evaluation
- **Dropdown Parameters**: Predefined options
- **Text Parameters**: Descriptive inputs

### Real-Time Validation
- Automatic parameter validation
- Instant pass/fail calculation
- Error prevention and guidance
- Progress saving capabilities

### Multi-Tester Support
- Parallel test execution
- Individual result tracking
- Comparative analysis
- Consolidated reporting

## 📈 Dashboard & Analytics

### Real-Time Statistics
- Assignment status overview
- Execution pass/fail rates
- Pending approvals count
- Performance metrics

### Trend Analysis
- Daily/weekly/monthly trends
- Performance comparisons
- Test completion rates
- Quality metrics

### Performance Tracking
- Tester performance metrics
- QA review efficiency
- Test execution times
- Quality improvement trends

## 🔧 Configuration

### Environment Variables
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRE`: Token expiration time

### Database Configuration
- PostgreSQL connection settings
- Migration scripts included
- Seed data for initial setup
- Backup and restore procedures

## 🚀 Deployment

### Production Deployment
1. Set environment variables
2. Build frontend assets
3. Run database migrations
4. Start production server
5. Configure reverse proxy

### Docker Support
```dockerfile
# Dockerfile example
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Add tests if applicable
5. Submit pull request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/change-password` - Change password

### Assignment Endpoints
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/:id` - Update assignment

### Execution Endpoints
- `GET /api/executions` - List executions
- `POST /api/executions/start/:assignmentId` - Start execution
- `POST /api/executions/:id/submit` - Submit results

## 🐛 Troubleshooting

### Common Issues
- **Database Connection**: Check PostgreSQL service and credentials
- **Authentication**: Verify JWT secret and token expiration
- **CORS Issues**: Ensure frontend URL is in allowed origins
- **Environment Variables**: Double-check all required variables

### Debug Mode
Enable debug logging by setting `NODE_ENV=development`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues

## 🔮 Future Enhancements

- [ ] Email notifications
- [ ] Advanced reporting features
- [ ] Mobile application
- [ ] Integration with CI/CD pipelines
- [ ] Advanced analytics dashboard
- [ ] Test scheduling automation
- [ ] API rate limiting
- [ ] Audit logging
- [ ] Multi-language support

---

**Built with ❤️ for Quality Assurance Teams**
