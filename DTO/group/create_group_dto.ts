export interface ICreateGroupDto {
  group_subject: string;
  days: string;
  start_time: string;
  end_time: string;
  teacher_id: string;
  teacher_phone?: string;
  img_url?: string;
  students_amount: number;
  paid_students_amount: number;
}
