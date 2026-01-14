import { useState } from "react";
import { supabase } from "../supabase";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });
    if (!error) alert("Check your email for login link");
  };

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) onLogin(session.user);
  });

  return (
    <div>
      <h2>Login</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={signIn}>Send Login Link</button>
    </div>
  );
}
