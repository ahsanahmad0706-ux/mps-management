export type PortalRole = "admin" | "teacher" | "student";

export type AttendanceStatus = "present" | "absent" | "late" | null;

export type UserCredential = {
  id: string;
  name: string;
  role: PortalRole;
  password: string;
  className?: string;
  subject?: string;
};

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  email: string;
  phone: string;
};

export type Student = {
  id: string;
  name: string;
  className: string;
  rollNo: string;
  guardian: string;
  phone: string;
};

export type FeeRecord = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  month: string;
  amount: number;
  status: "paid" | "unpaid";
  paidAt?: string;
  receiptSerial?: string;
};

export type AttendanceRecord = {
  studentId: string;
  date: string;
  status: AttendanceStatus;
};

export type SessionUser = {
  id: string;
  name: string;
  role: PortalRole;
  className?: string;
};

export type GeneratedCredential = {
  userId: string;
  name: string;
  role: "teacher" | "student";
  password: string;
  className?: string;
  subject?: string;
  createdAt: string;
};
