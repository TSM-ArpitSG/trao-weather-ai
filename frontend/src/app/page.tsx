// Root page for Trao Weather AI.
// Always redirects to /dashboard; authentication is handled there.
// Code written by Arpit Singh.
import { redirect } from "next/navigation";

export default function Home() {
  // We can't read localStorage on the server, and the dashboard already
  // redirects unauthenticated users back to /login on mount.
  // So we always send users to /dashboard here; unauthenticated users will be
  // redirected to /login by the dashboard page logic.
  redirect("/dashboard");
}
