import { Request, Response, NextFunction } from "express";
import { BaseError } from "../Utils/base_error";
import { RegistrationLink } from "../Models/registration_link_model";
import { Op } from "sequelize";

async function getRegistrationLinks(req: Request, res: Response, next: NextFunction) {
  try {
    const links = await RegistrationLink.findAll({
      order: [['created_at', 'DESC']]
    });
    res.json(links);
  } catch (error) {
    next(error);
  }
}

async function createRegistrationLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { subject } = req.body;

    if (!subject) {
      return next(BaseError.BadRequest(400, 'Fan nomi kiritilishi shart'));
    }

    const existingLink = await RegistrationLink.findOne({ where: { subject } });
    if (existingLink) {
      return next(BaseError.BadRequest(400, 'Bu fan nomi bilan link allaqachon mavjud'));
    }

    const link = await RegistrationLink.create({ subject });
    res.status(201).json(link);
  } catch (error) {
    next(error);
  }
}

async function updateRegistrationLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { subject } = req.body;

    console.log(`id: ${id}, subject: ${subject}`);
    

    if (!subject) {
      return next(BaseError.BadRequest(400, 'Fan nomi kiritilishi shart'));
    }

    const link = await RegistrationLink.findByPk(id);
    if (!link) {
      return next(BaseError.BadRequest(404, 'Link topilmadi'));
    }

    const existingLink = await RegistrationLink.findOne({
        where: {
          subject,
          id: { [Op.ne]: id }
        },
      });

    if (existingLink) {
      return next(BaseError.BadRequest(400, 'Bu fan nomi bilan link allaqachon mavjud'));
    }

    await link.update({ subject });
    res.json(link);
  } catch (error) {
    next(error);
  }
}

async function deleteRegistrationLink(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const link = await RegistrationLink.findByPk(id);
    if (!link) {
      return next(BaseError.BadRequest(404, 'Link topilmadi'));
    }

    await link.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export { getRegistrationLinks, createRegistrationLink, updateRegistrationLink, deleteRegistrationLink };