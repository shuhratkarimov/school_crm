export interface ICreatePaymentDto {
  pupil_id: string;
  payment_amount: number;
  payment_type: string
  received: string
  for_which_month: string,
  for_which_group: string
}
