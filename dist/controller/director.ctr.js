"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.getRevenueChart = getRevenueChart;
exports.getBranchPerformance = getBranchPerformance;
exports.getBranchesFullAnalytics = getBranchesFullAnalytics;
exports.getGroupsAnalytics = getGroupsAnalytics;
exports.getDirectorDebts = getDirectorDebts;
exports.getTeachersAnalytics = getTeachersAnalytics;
exports.getRoomsOccupancyAnalytics = getRoomsOccupancyAnalytics;
const index_1 = require("../Models/index");
const branch_scope_helper_1 = require("../Utils/branch_scope.helper");
const sequelize_1 = require("sequelize");
const apiResponse_1 = require("../Utils/apiResponse");
const room_ctr_1 = require("./room.ctr");
const extract_branchIds_from_scope_1 = require("../Utils/extract_branchIds_from_scope");
const index_2 = require("../Models/index");
async function getDebtSnapshotByMonth(req, monthNameUz, year) {
    const whereScope = (0, branch_scope_helper_1.withBranchScope)(req);
    const studentGroups = await index_1.StudentGroup.findAll({
        where: { month: monthNameUz, year },
        attributes: ["student_id", "group_id"],
        include: [
            {
                model: index_1.Group,
                as: "studentGroupParent",
                required: true,
                attributes: ["id", "branch_id", "monthly_fee"],
                where: whereScope,
            },
        ],
    });
    if (!studentGroups.length) {
        return {
            totalDebt: 0,
            totalShouldPayStudents: 0,
            totalPaidStudents: 0,
            byBranch: new Map(),
        };
    }
    const studentIds = [...new Set(studentGroups.map((r) => String(r.student_id)))];
    const groupIds = [...new Set(studentGroups.map((r) => String(r.group_id)))];
    const payments = await index_1.Payment.findAll({
        where: {
            pupil_id: { [sequelize_1.Op.in]: studentIds },
            group_id: { [sequelize_1.Op.in]: groupIds },
            for_which_month: monthNameUz,
        },
        attributes: [
            "pupil_id",
            "group_id",
            "payment_amount",
            "shouldBeConsideredAsPaid",
        ],
        raw: true,
    });
    const paymentMap = new Map();
    for (const p of payments) {
        const key = `${p.pupil_id}__${p.group_id}`;
        const prev = paymentMap.get(key) ?? {
            totalPaid: 0,
            consideredAsPaid: false,
        };
        paymentMap.set(key, {
            totalPaid: prev.totalPaid + Number(p.payment_amount ?? 0),
            consideredAsPaid: prev.consideredAsPaid || Boolean(p.shouldBeConsideredAsPaid),
        });
    }
    let totalDebt = 0;
    let totalPaidStudents = 0;
    const totalShouldPayStudents = studentGroups.length;
    const byBranch = new Map();
    for (const row of studentGroups) {
        const group = row.studentGroupParent;
        const branchId = String(group?.branch_id ?? "");
        const monthlyFee = Number(group?.monthly_fee ?? 0);
        const key = `${row.student_id}__${row.group_id}`;
        const paymentInfo = paymentMap.get(key);
        const paidAmount = Number(paymentInfo?.totalPaid ?? 0);
        const consideredAsPaid = Boolean(paymentInfo?.consideredAsPaid ?? false);
        const remaining = consideredAsPaid ? 0 : Math.max(monthlyFee - paidAmount, 0);
        totalDebt += remaining;
        if (remaining <= 0)
            totalPaidStudents += 1;
        if (!byBranch.has(branchId)) {
            byBranch.set(branchId, {
                debt: 0,
                paidStudents: 0,
                shouldPayStudents: 0,
            });
        }
        const branchStat = byBranch.get(branchId);
        branchStat.debt += remaining;
        branchStat.shouldPayStudents += 1;
        if (remaining <= 0) {
            branchStat.paidStudents += 1;
        }
    }
    return {
        totalDebt,
        totalShouldPayStudents,
        totalPaidStudents,
        byBranch,
    };
}
function normalizeDayName(day) {
    return String(day ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}
function getUzDayNameFromDate(dateStr) {
    const date = new Date(dateStr);
    const map = [
        "YAKSHANBA",
        "DUSHANBA",
        "SESHANBA",
        "CHORSHANBA",
        "PAYSHANBA",
        "JUMA",
        "SHANBA",
    ];
    return map[date.getDay()];
}
function timeToMinutes(time) {
    if (!time)
        return 0;
    const [h, m] = String(time).split(":").map(Number);
    return (Number(h) || 0) * 60 + (Number(m) || 0);
}
function fullTeacherName(teacher) {
    if (!teacher)
        return "Biriktirilmagan";
    return [teacher.first_name, teacher.last_name].filter(Boolean).join(" ").trim() || "Biriktirilmagan";
}
function calcRoomOccupancyPercentFromSchedules(schedules) {
    const totalMinutes = 16 * 60 * 6; // 05:00 - 21:00, 6 kun
    const busyByDay = new Map();
    for (const s of schedules) {
        const day = normalizeDayName(s.day);
        if (!day || day === "YAKSHANBA")
            continue;
        const start = timeToMinutes(s.start_time);
        const end = timeToMinutes(s.end_time);
        if (!busyByDay.has(day))
            busyByDay.set(day, []);
        busyByDay.get(day).push({ start, end });
    }
    let busyMinutes = 0;
    for (const intervals of busyByDay.values()) {
        if (!intervals.length)
            continue;
        intervals.sort((a, b) => a.start - b.start);
        const merged = [intervals[0]];
        for (let i = 1; i < intervals.length; i++) {
            const cur = intervals[i];
            const last = merged[merged.length - 1];
            if (cur.start <= last.end) {
                last.end = Math.max(last.end, cur.end);
            }
            else {
                merged.push(cur);
            }
        }
        for (const item of merged) {
            busyMinutes += Math.min(item.end - item.start, 960);
        }
    }
    const pct = (busyMinutes / totalMinutes) * 100;
    return Math.min(Math.round(pct), 100);
}
function getRoomStateForSelectedDate(roomSchedules, selectedDate) {
    const selectedDay = getUzDayNameFromDate(selectedDate);
    const todayStr = new Date().toISOString().split("T")[0];
    const isToday = selectedDate === todayStr;
    const daySchedules = roomSchedules
        .filter((s) => normalizeDayName(s.day) === selectedDay)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    if (!daySchedules.length) {
        return {
            status: "available",
            currentGroup: null,
            teacher: null,
            time: null,
            nextClass: null,
        };
    }
    if (!isToday) {
        const first = daySchedules[0];
        const second = daySchedules[1] ?? null;
        return {
            status: "occupied",
            currentGroup: first?.scheduleGroup?.group_subject ?? null,
            teacher: first?.teacher ? fullTeacherName(first.teacher) : null,
            time: first ? `${first.start_time?.slice(0, 5)} - ${first.end_time?.slice(0, 5)}` : null,
            nextClass: second
                ? `${second.start_time?.slice(0, 5)} - ${second.scheduleGroup?.group_subject ?? "Dars"}`
                : null,
        };
    }
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const active = daySchedules.find((s) => {
        const start = timeToMinutes(s.start_time);
        const end = timeToMinutes(s.end_time);
        return nowMinutes >= start && nowMinutes < end;
    });
    const next = daySchedules.find((s) => timeToMinutes(s.start_time) > nowMinutes);
    if (active) {
        return {
            status: "occupied",
            currentGroup: active?.scheduleGroup?.group_subject ?? null,
            teacher: active?.teacher ? fullTeacherName(active.teacher) : null,
            time: `${active.start_time?.slice(0, 5)} - ${active.end_time?.slice(0, 5)}`,
            nextClass: next
                ? `${next.start_time?.slice(0, 5)} - ${next.scheduleGroup?.group_subject ?? "Dars"}`
                : null,
        };
    }
    return {
        status: "available",
        currentGroup: null,
        teacher: null,
        time: null,
        nextClass: next
            ? `${next.start_time?.slice(0, 5)} - ${next.scheduleGroup?.group_subject ?? "Dars"}`
            : null,
    };
}
function parseGroupDays(days) {
    if (!days)
        return [];
    const parts = days
        .toLowerCase()
        .split(/[,/|-]/)
        .map((s) => s.trim())
        .filter(Boolean);
    const map = {
        yakshanba: 0,
        yak: 0,
        dushanba: 1,
        du: 1,
        seshanba: 2,
        se: 2,
        chorshanba: 3,
        chor: 3,
        payshanba: 4,
        pay: 4,
        juma: 5,
        ju: 5,
        shanba: 6,
        sha: 6,
        mon: 1,
        tue: 2,
        wed: 3,
        thu: 4,
        fri: 5,
        sat: 6,
        sun: 0,
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 4,
        "5": 5,
        "6": 6,
        "0": 0,
        "7": 0,
    };
    return [...new Set(parts.map((p) => map[p]).filter((v) => v !== undefined))];
}
function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function countLessonsByDaysInRange(days, rangeStart, rangeEnd) {
    const weekDays = parseGroupDays(days);
    if (!weekDays.length)
        return 0;
    let count = 0;
    const current = startOfDay(rangeStart);
    const end = startOfDay(rangeEnd);
    while (current < end) {
        if (weekDays.includes(current.getDay())) {
            count += 1;
        }
        current.setDate(current.getDate() + 1);
    }
    return count;
}
function getEffectiveMonthRangeForGroup(monthStart, monthEnd, groupCreatedAt) {
    const created = groupCreatedAt ? new Date(groupCreatedAt) : monthStart;
    const createdDayOnly = startOfDay(created);
    return {
        start: createdDayOnly > monthStart ? createdDayOnly : monthStart,
        end: monthEnd,
    };
}
const MONTH_UZ = {
    "01": "Yanvar",
    "02": "Fevral",
    "03": "Mart",
    "04": "Aprel",
    "05": "May",
    "06": "Iyun",
    "07": "Iyul",
    "08": "Avgust",
    "09": "Sentabr",
    "10": "Oktabr",
    "11": "Noyabr",
    "12": "Dekabr",
};
function getCurrentMonthYear() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // "03"
    const year = now.getFullYear(); // 2026
    return { month, year };
}
const { month: monthNum, year } = getCurrentMonthYear();
const monthNameUz = getUzMonthName(monthNum);
const { start, end } = getMonthRange(year, monthNum);
const prevRange = getMonthRange(year, monthNum);
function getCurrentMonthYearUz() {
    const now = new Date();
    const monthNum = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const monthNameUz = MONTH_UZ[monthNum] ?? monthNum;
    return { monthNum, monthNameUz, year };
}
function fullName(person) {
    if (!person)
        return "Noma'lum";
    return [person.first_name, person.last_name].filter(Boolean).join(" ") || "Noma'lum";
}
function getMonthRange(year, month) {
    const m = Number(month); // "03" -> 3
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1);
    return { start, end };
}
function getUzMonthName(month) {
    return MONTH_UZ[month] ?? month;
}
const prev = getPrevMonthYear(monthNum, year);
const prevMonthNameUz = getUzMonthName(prev.month);
async function calcAvgAttendanceForCurrentMonth(req, month, year) {
    const groupWhere = (0, branch_scope_helper_1.withBranchScope)(req);
    const { start, end } = getMonthRange(year, month);
    const totalPromise = index_1.AttendanceRecord.count({
        include: [
            {
                model: index_1.Attendance,
                as: "attendance", // AttendanceRecord.belongsTo(Attendance, as:"attendance")
                required: true,
                where: { date: { [sequelize_1.Op.gte]: start, [sequelize_1.Op.lt]: end } },
                include: [
                    {
                        model: index_1.Group,
                        as: "group", // Attendance.belongsTo(Group, as:"group")
                        required: true,
                        where: groupWhere, // Group.branch_id scope
                        attributes: [],
                    },
                ],
                attributes: [],
            },
        ],
    });
    const presentPromise = index_1.AttendanceRecord.count({
        where: { status: "present" },
        include: [
            {
                model: index_1.Attendance,
                as: "attendance",
                required: true,
                where: { date: { [sequelize_1.Op.gte]: start, [sequelize_1.Op.lt]: end } },
                include: [
                    {
                        model: index_1.Group,
                        as: "group",
                        required: true,
                        where: groupWhere,
                        attributes: [],
                    },
                ],
                attributes: [],
            },
        ],
    });
    const [total, present] = await Promise.all([totalPromise, presentPromise]);
    if (!total)
        return 0;
    const pct = (present / total) * 100;
    return Number(pct.toFixed(1));
}
async function getDashboardStats(req, res, next) {
    try {
        const whereScope = (0, branch_scope_helper_1.withBranchScope)(req);
        const branchIdScope = (0, branch_scope_helper_1.withBranchScope)(req, {}, "id");
        const { month, year } = getCurrentMonthYear();
        const prev = getPrevMonthYear(month, year);
        const uzMonth = getUzMonthName(month);
        const prevUzMonth = getUzMonthName(prev.month);
        const currentRange = getMonthRange(year, month);
        const prevRange = getMonthRange(prev.year, prev.month);
        const totalStudentsPromise = index_1.Student.count({ where: whereScope });
        const totalGroupsPromise = index_1.Group.count({ where: whereScope });
        const activeBranchesPromise = index_1.Branch.count({ where: branchIdScope });
        const totalTeachersPromise = index_1.Teacher.count({ where: whereScope });
        const totalExpensesPromise = index_1.Expense.sum("amount", { where: whereScope });
        const currentMonthGroupsPromise = index_1.Group.count({
            where: {
                ...whereScope,
                created_at: {
                    [sequelize_1.Op.gte]: currentRange.start,
                    [sequelize_1.Op.lt]: currentRange.end,
                },
            },
        });
        const prevMonthGroupsPromise = index_1.Group.count({
            where: {
                ...whereScope,
                created_at: {
                    [sequelize_1.Op.gte]: prevRange.start,
                    [sequelize_1.Op.lt]: prevRange.end,
                },
            },
        });
        const totalRevenuePromise = index_1.Payment.sum("payment_amount", {
            where: {
                ...whereScope,
                shouldBeConsideredAsPaid: true,
                for_which_month: uzMonth,
                created_at: {
                    [sequelize_1.Op.gte]: currentRange.start,
                    [sequelize_1.Op.lt]: currentRange.end,
                },
            },
        });
        const totalPrevMonthRevenuePromise = index_1.Payment.sum("payment_amount", {
            where: {
                ...whereScope,
                shouldBeConsideredAsPaid: true,
                for_which_month: prevUzMonth,
                created_at: {
                    [sequelize_1.Op.gte]: prevRange.start,
                    [sequelize_1.Op.lt]: prevRange.end,
                },
            },
        });
        const { monthNameUz, year: yearUz } = getCurrentMonthYearUz();
        const currentDebtSnapshotPromise = getDebtSnapshotByMonth(req, monthNameUz, yearUz);
        const prevDebtSnapshotPromise = getDebtSnapshotByMonth(req, prevUzMonth, prev.year);
        const curPaidCountPromise = index_1.Payment.count({
            where: {
                ...whereScope,
                shouldBeConsideredAsPaid: true,
                for_which_month: uzMonth,
            },
        });
        const prevPaidCountPromise = index_1.Payment.count({
            where: {
                ...whereScope,
                shouldBeConsideredAsPaid: true,
                for_which_month: prevUzMonth,
            },
        });
        const [totalStudents, totalGroups, activeBranches, totalRevenueRaw, totalPrevMonthRevenueRaw, currentMonthGroups, prevMonthGroups, curPaidCount, prevPaidCount, totalExpensesRaw, totalTeachers, currentDebtSnapshot, prevDebtSnapshot,] = await Promise.all([
            totalStudentsPromise,
            totalGroupsPromise,
            activeBranchesPromise,
            totalRevenuePromise,
            totalPrevMonthRevenuePromise,
            currentMonthGroupsPromise,
            prevMonthGroupsPromise,
            curPaidCountPromise,
            prevPaidCountPromise,
            totalExpensesPromise,
            totalTeachersPromise,
            currentDebtSnapshotPromise,
            prevDebtSnapshotPromise,
        ]);
        const totalStudentsShouldPay = currentDebtSnapshot.totalShouldPayStudents;
        const totalPaidStudents = currentDebtSnapshot.totalPaidStudents;
        let discipline = 0;
        if (totalStudentsShouldPay > 0) {
            discipline = (totalPaidStudents / totalStudentsShouldPay) * 100;
        }
        const totalRevenue = Number(totalRevenueRaw ?? 0);
        const totalPrevMonthRevenue = Number(totalPrevMonthRevenueRaw ?? 0);
        const debtAmount = Number(currentDebtSnapshot.totalDebt ?? 0);
        const prevMonthDebtAmount = Number(prevDebtSnapshot.totalDebt ?? 0);
        const prevMonthDebtGrowth = prevMonthDebtAmount === 0
            ? (debtAmount > 0 ? 100 : 0)
            : ((debtAmount - prevMonthDebtAmount) / prevMonthDebtAmount) * 100;
        const prevBase = prevPaidCount || 0;
        const monthlyGrowth = prevBase === 0 ? (curPaidCount > 0 ? 100 : 0) : ((curPaidCount - prevPaidCount) / prevBase) * 100;
        const avgAttendance = await calcAvgAttendanceForCurrentMonth(req, month, year);
        function normalizeCount(value) {
            if (typeof value === "number")
                return value;
            return value.reduce((sum, item) => sum + Number(item.count ?? 0), 0);
        }
        const currentMonthGroupsCount = normalizeCount(currentMonthGroups);
        const prevMonthGroupsCount = normalizeCount(prevMonthGroups);
        const prevMonthGroupsGrowth = prevMonthGroupsCount === 0
            ? (currentMonthGroupsCount > 0 ? 100 : 0)
            : ((currentMonthGroupsCount - prevMonthGroupsCount) / prevMonthGroupsCount) * 100;
        return void res.status(200).json((0, apiResponse_1.ok)({
            totalStudents,
            totalStudentsShouldPay,
            totalPaidStudents,
            totalTeachers,
            totalRevenue,
            totalPrevMonthRevenue,
            totalGroups,
            activeBranches,
            avgAttendance,
            monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
            prevMonthGrowth: Number(monthlyGrowth.toFixed(1)),
            debtAmount,
            prevMonthDebtAmount,
            prevMonthDebtGrowth: Number(prevMonthDebtGrowth.toFixed(1)),
            totalExpenses: Number(totalExpensesRaw ?? 0),
            period: { monthName: uzMonth, month, year },
            discipline: Number(discipline.toFixed(1)),
            currentMonthGroups,
            prevMonthGroups,
            prevMonthGroupsGrowth: Number(prevMonthGroupsGrowth.toFixed(1)),
        }, "Dashboard stats"));
    }
    catch (e) {
        next(e);
    }
}
function getUzMonthNameFromNum(monthNum) {
    return MONTH_UZ[monthNum] ?? monthNum;
}
async function getRevenueChart(req, res, next) {
    try {
        const whereScope = (0, branch_scope_helper_1.withBranchScope)(req);
        const year = new Date().getFullYear();
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthNum = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            const start = new Date(year, Number(monthNum) - 1, 1);
            const end = new Date(year, Number(monthNum), 1);
            months.push({
                monthNum,
                year,
                start,
                end,
                monthNameUz: getUzMonthNameFromNum(monthNum), // "Mart"
            });
        }
        const results = await Promise.all(months.map(async ({ monthNum, year, start, end, monthNameUz }) => {
            const amount = await index_1.Payment.sum("payment_amount", {
                where: {
                    ...whereScope,
                    shouldBeConsideredAsPaid: true,
                    for_which_month: monthNameUz,
                    created_at: { [sequelize_1.Op.gte]: start, [sequelize_1.Op.lt]: end }, // yil+oy aniqligi uchun
                },
            });
            return {
                month: monthNameUz,
                amount: Number(amount ?? 0),
                key: `${year}-${monthNum}`,
            };
        }));
        return void res.status(200).json((0, apiResponse_1.ok)(results, "Revenue chart"));
    }
    catch (e) {
        next(e);
    }
}
function getPrevMonthYear(month, year) {
    let m = Number(month);
    let y = year;
    m -= 1;
    if (m === 0) {
        m = 12;
        y -= 1;
    }
    return { month: String(m).padStart(2, "0"), year: y };
}
function calcGrowth(current, prev) {
    if (!prev)
        return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
}
function getStatus(revenue, debt) {
    if (revenue <= 0 && debt > 0)
        return "warning";
    const ratio = revenue > 0 ? debt / revenue : 1;
    if (ratio <= 0.08)
        return "excellent";
    if (ratio <= 0.18)
        return "good";
    return "warning";
}
async function getBranchPerformance(req, res, next) {
    try {
        const whereScope = (0, branch_scope_helper_1.withBranchScope)(req);
        const branchIds = (0, extract_branchIds_from_scope_1.extractBranchIdsFromScope)(whereScope);
        const paymentWhere = branchIds?.length
            ? { branch_id: { [sequelize_1.Op.in]: branchIds } }
            : whereScope;
        const { month: monthNum, year } = getCurrentMonthYear();
        const prev = getPrevMonthYear(monthNum, year);
        // bu qiymatlar senda yuqorida helper orqali olinayotgan bo‘lsa o‘sha helperni ishlat
        const range = getMonthRange(year, monthNum);
        const prevRange = getMonthRange(prev.year, prev.month);
        const monthNameUz = getUzMonthName(monthNum);
        const prevMonthNameUz = getUzMonthName(prev.month);
        const groupWhere = branchIds?.length
            ? { branch_id: { [sequelize_1.Op.in]: branchIds } }
            : whereScope;
        const branches = await index_1.Branch.findAll({
            where: branchIds?.length ? { id: { [sequelize_1.Op.in]: branchIds } } : {},
            attributes: ["id", "name", "manager_id", "phone", "address", "created_at"],
            include: [
                {
                    model: index_1.User,
                    as: "manager",
                    attributes: ["id", "username", "email"],
                    required: false,
                },
                {
                    model: index_1.Room,
                    as: "branchRooms",
                    attributes: ["id", "name", "capacity"],
                    required: false,
                    separate: true,
                },
                {
                    model: index_1.Group,
                    as: "branchGroups",
                    attributes: ["id", "group_subject"],
                    required: false,
                    separate: true,
                },
            ],
        });
        const resolvedBranchIds = branchIds?.length ? branchIds : branches.map((b) => b.id);
        const occupancyMap = await (0, room_ctr_1.getRoomsBusinessPercentByBranch)(resolvedBranchIds);
        const roomStatsMap = await (0, room_ctr_1.getRoomStatsByBranch)(resolvedBranchIds);
        const studentsByBranch = await index_1.Student.findAll({
            attributes: ["branch_id", [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.literal)("*")), "students"]],
            where: groupWhere,
            group: ["branch_id"],
            raw: true,
        });
        const revenueByBranch = await index_1.Payment.findAll({
            attributes: [
                ["branch_id", "branch_id"],
                [(0, sequelize_1.fn)("COALESCE", (0, sequelize_1.fn)("SUM", (0, sequelize_1.col)("payment_amount")), 0), "revenue"],
            ],
            where: {
                ...paymentWhere,
                shouldBeConsideredAsPaid: true,
                created_at: { [sequelize_1.Op.gte]: range.start, [sequelize_1.Op.lt]: range.end },
            },
            group: ["branch_id"],
            raw: true,
        });
        const debtSnapshot = await getDebtSnapshotByMonth(req, monthNameUz, year);
        const debtMap = new Map();
        for (const [branchId, stat] of debtSnapshot.byBranch.entries()) {
            debtMap.set(branchId, Number(stat.debt ?? 0));
        }
        const prevRevenueByBranch = await index_1.Payment.findAll({
            attributes: [
                ["branch_id", "branch_id"],
                [(0, sequelize_1.fn)("COALESCE", (0, sequelize_1.fn)("SUM", (0, sequelize_1.col)("payment_amount")), 0), "revenue_prev"],
            ],
            where: {
                ...paymentWhere,
                shouldBeConsideredAsPaid: true,
                created_at: { [sequelize_1.Op.gte]: prevRange.start, [sequelize_1.Op.lt]: prevRange.end },
            },
            group: ["branch_id"],
            raw: true,
        });
        const teacherByBranch = await index_1.Teacher.findAll({
            attributes: ["branch_id", [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("id")), "teachers"]],
            where: groupWhere,
            group: ["branch_id"],
            raw: true,
        });
        const studentsMap = new Map();
        for (const row of studentsByBranch) {
            studentsMap.set(String(row.branch_id), Number(row.students ?? 0));
        }
        const revenueMap = new Map();
        for (const row of revenueByBranch) {
            revenueMap.set(String(row.branch_id), Number(row.revenue ?? 0));
        }
        const prevRevenueMap = new Map();
        for (const row of prevRevenueByBranch) {
            prevRevenueMap.set(String(row.branch_id), Number(row.revenue_prev ?? 0));
        }
        const teachersMap = new Map();
        for (const row of teacherByBranch) {
            teachersMap.set(String(row.branch_id), Number(row.teachers ?? 0));
        }
        function calcGrowth(current, prev) {
            if (!prev)
                return current > 0 ? 100 : 0;
            return ((current - prev) / prev) * 100;
        }
        function normalize(value, max) {
            if (!max || max <= 0)
                return 0;
            return value / max;
        }
        const branchStats = branches.map((b) => {
            const id = String(b.id);
            const revenue = revenueMap.get(id) ?? 0;
            const prevRevenue = prevRevenueMap.get(id) ?? 0;
            const debt = debtMap.get(id) ?? 0;
            const teachers = teachersMap.get(id) ?? 0;
            const students = studentsMap.get(id) ?? 0;
            const occupancy = occupancyMap.get(id) ?? 0;
            const growth = calcGrowth(revenue, prevRevenue);
            return {
                id,
                name: b.name,
                manager: b.manager ? (typeof b.manager.get === "function" ? b.manager.get({ plain: true }) : b.manager) : null,
                phone: b.phone,
                address: b.address,
                created_at: b.created_at,
                branchRooms: Array.isArray(b.branchRooms)
                    ? b.branchRooms.map((room) => typeof room.get === "function" ? room.get({ plain: true }) : room)
                    : [],
                branchGroups: Array.isArray(b.branchGroups)
                    ? b.branchGroups.map((group) => typeof group.get === "function" ? group.get({ plain: true }) : group)
                    : [],
                students,
                revenue,
                prevRevenue,
                occupancy,
                teachers,
                debt,
                growth: Number(growth.toFixed(1)),
                status: getStatus(revenue, debt),
                roomStats: roomStatsMap.get(id) ?? 0,
            };
        });
        const maxRevenue = Math.max(...branchStats.map((b) => b.revenue), 0);
        const maxDebt = Math.max(...branchStats.map((b) => b.debt), 0);
        const maxStudents = Math.max(...branchStats.map((b) => b.students), 0);
        const maxTeachers = Math.max(...branchStats.map((b) => b.teachers), 0);
        const maxOccupancy = Math.max(...branchStats.map((b) => b.occupancy), 0);
        const maxGrowth = Math.max(...branchStats.map((b) => Math.max(b.growth, 0)), 0);
        const scoredBranches = branchStats.map((b) => {
            const revenueScore = normalize(b.revenue, maxRevenue);
            const debtScore = maxDebt > 0 ? 1 - normalize(b.debt, maxDebt) : 1;
            const studentsScore = normalize(b.students, maxStudents);
            const teachersScore = normalize(b.teachers, maxTeachers);
            const occupancyScore = normalize(b.occupancy, maxOccupancy);
            const growthScore = normalize(Math.max(b.growth, 0), maxGrowth);
            const score = (revenueScore * 0.35 +
                debtScore * 0.25 +
                studentsScore * 0.1 +
                teachersScore * 0.05 +
                occupancyScore * 0.1 +
                growthScore * 0.15) * 10;
            return {
                ...b,
                score: Number(score.toFixed(1)),
            };
        });
        const theBestBranch = scoredBranches.length > 0
            ? scoredBranches.reduce((best, item) => item.score > best.score ? item : best)
            : null;
        const theWorstBranch = scoredBranches.length > 1
            ? scoredBranches.reduce((worst, item) => item.score < worst.score ? item : worst)
            : scoredBranches.length === 1
                ? null
                : null;
        const result = scoredBranches.map((b) => ({
            id: b.id,
            name: b.name,
            manager: b.manager,
            phone: b.phone,
            address: b.address,
            created_at: b.created_at,
            branchRooms: b.branchRooms,
            branchGroups: b.branchGroups,
            students: b.students,
            revenue: b.revenue,
            prevRevenue: b.prevRevenue,
            occupancy: b.occupancy,
            teachers: b.teachers,
            debt: b.debt,
            growth: b.growth,
            roomStats: b.roomStats,
            score: b.score,
            status: b.status,
            isTheBest: theBestBranch ? b.id === theBestBranch.id : false,
            isTheWorst: theWorstBranch ? b.id === theWorstBranch.id : false,
        }));
        result.sort((a, b) => b.score - a.score);
        const totalRevenue = result.reduce((sum, b) => sum + b.revenue, 0);
        const totalDebt = result.reduce((sum, b) => sum + b.debt, 0);
        const totalStudents = result.reduce((sum, b) => sum + b.students, 0);
        const totalTeachers = result.reduce((sum, b) => sum + b.teachers, 0);
        const avgOccupancy = result.length
            ? Number((result.reduce((sum, b) => sum + b.occupancy, 0) / result.length).toFixed(1))
            : 0;
        const totalPrevRevenue = branches.reduce((sum, b) => {
            return sum + (prevRevenueMap.get(String(b.id)) ?? 0);
        }, 0);
        const overallGrowth = Number(calcGrowth(totalRevenue, totalPrevRevenue).toFixed(1));
        return void res.status(200).json((0, apiResponse_1.ok)({
            branches: result,
            summary: {
                totalBranches: result.length,
                totalRevenue,
                totalDebt,
                totalStudents,
                totalTeachers,
                avgOccupancy,
                overallGrowth,
                bestBranch: theBestBranch
                    ? {
                        id: theBestBranch.id,
                        name: theBestBranch.name,
                        score: theBestBranch.score,
                        revenue: theBestBranch.revenue,
                        debt: theBestBranch.debt,
                        growth: theBestBranch.growth,
                    }
                    : null,
                worstBranch: theWorstBranch
                    ? {
                        id: theWorstBranch.id,
                        name: theWorstBranch.name,
                        score: theWorstBranch.score,
                        revenue: theWorstBranch.revenue,
                        debt: theWorstBranch.debt,
                        growth: theWorstBranch.growth,
                    }
                    : null,
            },
        }, "Branch performance", { period: { monthNum, year } }));
    }
    catch (e) {
        next(e);
    }
}
async function getBranchesFullAnalytics(req, res, next) {
    try {
        const isAllScope = req.scope?.all === true;
        const branchIds = req.scope?.branchIds ?? [];
        const branchWhere = isAllScope
            ? {}
            : { id: { [sequelize_1.Op.in]: branchIds } };
        if (!isAllScope && !branchIds.length) {
            return void res.status(200).json((0, apiResponse_1.ok)({
                branches: [],
            }, "Branches analytics"));
        }
        const branches = await index_1.Branch.findAll({
            where: branchWhere,
            attributes: ["id", "name", "phone", "address", "created_at", "manager_id"],
            include: [
                {
                    model: index_1.User,
                    as: "manager",
                    attributes: ["id", "username", "email"],
                    required: false,
                },
            ],
            order: [["created_at", "DESC"]],
        });
        const resolvedBranchIds = branches.map((b) => String(b.id));
        const teachersPromise = index_1.Teacher.findAll({
            where: isAllScope
                ? {}
                : { branch_id: { [sequelize_1.Op.in]: resolvedBranchIds } },
            order: [["created_at", "DESC"]],
        });
        const teachers = await teachersPromise;
        const now = new Date();
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthNum = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            const start = new Date(year, Number(monthNum) - 1, 1);
            const end = new Date(year, Number(monthNum), 1);
            months.push({
                monthNum,
                year,
                start,
                end,
                monthNameUz: getUzMonthNameFromNum(monthNum),
                key: `${year}-${monthNum}`,
            });
        }
        const revenueByBranch = await Promise.all(resolvedBranchIds.map(async (branchId) => {
            const revenue12Months = await Promise.all(months.map(async ({ start, end, monthNameUz, key }) => {
                const amount = await index_1.Payment.sum("payment_amount", {
                    where: {
                        branch_id: branchId,
                        shouldBeConsideredAsPaid: true,
                        for_which_month: monthNameUz,
                        created_at: {
                            [sequelize_1.Op.gte]: start,
                            [sequelize_1.Op.lt]: end,
                        },
                    },
                });
                return {
                    key,
                    month: monthNameUz,
                    amount: Number(amount ?? 0),
                };
            }));
            return {
                branchId: String(branchId),
                revenue12Months,
            };
        }));
        const revenueMap = new Map();
        for (const item of revenueByBranch) {
            revenueMap.set(item.branchId, item.revenue12Months);
        }
        const result = branches.map((branch) => {
            const plainBranch = typeof branch.get === "function" ? branch.get({ plain: true }) : branch;
            const branchId = String(plainBranch.id);
            const branchTeachers = teachers
                .filter((t) => String(t.branch_id) === branchId)
                .map((t) => (typeof t.get === "function" ? t.get({ plain: true }) : t));
            return {
                id: plainBranch.id,
                name: plainBranch.name,
                phone: plainBranch.phone,
                address: plainBranch.address,
                created_at: plainBranch.created_at,
                manager: plainBranch.manager ?? null,
                branchTeachers,
                branchRevenue: revenueMap.get(branchId) ?? [],
                counts: {
                    teachers: branchTeachers.length,
                },
            };
        });
        return void res.status(200).json((0, apiResponse_1.ok)({
            branches: result,
        }, "Branches full analytics"));
    }
    catch (e) {
        next(e);
    }
}
function formatTeacherName(teacher) {
    if (!teacher)
        return "Biriktirilmagan";
    return `${teacher.first_name ?? ""} ${teacher.last_name ?? ""}`.trim();
}
function getStatusByAttendanceAndProgress(attendance, progress) {
    if (attendance < 50 || progress < 50)
        return "Yomon";
    if (attendance < 80 || progress < 80)
        return "O'rtacha";
    return "Yaxshi";
}
async function getGroupsAnalytics(req, res, next) {
    try {
        const whereScope = (0, branch_scope_helper_1.withBranchScope)(req);
        const search = String(req.query.search ?? "").trim();
        const branchId = String(req.query.branchId ?? "").trim();
        const level = String(req.query.level ?? "").trim();
        const { monthNum, monthNameUz, year } = getCurrentMonthYearUz();
        const { start, end } = getMonthRange(year, monthNum);
        const groupWhere = { ...whereScope };
        if (branchId && branchId !== "all") {
            groupWhere.branch_id = branchId;
        }
        if (level && level !== "all") {
            groupWhere.level = level;
        }
        if (search) {
            groupWhere[sequelize_1.Op.or] = [
                { group_subject: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { level: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        const groups = await index_1.Group.findAll({
            where: groupWhere,
            attributes: [
                "id",
                "group_subject",
                "branch_id",
                "teacher_id",
                "monthly_fee",
                "start_time",
                "end_time",
                "days",
                "created_at",
            ],
            include: [
                {
                    model: index_1.Branch,
                    as: "branch",
                    attributes: ["id", "name"],
                    required: false,
                },
                {
                    model: index_1.Teacher,
                    as: "teacher",
                    attributes: ["id", "first_name", "last_name"],
                    required: false,
                },
            ],
            order: [["created_at", "DESC"]],
        });
        const groupIds = groups.map((g) => g.id);
        if (!groupIds.length) {
            return void res.status(200).json((0, apiResponse_1.ok)({
                summary: {
                    totalGroups: 0,
                    totalStudents: 0,
                    avgAttendance: 0,
                    totalRevenue: 0,
                },
                groups: [],
            }, "Groups analytics"));
        }
        const studentCounts = await index_1.StudentGroup.findAll({
            attributes: [
                "group_id",
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.literal)('DISTINCT "student_id"')), "studentCount"],
            ],
            where: {
                group_id: { [sequelize_1.Op.in]: groupIds },
                month: monthNameUz,
                year,
            },
            group: ["group_id"],
            raw: true,
        });
        const studentCountsMap = new Map();
        for (const row of studentCounts) {
            studentCountsMap.set(String(row.group_id), Number(row.studentCount ?? 0));
        }
        // 2) paid / total for current month (for 12/15 formatga o‘xshash)
        const currentMonthStudentGroups = await index_1.StudentGroup.findAll({
            attributes: [
                "group_id",
                "paid",
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("student_id")), "count"],
            ],
            where: {
                group_id: { [sequelize_1.Op.in]: groupIds },
                month: monthNameUz,
                year,
            },
            group: ["group_id", "paid"],
            raw: true,
        });
        const paidMap = new Map();
        const shouldPayMap = new Map();
        for (const row of currentMonthStudentGroups) {
            const gid = String(row.group_id);
            const count = Number(row.count ?? 0);
            shouldPayMap.set(gid, (shouldPayMap.get(gid) ?? 0) + count);
            if (row.paid === true) {
                paidMap.set(gid, (paidMap.get(gid) ?? 0) + count);
            }
        }
        // 3) attendance per group (current month)
        const attendanceAgg = await index_1.AttendanceRecord.findAll({
            attributes: [
                [(0, sequelize_1.col)("attendance.group_id"), "group_id"],
                [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.literal)("*")), "totalRecords"],
                [
                    (0, sequelize_1.fn)("SUM", (0, sequelize_1.literal)(`CASE WHEN "AttendanceRecord"."status" = 'present' THEN 1 ELSE 0 END`)),
                    "presentRecords",
                ],
            ],
            include: [
                {
                    model: index_1.Attendance,
                    as: "attendance",
                    required: true,
                    attributes: [],
                    where: {
                        group_id: { [sequelize_1.Op.in]: groupIds },
                        date: {
                            [sequelize_1.Op.gte]: start,
                            [sequelize_1.Op.lt]: end,
                        },
                    },
                },
            ],
            group: [(0, sequelize_1.col)("attendance.group_id")],
            raw: true,
        });
        const attendanceMap = new Map();
        for (const row of attendanceAgg) {
            const total = Number(row.totalRecords ?? 0);
            const present = Number(row.presentRecords ?? 0);
            const pct = total > 0 ? (present / total) * 100 : 0;
            attendanceMap.set(String(row.group_id), Number(pct.toFixed(1)));
        }
        // 4) revenue per group (current month)
        // agar Payment da group_id bo‘lsa shuni ishlat
        const revenueAgg = await index_1.Payment.findAll({
            attributes: [
                "group_id",
                [(0, sequelize_1.fn)("COALESCE", (0, sequelize_1.fn)("SUM", (0, sequelize_1.col)("payment_amount")), 0), "revenue"],
            ],
            where: {
                group_id: { [sequelize_1.Op.in]: groupIds },
                shouldBeConsideredAsPaid: true,
                for_which_month: monthNameUz,
            },
            group: ["group_id"],
            raw: true,
        });
        const revenueMap = new Map();
        for (const row of revenueAgg) {
            revenueMap.set(String(row.group_id), Number(row.revenue ?? 0));
        }
        // 5) progress per group
        // Agar senda real progress table bo‘lmasa, temporary formula:
        // paid students ratio + attendance mix
        const progressMap = new Map();
        for (const g of groups) {
            const gid = String(g.id);
            const paid = paidMap.get(gid) ?? 0;
            const totalShouldPay = shouldPayMap.get(gid) ?? 0;
            const attendance = attendanceMap.get(gid) ?? 0;
            const paymentDiscipline = totalShouldPay > 0 ? (paid / totalShouldPay) * 100 : 0;
            const progress = (paymentDiscipline * 0.6 + attendance * 0.4);
            progressMap.set(gid, Number(progress.toFixed(1)));
        }
        const rows = groups.map((group) => {
            const plain = typeof group.get === "function"
                ? group.get({ plain: true })
                : group;
            const gid = String(plain.id);
            const actualStudents = studentCountsMap.get(gid) ?? 0;
            const shouldPay = shouldPayMap.get(gid) ?? actualStudents;
            const paidStudents = paidMap.get(gid) ?? 0;
            const attendance = attendanceMap.get(gid) ?? 0;
            const progress = progressMap.get(gid) ?? 0;
            const revenue = revenueMap.get(gid) ?? 0;
            const groupName = plain.group_subject || "Noma'lum guruh";
            return {
                id: plain.id,
                name: groupName,
                level: plain.level ?? "Noma'lum",
                branch: plain.branch?.name ?? "Noma'lum filial",
                teacher: formatTeacherName(plain.teacher),
                students: {
                    current: actualStudents,
                    capacity: shouldPay || actualStudents,
                    label: `${actualStudents}/${shouldPay || actualStudents}`,
                },
                schedule: {
                    days: Array.isArray(plain.days)
                        ? plain.days.join(" / ")
                        : plain.days || "Jadval kiritilmagan",
                    time: plain.start_time && plain.end_time
                        ? `${plain.start_time} - ${plain.end_time}`
                        : "Vaqt kiritilmagan",
                },
                attendance,
                progress,
                revenue,
                status: getStatusByAttendanceAndProgress(attendance, progress),
                paidStudents,
                shouldPayStudents: shouldPay,
            };
        });
        const totalGroups = rows.length;
        const totalStudents = rows.reduce((sum, row) => sum + row.students.current, 0);
        const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0);
        const avgAttendance = totalGroups
            ? Number((rows.reduce((sum, row) => sum + row.attendance, 0) / totalGroups).toFixed(1))
            : 0;
        return void res.status(200).json((0, apiResponse_1.ok)({
            summary: {
                totalGroups,
                totalStudents,
                avgAttendance,
                totalRevenue,
            },
            groups: rows,
            filters: {
                search,
                branchId: branchId || "all",
                level: level || "all",
                period: {
                    month: monthNameUz,
                    year,
                },
            },
        }, "Groups analytics"));
    }
    catch (e) {
        next(e);
    }
}
function formatDate(date) {
    return date.toISOString().split("T")[0];
}
function getDaysOverdue(dueDateStr) {
    const today = new Date();
    const dueDate = new Date(dueDateStr);
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const dueOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffMs = todayOnly.getTime() - dueOnly.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}
function getPaymentStatus(remaining, dueDateStr) {
    if (remaining <= 0)
        return "paid";
    const overdueDays = getDaysOverdue(dueDateStr);
    if (overdueDays > 0)
        return "overdue";
    return "pending";
}
async function getDirectorDebts(req, res, next) {
    try {
        const whereScope = (0, branch_scope_helper_1.withBranchScope)(req);
        const search = String(req.query.search ?? "").trim();
        const branchId = String(req.query.branchId ?? "").trim();
        const statusFilter = String(req.query.status ?? "").trim();
        const { monthNameUz, year, monthNum } = getCurrentMonthYearUz();
        const studentWhere = { ...whereScope };
        if (branchId && branchId !== "all") {
            studentWhere.branch_id = branchId;
        }
        if (search) {
            studentWhere[sequelize_1.Op.or] = [
                { first_name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { last_name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { phone_number: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        const studentGroups = await index_1.StudentGroup.findAll({
            where: {
                month: monthNameUz,
                year,
            },
            attributes: ["student_id", "group_id", "created_at"],
            include: [
                {
                    model: index_1.Student,
                    as: "student",
                    required: true,
                    attributes: [
                        "id",
                        "first_name",
                        "last_name",
                        "phone_number",
                        "branch_id",
                    ],
                    where: studentWhere,
                    include: [
                        {
                            model: index_1.Branch,
                            as: "branch",
                            required: false,
                            attributes: ["id", "name"],
                        },
                    ],
                },
                {
                    model: index_1.Group,
                    as: "studentGroupParent",
                    required: true,
                    attributes: ["id", "group_subject", "monthly_fee", "teacher_id"],
                    include: [
                        {
                            model: index_1.Teacher,
                            as: "teacher",
                            required: false,
                            attributes: ["id", "first_name", "last_name"],
                        },
                    ],
                },
            ],
            order: [["created_at", "DESC"]],
        });
        if (!studentGroups.length) {
            return void res.status(200).json((0, apiResponse_1.ok)({
                summary: {
                    totalDebt: 0,
                    overdueDebt: 0,
                    pendingDebt: 0,
                    averageDebt: 0,
                    debtorsCount: 0,
                    overdueCount: 0,
                    pendingCount: 0,
                },
                debts: [],
                branchSummary: [],
                branches: [],
            }, "Director debts"));
        }
        const studentIds = [...new Set(studentGroups.map((r) => String(r.student_id)))];
        const groupIds = [...new Set(studentGroups.map((r) => String(r.group_id)))];
        const payments = await index_1.Payment.findAll({
            where: {
                pupil_id: { [sequelize_1.Op.in]: studentIds },
                group_id: { [sequelize_1.Op.in]: groupIds },
                for_which_month: monthNameUz,
            },
            attributes: [
                "pupil_id",
                "group_id",
                "payment_amount",
                "created_at",
                "shouldBeConsideredAsPaid",
            ],
            raw: true,
            order: [["created_at", "DESC"]],
        });
        const paymentMap = new Map();
        for (const p of payments) {
            const key = `${p.pupil_id}__${p.group_id}`;
            const prev = paymentMap.get(key) ?? {
                totalPaid: 0,
                lastPayment: null,
                consideredAsPaid: false,
            };
            paymentMap.set(key, {
                totalPaid: prev.totalPaid + Number(p.payment_amount ?? 0),
                lastPayment: prev.lastPayment ??
                    (p.created_at ? formatDate(new Date(p.created_at)) : null),
                consideredAsPaid: prev.consideredAsPaid || Boolean(p.shouldBeConsideredAsPaid),
            });
        }
        const dueDate = formatDate(new Date(year, Number(monthNum) - 1, 26));
        let debts = studentGroups.map((row, index) => {
            const student = row.student;
            const group = row.studentGroupParent;
            const teacher = group?.teacher;
            const branch = student?.branch;
            const amount = Number(group?.monthly_fee ?? 0);
            const key = `${row.student_id}__${row.group_id}`;
            const paymentInfo = paymentMap.get(key);
            const paid = Number(paymentInfo?.totalPaid ?? 0);
            const consideredAsPaid = Boolean(paymentInfo?.consideredAsPaid ?? false);
            const remaining = consideredAsPaid ? 0 : Math.max(amount - paid, 0);
            const status = consideredAsPaid ? "paid" : getPaymentStatus(remaining, dueDate);
            const daysOverdue = consideredAsPaid || status !== "overdue" ? 0 : getDaysOverdue(dueDate);
            return {
                id: `${row.student_id}-${row.group_id}-${index}`,
                student: fullName(student),
                phone: student?.phone_number ?? "",
                email: student?.email ?? "",
                branch: branch?.name ?? "Noma'lum filial",
                group: group?.group_subject ?? "Noma'lum guruh",
                amount,
                paid,
                remaining,
                month: monthNameUz,
                year,
                dueDate,
                daysOverdue,
                status,
                teacher: fullName(teacher),
                consideredAsPaid,
                studentId: row.student_id,
                groupId: row.group_id,
                branchId: student?.branch_id ?? null,
            };
        });
        debts = debts.filter((d) => d.remaining > 0);
        if (statusFilter && statusFilter !== "all") {
            debts = debts.filter((d) => d.status === statusFilter);
        }
        const totalDebt = debts.reduce((sum, d) => sum + d.remaining, 0);
        const overdueDebt = debts
            .filter((d) => d.status === "overdue")
            .reduce((sum, d) => sum + d.remaining, 0);
        const pendingDebt = debts
            .filter((d) => d.status === "pending")
            .reduce((sum, d) => sum + d.remaining, 0);
        const debtors = debts.filter((d) => d.remaining > 0);
        const averageDebt = debtors.length ? Math.round(totalDebt / debtors.length) : 0;
        const branchSummaryMap = new Map();
        for (const debt of debts) {
            const key = debt.branch;
            if (!branchSummaryMap.has(key)) {
                branchSummaryMap.set(key, {
                    id: debt.branchId,
                    branch: debt.branch,
                    totalDebt: 0,
                    debtorsCount: 0,
                    overdueCount: 0,
                });
            }
            const item = branchSummaryMap.get(key);
            item.totalDebt += debt.remaining;
            if (debt.remaining > 0)
                item.debtorsCount += 1;
            if (debt.status === "overdue")
                item.overdueCount += 1;
        }
        const branchSummary = Array.from(branchSummaryMap.values()).map((item) => ({
            ...item,
            percent: totalDebt > 0 ? Number(((item.totalDebt / totalDebt) * 100).toFixed(1)) : 0,
        }));
        return void res.status(200).json((0, apiResponse_1.ok)({
            summary: {
                totalDebt,
                overdueDebt,
                pendingDebt,
                averageDebt,
                debtorsCount: debtors.length,
                overdueCount: debts.filter((d) => d.status === "overdue").length,
                pendingCount: debts.filter((d) => d.status === "pending").length,
            },
            debts,
            branchSummary,
            branches: branchSummary.map((b) => b.branch),
            filters: {
                search,
                branchId: branchId || "all",
                status: statusFilter || "all",
                period: {
                    month: monthNameUz,
                    year,
                },
            },
        }, "Director debts"));
    }
    catch (e) {
        next(e);
    }
}
async function getTeachersAnalytics(req, res, next) {
    try {
        const whereScope = (0, branch_scope_helper_1.withBranchScope)(req);
        const search = String(req.query.search ?? "").trim();
        const branchId = String(req.query.branchId ?? "").trim();
        const specialty = String(req.query.specialty ?? "").trim();
        const { monthNum, monthNameUz, year } = getCurrentMonthYearUz();
        const { start, end } = getMonthRange(year, monthNum);
        const teacherWhere = { ...whereScope };
        if (branchId && branchId !== "all") {
            teacherWhere.branch_id = branchId;
        }
        if (search) {
            teacherWhere[sequelize_1.Op.or] = [
                { first_name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { last_name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { phone_number: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { subject: { [sequelize_1.Op.iLike]: `%${search}%` } },
            ];
        }
        if (specialty && specialty !== "all") {
            teacherWhere[sequelize_1.Op.and] = teacherWhere[sequelize_1.Op.and] || [];
            teacherWhere[sequelize_1.Op.and].push({
                [sequelize_1.Op.or]: [
                    { subject: { [sequelize_1.Op.iLike]: `%${specialty}%` } },
                ],
            });
        }
        const teachers = await index_1.Teacher.findAll({
            where: teacherWhere,
            attributes: [
                "id",
                "first_name",
                "last_name",
                "phone_number",
                "branch_id",
                "subject",
                "img_url",
                "created_at",
            ],
            include: [
                {
                    model: index_1.Branch,
                    as: "branch",
                    attributes: ["id", "name"],
                    required: false,
                },
                {
                    model: index_2.TeacherBalance,
                    as: "teacherBalance",
                    attributes: ["balance"],
                    required: false,
                },
            ],
            order: [["created_at", "DESC"]],
        });
        if (!teachers.length) {
            return void res.status(200).json((0, apiResponse_1.ok)({
                summary: {
                    totalTeachers: 0,
                    avgRating: 0,
                    avgAttendance: 0,
                    totalStudents: 0,
                },
                teachers: [],
                branches: [],
                specialties: [],
                filters: {
                    search,
                    branchId: branchId || "all",
                    specialty: specialty || "all",
                    period: {
                        month: monthNameUz,
                        year,
                    },
                },
            }, "Teachers analytics"));
        }
        const teacherIds = teachers.map((t) => t.id);
        const groups = await index_1.Group.findAll({
            where: {
                teacher_id: { [sequelize_1.Op.in]: teacherIds },
            },
            attributes: [
                "id",
                "teacher_id",
                "branch_id",
                "group_subject",
                "start_time",
                "end_time",
                "days",
                "monthly_fee",
                "created_at",
            ],
            raw: true,
        });
        const groupIds = groups.map((g) => g.id);
        const groupsByTeacherMap = new Map();
        for (const group of groups) {
            const key = String(group.teacher_id);
            if (!groupsByTeacherMap.has(key)) {
                groupsByTeacherMap.set(key, []);
            }
            groupsByTeacherMap.get(key).push(group);
        }
        const groupCountMap = new Map();
        for (const [teacherId, teacherGroups] of groupsByTeacherMap.entries()) {
            groupCountMap.set(teacherId, teacherGroups.length);
        }
        const studentCountsRaw = groupIds.length
            ? await index_1.StudentGroup.findAll({
                attributes: [
                    "group_id",
                    [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.literal)('DISTINCT "student_id"')), "studentCount"],
                ],
                where: {
                    group_id: { [sequelize_1.Op.in]: groupIds },
                    month: monthNameUz,
                    year,
                },
                group: ["group_id"],
                raw: true,
            })
            : [];
        const studentsByGroupMap = new Map();
        for (const row of studentCountsRaw) {
            studentsByGroupMap.set(String(row.group_id), Number(row.studentCount ?? 0));
        }
        const studentsByTeacherMap = new Map();
        for (const teacher of teachers) {
            const tid = String(teacher.id);
            const teacherGroups = groupsByTeacherMap.get(tid) ?? [];
            const totalStudents = teacherGroups.reduce((sum, group) => {
                return sum + (studentsByGroupMap.get(String(group.id)) ?? 0);
            }, 0);
            studentsByTeacherMap.set(tid, totalStudents);
        }
        const attendanceAgg = groupIds.length
            ? await index_1.AttendanceRecord.findAll({
                attributes: [
                    [(0, sequelize_1.col)("attendance.group_id"), "group_id"],
                    [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.literal)("*")), "totalRecords"],
                    [
                        (0, sequelize_1.fn)("SUM", (0, sequelize_1.literal)(`CASE WHEN "AttendanceRecord"."status" = 'present' THEN 1 ELSE 0 END`)),
                        "presentRecords",
                    ],
                ],
                include: [
                    {
                        model: index_1.Attendance,
                        as: "attendance",
                        required: true,
                        attributes: [],
                        where: {
                            group_id: { [sequelize_1.Op.in]: groupIds },
                            date: { [sequelize_1.Op.gte]: start, [sequelize_1.Op.lt]: end },
                        },
                    },
                ],
                group: [(0, sequelize_1.col)("attendance.group_id")],
                raw: true,
            })
            : [];
        const attendanceByGroupMap = new Map();
        for (const row of attendanceAgg) {
            const total = Number(row.totalRecords ?? 0);
            const present = Number(row.presentRecords ?? 0);
            const percent = total > 0 ? (present / total) * 100 : 0;
            attendanceByGroupMap.set(String(row.group_id), Number(percent.toFixed(1)));
        }
        const attendanceByTeacherMap = new Map();
        for (const teacher of teachers) {
            const tid = String(teacher.id);
            const teacherGroups = groupsByTeacherMap.get(tid) ?? [];
            if (!teacherGroups.length) {
                attendanceByTeacherMap.set(tid, 0);
                continue;
            }
            const avg = teacherGroups.reduce((sum, group) => {
                return sum + (attendanceByGroupMap.get(String(group.id)) ?? 0);
            }, 0) / teacherGroups.length;
            attendanceByTeacherMap.set(tid, Number(avg.toFixed(1)));
        }
        const lessonsAgg = groupIds.length
            ? await index_1.Attendance.findAll({
                attributes: [
                    "group_id",
                    [(0, sequelize_1.fn)("COUNT", (0, sequelize_1.col)("id")), "lessonCount"],
                ],
                where: {
                    group_id: { [sequelize_1.Op.in]: groupIds },
                    date: { [sequelize_1.Op.gte]: start, [sequelize_1.Op.lt]: end },
                },
                group: ["group_id"],
                raw: true,
            })
            : [];
        const lessonsByGroupMap = new Map();
        for (const row of lessonsAgg) {
            lessonsByGroupMap.set(String(row.group_id), Number(row.lessonCount ?? 0));
        }
        const completedLessonsByTeacherMap = new Map();
        const totalLessonsByTeacherMap = new Map();
        for (const teacher of teachers) {
            const tid = String(teacher.id);
            const teacherGroups = groupsByTeacherMap.get(tid) ?? [];
            const completedLessons = teacherGroups.reduce((sum, group) => {
                return sum + (lessonsByGroupMap.get(String(group.id)) ?? 0);
            }, 0);
            const totalLessonsPlannedForMonth = teacherGroups.reduce((sum, group) => {
                const { start: effectiveStart, end: effectiveEnd } = getEffectiveMonthRangeForGroup(start, end, group.created_at);
                const planned = countLessonsByDaysInRange(String(group.days ?? ""), effectiveStart, effectiveEnd);
                return sum + planned;
            }, 0);
            const totalLessons = Math.max(completedLessons, totalLessonsPlannedForMonth);
            completedLessonsByTeacherMap.set(tid, completedLessons);
            totalLessonsByTeacherMap.set(tid, totalLessons);
        }
        const paymentsAgg = groupIds.length
            ? await index_1.Payment.findAll({
                attributes: [
                    "group_id",
                    [(0, sequelize_1.fn)("COALESCE", (0, sequelize_1.fn)("SUM", (0, sequelize_1.col)("payment_amount")), 0), "revenue"],
                ],
                where: {
                    group_id: { [sequelize_1.Op.in]: groupIds },
                    shouldBeConsideredAsPaid: true,
                    for_which_month: monthNameUz,
                },
                group: ["group_id"],
                raw: true,
            })
            : [];
        const revenueByGroupMap = new Map();
        for (const row of paymentsAgg) {
            revenueByGroupMap.set(String(row.group_id), Number(row.revenue ?? 0));
        }
        const ratingByTeacherMap = new Map();
        for (const teacher of teachers) {
            const tid = String(teacher.id);
            const teacherGroups = groupsByTeacherMap.get(tid) ?? [];
            const attendance = attendanceByTeacherMap.get(tid) ?? 0;
            const completedLessons = completedLessonsByTeacherMap.get(tid) ?? 0;
            const totalLessons = totalLessonsByTeacherMap.get(tid) ?? 0;
            const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
            // temporary rating formula
            const ratingRaw = (attendance * 0.6 + progress * 0.4) / 20; // 0..5
            const rating = Math.min(5, Number(ratingRaw.toFixed(1)));
            ratingByTeacherMap.set(tid, rating);
        }
        function buildSchedule(groups) {
            if (!groups.length)
                return "Jadval biriktirilmagan";
            const uniqueDays = new Set();
            for (const group of groups) {
                if (Array.isArray(group.days)) {
                    group.days.forEach((d) => uniqueDays.add(d));
                }
                else if (typeof group.days === "string" && group.days.trim()) {
                    uniqueDays.add(group.days);
                }
            }
            return uniqueDays.size
                ? Array.from(uniqueDays).join(", ")
                : "Jadval kiritilmagan";
        }
        function buildNextClass(groups) {
            if (!groups.length)
                return "Dars yo'q";
            const sorted = [...groups].sort((a, b) => {
                const aTime = String(a.start_time ?? "");
                const bTime = String(b.start_time ?? "");
                return aTime.localeCompare(bTime);
            });
            const next = sorted[0];
            const subject = next?.group_subject ?? "Noma'lum guruh";
            const time = next?.start_time ?? "Vaqt yo'q";
            return `${subject}/${time.slice(0, 5)}`;
        }
        function parseQualifications(raw) {
            if (!raw)
                return [];
            if (Array.isArray(raw))
                return raw.filter(Boolean);
            if (typeof raw === "string") {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed))
                        return parsed.filter(Boolean);
                }
                catch {
                    return raw
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean);
                }
            }
            return [];
        }
        function getTeacherStatus(attendance, rating) {
            if (attendance < 85 || rating < 4)
                return "warning";
            return "active";
        }
        const rows = teachers.map((teacher) => {
            const plain = typeof teacher.get === "function"
                ? teacher.get({ plain: true })
                : teacher;
            const tid = String(plain.id);
            const teacherGroups = groupsByTeacherMap.get(tid) ?? [];
            const attendance = attendanceByTeacherMap.get(tid) ?? 0;
            const rating = ratingByTeacherMap.get(tid) ?? 0;
            const completedLessons = completedLessonsByTeacherMap.get(tid) ?? 0;
            const totalLessons = totalLessonsByTeacherMap.get(tid) ?? 0;
            const balance = Number(plain.teacherBalance?.[0]?.balance ?? 0);
            const specialtyValue = plain.specialty ||
                plain.subject ||
                teacherGroups[0]?.group_subject ||
                "Yo'nalish kiritilmagan";
            return {
                id: plain.id,
                name: fullName(plain),
                photo: plain.photo ?? plain.img_url ?? null,
                specialty: specialtyValue,
                branch: plain.branch?.name ?? "Noma'lum filial",
                branchId: plain.branch_id ?? null,
                groups: groupCountMap.get(tid) ?? 0,
                students: studentsByTeacherMap.get(tid) ?? 0,
                attendance,
                rating,
                experience: Number(plain.experience ?? 0),
                balance,
                status: getTeacherStatus(attendance, rating),
                qualifications: parseQualifications(plain.qualifications),
                schedule: buildSchedule(teacherGroups),
                nextClass: buildNextClass(teacherGroups),
                completedLessons,
                totalLessons,
                phone: plain.phone_number ?? "",
                email: plain.email ?? "",
            };
        });
        const totalTeachers = rows.length;
        const totalStudents = rows.reduce((sum, row) => sum + row.students, 0);
        const avgAttendance = totalTeachers
            ? Number((rows.reduce((sum, row) => sum + row.attendance, 0) / totalTeachers).toFixed(1))
            : 0;
        const avgRating = totalTeachers
            ? Number((rows.reduce((sum, row) => sum + row.rating, 0) / totalTeachers).toFixed(1))
            : 0;
        const uniqueBranches = [...new Set(rows.map((row) => row.branch).filter(Boolean))];
        const uniqueSpecialties = [...new Set(rows.map((row) => row.specialty).filter(Boolean))];
        return void res.status(200).json((0, apiResponse_1.ok)({
            summary: {
                totalTeachers,
                avgRating,
                avgAttendance,
                totalStudents,
            },
            teachers: rows,
            branches: uniqueBranches,
            specialties: uniqueSpecialties,
            filters: {
                search,
                branchId: branchId || "all",
                specialty: specialty || "all",
                period: {
                    month: monthNameUz,
                    year,
                },
            },
        }, "Teachers analytics"));
    }
    catch (e) {
        next(e);
    }
}
async function getRoomsOccupancyAnalytics(req, res, next) {
    try {
        const whereScope = (0, branch_scope_helper_1.withBranchScope)(req);
        const search = String(req.query.search ?? "").trim();
        const branchId = String(req.query.branchId ?? "").trim();
        const selectedDate = String(req.query.date ?? "").trim() || new Date().toISOString().split("T")[0];
        const roomWhere = { ...whereScope };
        if (branchId && branchId !== "all") {
            roomWhere.branch_id = branchId;
        }
        const rooms = await index_1.Room.findAll({
            where: roomWhere,
            attributes: ["id", "name", "capacity", "branch_id", "created_at"],
            include: [
                {
                    model: index_1.Branch,
                    as: "branch",
                    attributes: ["id", "name"],
                    required: false,
                },
                {
                    model: index_1.Schedule,
                    as: "roomSchedules",
                    required: false,
                    attributes: ["id", "day", "start_time", "end_time", "room_id"],
                    include: [
                        {
                            model: index_1.Group,
                            as: "scheduleGroup",
                            attributes: ["id", "group_subject"],
                            required: false,
                        },
                        {
                            model: index_1.Teacher,
                            as: "teacher",
                            attributes: ["id", "first_name", "last_name"],
                            required: false,
                        },
                    ],
                },
            ],
            order: [["created_at", "DESC"]],
        });
        const rows = rooms
            .map((room) => {
            const plain = typeof room.get === "function"
                ? room.get({ plain: true })
                : room;
            const roomSchedules = Array.isArray(plain.roomSchedules) ? plain.roomSchedules : [];
            const occupancyRate = calcRoomOccupancyPercentFromSchedules(roomSchedules);
            const state = getRoomStateForSelectedDate(roomSchedules, selectedDate);
            return {
                id: plain.id,
                name: plain.name,
                branch: plain.branch?.name ?? "Noma'lum filial",
                branchId: plain.branch_id ?? null,
                capacity: Number(plain.capacity ?? 0),
                status: state.status,
                currentGroup: state.currentGroup,
                teacher: state.teacher,
                time: state.time,
                occupancyRate,
                nextClass: state.nextClass,
            };
        })
            .filter((room) => {
            if (!search)
                return true;
            const q = search.toLowerCase();
            return (String(room.name ?? "").toLowerCase().includes(q) ||
                String(room.branch ?? "").toLowerCase().includes(q) ||
                String(room.currentGroup ?? "").toLowerCase().includes(q) ||
                String(room.teacher ?? "").toLowerCase().includes(q));
        });
        const totalRooms = rows.length;
        const occupiedRooms = rows.filter((r) => r.status === "occupied").length;
        const availableRooms = rows.filter((r) => r.status === "available").length;
        const avgOccupancy = totalRooms
            ? Math.round(rows.reduce((sum, r) => sum + r.occupancyRate, 0) / totalRooms)
            : 0;
        const branchMap = new Map();
        for (const room of rows) {
            const key = room.branch;
            if (!branchMap.has(key)) {
                branchMap.set(key, {
                    branch: room.branch,
                    totalRooms: 0,
                    occupiedRooms: 0,
                    availableRooms: 0,
                    avgOccupancySource: [],
                });
            }
            const item = branchMap.get(key);
            item.totalRooms += 1;
            item.avgOccupancySource.push(room.occupancyRate);
            if (room.status === "occupied") {
                item.occupiedRooms += 1;
            }
            else {
                item.availableRooms += 1;
            }
        }
        const branchStats = Array.from(branchMap.values()).map((item) => ({
            branch: item.branch,
            totalRooms: item.totalRooms,
            occupiedRooms: item.occupiedRooms,
            availableRooms: item.availableRooms,
            avgOccupancy: item.avgOccupancySource.length
                ? Math.round(item.avgOccupancySource.reduce((sum, val) => sum + val, 0) /
                    item.avgOccupancySource.length)
                : 0,
        }));
        const branchMapForFilter = new Map();
        for (const room of rows) {
            if (room.branchId && room.branch) {
                branchMapForFilter.set(String(room.branchId), {
                    id: String(room.branchId),
                    name: room.branch,
                });
            }
        }
        const branches = Array.from(branchMapForFilter.values());
        return void res.status(200).json((0, apiResponse_1.ok)({
            summary: {
                totalRooms,
                occupiedRooms,
                availableRooms,
                avgOccupancy,
            },
            branchStats,
            rooms: rows,
            branches,
            filters: {
                search,
                branchId: branchId || "all",
                selectedDate,
            },
        }, "Rooms occupancy analytics"));
    }
    catch (e) {
        next(e);
    }
}
