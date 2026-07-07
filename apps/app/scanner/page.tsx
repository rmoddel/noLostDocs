import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireUser";

export default async function ScannerPage() {
  await requireUser("/scanner");
  redirect("/scan");
}
