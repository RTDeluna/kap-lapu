import { formatPhPhone, normalizePhPhone } from '../phone';

describe('normalizePhPhone', () => {
  it.each([
    ['09171234567', '+639171234567'],
    ['0917 123 4567', '+639171234567'],
    ['0917-123-4567', '+639171234567'],
    ['+639171234567', '+639171234567'],
    ['+63 917 123 4567', '+639171234567'],
    ['639171234567', '+639171234567'],
    ['  09991234567 ', '+639991234567'],
  ])('accepts %s', (input, expected) => {
    expect(normalizePhPhone(input)).toBe(expected);
  });

  it.each([
    '',
    '9171234567',
    '0917123456',
    '091712345678',
    '08171234567',
    '+09171234567',
    '+6309171234567',
    '+18005551234',
    '0917abc4567',
    '+63 2 8123 4567',
  ])('rejects %s', (input) => {
    expect(normalizePhPhone(input)).toBeNull();
  });
});

describe('formatPhPhone', () => {
  it('groups an E.164 number', () => {
    expect(formatPhPhone('+639171234567')).toBe('+63 917 123 4567');
  });
  it('leaves other strings alone', () => {
    expect(formatPhPhone('hello')).toBe('hello');
  });
});
