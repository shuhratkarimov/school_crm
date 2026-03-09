import { Request, Response, NextFunction } from "express";
import { BaseError } from "../Utils/base_error";
import { RegistrationLink } from "../Models/registration_link_model";
import { Op } from "sequelize";
import { withBranchScope } from '../Utils/branch_scope.helper' // sizdagi helper

async function getRegistrationLinks(req: any, res: Response, next: NextFunction) {
  try {
    const links = await RegistrationLink.findAll({
      where: withBranchScope(req),
      order: [["created_at", "DESC"]],
    });
    res.json(links);
  } catch (error) {
    next(error);
  }
}

async function createRegistrationLink(req: any, res: Response, next: NextFunction) {
  try {
    const { subject } = req.body;

    if (!subject?.trim()) {
      return next(BaseError.BadRequest(400, "Fan nomi kiritilishi shart"));
    }

    const scope = req.scope;
    const branch_id = scope?.all ? req.body.branch_id : scope?.branchIds?.[0];
    if (!branch_id) return next(BaseError.BadRequest(400, "branch_id required"));

    // shu branch ichida subject unique bo‘lsin
    const existingLink = await RegistrationLink.findOne({
      where: withBranchScope(req, { subject: subject.trim() }),
    });
    if (existingLink) {
      return next(BaseError.BadRequest(400, "Bu fan nomi bilan link allaqachon mavjud"));
    }

    // token avtomatik yaraladi (defaultValue)
    const link = await RegistrationLink.create({
      subject: subject.trim(),
      branch_id,
    });

    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
}

async function updateRegistrationLink(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { subject } = req.body;

    if (!subject?.trim()) {
      return next(BaseError.BadRequest(400, "Fan nomi kiritilishi shart"));
    }

    const link = await RegistrationLink.findOne({
      where: withBranchScope(req, { id }),
    });
    if (!link) {
      return next(BaseError.BadRequest(404, "Link topilmadi (yoki ruxsat yo‘q)"));
    }

    // shu branch ichida subject unique bo‘lsin (o‘zidan tashqari)
    const existingLink = await RegistrationLink.findOne({
      where: withBranchScope(req, {
        subject: subject.trim(),
        id: { [Op.ne]: id },
      }),
    });

    if (existingLink) {
      return next(BaseError.BadRequest(400, "Bu fan nomi bilan link allaqachon mavjud"));
    }

    await link.update({ subject: subject.trim() });
    res.json(link);
  } catch (error) {
    next(error);
  }
}

async function getRegistrationLinkByToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;

    const link = await RegistrationLink.findOne({
      where: { token },
      attributes: ["id", "subject", "branch_id"],
    });

    if (!link) return next(BaseError.BadRequest(404, "Link topilmadi"));

    return res.json({ subject: link.get("subject") });
  } catch (e) {
    next(e);
  }
}

async function deleteRegistrationLink(req: any, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const link = await RegistrationLink.findOne({
      where: withBranchScope(req, { id }),
    });
    if (!link) {
      return next(BaseError.BadRequest(404, "Link topilmadi (yoki ruxsat yo‘q)"));
    }

    await link.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export { getRegistrationLinks, createRegistrationLink, updateRegistrationLink, deleteRegistrationLink, getRegistrationLinkByToken };