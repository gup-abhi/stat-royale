export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class SupercellUnavailableError extends Error {
  constructor(message = 'Supercell API is currently unavailable') {
    super(message);
    this.name = 'SupercellUnavailableError';
  }
}

export class InvalidTagError extends Error {
  constructor(tag: string) {
    super(`Invalid player tag: ${tag}`);
    this.name = 'InvalidTagError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorisedError extends Error {
  constructor(message = 'Missing or invalid access token') {
    super(message);
    this.name = 'UnauthorisedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class RateLimitedError extends Error {
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitedError';
  }
}
