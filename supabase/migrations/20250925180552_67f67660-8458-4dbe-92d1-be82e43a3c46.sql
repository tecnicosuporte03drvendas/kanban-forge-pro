-- Fix the search_path security issue for the validate_celular_format function
CREATE OR REPLACE FUNCTION validate_celular_format()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;