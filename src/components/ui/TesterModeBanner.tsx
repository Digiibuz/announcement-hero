import { AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const TesterModeBanner = () => {
  const { isTester } = useAuth();

  if (!isTester) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <AlertCircle className="w-4 h-4" />
      <span>
        MODE TESTEUR - Les publications sont simulées et n'appellent pas les APIs externes
      </span>
    </div>
  );
};
