
import * as z from "zod";
import { Role } from "@/types/auth";

// Define the form schema with proper typing
export const formSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  // Remove 'user' from the enum since it's not used in the form
  role: z.enum(["admin", "client"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
  clientId: z.string().optional(),
  wordpressConfigId: z.string().optional(),
  wpConfigIds: z.array(z.string()).default([]),
});

export type FormSchema = z.infer<typeof formSchema>;
