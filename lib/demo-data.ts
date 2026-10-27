import type {
  AttendanceRecord,
  FeeRecord,
  Student,
  Teacher,
  UserCredential,
} from "./types";

export const DEMO_CREDENTIALS: UserCredential[] = [
  {
    id: "MPS-ADM-001",
    name: "Principal Sharma",
    role: "admin",
    password: "MPS@Admin2024",
  },
  {
    id: "MPS-TCH-101",
    name: "Anita Verma",
    role: "teacher",
    password: "Teach@101",
    subject: "Mathematics",
    className: "Class 8-A",
  },
  {
    id: "MPS-STD-101",
    name: "Rohan Mehta",
    role: "student",
    password: "Stud@101",
    className: "Class 8-A",
  },
];

export const DEMO_TEACHERS: Teacher[] = [
  {
    id: "MPS-TCH-101",
    name: "Anita Verma",
    subject: "Mathematics",
    email: "anita.verma@mps.edu",
    phone: "+91 98765 10101",
  },
  {
    id: "MPS-TCH-102",
    name: "Rajesh Kumar",
    subject: "Science",
    email: "rajesh.kumar@mps.edu",
    phone: "+91 98765 10102",
  },
  {
    id: "MPS-TCH-103",
    name: "Priya Nair",
    subject: "English",
    email: "priya.nair@mps.edu",
    phone: "+91 98765 10103",
  },
  {
    id: "MPS-TCH-104",
    name: "Imran Siddiqui",
    subject: "History",
    email: "imran.siddiqui@mps.edu",
    phone: "+91 98765 10104",
  },
];

export const DEMO_STUDENTS: Student[] = [
  {
    id: "MPS-STD-101",
    name: "Rohan Mehta",
    className: "Class 8-A",
    rollNo: "08",
    guardian: "Suresh Mehta",
    phone: "+91 98111 22001",
  },
  {
    id: "MPS-STD-102",
    name: "Aisha Khan",
    className: "Class 8-A",
    rollNo: "02",
    guardian: "Farah Khan",
    phone: "+91 98111 22002",
  },
  {
    id: "MPS-STD-103",
    name: "Dev Patel",
    className: "Class 8-A",
    rollNo: "15",
    guardian: "Kiran Patel",
    phone: "+91 98111 22003",
  },
  {
    id: "MPS-STD-104",
    name: "Sara Joseph",
    className: "Class 8-A",
    rollNo: "21",
    guardian: "Mary Joseph",
    phone: "+91 98111 22004",
  },
  {
    id: "MPS-STD-105",
    name: "Arjun Singh",
    className: "Class 8-A",
    rollNo: "04",
    guardian: "Vikram Singh",
    phone: "+91 98111 22005",
  },
  {
    id: "MPS-STD-106",
    name: "Meera Iyer",
    className: "Class 9-B",
    rollNo: "11",
    guardian: "Lakshmi Iyer",
    phone: "+91 98111 22006",
  },
];

export const DEMO_FEES: FeeRecord[] = [
  {
    id: "fee-1",
    studentId: "MPS-STD-101",
    studentName: "Rohan Mehta",
    className: "Class 8-A",
    month: "October 2026",
    amount: 4500,
    status: "unpaid",
  },
  {
    id: "fee-2",
    studentId: "MPS-STD-102",
    studentName: "Aisha Khan",
    className: "Class 8-A",
    month: "October 2026",
    amount: 4500,
    status: "unpaid",
  },
  {
    id: "fee-3",
    studentId: "MPS-STD-103",
    studentName: "Dev Patel",
    className: "Class 8-A",
    month: "September 2026",
    amount: 4500,
    status: "paid",
    paidAt: "2026-09-12",
    receiptSerial: "MPS-RCP-2026-0042",
  },
  {
    id: "fee-4",
    studentId: "MPS-STD-106",
    studentName: "Meera Iyer",
    className: "Class 9-B",
    month: "October 2026",
    amount: 4800,
    status: "unpaid",
  },
  {
    id: "fee-5",
    studentId: "MPS-STD-101",
    studentName: "Rohan Mehta",
    className: "Class 8-A",
    month: "September 2026",
    amount: 4500,
    status: "paid",
    paidAt: "2026-09-05",
    receiptSerial: "MPS-RCP-2026-0018",
  },
];

/** Seed attendance for Class 8-A for the current month (weekdays). */
export function buildMonthAttendance(
  students: Student[],
  year: number,
  monthIndex: number,
): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const statuses: Array<"present" | "absent" | "late"> = [
    "present",
    "present",
    "present",
    "present",
    "late",
    "absent",
  ];

  for (const student of students) {
    let seed = student.id
      .split("")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      if (date.getDay() === 0) continue;

      seed = (seed * 31 + day) % 997;
      const status = statuses[seed % statuses.length];
      const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      records.push({ studentId: student.id, date: iso, status });
    }
  }

  return records;
}
