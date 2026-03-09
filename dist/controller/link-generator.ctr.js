"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRegistrationLinks = getRegistrationLinks;
exports.createRegistrationLink = createRegistrationLink;
exports.updateRegistrationLink = updateRegistrationLink;
exports.deleteRegistrationLink = deleteRegistrationLink;
exports.getRegistrationLinkByToken = getRegistrationLinkByToken;
const base_error_1 = require("../Utils/base_error");
const registration_link_model_1 = require("../Models/registration_link_model");
const sequelize_1 = require("sequelize");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper"); // sizdagi helper
async function getRegistrationLinks(req, res, next) {
    try {
        const links = await registration_link_model_1.RegistrationLink.findAll({
            where: (0, branch_scope_helper_1.withBranchScope)(req),
            order: [["created_at", "DESC"]],
        });
        res.json(links);
    }
    catch (error) {
        next(error);
    }
}
async function createRegistrationLink(req, res, next) {
    try {
        const { subject } = req.body;
        if (!subject?.trim()) {
            return next(base_error_1.BaseError.BadRequest(400, "Fan nomi kiritilishi shart"));
        }
        const scope = req.scope;
        const branch_id = scope?.all ? req.body.branch_id : scope?.branchIds?.[0];
        if (!branch_id)
            return next(base_error_1.BaseError.BadRequest(400, "branch_id required"));
        // shu branch ichida subject unique bo‘lsin
        const existingLink = await registration_link_model_1.RegistrationLink.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { subject: subject.trim() }),
        });
        if (existingLink) {
            return next(base_error_1.BaseError.BadRequest(400, "Bu fan nomi bilan link allaqachon mavjud"));
        }
        // token avtomatik yaraladi (defaultValue)
        const link = await registration_link_model_1.RegistrationLink.create({
            subject: subject.trim(),
            branch_id,
        });
        res.status(201).json(link);
    }
    catch (error) {
        next(error);
    }
}
async function updateRegistrationLink(req, res, next) {
    try {
        const { id } = req.params;
        const { subject } = req.body;
        if (!subject?.trim()) {
            return next(base_error_1.BaseError.BadRequest(400, "Fan nomi kiritilishi shart"));
        }
        const link = await registration_link_model_1.RegistrationLink.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!link) {
            return next(base_error_1.BaseError.BadRequest(404, "Link topilmadi (yoki ruxsat yo‘q)"));
        }
        // shu branch ichida subject unique bo‘lsin (o‘zidan tashqari)
        const existingLink = await registration_link_model_1.RegistrationLink.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, {
                subject: subject.trim(),
                id: { [sequelize_1.Op.ne]: id },
            }),
        });
        if (existingLink) {
            return next(base_error_1.BaseError.BadRequest(400, "Bu fan nomi bilan link allaqachon mavjud"));
        }
        await link.update({ subject: subject.trim() });
        res.json(link);
    }
    catch (error) {
        next(error);
    }
}
async function getRegistrationLinkByToken(req, res, next) {
    try {
        const { token } = req.params;
        const link = await registration_link_model_1.RegistrationLink.findOne({
            where: { token },
            attributes: ["id", "subject", "branch_id"],
        });
        if (!link)
            return next(base_error_1.BaseError.BadRequest(404, "Link topilmadi"));
        return res.json({ subject: link.get("subject") });
    }
    catch (e) {
        next(e);
    }
}
async function deleteRegistrationLink(req, res, next) {
    try {
        const { id } = req.params;
        const link = await registration_link_model_1.RegistrationLink.findOne({
            where: (0, branch_scope_helper_1.withBranchScope)(req, { id }),
        });
        if (!link) {
            return next(base_error_1.BaseError.BadRequest(404, "Link topilmadi (yoki ruxsat yo‘q)"));
        }
        await link.destroy();
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
