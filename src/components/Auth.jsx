import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import "./Auth.css";

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) onLogin(session.user);
    });

    return () => subscription.unsubscribe();
  }, [onLogin]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      if (data.user && data.session) {
        // User is immediately authenticated (email confirmation disabled in Supabase)
        setMessage("Account created successfully!");
      } else {
        // Email confirmation required
        setMessage("Please check your email to confirm your account before signing in.");
      }
    }
    setLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
    }
    setLoading(false);
  };

  const handleOTPLogin = async () => {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for login link");
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isSignUp ? "Sign Up" : "Login"}</h2>
        <form onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          {message && <div className="auth-message">{message}</div>}
          <button type="submit" disabled={loading}>
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <div className="auth-divider">or</div>
        <button onClick={handleOTPLogin} disabled={loading || !email} className="auth-otp-button">
          Send Magic Link
        </button>
        <button
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage("");
          }}
          className="auth-toggle"
          disabled={loading}
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </button>
        {isSignUp && (
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#8b949e", textAlign: "center" }}>
            Note: If email confirmation is enabled, check your email after signing up.
          </div>
        )}
      </div>
    </div>
  );
}
