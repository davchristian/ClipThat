import { AuthScreen } from "@/features/auth/auth-screen";
import { liveMode } from "@/lib/app-mode";
import { supabaseConfigError } from "@/lib/supabase-config";

export default function LoginPage() {
  return (
    <AuthScreen
      mode="login"
      setupError={
        liveMode
          ? supabaseConfigError(
              process.env.NEXT_PUBLIC_SUPABASE_URL,
              process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
            )
          : ""
      }
    />
  );
}
