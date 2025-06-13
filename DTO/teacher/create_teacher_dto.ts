export interface ICreateTeacherDto {
  first_name: string;
  last_name: string;
  father_name?: string;
  birth_date: string;
  phone_number: string;
  subject: string;
  img_url?: string;
  got_salary_for_this_month: boolean;
  salary_amount: number
}
