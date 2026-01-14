import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";

export default function NotesTable({ user }) {
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("date, note")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error loading notes:", error);
        return;
      }

      setRows(data || []);
    } catch (err) {
      console.error("Unexpected error loading notes:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const saveNote = async () => {
    if (!note.trim() || !user?.id) return;
    if (saving) return;

    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const noteText = note.trim();

    try {
      // First, get existing record to preserve productivity
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("productivity")
        .eq("user_id", user.id)
        .eq("date", today)
        .single();

      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          {
            user_id: user.id,
            date: today,
            note: noteText,
            productivity: existing?.productivity ?? 0,
          },
          {
            onConflict: "user_id,date",
          }
        );

      if (error) {
        console.error("Error saving note:", error);
        alert("Error saving note: " + error.message);
        return;
      }

      setNote("");
      await load();
    } catch (err) {
      console.error("Unexpected error saving note:", err);
      alert("Unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
  };

  return (
    <div className="notes-box">
      <h3>Notes</h3>
      <div className="notes-input-container">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Today's note"
          disabled={saving}
        />
        <button onClick={saveNote} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="2" style={{ textAlign: "center", color: "#8b949e" }}>
                No notes yet
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.date}>
                <td>{r.date}</td>
                <td>{r.note || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
