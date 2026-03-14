export class ApiValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiValidationError';
    this.status = status;
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;

type StringOptions = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  allowEmpty?: boolean;
};

function asTrimmedString(value: unknown, fieldName: string, options: StringOptions = {}): string | undefined {
  const { required = false, minLength = 0, maxLength = 500, allowEmpty = false } = options;

  if (value === undefined || value === null) {
    if (required) {
      throw new ApiValidationError(`${fieldName} is required`);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new ApiValidationError(`${fieldName} must be a text value`);
  }

  const trimmed = value.trim();
  if (!allowEmpty && required && trimmed.length === 0) {
    throw new ApiValidationError(`${fieldName} is required`);
  }

  if (!allowEmpty && trimmed.length === 0) {
    return '';
  }

  if (trimmed.length < minLength) {
    throw new ApiValidationError(`${fieldName} must be at least ${minLength} characters`);
  }

  if (trimmed.length > maxLength) {
    throw new ApiValidationError(`${fieldName} must be at most ${maxLength} characters`);
  }

  return trimmed;
}

export function requireBodyObject(body: unknown): Record<string, any> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiValidationError('Invalid request body');
  }
  return body as Record<string, any>;
}

export function requireString(value: unknown, fieldName: string, options: StringOptions = {}): string {
  const parsed = asTrimmedString(value, fieldName, { ...options, required: true });
  return parsed ?? '';
}

export function optionalString(value: unknown, fieldName: string, options: StringOptions = {}): string | undefined {
  return asTrimmedString(value, fieldName, { ...options, required: false });
}

export function requireEmail(value: unknown, fieldName = 'Email'): string {
  const email = requireString(value, fieldName, { minLength: 5, maxLength: 254 });
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiValidationError(`${fieldName} must be a valid email address`);
  }
  return email.toLowerCase();
}

export function requireBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new ApiValidationError(`${fieldName} must be true or false`);
  }
  return value;
}

export function requireMongoId(value: unknown, fieldName: string): string {
  const id = requireString(value, fieldName, { minLength: 24, maxLength: 24 });
  if (!MONGO_ID_REGEX.test(id)) {
    throw new ApiValidationError(`${fieldName} must be a valid ID`);
  }
  return id;
}

export function optionalNumber(value: unknown, fieldName: string, options: { min?: number; max?: number; integer?: boolean } = {}): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new ApiValidationError(`${fieldName} must be a valid number`);
  }

  if (options.integer && !Number.isInteger(num)) {
    throw new ApiValidationError(`${fieldName} must be an integer number`);
  }

  if (options.min !== undefined && num < options.min) {
    throw new ApiValidationError(`${fieldName} cannot be less than ${options.min}`);
  }

  if (options.max !== undefined && num > options.max) {
    throw new ApiValidationError(`${fieldName} cannot be greater than ${options.max}`);
  }

  return num;
}

export function requireEnum<T extends string>(value: unknown, fieldName: string, allowed: T[]): T {
  const parsed = requireString(value, fieldName) as T;
  if (!allowed.includes(parsed)) {
    throw new ApiValidationError(`${fieldName} is invalid`);
  }
  return parsed;
}

export function optionalDate(value: unknown, fieldName: string): Date | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new ApiValidationError(`${fieldName} must be a valid date`);
  }
  return date;
}
