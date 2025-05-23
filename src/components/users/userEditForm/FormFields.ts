
import * as z from "zod";
import { Role } from "@/types/auth";

// Make sure FormSchema aligns with our Role type
export const formSchema = z.object({
  email: z.string().email({
    message: "Email invalide"
  }),
  name: z.string().min(2, {
    message: "Le nom doit comporter au moins 2 caractères"
  }),
  role: z.enum(['admin', 'editor', 'client'] as const),
  clientId: z.string().optional(),
  wordpressConfigId: z.string().optional(),
  wpConfigIds: z.array(z.string()).optional(),
});

export type FormSchema = z.infer<typeof formSchema>;
