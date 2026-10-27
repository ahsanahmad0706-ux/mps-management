"use client";

import { AlertCircle, CalendarDays } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AttendanceRecord, FeeRecord } from "@/lib/types";

type StudentPortalProps = {
  studentId: string;
  studentName: string;
  className: string;
  attendance: AttendanceRecord[];
  fees: FeeRecord[];
};

export function StudentPortal({
  studentId,
  studentName,
  className,
  attendance,
  fees,
}: StudentPortalProps) {
  const [year, setYear] = useState(2026);
  const [monthIndex, setMonthIndex] = useState(9);
  const [monthLabel, setMonthLabel] = useState("October 2026");

  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonthIndex(now.getMonth());
    setMonthLabel(
      now.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    );
  }, []);

  const unpaid = fees.filter(
    (f) => f.studentId === studentId && f.status === "unpaid",
  );

  const monthRecords = useMemo(() => {
    const prefix = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const map = new Map<number, string>();
    for (const r of attendance) {
      if (r.studentId !== studentId || !r.date.startsWith(prefix) || !r.status)
        continue;
      const day = Number.parseInt(r.date.slice(8, 10), 10);
      map.set(day, r.status);
    }
    return map;
  }, [attendance, studentId, year, monthIndex]);

  const cells = useMemo(() => {
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstWeekday = new Date(year, monthIndex, 1).getDay();
    const next: Array<{ day: number | null; status: string | null }> = [];
    for (let i = 0; i < firstWeekday; i++) {
      next.push({ day: null, status: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      next.push({ day: d, status: monthRecords.get(d) ?? null });
    }
    return next;
  }, [year, monthIndex, monthRecords]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#2E3192]">
          Student Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {studentName} · {className} · View only
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-[#2E3192]" />
            <h3 className="text-lg font-semibold text-[#2E3192]">
              Attendance · {monthLabel}
            </h3>
          </div>

          <div className="mb-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell, i) => (
              <div
                key={i}
                className={`aspect-square rounded-md text-xs font-semibold ${
                  cell.day === null
                    ? "bg-transparent"
                    : cellStatusClass(cell.status)
                } flex flex-col items-center justify-center`}
              >
                {cell.day !== null && (
                  <>
                    <span>{cell.day}</span>
                    {cell.status && (
                      <span className="mt-0.5 text-[9px] uppercase opacity-80">
                        {cell.status[0]}
                      </span>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-600">
            <Legend swatch="bg-emerald-100 text-emerald-800" label="Present" />
            <Legend swatch="bg-rose-100 text-rose-800" label="Absent" />
            <Legend swatch="bg-amber-100 text-amber-800" label="Late" />
            <Legend swatch="bg-slate-100 text-slate-500" label="No record" />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#2E3192]" />
            <h3 className="text-lg font-semibold text-[#2E3192]">
              Unpaid Fee Notices
            </h3>
          </div>
          {unpaid.length === 0 ? (
            <p className="text-sm text-slate-500">
              No outstanding fee notices. All clear.
            </p>
          ) : (
            <ul className="space-y-3">
              {unpaid.map((f) => (
                <li
                  key={f.id}
                  className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3"
                >
                  <p className="font-semibold text-amber-950">{f.month}</p>
                  <p className="mt-0.5 text-sm text-amber-900">
                    Amount due: ₹{f.amount.toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Please clear dues at the Admin office.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function cellStatusClass(status: string | null) {
  if (status === "present") return "bg-emerald-100 text-emerald-900";
  if (status === "absent") return "bg-rose-100 text-rose-900";
  if (status === "late") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-500";
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded ${swatch}`}
      />
      {label}
    </span>
  );
}
