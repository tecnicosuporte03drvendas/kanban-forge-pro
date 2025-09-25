-- Update all existing cellular numbers to include 55 prefix and set default for empty ones
UPDATE usuarios 
SET celular = CASE 
  WHEN celular = '' OR celular IS NULL THEN '5521982534276'
  WHEN LENGTH(celular) = 11 AND NOT celular LIKE '55%' THEN CONCAT('55', celular)
  WHEN LENGTH(celular) = 13 AND celular LIKE '55%' THEN celular
  ELSE '5521982534276'
END;

-- Ensure all cellular numbers have the correct format going forward
CREATE OR REPLACE FUNCTION validate_celular_format()
RETURNS TRIGGER AS $$
BEGIN
  -- If celular is empty or null, set default
  IF NEW.celular = '' OR NEW.celular IS NULL THEN
    NEW.celular = '5521982534276';
  -- If it's 11 digits and doesn't start with 55, prepend 55
  ELSIF LENGTH(NEW.celular) = 11 AND NOT NEW.celular LIKE '55%' THEN
    NEW.celular = CONCAT('55', NEW.celular);
  -- If it's not 13 digits or doesn't start with 55, set default
  ELSIF LENGTH(NEW.celular) != 13 OR NOT NEW.celular LIKE '55%' THEN
    NEW.celular = '5521982534276';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for usuarios table
DROP TRIGGER IF EXISTS validate_celular_trigger ON usuarios;
CREATE TRIGGER validate_celular_trigger
  BEFORE INSERT OR UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION validate_celular_format();