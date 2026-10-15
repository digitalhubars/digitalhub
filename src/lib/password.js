// Shared by sign-up, reset password and the in-app password page.
export const passwordRules = (value) => [
  ['At least 8 characters', value.length >= 8],
  ['A number', /\d/.test(value)],
  ['An uppercase letter', /[A-Z]/.test(value)],
  ['A symbol', /[^A-Za-z0-9]/.test(value)],
];

export const passwordStrength = (value) => passwordRules(value).filter(([, ok]) => ok).length;

export const MIN_STRENGTH = 3;
