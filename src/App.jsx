import { useState, useEffect } from "react";
import Auth from "./components/Auth";
import Heatmap from "./components/Heatmap";
import NotesTable from "./components/NotesTable";
import { supabase } from "./supabase";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="app">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo-container">
          <svg className="logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="60" height="60" rx="8" fill="#26a641" />
            <path d="M 35 50 L 45 60 L 65 40" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1>Progress Tracker</h1>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>
      <Heatmap user={user} />
      <NotesTable user={user} />
    </div>
  );
}

export default App;
