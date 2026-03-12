type BulkJobProgress = {
    jobId: string;
    type: "delete_reserve_students_bulk" | "approve_reserve_students_bulk" | "import_students";
    status: "pending" | "running" | "done" | "error";
    total: number;
    processed: number;
    percent: number;
    successCount: number;
    failedCount: number;
    message: string;
    errors: string[];
    createdAt: number;
  };
  
  const bulkJobs = new Map<string, BulkJobProgress>();
  
  export const createBulkJob = (
    jobId: string,
    type: BulkJobProgress["type"],
    total: number
  ) => {
    const job: BulkJobProgress = {
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
  
  export const getBulkJob = (jobId: string) => {
    return bulkJobs.get(jobId) || null;
  };
  
  export const updateBulkJob = (
    jobId: string,
    patch: Partial<BulkJobProgress>
  ) => {
    const job = bulkJobs.get(jobId);
    if (!job) return null;
  
    const updated = { ...job, ...patch };
    bulkJobs.set(jobId, updated);
    return updated;
  };
  
  export const removeBulkJob = (jobId: string) => {
    bulkJobs.delete(jobId);
  };
  
  setInterval(() => {
    const now = Date.now();
    for (const [jobId, job] of bulkJobs.entries()) {
      if (now - job.createdAt > 1000 * 60 * 30) {
        bulkJobs.delete(jobId);
      }
    }
  }, 1000 * 60 * 5);