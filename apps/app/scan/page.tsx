import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";

export default async function ScanPage() {
  await requireUser("/dashboard?scan=open");
  redirect("/dashboard?scan=open");
}
