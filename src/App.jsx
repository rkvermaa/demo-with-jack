import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Password recovery route placeholder — navigated to by "Forgot Password?" */}
      <Route path="/forgot-password" element={<div style={{ padding: '2rem' }}>Password recovery coming soon.</div>} />
      {/* Post-login destination placeholder */}
      <Route path="/dashboard" element={<div style={{ padding: '2rem' }}>Welcome! You are logged in.</div>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
