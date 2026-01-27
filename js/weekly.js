import { getMonday } from "./utils.js";

async function saveWeekly() {
  const weeklySpend = Number(document.getElementById("weeklySpend").value);
  const status = document.getElementById("status");

  if (!weeklySpend || weeklySpend <= 0) {
    status.innerText = "Enter valid amount";
    return;
  }

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const monday = getMonday();

  const { error } = await supabase.from("weekly_plan").upsert({
    user_id: user.id,
    week_start: monday,
    weekly_spend: weeklySpend
  });

  if (error) status.innerText = error.message;
  else window.location.href = "home.html";
}

window.saveWeekly = saveWeekly;
