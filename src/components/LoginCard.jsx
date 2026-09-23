/**
 * LoginCard
 *
 * Renders the centred form card exactly as shown in login.png:
 *   - White outline avatar icon + "User Login" heading
 *   - Email field with envelope icon prefix, placeholder "Email ID"
 *   - Password field with padlock icon prefix, placeholder "Password", masked
 *   - "Remember me" checkbox (left) + "Forgot Password?" link (right) on same row
 *   - Full-width "LOGIN" button
 *
 * Form logic (validation, auth call, redirect) is co-located here per the plan.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as authLogin } from '../services/AuthService.js';
import './LoginCard.css';

/* ── SVG icon components (white outline, matching login.png) ── */

function AvatarIcon() {
  return (
    <svg
      className="avatar-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Head circle */}
      <circle cx="12" cy="8" r="4" />
      {/* Shoulders arc */}
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg
      className="field-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="2,4 12,13 22,4" />
    </svg>
  );
}

function PadlockIcon() {
  return (
    <svg
      className="field-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/* ── LoginCard ── */

function LoginCard() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Client-side validation (pre-network) ── */
  function validate() {
    let valid = true;
    if (!email.trim()) {
      setEmailError('Please enter your email.');
      valid = false;
    } else {
      setEmailError('');
    }
    if (!password) {
      setPasswordError('Please enter your password.');
      valid = false;
    } else {
      setPasswordError('');
    }
    return valid;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAuthError('');

    if (!validate()) {
      // Validation failed — no network request made.
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authLogin(email, password, rememberMe);
      if (result.success) {
        // Redirect to post-login destination.
        // redirectUrl is a path only — no credentials in the URL.
        navigate(result.redirectUrl, { replace: true });
      } else {
        // Same generic message for INVALID_CREDENTIALS and NETWORK_ERROR —
        // prevents email enumeration (plan: Authentication Contract).
        setAuthError('Incorrect email or password.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-card">
      {/* Avatar icon + heading — login.png */}
      <div className="login-card__header">
        <AvatarIcon />
        <h1 className="login-card__heading">User Login</h1>
      </div>

      <form className="login-card__form" onSubmit={handleSubmit} noValidate>
        {/* Email field */}
        <div className="login-card__field-wrapper">
          <div className={`login-card__input-row${emailError ? ' login-card__input-row--error' : ''}`}>
            <EnvelopeIcon />
            <input
              className="login-card__input"
              type="email"
              placeholder="Email ID"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
              }}
              autoComplete="email"
              aria-label="Email ID"
              aria-describedby={emailError ? 'email-error' : undefined}
              aria-invalid={!!emailError}
            />
          </div>
          {emailError && (
            <span id="email-error" className="login-card__field-error" role="alert">
              {emailError}
            </span>
          )}
        </div>

        {/* Password field */}
        <div className="login-card__field-wrapper">
          <div className={`login-card__input-row${passwordError ? ' login-card__input-row--error' : ''}`}>
            <PadlockIcon />
            <input
              className="login-card__input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              autoComplete="current-password"
              aria-label="Password"
              aria-describedby={passwordError ? 'password-error' : undefined}
              aria-invalid={!!passwordError}
            />
          </div>
          {passwordError && (
            <span id="password-error" className="login-card__field-error" role="alert">
              {passwordError}
            </span>
          )}
        </div>

        {/* Generic auth error (same message for wrong password AND unknown email) */}
        {authError && (
          <div className="login-card__auth-error" role="alert">
            {authError}
          </div>
        )}

        {/* Remember me (left) + Forgot Password? (right) — login.png */}
        <div className="login-card__remember-row">
          <label className="login-card__remember-label">
            <input
              type="checkbox"
              className="login-card__checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me
          </label>
          {/*
            "Forgot Password?" is a plain <a> element outside the submit path.
            Clicking it navigates to the recovery route and does NOT submit the form.
            (Plan: Navigation Contract — "Forgot Password?" does not appear in the
            form submit path.)
          */}
          <a
            href="/forgot-password"
            className="login-card__forgot-link"
            onClick={(e) => {
              e.preventDefault();
              navigate('/forgot-password');
            }}
          >
            Forgot Password?
          </a>
        </div>

        {/* Full-width LOGIN button — login.png */}
        <button
          type="submit"
          className="login-card__submit-btn"
          disabled={isSubmitting}
        >
          LOGIN
        </button>
      </form>
    </div>
  );
}

export default LoginCard;
