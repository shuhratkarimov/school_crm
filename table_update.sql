UPDATE users 
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL 
  AND role NOT IN ('superadmin','director');

-- Students
UPDATE students 
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Teachers
UPDATE teachers 
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Groups
UPDATE groups 
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Payments
UPDATE payments 
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Expenses
UPDATE expenses 
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Notes
UPDATE notes 
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- New Students
UPDATE new_students
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Registration Links
UPDATE registration_links
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Rooms
UPDATE rooms
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Reserve Students
UPDATE reserve_students
SET branch_id = '52044690-5f2f-4d76-a28f-f8096583f240'
WHERE branch_id IS NULL;

-- Tekshirish
SELECT branch_id, COUNT(*) FROM users GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM students GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM teachers GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM groups GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM payments GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM expenses GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM notes GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM new_students GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM registration_links GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM rooms GROUP BY branch_id;
SELECT branch_id, COUNT(*) FROM reserve_students GROUP BY branch_id;