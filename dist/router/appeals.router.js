"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppealRouter = void 0;
const express_1 = require("express");
const appeals_ctr_1 = require("../controller/appeals.ctr");
const AppealRouter = (0, express_1.Router)();
exports.AppealRouter = AppealRouter;
AppealRouter.get("/get_appeals", appeals_ctr_1.getAppeals);
AppealRouter.get("/get_last_ten_day_appeals", appeals_ctr_1.getLastTenDayAppeals);
