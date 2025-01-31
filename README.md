# Online Aptitude Test Application

A web application for conducting online aptitude tests with separate admin and student panels.

## Features

### Admin Panel
- Manage company and college names
- Generate and send student registration links
- Create, edit, and delete aptitude test questions
- View student test results
- Set 24-hour registration window

### Student Panel
- Register using admin-provided link
- Take timed aptitude tests
- View test results
- Automatic test submission on timeout

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aptitude-test-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
MONGODB_URI=mongodb://localhost:27017/aptitude-test
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - User login

### Admin Routes
- POST `/api/admin/questions` - Add new question
- GET `/api/admin/questions` - Get all questions
- PATCH `/api/admin/questions/:id` - Update question
- DELETE `/api/admin/questions/:id` - Delete question
- GET `/api/admin/results` - View all test results
- POST `/api/admin/generate-link` - Generate registration link

### Student Routes
- GET `/api/student/test` - Get test questions
- POST `/api/student/submit` - Submit test answers
- GET `/api/student/result` - View test result

## Security Features
- JWT-based authentication
- Password hashing
- Role-based access control
- Secure registration link generation

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE file for details. 