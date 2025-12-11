ALTER TABLE users_customer 
ALTER COLUMN status TYPE boolean 
USING CASE 
    WHEN status IN ('active', 'enabled', 'true', '1') THEN true
    ELSE false
END;