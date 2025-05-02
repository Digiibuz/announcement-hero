
import { createContext } from "react";
import { AuthContextType } from "@/types/auth";

// Create the context with undefined as default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;
