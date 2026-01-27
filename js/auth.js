async function signUp() {
  const email = emailInput();
  const password = passwordInput();
  const status = document.getElementById("authStatus");

  const { error } = await supabase.auth.signUp({ email, password });
  status.innerText = error ? error.message : "Account created. Sign in.";
}

async function signIn() {
  const email = emailInput();
  const password = passwordInput();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) window.location.href = "home.html";
}

function emailInput() {
  return document.getElementById("email").value;
}
function passwordInput() {
  return document.getElementById("password").value;
}
