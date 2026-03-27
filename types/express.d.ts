export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        first_name: string;
        branch_id: string;
      };

      teacher?: {
        id: string;
      };

      scope?: {
        branchIds: string[];
        all?: boolean;
      };

      actor?: {
        id: string;
      };

      actorType?: 'teacher' | 'user';
    }
  }
}