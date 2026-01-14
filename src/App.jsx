import { useState } from "react";
import Auth from "./components/Auth";
import Heatmap from "./components/Heatmap";
import NotesTable from "./components/NotesTable";
import "./App.css";


function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <Auth onLogin={setUser} />;
  }

  return (
    <div className="app">
      <h1>My Progress Tracker</h1>
      <Heatmap user={user} />
      <NotesTable user={user} />
    </div>
  );
}

export default App;
