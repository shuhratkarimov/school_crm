"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.superadminMiddleware = void 0;
const superadminMiddleware = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized at superadmin" });
        return;
    }
    if (req.user.role !== "superadmin") {
        res.status(403).json({ message: "Forbidden" });
        return;
    }
    next();
};
exports.superadminMiddleware = superadminMiddleware;
