import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Code from './pages/Code/Code';
import Dashboard from './pages/Dashboard/Dashboard';
import ProtectedRoute from './utils/ProtectedRoute';
import PublicRoute from './utils/PublicRoute';
import AuthCallback from './pages/AuthCallback/AuthCallback';
import Validate from './pages/Validate/Validate';

function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route path="/code" element={<Code />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/validate" element={<Validate />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
