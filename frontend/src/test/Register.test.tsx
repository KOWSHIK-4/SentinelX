import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Register } from '@/pages/Register';

describe('Register Page', () => {
  it('should render registration form', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    expect(screen.getByText('Create an account')).toBeInTheDocument();
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should have link to login page', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>,
    );

    const loginLink = screen.getByText('Sign in');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });
});