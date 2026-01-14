import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
  getYearDates,
  getMonthDates,
  getWeekDates,
} from "../utils/dateUtils";
import "./Heatmap.css";

export default function Heatmap({ user }) {
  const [logs, setLogs] = useState({});
  const [view, setView] = useState("year");

  const YEAR = 2026;
  const today = new Date();

  // ---------------- FETCH DATA ----------------
 useEffect(() => {
  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("daily_logs")
      .select("date, productivity")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    const map = {};
    data.forEach((d) => {
      map[d.date] = d.productivity;
    });

    setLogs(map);
  };

  fetchLogs();
}, [user.id]);


  // const fetchLogs = async () => {
  //   const { data, error } = await supabase
  //     .from("daily_logs")
  //     .select("date, productivity")
  //     .eq("user_id", user.id);

  //   if (error) {
  //     console.error(error);
  //     return;
  //   }

  //   const map = {};
  //   data.forEach((d) => {
  //     map[d.date] = d.productivity;
  //   });

  //   setLogs(map);
  // };

  // ---------------- DATE LOGIC ----------------
  let dates = [];

  if (view === "year") {
    dates = getYearDates(YEAR);
  }

  if (view === "month") {
    dates = getMonthDates(YEAR, today.getMonth());
  }

  if (view === "week") {
    dates = getWeekDates(today);
  }

  // ---------------- CLICK HANDLER ----------------
  const toggleDay = async (dateStr) => {
    const current = logs[dateStr] ?? 0;
    const next = (current + 1) % 3;

    const { error } = await supabase.from("daily_logs").upsert({
      user_id: user.id,
      date: dateStr,
      productivity: next,
    });

    if (error) {
      console.error(error);
      return;
    }

    setLogs((prev) => ({
      ...prev,
      [dateStr]: next,
    }));
  };

  // ---------------- RENDER ----------------
  return (
    <>
      <div style={{ marginBottom: "10px" }}>
        <button onClick={() => setView("week")}>Week</button>
        <button onClick={() => setView("month")}>Month</button>
        <button onClick={() => setView("year")}>Year</button>
      </div>
    <div className="tracker-box">
      <div className={`heatmap ${view}`}>
        {dates.map((date) => {
          const dateStr = date.toISOString().slice(0, 10);
          const level = logs[dateStr] ?? 0;

          return (
            <div
              key={dateStr}
              className={`cell level-${level}`}
              title={`${dateStr} | ${
                level === 2
                  ? "Productive"
                  : level === 1
                  ? "Semi-productive"
                  : "Not productive"
              }`}
              onClick={() => toggleDay(dateStr)}
            />
          );
        })}
        </div>
      </div>
    </>
  );
}
