// js/auth.js

async function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("authStatus");

  status.innerText = "Creating account...";

  const { error } = await sb.auth.signUp({ email, password });

  if (error) {
    status.innerText = error.message;
    return;
  }

  status.innerText = "Account created. You can sign in.";
}

async function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const status = document.getElementById("authStatus");

  status.innerText = "Signing in...";

  const { error } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    status.innerText = error.message;
    return;
  }

  window.location.href = "home.html";
}
