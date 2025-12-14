// ==========================
// AUTH PROTECTION
// ==========================
async function checkAuth() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "index.html";
  }
}
checkAuth();

// ==========================
// HELPERS
// ==========================
function todayDate() {
  return new Date().toISOString().split("T")[0];
}

// ==========================
// LOAD TODAY'S SPEND (NOT SUM, SINGLE VALUE)
// ==========================
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

  document.getElementById("todaySpend").innerText = data ? data.amount : 0;
}

// ==========================
// SAVE / OVERWRITE TODAY'S SPEND
// ==========================
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

  // Check if today's entry already exists
  const { data: existing, error: fetchError } = await supabase
    .from("spends")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  let result;

  if (existing && !fetchError) {
    // UPDATE (overwrite)
    result = await supabase
      .from("spends")
      .update({
        amount,
        category,
        mood,
      })
      .eq("id", existing.id);
  } else {
    // INSERT (first entry of the day)
    result = await supabase
      .from("spends")
      .insert([
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
    loadTodaySpend();
  }
}

// ==========================
// LOGOUT
// ==========================
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// ==========================
// INIT
// ==========================
loadTodaySpend();
