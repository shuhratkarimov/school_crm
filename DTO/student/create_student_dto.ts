export interface ICreateStudentDto {
    first_name: string;
    last_name: string;
    father_name?: string;
    mother_name?: string;
    birth_date: string;
    phone_number?: string;
    group_id: string;
    teacher_id: string;
    paid_for_this_month: boolean;
    parents_phone_number?: string;
    telegram_user_id?: number;
    came_in_school?: string;
    img_url?: string;
    left_school?: string;
  }