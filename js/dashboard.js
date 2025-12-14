// 1️⃣ Protect page: user logged in hona chahiye
async function checkAuth() {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    window.location.href = "index.html";
  }
}

checkAuth();

// 2️⃣ Helper: aaj ki date (YYYY-MM-DD)
function todayDate() {
  return new Date().toISOString().split("T")[0];
}

// 3️⃣ Aaj ka total spend nikaal ke dikhao
async function loadTodaySpend() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return;

  const today = todayDate();

  const { data, error } = await supabase
    .from("spends")
    .select("amount")
    .eq("user_id", user.id)
    .eq("date", today);

  if (error) {
    console.error(error);
    return;
  }

  const total = data.reduce((sum, row) => sum + row.amount, 0);
  document.getElementById("todaySpend").innerText = total;
}

// 4️⃣ Save today’s spend
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

  const { error } = await supabase.from("spends").insert([
    {
      user_id: user.id,
      amount,
      category,
      mood,
      date: today
    }
  ]);

  if (error) {
    status.innerText = error.message;
  } else {
    status.innerText = "Saved successfully ✅";
    loadTodaySpend(); // refresh total
  }
}

// 5️⃣ Logout
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "index.html";
}

// Init
loadTodaySpend();
