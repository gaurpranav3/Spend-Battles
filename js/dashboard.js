import { todayDate, getMonday } from "./utils.js";

async function checkAuth() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) window.location.href = "index.html";
}
checkAuth();

async function ensureWeekly() {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const monday = getMonday();

  const { data: plan } = await supabase
    .from("weekly_plan")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", monday)
    .single();

  if (!plan) window.location.href = "weekly.html";
  return plan.weekly_spend;
}

async function loadData() {
  const weeklySpend = await ensureWeekly();
  const dailyLimit = Math.round(weeklySpend / 7);
  document.getElementById("dailyLimit").innerText = dailyLimit;

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const today = todayDate();
  const monday = getMonday();

  const { data: todayData } = await supabase
    .from("spends")
    .select("amount")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const todayAmt = todayData ? todayData.amount : 0;
  document.getElementById("todaySpend").innerText = todayAmt;

  const { data: weekData } = await supabase
    .from("spends")
    .select("amount")
    .eq("user_id", user.id)
    .gte("date", monday);

  const weekTotal = weekData.reduce((s, x) => s + x.amount, 0);
  document.getElementById("weekSpend").innerText = weekTotal;

  const status = document.getElementById("statusText");
  status.innerText =
    todayAmt <= dailyLimit
      ? "Under control 🟢"
      : "Out of control 🔥";
}

async function saveSpend() {
  const amount = Number(document.getElementById("amount").value);
  if (!amount) return;

  const { data } = await supabase.auth.getUser();
  const user = data.user;

  await supabase.from("spends").upsert({
    user_id: user.id,
    date: todayDate(),
    amount
  });

  document.getElementById("amount").value = "";
  loadData();
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

window.saveSpend = saveSpend;
window.logout = logout;

loadData();
