"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchRouter = void 0;
const express_1 = require("express");
const search_ctr_1 = __importDefault(require("../controller/search.ctr"));
const SearchRouter = (0, express_1.Router)();
exports.SearchRouter = SearchRouter;
SearchRouter.get("/search", search_ctr_1.default);
