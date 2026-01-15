import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import {
  getYearDates,
  getMonthDates,
  getWeekDates,
  formatDateIST,
  getTodayIST,
  isPastDate,
  getMonthAbbr,
  getYearStartDay,
} from "../utils/dateUtils";
import "./Heatmap.css";

export default function Heatmap({ user }) {
  const [logs, setLogs] = useState({});
  const [view, setView] = useState("year");

  const todayIST = getTodayIST();
  const YEAR = todayIST.getFullYear();

  // ---------------- FETCH DATA ----------------
  useEffect(() => {
    if (!user?.id) return;

    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("daily_logs")
        .select("date, productivity")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching logs:", error);
        return;
      }

      const map = {};
      if (data) {
        data.forEach((d) => {
          map[d.date] = d.productivity ?? 0;
        });
      }

      setLogs(map);
    };

    fetchLogs();
  }, [user?.id]);

  // ---------------- DATE LOGIC ----------------
  let dates = [];
  let monthLabels = [];
  let dayLabels = [];
  let yearStartOffset = 0;
  let yearWeekData = null;

  if (view === "year") {
    dates = getYearDates(YEAR);
    yearStartOffset = getYearStartDay(YEAR); // 0=Sunday, 4=Thursday for 2026
    const totalDays = dates.length + yearStartOffset;
    const totalWeeks = Math.ceil(totalDays / 7);

    // Organize dates into weeks (columns) and days (rows) - GitHub style
    const weeks = Array(totalWeeks).fill(null).map(() => Array(7).fill(null));

    // Fill empty cells at the start
    for (let i = 0; i < yearStartOffset; i++) {
      const dayOfWeek = i;
      weeks[0][dayOfWeek] = null;
    }

    // Fill actual dates
    dates.forEach((date, index) => {
      const weekIndex = Math.floor((index + yearStartOffset) / 7);
      const dayOfWeek = (index + yearStartOffset) % 7;
      weeks[weekIndex][dayOfWeek] = date;
    });

    yearWeekData = weeks;

    // Create month labels - find first occurrence of each month
    const months = {};
    dates.forEach((date, index) => {
      const month = date.getMonth();
      if (!months[month]) {
        const totalDaysFromStart = index + yearStartOffset;
        const weekNum = Math.floor(totalDaysFromStart / 7);
        months[month] = { month, weekNum, date };
      }
    });
    monthLabels = Object.values(months).sort((a, b) => a.month - b.month);

    // Day labels for left side (show Mon=1, Wed=3, Fri=5)
    dayLabels = [1, 3, 5];
  }

  if (view === "month") {
    dates = getMonthDates(YEAR, todayIST.getMonth());
    // Add empty cells for days before month start
    const firstDayOfMonth = dates[0].getDay();
    const emptyDays = Array(firstDayOfMonth).fill(null);
    dates = [...emptyDays, ...dates];
    dayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  }

  if (view === "week") {
    dates = getWeekDates(todayIST);
    dayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  }

  // ---------------- CLICK HANDLER ----------------
  const toggleDay = async (dateStr) => {
    if (!user?.id) return;

    // Prevent clicking on future dates
    if (!isPastDate(dateStr)) {
      return;
    }

    const current = logs[dateStr] ?? 0;
    const next = (current + 1) % 3;

    try {
      const { error } = await supabase
        .from("daily_logs")
        .upsert(
          {
            user_id: user.id,
            date: dateStr,
            productivity: next,
          },
          {
            onConflict: "user_id,date",
          }
        );

      if (error) {
        console.error("Error updating productivity:", error);
        alert("Error updating: " + error.message);
        return;
      }

      setLogs((prev) => ({
        ...prev,
        [dateStr]: next,
      }));
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Unexpected error occurred");
    }
  };

  // ---------------- RENDER ----------------
  const todayStr = formatDateIST(todayIST);

  return (
    <>
      <div className="view-buttons">
        <button
          className={view === "week" ? "active" : ""}
          onClick={() => setView("week")}
        >
          Week
        </button>
        <button
          className={view === "month" ? "active" : ""}
          onClick={() => setView("month")}
        >
          Month
        </button>
        <button
          className={view === "year" ? "active" : ""}
          onClick={() => setView("year")}
        >
          Year
        </button>
      </div>
      <div className="tracker-box">
        {view === "year" && yearWeekData && (() => {
          const totalWeeks = yearWeekData.length;

          return (
            <div className="year-view-container">
              {/* Month labels at top */}
              <div className="year-header">
                <div className="year-day-labels-left"></div>
                <div className="year-month-labels">
                  {monthLabels.map(({ month, weekNum }) => {
                    // Calculate how many weeks this month spans
                    const nextMonth = monthLabels.find(m => m.month > month);
                    const monthEndWeek = nextMonth ? nextMonth.weekNum : totalWeeks;
                    const spanWeeks = monthEndWeek - weekNum;

                    return (
                      <div
                        key={month}
                        className="year-month-label"
                        style={{
                          gridColumn: `${weekNum + 1} / span ${spanWeeks}`
                        }}
                      >
                        {getMonthAbbr(month)}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main grid with day labels on left */}
              <div className="year-grid-wrapper">
                {/* Day labels on left - Mon (row 1), Wed (row 3), Fri (row 5) */}
                <div className="year-day-labels">
                  {dayLabels.map((dayIdx) => (
                    <div key={dayIdx} className="year-day-label">
                      {dayIdx === 1 ? "Mon" : dayIdx === 3 ? "Wed" : "Fri"}
                    </div>
                  ))}
                </div>

                {/* Week columns grid */}
                <div className="year-heatmap" style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
                  {yearWeekData.map((week, weekIdx) => (
                    <div key={weekIdx} className="year-week-column">
                      {week.map((date, dayIdx) => {
                        if (date === null) {
                          return <div key={`empty-${dayIdx}`} className="year-empty-cell" />;
                        }
                        const dateStr = formatDateIST(date);
                        const level = logs[dateStr] ?? 0;
                        const isFuture = !isPastDate(dateStr);
                        const isToday = dateStr === todayStr;

                        return (
                          <div
                            key={dateStr}
                            className={`year-cell level-${level} ${isFuture ? "future" : ""} ${isToday ? "today" : ""}`}
                            title={`${dateStr} | ${level === 2
                                ? "Productive"
                                : level === 1
                                  ? "Semi-productive"
                                  : "Not productive"
                              }${isFuture ? " (Future - cannot edit)" : ""}`}
                            onClick={() => !isFuture && toggleDay(dateStr)}
                            style={{ cursor: isFuture ? "not-allowed" : "pointer", opacity: isFuture ? 0.5 : 1 }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
        {(view === "week" || view === "month") && (
          <>
            {/* Day labels row - shifted right for alignment */}
            <div className="day-labels week-month-labels">
              {dayLabels.map((day, idx) => (
                <div key={idx} className="day-label week-month-label">
                  {day}
                </div>
              ))}
            </div>
            {/* Week/Month grid - matching gap */}
            <div className={`heatmap ${view}`}>
              {dates.map((date, idx) => {
                if (date === null) {
                  return <div key={`empty-${idx}`} className="empty-cell" />;
                }
                const dateStr = formatDateIST(date);
                const level = logs[dateStr] ?? 0;
                const isFuture = !isPastDate(dateStr);
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={dateStr}
                    className={`cell level-${level} ${isFuture ? "future" : ""} ${isToday ? "today" : ""}`}
                    title={`${dateStr} | ${level === 2
                        ? "Productive"
                        : level === 1
                          ? "Semi-productive"
                          : "Not productive"
                      }${isFuture ? " (Future - cannot edit)" : ""}`}
                    onClick={() => !isFuture && toggleDay(dateStr)}
                    style={{ cursor: isFuture ? "not-allowed" : "pointer", opacity: isFuture ? 0.5 : 1 }}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
      {/* Color Legend */}
      <div className="color-legend">
        <div className="legend-item">
          <div className="legend-box level-2"></div>
          <span>Productive</span>
        </div>
        <div className="legend-item">
          <div className="legend-box level-1"></div>
          <span>Semi-productive</span>
        </div>
        <div className="legend-item">
          <div className="legend-box level-0"></div>
          <span>Unproductive</span>
        </div>
      </div>
    </>
  );
}
