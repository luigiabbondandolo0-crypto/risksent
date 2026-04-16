export type PasswordValidationResult = {
  valid: boolean;
  message?: string;
};

const MIN_PASSWORD_LENGTH = 10;

export function validatePasswordPolicy(password: string): PasswordValidationResult {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return {
      valid: false,
      message:
        "Password must include uppercase, lowercase, number, and special character."
    };
  }

  return { valid: true };
}
