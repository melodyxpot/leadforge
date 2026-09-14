import { redirect } from "next/navigation";
import { getCurrentWorkspace } from "@/lib/auth/workspace";

export default async function HomePage() {
  const current = await getCurrentWorkspace();
  redirect(current ? "/overview" : "/login");
}
