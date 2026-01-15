import { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import { formatDateIST, getTodayIST, isPastDate } from "../utils/dateUtils";

export default function NotesTable({ user }) {
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("date, note")
        .eq("user_id", user.id)
        .not("note", "is", null)
        .order("date", { ascending: true });

      if (error) {
        console.error("Error loading notes:", error);
        return;
      }

      // Filter out empty notes
      const filteredData = (data || []).filter((r) => r.note && r.note.trim() !== "");
      setRows(filteredData);
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
    if (note.trim().length > 250) {
      alert("Note cannot exceed 250 characters");
      return;
    }

    setSaving(true);
    const dateToUse = selectedDate || formatDateIST(getTodayIST());
    const noteText = note.trim();

    // Prevent saving notes for future dates
    if (!isPastDate(dateToUse)) {
      alert("Cannot add notes for future dates");
      setSaving(false);
      return;
    }

    try {
      // Get existing record
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("note, productivity")
        .eq("user_id", user.id)
        .eq("date", dateToUse)
        .single();

      // Append to existing note if it exists
      let finalNote = noteText;
      if (existing?.note && existing.note.trim() !== "") {
        const existingNote = existing.note.trim();
        const separator = "\n---\n";
        finalNote = existingNote + separator + noteText;
        // Ensure total length doesn't exceed 250
        if (finalNote.length > 250) {
          finalNote = finalNote.slice(-250);
        }
      }

      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          {
            user_id: user.id,
            date: dateToUse,
            note: finalNote,
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
      setSelectedDate("");
      await load();
    } catch (err) {
      console.error("Unexpected error saving note:", err);
      alert("Unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (date) => {
    if (!user?.id || deleting) return;
    if (!confirm("Are you sure you want to delete this note?")) return;

    setDeleting(true);
    try {
      // Get existing record to preserve productivity
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("productivity")
        .eq("user_id", user.id)
        .eq("date", date)
        .single();

      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          {
            user_id: user.id,
            date: date,
            note: null,
            productivity: existing?.productivity ?? 0,
          },
          {
            onConflict: "user_id,date",
          }
        );

      if (error) {
        console.error("Error deleting note:", error);
        alert("Error deleting note: " + error.message);
        return;
      }

      await load();
    } catch (err) {
      console.error("Unexpected error deleting note:", err);
      alert("Unexpected error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      saveNote();
    }
  };

  const handleNoteChange = (e) => {
    const value = e.target.value;
    if (value.length <= 250) {
      setNote(value);
    }
  };

  const todayIST = formatDateIST(getTodayIST());

  return (
    <div className="notes-box">
      <h3>Notes</h3>
      <div className="notes-input-container">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => {
            const selected = e.target.value;
            if (isPastDate(selected)) {
              setSelectedDate(selected);
            } else {
              alert("Cannot add notes for future dates");
            }
          }}
          max={todayIST}
          placeholder="Select date (optional)"
          className="date-input"
        />
        <input
          type="text"
          value={note}
          onChange={handleNoteChange}
          onKeyPress={handleKeyPress}
          placeholder="Today's note"
          disabled={saving}
          maxLength={250}
          className="note-input"
        />
        <button onClick={saveNote} disabled={saving} className="save-button">
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="note-char-count">{note.length}/250</div>

      <table>
        <thead>
          <tr>
            <th style={{ width: "80px" }}>Action</th>
            <th>Date</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", color: "#8b949e" }}>
                No notes yet
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.date}>
                <td>
                  <button
                    onClick={() => deleteNote(r.date)}
                    disabled={deleting}
                    className="delete-button"
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </td>
                <td>{r.date}</td>
                <td className="note-cell">{r.note || "-"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
