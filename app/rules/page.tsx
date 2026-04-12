import { redirect } from "next/navigation";

/** Legacy `/rules` (and `#alerts`) — Risk Manager is the single alerts/rules hub. */
export default function RulesLegacyRedirect() {
  redirect("/app/risk-manager");
}
