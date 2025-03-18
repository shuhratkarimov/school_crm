export class BaseError extends Error {
  status: number;
  errors: string;

  constructor(status: number, message: string, errors?: any) {
    super(message);
    this.status = status;
    this.errors = errors;
    Object.setPrototypeOf(this, BaseError.prototype);
  }

  static BadRequest(status: number = 400, message: string, errors?: string) {
    return new BaseError(status, message, errors);
  }
}




