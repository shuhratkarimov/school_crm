export class CreateTestDto {
    group_id: string | undefined;
    test_number: number | undefined;
    test_type: string | undefined;
    total_students: number | undefined;
    attended_students: number | undefined;
    average_score: number | undefined;
    results?: any;
}
