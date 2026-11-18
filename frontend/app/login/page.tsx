import { Suspense } from "react";
import { AuthForm } from "@/components/authform";

export const metadata = { title: "Sign in — AI Agency OS" };

export default function LoginPage() {
  return (
    <Suspense>
      <AuthForm mode="login" />
    </Suspense>
  );
}
