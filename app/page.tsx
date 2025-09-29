import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect directly to admin login
  redirect("/admin/login");
}
