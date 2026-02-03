import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Admin from './components/Certify/Admin.jsx';
import AdminLogin from './components/Certify/AdminLogin.jsx';
import CertificateVerify from './components/Certify/CertificateVerify.jsx';
import { AuthProvider, useAuth } from './auth-context.jsx';
import { Loader, Center } from '@mantine/core';

function ProtectedRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) {
    return (
      <Center style={{ minHeight: '100vh' }}>
        <Loader size="lg" />
      </Center>
    );
  }
  if (!user) {
    return <Navigate to="/cert-login" replace />;
  }
  return children;
}

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/cert-login" replace />} />
          <Route path="/cert-login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          } />
          <Route path="/verify/:code" element={<CertificateVerify />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
