"use client";

import {
  GraduationCap,
  LogOut,
  Shield,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DEMO_CREDENTIALS,
  DEMO_FEES,
  DEMO_STUDENTS,
  DEMO_TEACHERS,
  buildMonthAttendance,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/supabase";
import type {
  AttendanceRecord,
  FeeRecord,
  PortalRole,
  SessionUser,
  Student,
  Teacher,
  UserCredential,
} from "@/lib/types";
import { AdminPortal } from "./admin-portal";
import { SchoolLogo } from "./school-logo";
import { StudentPortal } from "./student-portal";
import { TeacherPortal } from "./teacher-portal";

const PORTALS: Array<{
  id: PortalRole;
  label: string;
  icon: typeof Shield;
  hint: string;
}> = [
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    hint: "Executive oversight & fee collection",
  },
  {
    id: "teacher",
    label: "Teacher",
    icon: UserRound,
    hint: "Daily class attendance",
  },
  {
    id: "student",
    label: "Student",
    icon: GraduationCap,
    hint: "Attendance & fee notices",
  },
];

export function SchoolApp() {
  const [portal, setPortal] = useState<PortalRole>("admin");
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [session, setSession] = useState<SessionUser | null>(null);

  const [credentials, setCredentials] =
    useState<UserCredential[]>(DEMO_CREDENTIALS);
  const [teachers, setTeachers] = useState<Teacher[]>(DEMO_TEACHERS);
  const [students, setStudents] = useState<Student[]>(DEMO_STUDENTS);
  const [fees, setFees] = useState<FeeRecord[]>(DEMO_FEES);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [supabaseReady, setSupabaseReady] = useState(false);

  // Restore saved session from localStorage on initial load
  useEffect(() => {
    const now = new Date();
    setAttendance(
      buildMonthAttendance(
        DEMO_STUDENTS.filter((s) => s.className === "Class 8-A"),
        now.getFullYear(),
        now.getMonth(),
      ),
    );
    setSupabaseReady(isSupabaseConfigured());

    try {
      const savedSession = localStorage.getItem("mps_user_session");
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        if (parsedSession && parsedSession.id && parsedSession.role) {
          setSession(parsedSession);
        }
      }
    } catch (e) {
      console.error("Error restoring session:", e);
    }
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const match = credentials.find(
      (c) =>
        c.id.toUpperCase() === userId.trim().toUpperCase() &&
        c.password === password &&
        c.role === portal,
    );

    if (!match) {
      setError("Invalid User ID or password for this portal.");
      return;
    }

    const sessionData: SessionUser = {
      id: match.id,
      name: match.name,
      role: match.role,
      className: match.className,
    };

    setSession(sessionData);
    localStorage.setItem("mps_user_session", JSON.stringify(sessionData));
    setPassword("");
  }

  function handleLogout() {
    setSession(null);
    localStorage.removeItem("mps_user_session");
    setError("");
  }

  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #2E3192 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#93C5FD]/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#DBEAFE]/60 blur-3xl" />

      <div className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
        {session && (
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-[#93C5FD]/40 pb-5">
            <div className="flex items-center">
              <SchoolLogo className="h-16 w-auto sm:h-20" />
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right text-sm">
                <p className="font-semibold text-slate-800">{session.name}</p>
                <p className="font-mono text-xs text-[#64748B]">{session.id}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#93C5FD] bg-white px-3 py-2 text-sm font-semibold text-[#2E3192] transition hover:bg-[#EFF6FF]"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </header>
        )}

        {!session ? (
          <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center animate-[fadeUp_0.45s_ease-out]">
            <div className="mb-8 w-full">
              <SchoolLogo
                priority
                className="h-auto w-full max-h-40 object-contain sm:max-h-48"
              />
              <p className="mt-4 text-center text-sm text-[#64748B]">
                Sign in with your assigned school credentials.
              </p>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg bg-[#93C5FD]/20 p-1">
              {PORTALS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setPortal(id);
                    setError("");
                  }}
                  className={`flex flex-col items-center gap-1 rounded-md px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                    portal === id
                      ? "bg-[#2E3192] text-white shadow-sm"
                      : "text-[#64748B] hover:bg-white/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleLogin}
              className="rounded-lg border border-[#93C5FD]/40 bg-white p-6 shadow-sm animate-[fadeIn_0.35s_ease-out]"
            >
              <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-[#64748B]">
                {PORTALS.find((p) => p.id === portal)?.hint}
              </p>

              <label className="mb-4 block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">
                  User ID
                </span>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={
                    portal === "admin"
                      ? "MPS-ADM-001"
                      : portal === "teacher"
                        ? "MPS-TCH-101"
                        : "MPS-STD-101"
                  }
                  autoComplete="username"
                  className="w-full rounded-md border border-[#93C5FD]/60 px-3 py-2.5 font-mono text-sm outline-none ring-[#2E3192] focus:ring-2"
                  required
                />
              </label>

              <label className="mb-4 block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-md border border-[#93C5FD]/60 px-3 py-2.5 text-sm outline-none ring-[#2E3192] focus:ring-2"
                  required
                />
              </label>

              {error && (
                <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-md bg-[#2E3192] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#252884]"
              >
                Sign in to {PORTALS.find((p) => p.id === portal)?.label} Portal
              </button>

              <div className="mt-4 rounded-md bg-[#EFF6FF] px-3 py-2.5 text-xs text-[#64748B]">
                <p className="font-semibold text-[#2E3192]">Demo credentials</p>
                <ul className="mt-1 space-y-0.5 font-mono">
                  <li>Admin · MPS-ADM-001 / MPS@Admin2024</li>
                  <li>Teacher · MPS-TCH-101 / Teach@101</li>
                  <li>Student · MPS-STD-101 / Stud@101</li>
                </ul>
              </div>
            </form>

            <p className="mt-4 text-center text-xs text-slate-500">
              {supabaseReady
                ? "Supabase connected — local demo data active until tables are provisioned."
                : "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to enable Supabase."}
            </p>
          </main>
        ) : (
          <main className="flex-1 animate-[fadeUp_0.4s_ease-out]">
            {session.role === "admin" && (
              <AdminPortal
                teachers={teachers}
                students={students}
                fees={fees}
                onCollectFee={(feeId: string, serial: string) => {
                  setFees((prev) =>
                    prev.map((f) =>
                      f.id === feeId
                        ? {
                            ...f,
                            status: "paid",
                            paidAt: new Date().toISOString().slice(0, 10),
                            receiptSerial: serial,
                          }
                        : f,
                    ),
                  );
                }}
                onAddTeacher={(teacher: Teacher, pwd: string) => {
                  setTeachers((prev) => [...prev, teacher]);
                  setCredentials((prev) => [
                    ...prev,
                    {
                      id: teacher.id,
                      name: teacher.name,
                      role: "teacher",
                      password: pwd,
                      subject: teacher.subject,
                      className: "Class 8-A",
                    },
                  ]);
                }}
                onAddStudent={(student: Student, pwd: string) => {
                  setStudents((prev) => [...prev, student]);
                  setCredentials((prev) => [
                    ...prev,
                    {
                      id: student.id,
                      name: student.name,
                      role: "student",
                      password: pwd,
                      className: student.className,
                    },
                  ]);
                }}
              />
            )}

            {session.role === "teacher" && (
              <TeacherPortal
                className={session.className ?? "Class 8-A"}
                students={students}
                attendance={attendance}
                onSaveAttendance={(date, updates) => {
                  setAttendance((prev) => {
                    const next = prev.filter(
                      (a) =>
                        !(
                          a.date === date &&
                          Object.prototype.hasOwnProperty.call(updates, a.studentId)
                        ),
                    );
                    for (const [studentId, status] of Object.entries(updates)) {
                      next.push({ studentId, date, status });
                    }
                    return next;
                  });
                }}
              />
            )}

            {session.role === "student" && (
              <StudentPortal
                studentId={session.id}
                studentName={session.name}
                className={session.className ?? "Class 8-A"}
                attendance={attendance}
                fees={fees}
              />
            )}
          </main>
        )}
      </div>
    </div>
  );
}