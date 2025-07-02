
-- Ajouter le champ additionalMedias à la table announcements
ALTER TABLE public.announcements 
ADD COLUMN additional_medias TEXT[] DEFAULT '{}';

-- Mettre à jour le commentaire pour clarifier le nouveau champ
COMMENT ON COLUMN public.announcements.additional_medias IS 'Médias additionnels (photos et vidéos) pour l''annonce';
