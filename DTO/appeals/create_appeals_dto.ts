export interface ICreateAppealsDTO {
    pupil_id: string;
    message: string;
    telegram_user_id: bigint;
    is_seen: Boolean;
    is_answered: Boolean;
    answer?: string
}