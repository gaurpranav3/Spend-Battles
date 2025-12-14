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
  ENSURE WEEKLY PLAN EXISTS
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
  LOAD DAILY TARGET
*************************/
async function loadDailyTarget() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const monday = getMonday().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("weekly_plan")
    .select("weekly_spend")
    .eq("user_id", user.id)
    .eq("week_start", monday)
    .single();

  if (error || !data) return;

  const daily = Math.round(data.weekly_spend / 7);
  document.getElementById("dailyTarget").innerText = daily;
}

/*************************
  LOAD TODAY'S SPEND
*************************/
async function loadTodaySpend() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const today = todayDate();

  const { data, error } = await supabase
    .from("spends")
    .select("amount")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error(error);
    return;
  }

  const todayAmount = data ? Number(data.amount) : 0;
  document.getElementById("todaySpend").innerText = todayAmount;

  const dailyTarget = Number(
    document.getElementById("dailyTarget").innerText
  );

  updateProgressBar(todayAmount, dailyTarget);
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

  const { data: existing, error: fetchError } = await supabase
    .from("spends")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  let result;

  if (existing && !fetchError) {
    result = await supabase
      .from("spends")
      .update({ amount, category, mood })
      .eq("id", existing.id);
  } else {
    result = await supabase.from("spends").insert([
      {
        user_id: user.id,
        amount,
        category,
        mood,
        date: today,
      },
    ]);
  }

  if (result.error) {
    status.innerText = result.error.message;
  } else {
    status.innerText = "Saved successfully ✅";
    document.getElementById("amount").value = "";
    loadTodaySpend();
    loadWeekSpend();
  }
}

/*************************
  LOAD THIS WEEK TOTAL
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

  if (error) {
    console.error(error);
    return;
  }

  const total = data.reduce((sum, e) => sum + Number(e.amount), 0);
  document.getElementById("weekSpend").innerText = total;
}

/*************************
  PROGRESS BAR
*************************/
function updateProgressBar(todaySpend, dailyTarget) {
  if (!dailyTarget || dailyTarget <= 0) return;

  const percent = Math.min((todaySpend / dailyTarget) * 100, 100);
  const bar = document.getElementById("progressFill");
  const text = document.getElementById("progressText");

  bar.style.width = percent + "%";

  if (todaySpend <= dailyTarget * 0.7) {
    bar.style.background = "#2ecc71";
    text.innerText = "Good control today 🟢";
  } else if (todaySpend <= dailyTarget) {
    bar.style.background = "#f1c40f";
    text.innerText = "Close to target 🟡";
  } else {
    bar.style.background = "#e74c3c";
    text.innerText = "Over target 🔴";
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
  await loadDailyTarget();
  await loadTodaySpend();
  await loadWeekSpend();
})();
