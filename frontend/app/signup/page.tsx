import { Suspense } from "react";
import { AuthForm } from "@/components/authform";

export const metadata = { title: "Create account — AI Agency OS" };

export default function SignupPage() {
  return (
    <Suspense>
      <AuthForm mode="signup" />
    </Suspense>
  );
}
