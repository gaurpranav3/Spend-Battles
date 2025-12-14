/*************************
  AUTH GUARD
*************************/
async function checkAuth() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "/index.html";
  }
}
checkAuth();

/*************************
  DATE HELPERS
*************************/
function todayDate() {
  return new Date().toISOString().split("T")[0];
}

function getMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/*************************
  ENSURE WEEKLY PLAN EXISTS (GOALS)
*************************/
async function ensureWeeklyPlan() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const monday = getMonday().toISOString().split("T")[0];

  const { data } = await supabase
    .from("weekly_plan")
    .select("id")
    .eq("user_id", user.id)
    .eq("week_start", monday)
    .single();

  if (!data) {
    window.location.href = "/weekly.html";
  }
}

/*************************
  LOAD DAILY TARGET (FROM GOAL)
*************************/
async function loadDailyTarget() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return 0;

  const monday = getMonday().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("weekly_plan")
    .select("weekly_spend")
    .eq("user_id", user.id)
    .eq("week_start", monday)
    .single();

  if (error || !data) return 0;

  const dailyTarget = Math.round(data.weekly_spend / 7);
  document.getElementById("dailyTarget").innerText = dailyTarget;
  return dailyTarget;
}

/*************************
  LOAD TODAY'S SPEND (ACTUAL)
*************************/
async function loadTodaySpend(dailyTarget) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const today = todayDate();

  const { data } = await supabase
    .from("spends")
    .select("amount")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const todayAmount = data ? Number(data.amount) : 0;
  document.getElementById("todaySpend").innerText = todayAmount;

  updateProgressBar(todayAmount, dailyTarget);
  roastUser(todayAmount, dailyTarget);
}

/*************************
  SAVE / OVERWRITE TODAY
*************************/
async function saveSpend() {
  const amount = Number(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const mood = document.getElementById("mood").value;
  const status = document.getElementById("saveStatus");

  if (!amount || amount <= 0) {
    status.innerText = "Enter a valid amount";
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const today = todayDate();

  await supabase
    .from("spends")
    .upsert(
      {
        user_id: user.id,
        amount,
        category,
        mood,
        date: today,
      },
      { onConflict: "user_id,date" }
    );

  status.innerText = "Saved successfully ✅";
  document.getElementById("amount").value = "";

  const dailyTarget = await loadDailyTarget();
  await loadTodaySpend(dailyTarget);
  await loadWeekSpend();
}

/*************************
  LOAD THIS WEEK TOTAL (ACTUAL)
*************************/
async function loadWeekSpend() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const monday = getMonday().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("spends")
    .select("amount")
    .eq("user_id", user.id)
    .gte("date", monday);

  if (error) return;

  const total = data.reduce((sum, e) => sum + Number(e.amount), 0);
  document.getElementById("weekSpend").innerText = total;
}

/*************************
  PROGRESS BAR + TEXT
*************************/
function updateProgressBar(todaySpend, dailyTarget) {
  if (!dailyTarget || dailyTarget <= 0) return;

  const percent = Math.min((todaySpend / dailyTarget) * 100, 100);
  const bar = document.getElementById("progressFill");
  const text = document.getElementById("progressText");

  bar.style.width = percent + "%";

  if (todaySpend <= dailyTarget * 0.5) {
    bar.style.background = "#2ecc71";
    text.innerText = "Bro are you even living? 💀";
  } else if (todaySpend <= dailyTarget) {
    bar.style.background = "#27ae60";
    text.innerText = "Control game strong 🧠";
  } else if (todaySpend <= dailyTarget * 1.2) {
    bar.style.background = "#f39c12";
    text.innerText = "Weak discipline 😬";
  } else {
    bar.style.background = "#e74c3c";
    text.innerText = "Bro who hurt you? 💸🔥";
  }
}

/*************************
  ROAST COPY
*************************/
function roastUser(today, target) {
  const title = document.getElementById("roastTitle");
  const sub = document.getElementById("roastSub");

  if (!today) {
    title.innerText = "Don’t run. Log it.";
    sub.innerText = "Ignoring it doesn’t make it cheaper.";
    return;
  }

  if (today <= target * 0.5) {
    title.innerText = "Bro are you even living? 💀";
    sub.innerText = "Monk-level spending today.";
  } else if (today <= target) {
    title.innerText = "Control game strong 🧠";
    sub.innerText = "You stayed under the line.";
  } else if (today <= target * 1.2) {
    title.innerText = "Hmm… weak discipline 😬";
    sub.innerText = "Recoverable. Don’t spiral.";
  } else {
    title.innerText = "Bro who hurt you? 💸🔥";
    sub.innerText = "This was emotional damage.";
  }
}

/*************************
  LOGOUT
*************************/
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/index.html";
}

/*************************
  INIT
*************************/
(async function init() {
  await ensureWeeklyPlan();
  const dailyTarget = await loadDailyTarget();
  await loadTodaySpend(dailyTarget);
  await loadWeekSpend();
})();
