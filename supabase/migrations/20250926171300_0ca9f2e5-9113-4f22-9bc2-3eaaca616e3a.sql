-- Mettre à jour l'annonce "Création piscine béton" pour indiquer qu'elle a été publiée sur Facebook
UPDATE announcements 
SET create_facebook_post = true 
WHERE title = 'Création piscine béton';