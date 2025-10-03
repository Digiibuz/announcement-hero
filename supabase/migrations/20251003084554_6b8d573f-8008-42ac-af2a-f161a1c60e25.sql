-- Ajouter un champ pour les instructions spécifiques à l'IA dans la table announcements
ALTER TABLE announcements 
ADD COLUMN ai_instructions TEXT;

COMMENT ON COLUMN announcements.ai_instructions IS 'Instructions spécifiques données à l''IA pour personnaliser la génération de contenu pour cette annonce';