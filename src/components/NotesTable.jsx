import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export default function NotesTable({ user }) {
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("daily_logs")
      .select("date, note")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    setRows(data || []);
  };

  const saveNote = async () => {
    const today = new Date().toISOString().slice(0, 10);

    await supabase.from("daily_logs").upsert({
      user_id: user.id,
      date: today,
      note,
      productivity: 1,
    });

    setNote("");
    load();
  };

  return (
    <div>
    <div className="notes-box">
      <h3>Notes</h3>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Today's note"
      />
      <button onClick={saveNote}>Save</button>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.date}>
              <td>{r.date}</td>
              <td>{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
