"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
function ok(data, message = "OK", meta) {
    return {
        ok: true,
        message,
        data,
        meta,
    };
}
function fail(message = "Error", code, details) {
    return {
        ok: false,
        message,
        code,
        details,
    };
}
