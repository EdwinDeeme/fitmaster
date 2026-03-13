-- Actualizar el SUPER_ADMIN existente para que no tenga gymId
UPDATE users 
SET gym_id = NULL 
WHERE role = 'SUPER_ADMIN' AND email = 'superadmin@fitmaster.com';
