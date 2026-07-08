import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";

export default async function ScannerPage() {
  await requireUser("/dashboard?scan=open");
  redirect("/dashboard?scan=open");
}
