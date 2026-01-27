function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split("T")[0];
}

async function checkAuth() {
  const { data } = await window.db.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
  }
}

async function ensureWeekly() {
  const { data } = await window.db.auth.getUser();
  const user = data.user;
  const monday = getMonday();

  const { data: plan } = await window.db
    .from("weekly_plan")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", monday)
    .single();

  if (!plan) {
    window.location.href = "weekly.html";
    return null;
  }

  return plan.weekly_spend;
}

async function loadData() {
  const weeklySpend = await ensureWeekly();
  if (!weeklySpend) return;

  const dailyLimit = Math.round(weeklySpend / 7);
  document.getElementById("dailyLimit").innerText = dailyLimit;

  const { data } = await window.db.auth.getUser();
  const user = data.user;

  const today = todayDate();
  const monday = getMonday();

  const { data: todayData } = await window.db
    .from("spends")
    .select("amount")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const todayAmt = todayData ? todayData.amount : 0;
  document.getElementById("todaySpend").innerText = todayAmt;

  const { data: weekData } = await window.db
    .from("spends")
    .select("amount")
    .eq("user_id", user.id)
    .gte("date", monday);

  const weekTotal = weekData.reduce((s, x) => s + x.amount, 0);
  document.getElementById("weekSpend").innerText = weekTotal;
}

async function saveSpend() {
  const amount = Number(document.getElementById("amount").value);
  if (!amount || amount <= 0) return;

  const { data } = await window.db.auth.getUser();
  const user = data.user;

  await window.db.from("spends").upsert({
    user_id: user.id,
    date: todayDate(),
    amount,
  });

  document.getElementById("amount").value = "";
  loadData();
}

async function logout() {
  await window.db.auth.signOut();
  window.location.href = "index.html";
}

window.saveSpend = saveSpend;
window.logout = logout;

checkAuth().then(loadData);
