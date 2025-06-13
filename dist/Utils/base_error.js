"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseError = void 0;
class BaseError extends Error {
    constructor(status, message, errors) {
        super(message);
        this.status = status;
        this.errors = errors;
        Object.setPrototypeOf(this, BaseError.prototype);
    }
    static BadRequest(status = 400, message, errors) {
        return new BaseError(status, message, errors);
    }
}
exports.BaseError = BaseError;
