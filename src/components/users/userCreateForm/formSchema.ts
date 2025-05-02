
import * as z from "zod";

export const userCreateFormSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  role: z.enum(["admin", "client"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
  wordpressConfigId: z.string().optional(),
});

export type UserCreateFormValues = z.infer<typeof userCreateFormSchema>;
