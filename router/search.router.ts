import { RequestHandler, Router } from "express"
import searchGlobal from "../controller/search.ctr"
const SearchRouter:Router = Router()

SearchRouter.get("/search", searchGlobal as RequestHandler)

export {
    SearchRouter
}