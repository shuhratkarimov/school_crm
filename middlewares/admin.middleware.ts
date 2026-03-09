import { RequestHandler } from "express";

export const superadminMiddleware: RequestHandler = (req, res, next) => {
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