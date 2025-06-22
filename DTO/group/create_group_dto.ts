export interface ICreateGroupDto {
  group_subject: string;
  days: string; // "DU-CHOR-PAY"
  start_time: string; // "09:00:00"
  end_time: string; // "11:00:00"
  teacher_id: string;
  monthly_fee: number;
  room_id: string;
}