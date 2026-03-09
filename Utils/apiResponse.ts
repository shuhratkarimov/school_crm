export function ok<T>(data: T, message = "OK", meta?: Record<string, any>) {
    return {
        ok: true,
        message,
        data,
        meta,
    };
}

export function fail(message = "Error", code?: string, details?: unknown) {
    return {
        ok: false,
        message,
        code,
        details,
    };
}