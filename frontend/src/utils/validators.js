export const KENYAN_PHONE_REGEX = /^0[17]\d{8}$/;

export const validateFullName = (v) => {
  const t = (v || '').trim();
  if (!t) return 'Full name is required.';
  if (t.length < 2) return 'Full name must be at least 2 characters.';
  return null;
};

export const validateEmail = (v) => {
  const t = (v || '').trim().toLowerCase();
  if (!t) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t)) return 'Enter a valid email address.';
  return null;
};

export const validateKenyanPhone = (v) => {
  const t = (v || '').trim();
  if (!t) return 'Phone number is required.';
  if (!/^\d+$/.test(t)) return 'Phone number must contain only digits.';
  if (t.length !== 10) return 'Phone number must contain 10 digits and start with 01 or 07.';
  if (!KENYAN_PHONE_REGEX.test(t)) return 'Phone number must contain 10 digits and start with 01 or 07.';
  return null;
};

export const validatePassword = (v) => {
  const t = v || '';
  if (!t) return 'Password is required.';
  if (t.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(t)) return 'Password must contain an uppercase letter.';
  if (!/[a-z]/.test(t)) return 'Password must contain a lowercase letter.';
  if (!/[0-9]/.test(t)) return 'Password must contain a number.';
  if (!/[^A-Za-z0-9]/.test(t)) return 'Password must contain a special character.';
  return null;
};

export const validateConfirmPassword = (password, confirm) => {
  if (!confirm) return 'Please confirm your password.';
  if (password !== confirm) return 'Passwords do not match.';
  return null;
};

export const passwordStrength = (v) => {
  const t = v || '';
  let score = 0;
  if (t.length >= 8) score++;
  if (/[A-Z]/.test(t) && /[a-z]/.test(t)) score++;
  if (/\d/.test(t)) score++;
  if (/[^A-Za-z0-9]/.test(t)) score++;
  return score;
};