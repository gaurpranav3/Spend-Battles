function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

async function saveWeekly() {
  const weeklySpend = Number(document.getElementById("weeklySpend").value);
  const status = document.getElementById("status");

  if (!weeklySpend || weeklySpend <= 0) {
    status.innerText = "Enter a valid weekly amount";
    return;
  }

  status.innerText = "Locking goal...";

  const { data } = await window.db.auth.getUser();
  const user = data.user;

  if (!user) {
    status.innerText = "User not logged in";
    return;
  }

  const monday = getMonday();

  const { error } = await window.db
    .from("weekly_plan")
    .upsert({
      user_id: user.id,
      week_start: monday,
      weekly_spend: weeklySpend
    });

  if (error) {
    status.innerText = error.message;
  } else {
    window.location.href = "home.html";
  }
}
