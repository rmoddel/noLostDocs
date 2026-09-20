import { PasswordRecoveryForm } from "@/components/auth/PasswordRecoveryForm";
import { requireUser } from "@/lib/auth/requireUser";
export default async function ResetPasswordPage() { await requireUser("/reset-password"); return <PasswordRecoveryForm reset />; }
