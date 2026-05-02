"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeBulkJob = exports.updateBulkJob = exports.getBulkJob = exports.createBulkJob = void 0;
const bulkJobs = new Map();
const createBulkJob = (jobId, type, total) => {
    const job = {
        jobId,
        type,
        status: "pending",
        total,
        processed: 0,
        percent: 0,
        successCount: 0,
        failedCount: 0,
        message: "Jarayon boshlandi",
        errors: [],
        createdAt: Date.now(),
    };
    bulkJobs.set(jobId, job);
    return job;
};
exports.createBulkJob = createBulkJob;
const getBulkJob = (jobId) => {
    return bulkJobs.get(jobId) || null;
};
exports.getBulkJob = getBulkJob;
const updateBulkJob = (jobId, patch) => {
    const job = bulkJobs.get(jobId);
    if (!job)
        return null;
    const updated = { ...job, ...patch };
    bulkJobs.set(jobId, updated);
    return updated;
};
exports.updateBulkJob = updateBulkJob;
const removeBulkJob = (jobId) => {
    bulkJobs.delete(jobId);
};
exports.removeBulkJob = removeBulkJob;
setInterval(() => {
    const now = Date.now();
    for (const [jobId, job] of bulkJobs.entries()) {
        if (now - job.createdAt > 1000 * 60 * 30) {
            bulkJobs.delete(jobId);
        }
    }
}, 1000 * 60 * 5);
