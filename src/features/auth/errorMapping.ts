import type { AuthServiceError } from './types';

export const mapSignInError = (code?: string): AuthServiceError => {
  if (code === 'email_not_confirmed') {
    return {
      code: 'email_not_confirmed',
      message: 'Please confirm your email before signing in.',
    };
  }
  if (code === 'over_email_send_rate_limit') {
    return {
      code: 'over_email_send_rate_limit',
      message: 'Please wait a moment before requesting another email.',
    };
  }
  return {
    code: 'invalid_credentials',
    message: "That email or password doesn't look right.",
  };
};

export const mapSignUpError = (code?: string): AuthServiceError => {
  if (code === 'over_email_send_rate_limit') {
    return {
      code: 'over_email_send_rate_limit',
      message: 'Please wait a moment before requesting another email.',
    };
  }
  return {
    code: 'sign_up_failed',
    message: "We couldn't create your account. Please try again.",
  };
};
