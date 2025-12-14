function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

async function saveWeeklyPlan() {
  const spend = Number(document.getElementById("weeklySpend").value);
  const save = Number(document.getElementById("weeklySave").value);
  const status = document.getElementById("planStatus");

  if (!spend || spend <= 0) {
    status.innerText = "Enter a valid weekly spend";
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const monday = getMonday().toISOString().split("T")[0];

  const { error } = await supabase.from("weekly_plan").insert([
    {
      user_id: user.id,
      week_start: monday,
      weekly_spend: spend,
      weekly_save: save || 0,
    },
  ]);

  if (error) {
    status.innerText = error.message;
  } else {
    window.location.href = "/home.html";
  }
}
