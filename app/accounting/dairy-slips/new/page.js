import { redirect } from "next/navigation";

export default function NewDairySlipPage() {
  redirect("/nondi/dudh?date=today");
}
