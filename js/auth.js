async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("authStatus");

  status.innerText = "Creating account...";

  const { error } = await supabaseClient.auth.signUp({
    email,
    password
  });

  if (error) {
    status.innerText = error.message;
  } else {
    status.innerText = "Account created. Check your email 📩";
  }
}

async function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("authStatus");

  status.innerText = "Signing in...";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    status.innerText = error.message;
  } else {
    window.location.href = "home.html";
  }
}
