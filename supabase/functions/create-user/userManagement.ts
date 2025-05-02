
/**
 * User management utilities for the create-user function
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { RequestData, ProfileData } from "./types.ts";
import { logger } from "./logger.ts";

export async function findExistingUser(supabaseAdmin: any, email: string) {
  logger.log("Vérification si l'utilisateur existe dans auth.users:", email);
  try {
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers({
      filter: {
        email: email,
      },
    });

    if (searchError) {
      logger.log("Erreur lors de la recherche d'utilisateurs existants:", searchError.message);
      throw searchError;
    }

    logger.log("Structure de existingUsers:", Object.keys(existingUsers || {}));
    logger.log("Type de existingUsers:", typeof existingUsers);
    logger.log("existingUsers.users existe:", existingUsers && Array.isArray(existingUsers.users));
    logger.log("Longueur de existingUsers.users:", existingUsers?.users?.length || 0);
    
    if (existingUsers?.users) {
      for (let i = 0; i < existingUsers.users.length; i++) {
        logger.log(`User #${i + 1}:`, JSON.stringify(existingUsers.users[i], null, 2));
      }
    }

    let existingUser = null;
    let isPartiallyCreated = false;
    
    // Vérification explicite que l'email correspond
    if (existingUsers && existingUsers.users && existingUsers.users.length > 0) {
      for (const user of existingUsers.users) {
        if (user.email === email) {
          logger.log("L'utilisateur existe déjà dans auth.users:", email, "ID:", user.id);
          existingUser = user;
          
          // Check if the user exists in the profiles table
          const { data: existingProfiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', existingUser.id);
            
          if (profilesError) {
            logger.error("Erreur lors de la vérification du profil existant:", profilesError);
          }
          
          logger.log("Résultat de la recherche dans profiles:", JSON.stringify(existingProfiles, null, 2));
          
          if (existingProfiles && existingProfiles.length > 0) {
            logger.log("L'utilisateur existe également dans la table profiles:", JSON.stringify(existingProfiles, null, 2));
            return { existingUser, isPartiallyCreated: false, profileExists: true };
          } else {
            logger.log("L'utilisateur existe dans auth.users mais PAS dans la table profiles. Tentative de réparation.");
            isPartiallyCreated = true;
            return { existingUser, isPartiallyCreated, profileExists: false };
          }
        }
      }
    }
    
    // Check if the email exists in the profiles table but not in auth.users
    if (!isPartiallyCreated && !existingUser) {
      logger.log("Vérification si l'email existe dans la table profiles:", email);
      const { data: existingProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email);
        
      if (profilesError) {
        logger.error("Erreur lors de la vérification du profil existant:", profilesError);
        throw profilesError;
      }
      
      logger.log("Résultat de la recherche dans profiles par email:", JSON.stringify(existingProfiles, null, 2));
      
      if (existingProfiles && existingProfiles.length > 0) {
        logger.log("L'email existe déjà dans la table profiles mais pas dans auth.users:", JSON.stringify(existingProfiles, null, 2));
        return { 
          existingUser: null, 
          isPartiallyCreated: false, 
          profileExists: true, 
          profileId: existingProfiles[0].id
        };
      }
    }
    
    return { existingUser: null, isPartiallyCreated: false, profileExists: false };
  } catch (error) {
    logger.error("Erreur lors de la vérification d'utilisateur existant:", error);
    throw error;
  }
}

export async function createNewUser(supabaseAdmin: any, userData: RequestData) {
  logger.log("Création d'un nouvel utilisateur dans auth.users:", userData.email);
  try {
    const createUserData = {
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role,
      },
    };
    logger.log("Données pour création d'utilisateur:", JSON.stringify(createUserData, null, 2));
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser(createUserData);

    if (error) {
      logger.log("Erreur lors de la création de l'utilisateur:", error.message);
      throw error;
    }
    
    logger.log("Utilisateur créé avec succès dans auth:", data.user.id);
    logger.log("Détails de l'utilisateur créé:", JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    logger.error("Erreur lors de la création de l'utilisateur:", error);
    throw error;
  }
}

export async function createOrUpdateProfile(
  supabaseAdmin: any, 
  userId: string, 
  userData: RequestData
) {
  logger.log("Création/mise à jour du profil pour l'utilisateur:", userId);
  
  // Handle WordPress config ID properly
  let wordpress_config_id = null;
  if (userData.role === "client" && userData.wordpressConfigId && 
      userData.wordpressConfigId !== "" && userData.wordpressConfigId !== "none") {
    wordpress_config_id = userData.wordpressConfigId;
    logger.log("WordPress config ID défini:", wordpress_config_id);
  } else {
    logger.log("Pas de WordPress config ID ou valeur invalide:", userData.wordpressConfigId);
  }
  
  // Check if profile already exists
  logger.log("Vérification si le profil existe déjà pour l'ID:", userId);
  const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();
  
  if (profileCheckError && profileCheckError.code !== 'PGRST116') {  // PGRST116 = not found
    logger.error("Erreur lors de la vérification du profil:", profileCheckError);
  }
  
  logger.log("Résultat de la vérification de profil:", JSON.stringify(existingProfile, null, 2));
  
  if (existingProfile) {
    logger.log("Le profil existe déjà, mise à jour:", existingProfile.id);
    const profileData: ProfileData = {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      wordpress_config_id: wordpress_config_id,
      updated_at: new Date()
    };
    
    logger.log("Données de mise à jour du profil:", JSON.stringify(profileData, null, 2));
    
    const { error: updateError, data: updateResult } = await supabaseAdmin
      .from('profiles')
      .update(profileData)
      .eq('id', userId);

    if (updateError) {
      logger.error("Erreur lors de la mise à jour du profil:", updateError);
      throw updateError;
    }
    
    logger.log("Résultat de la mise à jour:", JSON.stringify(updateResult, null, 2));
    return updateResult;
  } else {
    logger.log("Création d'un nouveau profil");
    const profileData: ProfileData = {
      id: userId,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      wordpress_config_id: wordpress_config_id,
    };
    
    logger.log("Données de création du profil:", JSON.stringify(profileData, null, 2));
    
    const { error: insertError, data: insertResult } = await supabaseAdmin
      .from('profiles')
      .insert(profileData);

    if (insertError) {
      logger.error("Erreur lors de la création du profil:", insertError);
      throw insertError;
    }
    
    logger.log("Résultat de l'insertion:", JSON.stringify(insertResult, null, 2));
    return insertResult;
  }
}
