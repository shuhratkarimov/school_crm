export interface ICreatePaymentDto {
  pupil_id: string;
  payment_amount: number;
  payment_type: string;
  received: string;
  for_which_month: string;
  group_id: string;
  comment?: string;
  shouldBeConsideredAsPaid?: boolean;
}
