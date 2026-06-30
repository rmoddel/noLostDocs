import { requireUser } from "@/lib/auth/requireUser";
import { redirect } from "next/navigation";

export default async function ScanPage() {
  await requireUser("/scan");
  redirect("/dashboard#scan");
}
