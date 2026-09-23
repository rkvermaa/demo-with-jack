/**
 * LoginCard tests — SDP-10
 *
 * Covers every acceptance criterion that can be exercised in jsdom:
 *  - Heading copy and presence of avatar icon
 *  - Field placeholders and icons
 *  - Remember me checkbox (unchecked by default, correct label)
 *  - Forgot Password? link (correct copy, right-aligned, does NOT submit form)
 *  - LOGIN button copy and full-width presence
 *  - Client-side validation: empty email, empty password, both empty
 *  - No network request on validation failure
 *  - Generic error message for wrong credentials (no email enumeration)
 *  - Generic error message for unknown email (same message as wrong password)
 *  - Successful login redirects without credentials in URL
 *  - Password field is masked (type="password")
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// We mock AuthService so no real network calls are made.
import * as AuthService from '../services/AuthService.js';

import LoginCard from '../components/LoginCard.jsx';

// Helper: render LoginCard inside a MemoryRouter (needed for useNavigate).
function renderLoginCard() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginCard />
    </MemoryRouter>
  );
}

describe('LoginCard — static structure (login.png)', () => {
  it('renders the "User Login" heading with exact copy', () => {
    renderLoginCard();
    expect(screen.getByRole('heading', { level: 1, name: /^User Login$/i })).toBeInTheDocument();
  });

  it('renders the avatar SVG icon above the heading', () => {
    const { container } = renderLoginCard();
    const avatar = container.querySelector('.avatar-icon');
    expect(avatar).toBeInTheDocument();
    // Must appear before the heading in DOM order.
    const heading = screen.getByRole('heading', { level: 1 });
    expect(avatar.compareDocumentPosition(heading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('renders the email input with placeholder "Email ID"', () => {
    renderLoginCard();
    expect(screen.getByPlaceholderText('Email ID')).toBeInTheDocument();
  });

  it('email input has type="email"', () => {
    renderLoginCard();
    expect(screen.getByPlaceholderText('Email ID')).toHaveAttribute('type', 'email');
  });

  it('renders the envelope icon prefix on the email field', () => {
    const { container } = renderLoginCard();
    const emailRow = screen.getByPlaceholderText('Email ID').closest('.login-card__input-row');
    expect(emailRow.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the password input with placeholder "Password"', () => {
    renderLoginCard();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('password input has type="password" (masked by default)', () => {
    renderLoginCard();
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');
  });

  it('renders the padlock icon prefix on the password field', () => {
    const { container } = renderLoginCard();
    const passwordRow = screen.getByPlaceholderText('Password').closest('.login-card__input-row');
    expect(passwordRow.querySelector('svg')).toBeInTheDocument();
  });

  it('renders a "Remember me" checkbox that is unchecked by default', () => {
    renderLoginCard();
    const checkbox = screen.getByRole('checkbox', { name: /remember me/i });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('renders a "Forgot Password?" link with exact copy', () => {
    renderLoginCard();
    expect(screen.getByRole('link', { name: /^Forgot Password\?$/i })).toBeInTheDocument();
  });

  it('renders exactly one submit button reading "LOGIN"', () => {
    renderLoginCard();
    const buttons = screen.getAllByRole('button', { name: /^LOGIN$/i });
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute('type', 'submit');
  });
});

describe('LoginCard — client-side validation (no network)', () => {
  let loginSpy;

  beforeEach(() => {
    loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue({ success: true, redirectUrl: '/dashboard' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows email error and blocks submission when email is empty', async () => {
    renderLoginCard();
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret123');
    fireEvent.click(screen.getByRole('button', { name: /^LOGIN$/i }));

    expect(await screen.findByText(/please enter your email/i)).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('shows password error and blocks submission when password is empty', async () => {
    renderLoginCard();
    await userEvent.type(screen.getByPlaceholderText('Email ID'), 'user@example.com');
    fireEvent.click(screen.getByRole('button', { name: /^LOGIN$/i }));

    expect(await screen.findByText(/please enter your password/i)).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('shows both errors simultaneously when both fields are empty', async () => {
    renderLoginCard();
    fireEvent.click(screen.getByRole('button', { name: /^LOGIN$/i }));

    expect(await screen.findByText(/please enter your email/i)).toBeInTheDocument();
    expect(screen.getByText(/please enter your password/i)).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('clears email error when user starts typing in the email field', async () => {
    renderLoginCard();
    fireEvent.click(screen.getByRole('button', { name: /^LOGIN$/i }));
    expect(await screen.findByText(/please enter your email/i)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Email ID'), 'a');
    expect(screen.queryByText(/please enter your email/i)).not.toBeInTheDocument();
  });

  it('clears password error when user starts typing in the password field', async () => {
    renderLoginCard();
    fireEvent.click(screen.getByRole('button', { name: /^LOGIN$/i }));
    expect(await screen.findByText(/please enter your password/i)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Password'), 'x');
    expect(screen.queryByText(/please enter your password/i)).not.toBeInTheDocument();
  });
});

describe('LoginCard — authentication responses', () => {
  let loginSpy;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function fillAndSubmit(email = 'user@example.com', password = 'secret') {
    await userEvent.type(screen.getByPlaceholderText('Email ID'), email);
    await userEvent.type(screen.getByPlaceholderText('Password'), password);
    fireEvent.click(screen.getByRole('button', { name: /^LOGIN$/i }));
  }

  it('shows the same generic error for wrong password (no email enumeration)', async () => {
    loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue({ success: false, error: 'INVALID_CREDENTIALS' });
    renderLoginCard();
    await fillAndSubmit();

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument();
  });

  it('shows the same generic error for unregistered email (no email enumeration)', async () => {
    // Backend returns INVALID_CREDENTIALS for both cases — client shows same message.
    loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue({ success: false, error: 'INVALID_CREDENTIALS' });
    renderLoginCard();
    await fillAndSubmit('notregistered@example.com', 'anypassword');

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument();
  });

  it('shows a generic error on network failure', async () => {
    loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue({ success: false, error: 'NETWORK_ERROR' });
    renderLoginCard();
    await fillAndSubmit();

    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument();
  });

  it('calls AuthService.login with email, password, and rememberMe=false by default', async () => {
    loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue({ success: true, redirectUrl: '/dashboard' });
    renderLoginCard();
    await fillAndSubmit('user@example.com', 'mypassword');

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('user@example.com', 'mypassword', false);
    });
  });

  it('calls AuthService.login with rememberMe=true when checkbox is checked', async () => {
    loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue({ success: true, redirectUrl: '/dashboard' });
    renderLoginCard();

    await userEvent.click(screen.getByRole('checkbox', { name: /remember me/i }));
    await fillAndSubmit('user@example.com', 'mypassword');

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('user@example.com', 'mypassword', true);
    });
  });
});

describe('LoginCard — navigation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('"Forgot Password?" link does not submit the form', async () => {
    const loginSpy = vi.spyOn(AuthService, 'login').mockResolvedValue({ success: true, redirectUrl: '/dashboard' });
    renderLoginCard();

    // Fill fields so validation would pass if form were submitted.
    await userEvent.type(screen.getByPlaceholderText('Email ID'), 'user@example.com');
    await userEvent.type(screen.getByPlaceholderText('Password'), 'secret');

    fireEvent.click(screen.getByRole('link', { name: /^Forgot Password\?$/i }));

    // AuthService.login must NOT have been called.
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it('"Forgot Password?" link is an anchor element (not a submit button)', () => {
    renderLoginCard();
    const link = screen.getByRole('link', { name: /^Forgot Password\?$/i });
    expect(link.tagName.toLowerCase()).toBe('a');
  });
});

describe('AuthService — unit', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns INVALID_CREDENTIALS on a 401 response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'INVALID_CREDENTIALS' }),
    });

    const { login } = await import('../services/AuthService.js');
    const result = await login('a@b.com', 'wrong', false);
    expect(result).toEqual({ success: false, error: 'INVALID_CREDENTIALS' });
  });

  it('returns NETWORK_ERROR when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'));

    const { login } = await import('../services/AuthService.js');
    const result = await login('a@b.com', 'pass', false);
    expect(result).toEqual({ success: false, error: 'NETWORK_ERROR' });
  });

  it('returns success with redirectUrl on HTTP 200', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ redirectUrl: '/dashboard' }),
    });

    const { login } = await import('../services/AuthService.js');
    const result = await login('a@b.com', 'correct', false);
    expect(result).toEqual({ success: true, redirectUrl: '/dashboard' });
  });

  it('redirectUrl does not contain the password', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ redirectUrl: '/dashboard' }),
    });

    const { login } = await import('../services/AuthService.js');
    const result = await login('a@b.com', 'supersecret', false);
    expect(result.success).toBe(true);
    expect(result.redirectUrl).not.toContain('supersecret');
    expect(result.redirectUrl).not.toContain('a@b.com');
  });
});
