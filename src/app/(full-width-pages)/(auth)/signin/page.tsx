import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rayo SignIn Page ",
  description: "This is Rayo Signin Page Rayo ",
};

export default function SignIn() {
  return <SignInForm />;
}
