"use client";

import { Check, Clock, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AttendanceRecord, AttendanceStatus, Student } from "@/lib/types";

type TeacherPortalProps = {
  className: string;
  students: Student[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (date: string, updates: Record<string, AttendanceStatus>) => void;
};

export function TeacherPortal({
  className,
  students,
  attendance,
  onSaveAttendance,
}: TeacherPortalProps) {
  const [date, setDate] = useState("");
  const classStudents = useMemo(
    () => students.filter((s) => s.className === className),
    [students, className],
  );

  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (!date) return;
    const map: Record<string, AttendanceStatus> = {};
    for (const s of classStudents) {
      const existing = attendance.find(
        (a) => a.studentId === s.id && a.date === date,
      );
      map[s.id] = existing?.status ?? "present";
    }
    setMarks(map);
  }, [classStudents, attendance, date]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setMarks((prev) => ({ ...prev, [studentId]: status }));
  }

  function handleSave() {
    onSaveAttendance(date, marks);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }

  const counts = {
    present: Object.values(marks).filter((s) => s === "present").length,
    absent: Object.values(marks).filter((s) => s === "absent").length,
    late: Object.values(marks).filter((s) => s === "late").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#2E3192]">
            Daily Class Attendance
          </h2>
          <p className="mt-1 text-sm text-slate-600">{className}</p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-800">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-[#93C5FD]/60 px-3 py-2 text-sm outline-none ring-[#2E3192] focus:ring-2"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Pill label="Present" value={counts.present} tone="emerald" />
        <Pill label="Absent" value={counts.absent} tone="rose" />
        <Pill label="Late" value={counts.late} tone="amber" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="bg-[#2E3192] text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Roll</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">User ID</th>
              <th className="px-4 py-3 font-medium">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {classStudents.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-600">{s.rollNo}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {s.id}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    <StatusBtn
                      active={marks[s.id] === "present"}
                      onClick={() => setStatus(s.id, "present")}
                      tone="emerald"
                      icon={<Check className="h-3.5 w-3.5" />}
                      label="Present"
                    />
                    <StatusBtn
                      active={marks[s.id] === "absent"}
                      onClick={() => setStatus(s.id, "absent")}
                      tone="rose"
                      icon={<X className="h-3.5 w-3.5" />}
                      label="Absent"
                    />
                    <StatusBtn
                      active={marks[s.id] === "late"}
                      onClick={() => setStatus(s.id, "late")}
                      tone="amber"
                      icon={<Clock className="h-3.5 w-3.5" />}
                      label="Late"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-md bg-[#2E3192] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#252884]"
        >
          <Save className="h-4 w-4" />
          Save Attendance
        </button>
        {savedFlash && (
          <span className="text-sm font-medium text-emerald-700">
            Attendance saved for {date}.
          </span>
        )}
      </div>
    </div>
  );
}

function Pill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "rose" | "amber";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800",
    rose: "bg-rose-50 text-rose-800",
    amber: "bg-amber-50 text-amber-800",
  };
  return (
    <span className={`rounded-full px-3 py-1 font-semibold ${tones[tone]}`}>
      {label}: {value}
    </span>
  );
}

function StatusBtn({
  active,
  onClick,
  tone,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  tone: "emerald" | "rose" | "amber";
  icon: React.ReactNode;
  label: string;
}) {
  const activeTone = {
    emerald: "bg-emerald-600 text-white border-emerald-600",
    rose: "bg-rose-600 text-white border-rose-600",
    amber: "bg-amber-600 text-white border-amber-600",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition ${
        active
          ? activeTone[tone]
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
