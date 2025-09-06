import { Router, RequestHandler } from "express";
import { getRegistrationLinks, createRegistrationLink, updateRegistrationLink, deleteRegistrationLink } from "../controller/link-generator.ctr";

const LinkGeneratorRouter:Router = Router()

LinkGeneratorRouter.get("/get-registration-links", getRegistrationLinks as RequestHandler)
LinkGeneratorRouter.post("/create-registration-link", createRegistrationLink as RequestHandler)
LinkGeneratorRouter.put("/update-registration-link/:id", updateRegistrationLink as RequestHandler)
LinkGeneratorRouter.delete("/delete-registration-link/:id", deleteRegistrationLink as RequestHandler)

export {
    LinkGeneratorRouter
}
