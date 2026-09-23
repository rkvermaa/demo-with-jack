/* ============================================================
   LoginPage — full-viewport pink-to-teal gradient background
   as shown in login.png. The LoginCard is centred within it.
   ============================================================ */

import React from 'react';
import LoginCard from '../components/LoginCard.jsx';
import './LoginPage.css';

function LoginPage() {
  return (
    <div className="login-page">
      <LoginCard />
    </div>
  );
}

export default LoginPage;
