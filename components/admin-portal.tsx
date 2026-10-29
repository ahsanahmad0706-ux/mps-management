"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Core Subject Configuration for Academic Examinations
const CORE_SUBJECTS = [
  { name: "Mathematics", code: "MATH-10", maxMarks: 100, passMarks: 33 },
  { name: "Science", code: "SCI-10", maxMarks: 100, passMarks: 33 },
  { name: "English", code: "ENG-10", maxMarks: 100, passMarks: 33 },
  { name: "Social Science", code: "SST-10", maxMarks: 100, passMarks: 33 },
  { name: "Hindi / Regional Language", code: "LANG-10", maxMarks: 100, passMarks: 33 },
];

interface AdminPortalProps {
  teachers?: any[];
  students?: any[];
  fees?: any[];
  onCollectFee?: (feeId: string, serial: string) => void;
  onAddTeacher?: (teacher: any, pwd: string) => void;
  onAddStudent?: (student: any, pwd: string) => void;
  [key: string]: any;
}

export function AdminPortal(props: AdminPortalProps) {
  // Navigation State Across All Directories
  const [activeTab, setActiveTab] = useState<
    "exams" | "students" | "staff" | "classes" | "fees" | "notices"
  >("exams");

  // Exam Role Simulation State
  const [userRole, setUserRole] = useState<"Teacher" | "Office Staff" | "Admin">("Teacher");

  // Global Database Data States
  const [students, setStudents] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [classList, setClassList] = useState<any[]>([]);
  const [feesList, setFeesList] = useState<any[]>([]);
  const [noticesList, setNoticesList] = useState<any[]>([]);
  const [examTerms, setExamTerms] = useState<any[]>([]);
  const [marksRecords, setMarksRecords] = useState<Record<string, any>>({});

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassFilter, setSelectedClassFilter] = useState("All");
  const [selectedExamClass, setSelectedExamClass] = useState("Class 10");
  const [selectedExamSection, setSelectedExamSection] = useState("A");
  const [selectedTermId, setSelectedTermId] = useState("");

  // Modals Visibility States
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddClass, setShowAddClass] = useState(false);
  const [showAddNotice, setShowAddNotice] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [addingMoreDetailsStudent, setAddingMoreDetailsStudent] = useState<any | null>(null);
  const [staffCategory, setStaffCategory] = useState("Teacher");
  const [editingExamStudent, setEditingExamStudent] = useState<any | null>(null);
  const [printModalData, setPrintModalData] = useState<any[] | null>(null);

  // Loading & Action Processing States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- INITIAL DATA FETCHING & SESSION RESTORATION ---
  useEffect(() => {
    fetchAllData();
    
    // Restore saved active tab from localStorage on refresh
    const savedTab = localStorage.getItem("mps_admin_active_tab");
    if (savedTab) {
      setActiveTab(savedTab as any);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "exams" && selectedExamClass && selectedTermId) {
      fetchExamMarks();
    }
  }, [activeTab, selectedExamClass, selectedExamSection, selectedTermId]);

  const handleTabChange = (tab: "exams" | "students" | "staff" | "classes" | "fees" | "notices") => {
    setActiveTab(tab);
    localStorage.setItem("mps_admin_active_tab", tab);
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchStudents(),
      fetchStaff(),
      fetchClasses(),
      fetchFees(),
      fetchNotices(),
      fetchExamTerms(),
    ]);
    setIsLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*").order("created_at", { ascending: false });
    if (data) setStudents(data);
  };

  const fetchStaff = async () => {
    const { data } = await supabase.from("staff").select("*").order("created_at", { ascending: false });
    if (data) setStaffList(data);
  };

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*").order("class_name", { ascending: true });
    if (data) setClassList(data);
  };

  const fetchFees = async () => {
    const { data } = await supabase.from("fee_records").select("*").order("created_at", { ascending: false });
    if (data) setFeesList(data);
  };

  const fetchNotices = async () => {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    if (data) setNoticesList(data);
  };

  const fetchExamTerms = async () => {
    const { data } = await supabase.from("exam_terms").select("*").order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setExamTerms(data);
      const activeTerm = data.find((t) => t.is_active) || data[0];
      setSelectedTermId(activeTerm.id);
    }
  };

  const fetchExamMarks = async () => {
    const { data } = await supabase
      .from("student_marks")
      .select("*")
      .eq("class_name", selectedExamClass)
      .eq("exam_term_id", selectedTermId);

    const map: Record<string, any> = {};
    if (data) {
      data.forEach((rec) => {
        map[rec.admission_no] = rec;
      });
    }
    setMarksRecords(map);
  };

  // --- AUTOMATIC CALCULATION ENGINE ---
  const calculateResultMetrics = (subjectMarks: Record<string, number>) => {
    let totalObtained = 0;
    let totalMax = 0;
    let isFailedInAny = false;

    CORE_SUBJECTS.forEach((subj) => {
      const mark = Number(subjectMarks[subj.name]) || 0;
      totalObtained += mark;
      totalMax += subj.maxMarks;
      if (mark < subj.passMarks) isFailedInAny = true;
    });

    const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
    let overallGrade = "F";
    if (percentage >= 90) overallGrade = "A+";
    else if (percentage >= 80) overallGrade = "A";
    else if (percentage >= 70) overallGrade = "B";
    else if (percentage >= 60) overallGrade = "C";
    else if (percentage >= 33) overallGrade = "D";

    const resultStatus = isFailedInAny || percentage < 33 ? "FAILED" : "PASSED";
    return { totalObtained, totalMax, percentage, overallGrade, resultStatus };
  };

  // --- SUBMISSION & DATABASE SAVE HANDLERS ---
  const handleSaveStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const fullName = (formData.get("full_name") as string)?.trim();
      const guardianPhone = (formData.get("guardian_phone") as string)?.trim();
      const className = formData.get("class_name") as string;

      if (!fullName || !guardianPhone || !className) {
        alert("Please fill in Student Name, Guardian Phone, and Class.");
        setIsSaving(false);
        return;
      }

      const admissionNo = (formData.get("admission_no") as string)?.trim() || `ADM-${Date.now().toString().slice(-5)}`;

      const payload = {
        id: admissionNo,
        admission_no: admissionNo,
        full_name: fullName,
        roll_no: (formData.get("roll_no") as string)?.trim() || "101",
        class_name: className,
        section: (formData.get("section") as string) || "A",
        gender: (formData.get("gender") as string) || "Other",
        dob: (formData.get("dob") as string) || null,
        guardian_name: (formData.get("guardian_name") as string)?.trim() || "N/A",
        guardian_phone: guardianPhone,
        address: (formData.get("address") as string)?.trim() || "N/A",
        status: "Active",
        fee_status: (formData.get("fee_status") as string) || "Pending",
      };

      const { data, error } = await supabase.from("students").insert([payload]).select();
      if (error) {
        alert(`Failed to register student: ${error.message}`);
      } else if (data) {
        setStudents((prev) => [data[0], ...prev]);
        setShowAddStudent(false);
        alert("Student registered successfully!");
      }
    } catch (err: any) {
      alert("Unexpected error: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStudentDetails = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!addingMoreDetailsStudent) return;
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const updatedPayload = {
        roll_no: (formData.get("roll_no") as string)?.trim() || addingMoreDetailsStudent.roll_no || "101",
        gender: (formData.get("gender") as string) || addingMoreDetailsStudent.gender || "Other",
        dob: (formData.get("dob") as string) || addingMoreDetailsStudent.dob || null,
        blood_group: (formData.get("blood_group") as string) || addingMoreDetailsStudent.blood_group || "",
        aadhaar_no: (formData.get("aadhaar_no") as string)?.trim() || addingMoreDetailsStudent.aadhaar_no || "",
        guardian_name: (formData.get("guardian_name") as string)?.trim() || addingMoreDetailsStudent.guardian_name || "N/A",
        mother_name: (formData.get("mother_name") as string)?.trim() || addingMoreDetailsStudent.mother_name || "",
        guardian_phone: (formData.get("guardian_phone") as string)?.trim() || addingMoreDetailsStudent.guardian_phone,
        emergency_phone: (formData.get("emergency_phone") as string)?.trim() || addingMoreDetailsStudent.emergency_phone || "",
        email: (formData.get("email") as string)?.trim() || addingMoreDetailsStudent.email || "",
        address: (formData.get("address") as string)?.trim() || addingMoreDetailsStudent.address || "N/A",
        transport_mode: (formData.get("transport_mode") as string) || addingMoreDetailsStudent.transport_mode || "Self",
        fee_status: (formData.get("fee_status") as string) || addingMoreDetailsStudent.fee_status || "Pending",
        status: (formData.get("status") as string) || addingMoreDetailsStudent.status || "Active",
        medical_notes: (formData.get("medical_notes") as string)?.trim() || addingMoreDetailsStudent.medical_notes || "",
      };

      const { data, error } = await supabase
        .from("students")
        .update(updatedPayload)
        .eq("admission_no", addingMoreDetailsStudent.admission_no)
        .select();

      if (error) {
        alert(`Failed to update student details: ${error.message}`);
      } else if (data) {
        setStudents((prev) =>
          prev.map((s) => (s.admission_no === addingMoreDetailsStudent.admission_no ? { ...s, ...data[0] } : s))
        );
        if (selectedStudent?.admission_no === addingMoreDetailsStudent.admission_no) {
          setSelectedStudent({ ...selectedStudent, ...data[0] });
        }
        setAddingMoreDetailsStudent(null);
        alert("Student details updated successfully!");
      }
    } catch (err: any) {
      alert("Unexpected error: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      const fullName = (formData.get("full_name") as string)?.trim();
      const phone = (formData.get("phone") as string)?.trim();

      if (!fullName || !phone) {
        alert("Please enter Name and Phone number.");
        setIsSaving(false);
        return;
      }

      const prefix = staffCategory === "Teacher" ? "TCH" : staffCategory === "Office Staff" ? "OFF" : "SUP";
      const staffCode = `MPS-${prefix}-${101 + staffList.length}`;

      const payload = {
        id: staffCode,
        staff_id: staffCode,
        full_name: fullName,
        name: fullName,
        category: staffCategory,
        designation: (formData.get("designation") as string) || "Staff Member",
        gender: (formData.get("gender") as string) || "Other",
        email: (formData.get("email") as string) || null,
        phone: phone,
        contact: phone,
        qualification: (formData.get("qualification") as string) || "High School",
        subject: (formData.get("subject") as string) || "N/A",
        joining_date: (formData.get("joining_date") as string) || new Date().toISOString().split("T")[0],
        status: "Active",
        salary: parseFloat(formData.get("salary") as string) || 0,
      };

      const { data, error } = await supabase.from("staff").insert([payload]).select();
      if (error) {
        alert(`Failed to save staff: ${error.message}`);
      } else if (data) {
        setStaffList((prev) => [data[0], ...prev]);
        setShowAddStaff(false);
        alert(`${staffCategory} registered successfully!`);
      }
    } catch (err: any) {
      alert("Unexpected error: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClass = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const className = (formData.get("class_name") as string)?.trim();

    if (!className) {
      alert("Please enter Class Name.");
      setIsSaving(false);
      return;
    }

    const payload = {
      id: `CLS-${Date.now().toString().slice(-4)}`,
      class_name: className,
      section: (formData.get("section") as string) || "A",
      room_no: (formData.get("room_no") as string) || "N/A",
      capacity: parseInt(formData.get("capacity") as string) || 40,
      class_teacher_name: (formData.get("class_teacher_name") as string) || "Unassigned",
    };

    const { data, error } = await supabase.from("classes").insert([payload]).select();
    if (error) {
      alert(`Failed to add class: ${error.message}`);
    } else if (data) {
      setClassList((prev) => [...prev, data[0]]);
      setShowAddClass(false);
      alert("Class added successfully!");
    }
    setIsSaving(false);
  };

  const handleSaveNotice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();

    if (!title || !description) {
      alert("Please enter both Title and Description.");
      setIsSaving(false);
      return;
    }

    const payload = {
      title,
      description,
      category: (formData.get("category") as string) || "General",
      target_audience: (formData.get("target_audience") as string) || "All",
      posted_by: "Admin",
      date_posted: new Date().toISOString().split("T")[0],
    };

    const { data, error } = await supabase.from("notices").insert([payload]).select();
    if (error) {
      alert(`Failed to post notice: ${error.message}`);
    } else if (data) {
      setNoticesList((prev) => [data[0], ...prev]);
      setShowAddNotice(false);
      alert("Notice posted successfully!");
    }
    setIsSaving(false);
  };

  const handleSaveExamMarks = async (
    student: any,
    subjectMarks: Record<string, number>,
    subjectRemarks: Record<string, string>,
    overallRemarks: string,
    newStatus: "DRAFT" | "SUBMITTED" | "LOCKED"
  ) => {
    setIsSaving(true);
    const metrics = calculateResultMetrics(subjectMarks);
    const existingRecord = marksRecords[student.admission_no];

    const payload = {
      student_id: student.id || student.admission_no,
      admission_no: student.admission_no,
      student_name: student.full_name,
      class_name: selectedExamClass,
      section: selectedExamSection,
      exam_term_id: selectedTermId,
      subject_marks: subjectMarks,
      subject_remarks: subjectRemarks,
      overall_remarks: overallRemarks,
      total_obtained: metrics.totalObtained,
      total_max: metrics.totalMax,
      percentage: metrics.percentage,
      overall_grade: metrics.overallGrade,
      result_status: metrics.resultStatus,
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === "LOCKED" ? { locked_by: userRole, locked_at: new Date().toISOString() } : {}),
      ...(existingRecord?.status === "LOCKED" && userRole === "Admin" && newStatus !== "LOCKED"
        ? { unlocked_by: userRole }
        : {}),
    };

    let resultError = null;
    let savedData = null;

    if (existingRecord?.id) {
      const { data, error } = await supabase.from("student_marks").update(payload).eq("id", existingRecord.id).select();
      resultError = error;
      if (data) savedData = data[0];
    } else {
      const { data, error } = await supabase.from("student_marks").insert([payload]).select();
      resultError = error;
      if (data) savedData = data[0];
    }

    if (resultError) {
      alert(`Error saving marks: ${resultError.message}`);
    } else {
      setMarksRecords((prev) => ({ ...prev, [student.admission_no]: savedData || payload }));
      setEditingExamStudent(null);
      alert(`Marks saved successfully as ${newStatus}!`);
    }
    setIsSaving(false);
  };

  // --- REPORT CARD PRINT HELPERS ---
  const currentTermObj = examTerms.find((t) => t.id === selectedTermId) || { term_name: "Academic Term" };

  const handlePrintSingleCard = (student: any) => {
    const record = marksRecords[student.admission_no] || {
      subject_marks: { Mathematics: 85, Science: 90, English: 78, "Social Science": 84, "Hindi / Regional Language": 88 },
      subject_remarks: { Mathematics: "Strong problem solving skill" },
      overall_remarks: "Excellent effort and consistent academic progress.",
      total_obtained: 425,
      total_max: 500,
      percentage: 85.0,
      overall_grade: "A",
      result_status: "PASSED",
    };
    setPrintModalData([{ student, record, termName: currentTermObj.term_name }]);
  };

  const handlePrintAllClassCards = () => {
    const classStudents = students.filter((s) => s.class_name === selectedExamClass);
    const target = classStudents.length > 0 ? classStudents : [
      { admission_no: "ADM-2026-001", full_name: "Rahul Sharma", class_name: selectedExamClass, section: "A", roll_no: "101" },
      { admission_no: "ADM-2026-002", full_name: "Ananya Roy", class_name: selectedExamClass, section: "A", roll_no: "102" },
    ];

    const cards = target.map((st) => ({
      student: st,
      record: marksRecords[st.admission_no] || {
        subject_marks: { Mathematics: 80, Science: 82, English: 78, "Social Science": 84, "Hindi / Regional Language": 86 },
        subject_remarks: {},
        overall_remarks: "Good academic effort this term.",
        total_obtained: 410,
        total_max: 500,
        percentage: 82.0,
        overall_grade: "A",
        result_status: "PASSED",
      },
      termName: currentTermObj.term_name,
    }));
    setPrintModalData(cards);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER BAR */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Model Public School Admin Portal</h1>
            <p className="text-xs text-gray-500 mt-0.5">Comprehensive School & Academic Management Dashboard</p>
          </div>

          {activeTab === "exams" && (
            <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-xl border">
              <span className="text-[10px] font-bold text-gray-500 uppercase px-2">Simulate Role:</span>
              {(["Teacher", "Office Staff", "Admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRole(r)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    userRole === r ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {[
            { id: "exams", label: "Examination & Report Cards" },
            { id: "students", label: `Student Directory (${students.length})` },
            { id: "staff", label: `Teacher & Staff (${staffList.length})` },
            { id: "classes", label: `Class Directory (${classList.length})` },
            { id: "fees", label: `Fee Management (${feesList.length})` },
            { id: "notices", label: `Noticeboard (${noticesList.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id ? "bg-gray-900 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= 1. EXAMINATION DIRECTORY ================= */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Exam Term</label>
                <select
                  value={selectedTermId}
                  onChange={(e) => setSelectedTermId(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                >
                  {examTerms.map((t) => (
                    <option key={t.id} value={t.id}>{t.term_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Class</label>
                <select
                  value={selectedExamClass}
                  onChange={(e) => setSelectedExamClass(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                >
                  {Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Section</label>
                <select
                  value={selectedExamSection}
                  onChange={(e) => setSelectedExamSection(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-xs font-bold bg-white"
                >
                  <option value="A">Sec A</option>
                  <option value="B">Sec B</option>
                </select>
              </div>
            </div>

            <button
              onClick={handlePrintAllClassCards}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-sm"
            >
              🖨️ Print All Class Report Cards
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 border-b font-extrabold text-gray-500 uppercase">
                  <th className="p-4">Student</th>
                  <th className="p-4">Subject Marks</th>
                  <th className="p-4">Total Obtained</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4">Grade & Status</th>
                  <th className="p-4">Lock Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students
                  .filter((s) => s.class_name === selectedExamClass)
                  .map((st) => {
                    const record = marksRecords[st.admission_no];
                    const isLocked = record?.status === "LOCKED";
                    const metrics = calculateResultMetrics(record?.subject_marks || {});

                    return (
                      <tr key={st.admission_no} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{st.full_name}</div>
                          <div className="text-[11px] text-blue-600 font-mono font-semibold">{st.admission_no}</div>
                        </td>
                        <td className="p-4">
                          {record ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {CORE_SUBJECTS.map((sub) => (
                                <span key={sub.name} className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded font-mono font-semibold">
                                  {sub.name.slice(0, 3)}: {record.subject_marks?.[sub.name] ?? "-"}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No marks recorded</span>
                          )}
                        </td>
                        <td className="p-4 font-mono font-bold">
                          {record ? `${metrics.totalObtained} / ${metrics.totalMax}` : "-"}
                        </td>
                        <td className="p-4 font-bold">{record ? `${metrics.percentage}%` : "-"}</td>
                        <td className="p-4">
                          {record ? (
                            <div className="flex items-center space-x-1">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 font-bold rounded">
                                {metrics.overallGrade}
                              </span>
                              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                metrics.resultStatus === "PASSED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                              }`}>
                                {metrics.resultStatus}
                              </span>
                            </div>
                          ) : "-"}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            isLocked ? "bg-red-100 text-red-700" : record?.status === "SUBMITTED" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {isLocked ? "🔒 LOCKED" : record?.status || "OPEN"}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => setEditingExamStudent(st)}
                            disabled={isLocked && userRole !== "Admin"}
                            className="px-3 py-1 bg-blue-50 text-blue-600 rounded font-bold hover:bg-blue-100 disabled:opacity-40"
                          >
                            {isLocked && userRole !== "Admin" ? "Locked" : record ? "Edit Marks" : "Enter Marks"}
                          </button>
                          <button
                            onClick={() => handlePrintSingleCard(st)}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded font-bold hover:bg-emerald-100"
                          >
                            Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 2. STUDENT DIRECTORY ================= */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="flex items-center space-x-3 flex-1 min-w-[280px]">
              <input
                type="text"
                placeholder="Search name, admission #, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-xs outline-none bg-white font-medium"
              >
                <option value="All">All Classes</option>
                {Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowAddStudent(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              + Add New Student
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b font-extrabold text-gray-500 uppercase">
                  <th className="p-4">Adm No</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Class & Sec</th>
                  <th className="p-4">Guardian Details</th>
                  <th className="p-4">Fee Status</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students
                  .filter((s) => {
                    const matchesSearch =
                      s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.admission_no?.toLowerCase().includes(searchQuery.toLowerCase());
                    const matchesClass = selectedClassFilter === "All" || s.class_name === selectedClassFilter;
                    return matchesSearch && matchesClass;
                  })
                  .map((st) => (
                    <tr key={st.id || st.admission_no} className="hover:bg-gray-50">
                      <td className="p-4 font-mono font-bold text-blue-600">{st.admission_no}</td>
                      <td className="p-4 font-bold text-gray-900">{st.full_name}</td>
                      <td className="p-4 font-medium">{st.class_name} ({st.section || "A"})</td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-800">{st.guardian_name || "Parent"}</div>
                        <div className="text-[11px] text-gray-500">{st.guardian_phone}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          st.fee_status === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {st.fee_status || "Pending"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                          {st.status || "Active"}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => setSelectedStudent(st)} 
                          className="rounded bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => setAddingMoreDetailsStudent(st)} 
                          className="rounded bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
                        >
                          + Add More Details
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 3. TEACHER & STAFF DIRECTORY ================= */}
      {activeTab === "staff" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <h2 className="text-sm font-bold text-gray-800">Faculty & Staff Members</h2>
            <button
              onClick={() => setShowAddStaff(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition"
            >
              + Register Staff Member
            </button>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b font-extrabold text-gray-500 uppercase">
                  <th className="p-4">Staff ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Category & Designation</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4">Monthly Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staffList.map((sf) => (
                  <tr key={sf.id || sf.staff_id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-blue-600">{sf.staff_id || sf.id}</td>
                    <td className="p-4 font-bold text-gray-900">{sf.full_name || sf.name}</td>
                    <td className="p-4 font-medium">{sf.category} — {sf.designation}</td>
                    <td className="p-4 font-mono">{sf.phone || sf.contact}</td>
                    <td className="p-4 font-semibold text-purple-700">{sf.subject || "N/A"}</td>
                    <td className="p-4 font-mono font-bold">₹{sf.salary || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= 4. CLASS DIRECTORY ================= */}
      {activeTab === "classes" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <h2 className="text-sm font-bold text-gray-800">Academic Classrooms & Class Teachers</h2>
            <button
              onClick={() => setShowAddClass(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700"
            >
              + Add Class
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {classList.length > 0 ? (
              classList.map((cls) => (
                <div key={cls.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-gray-900">{cls.class_name}</h3>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                      Sec {cls.section || "A"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1 border-t pt-3">
                    <div>Class Teacher: <strong className="text-gray-800">{cls.class_teacher_name || "Unassigned"}</strong></div>
                    <div>Room Number: <strong className="text-gray-800">{cls.room_no || "N/A"}</strong></div>
                    <div>Max Capacity: <strong className="text-gray-800">{cls.capacity || 40} Students</strong></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center p-8 bg-white rounded-2xl border text-gray-400 text-xs">
                No class structures created. Click "+ Add Class" to configure one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= 5. FEE MANAGEMENT ================= */}
      {activeTab === "fees" && (
        <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b font-extrabold text-gray-500 uppercase">
                <th className="p-4">Adm No</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">Class</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Fee Type</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {feesList.length > 0 ? (
                feesList.map((fee) => (
                  <tr key={fee.id} className="hover:bg-gray-50">
                    <td className="p-4 font-mono font-bold text-blue-600">{fee.admission_no}</td>
                    <td className="p-4 font-bold text-gray-900">{fee.student_name}</td>
                    <td className="p-4">{fee.class_name}</td>
                    <td className="p-4 font-mono font-bold">₹{fee.amount}</td>
                    <td className="p-4">{fee.fee_type || "Tuition Fee"}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        fee.status === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {fee.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">No fee ledger records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ================= 6. NOTICEBOARD ================= */}
      {activeTab === "notices" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
            <h2 className="text-sm font-bold text-gray-800">School Noticeboard</h2>
            <button
              onClick={() => setShowAddNotice(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700"
            >
              + Post Announcement
            </button>
          </div>

          <div className="space-y-3">
            {noticesList.map((n) => (
              <div key={n.id} className="bg-white p-5 rounded-2xl border shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                      {n.category || "General"}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900 mt-1">{n.title}</h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{n.date_posted}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{n.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD STUDENT */}
      {showAddStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Register New Student</h2>
            <form onSubmit={handleSaveStudent} noValidate className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Full Name *</label>
                <input name="full_name" required placeholder="e.g. Rahul Sharma" className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Class *</label>
                  <select name="class_name" required className="w-full p-2 border rounded-lg bg-white outline-none">
                    {Array.from({ length: 10 }, (_, i) => `Class ${i + 1}`).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Section</label>
                  <select name="section" className="w-full p-2 border rounded-lg bg-white outline-none">
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Guardian Name</label>
                  <input name="guardian_name" placeholder="Parent / Guardian" className="w-full p-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Guardian Phone *</label>
                  <input name="guardian_phone" required placeholder="10-digit phone" className="w-full p-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Fee Status</label>
                  <select name="fee_status" className="w-full p-2 border rounded-lg bg-white outline-none">
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Admission No (Optional)</label>
                  <input name="admission_no" placeholder="Auto-generated if blank" className="w-full p-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => setShowAddStudent(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                  {isSaving ? "Saving..." : "Save Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: VIEW STUDENT DETAILS */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Student Profile & Details</h2>
                <p className="text-xs text-blue-600 font-mono font-bold">{selectedStudent.admission_no}</p>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">&times;</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Full Name</span>
                <span className="font-bold text-gray-900 text-sm">{selectedStudent.full_name}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Class & Section</span>
                <span className="font-bold text-gray-900">{selectedStudent.class_name} ({selectedStudent.section || "A"})</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Roll Number</span>
                <span className="font-bold text-gray-900">{selectedStudent.roll_no || "101"}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Gender & DOB</span>
                <span className="font-bold text-gray-900">{selectedStudent.gender || "Other"} | {selectedStudent.dob || "N/A"}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Guardian Name</span>
                <span className="font-bold text-gray-900">{selectedStudent.guardian_name || "Parent"}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Guardian Phone</span>
                <span className="font-bold text-gray-900 font-mono">{selectedStudent.guardian_phone || "N/A"}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl col-span-2">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Address</span>
                <span className="font-bold text-gray-900">{selectedStudent.address || "N/A"}</span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Fee Status</span>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedStudent.fee_status === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {selectedStudent.fee_status || "Pending"}
                </span>
              </div>
              <div className="p-2.5 bg-gray-50 rounded-xl">
                <span className="text-gray-400 block text-[10px] uppercase font-bold">Academic Status</span>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
                  {selectedStudent.status || "Active"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  setAddingMoreDetailsStudent(selectedStudent);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                + Edit / Add More Details
              </button>
              <button type="button" onClick={() => setSelectedStudent(null)} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT MORE DETAILS (COMPREHENSIVE MULTI-SECTION) */}
      {addingMoreDetailsStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add / Update Comprehensive Student Details</h2>
                <p className="text-xs text-gray-500">{addingMoreDetailsStudent.full_name} ({addingMoreDetailsStudent.admission_no})</p>
              </div>
              <button onClick={() => setAddingMoreDetailsStudent(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">&times;</button>
            </div>

            <form onSubmit={handleUpdateStudentDetails} className="space-y-4 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* SECTION 1: PERSONAL & IDENTIFICATION */}
              <div>
                <h3 className="font-bold text-blue-700 uppercase text-[10px] tracking-wider mb-2 border-b pb-1">1. Personal & Identification</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Roll Number</label>
                    <input name="roll_no" defaultValue={addingMoreDetailsStudent.roll_no || ""} placeholder="e.g. 101" className="w-full p-2 border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Gender</label>
                    <select name="gender" defaultValue={addingMoreDetailsStudent.gender || "Male"} className="w-full p-2 border rounded-lg bg-white outline-none">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Date of Birth</label>
                    <input type="date" name="dob" defaultValue={addingMoreDetailsStudent.dob || ""} className="w-full p-2 border rounded-lg outline-none bg-white" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Blood Group</label>
                    <select name="blood_group" defaultValue={addingMoreDetailsStudent.blood_group || "O+"} className="w-full p-2 border rounded-lg bg-white outline-none">
                      <option value="">Select</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-gray-600 mb-1">Aadhaar / National ID No</label>
                    <input name="aadhaar_no" defaultValue={addingMoreDetailsStudent.aadhaar_no || ""} placeholder="12-digit Aadhaar Number" className="w-full p-2 border rounded-lg outline-none" />
                  </div>
                </div>
              </div>

              {/* SECTION 2: FAMILY & CONTACT INFO */}
              <div>
                <h3 className="font-bold text-blue-700 uppercase text-[10px] tracking-wider mb-2 border-b pb-1">2. Family & Contact Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Father / Guardian Name</label>
                    <input name="guardian_name" defaultValue={addingMoreDetailsStudent.guardian_name || ""} placeholder="Father's Full Name" className="w-full p-2 border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Mother's Name</label>
                    <input name="mother_name" defaultValue={addingMoreDetailsStudent.mother_name || ""} placeholder="Mother's Full Name" className="w-full p-2 border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Primary Guardian Phone</label>
                    <input name="guardian_phone" defaultValue={addingMoreDetailsStudent.guardian_phone || ""} placeholder="10-digit primary number" className="w-full p-2 border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Emergency / Alternate Contact</label>
                    <input name="emergency_phone" defaultValue={addingMoreDetailsStudent.emergency_phone || ""} placeholder="Secondary phone number" className="w-full p-2 border rounded-lg outline-none" />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-gray-600 mb-1">Student / Parent Email</label>
                    <input type="email" name="email" defaultValue={addingMoreDetailsStudent.email || ""} placeholder="email@example.com" className="w-full p-2 border rounded-lg outline-none" />
                  </div>
                </div>
              </div>

              {/* SECTION 3: RESIDENCE, TRANSPORT & STATUS */}
              <div>
                <h3 className="font-bold text-blue-700 uppercase text-[10px] tracking-wider mb-2 border-b pb-1">3. Address, Transport & Status</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-gray-600 mb-1">Full Residential Address</label>
                    <textarea name="address" rows={2} defaultValue={addingMoreDetailsStudent.address || ""} placeholder="Complete street address, locality, city" className="w-full p-2 border rounded-lg outline-none resize-none" />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Transport Mode</label>
                    <select name="transport_mode" defaultValue={addingMoreDetailsStudent.transport_mode || "Self"} className="w-full p-2 border rounded-lg bg-white outline-none">
                      <option value="School Bus">School Bus</option>
                      <option value="Self / Private">Self / Private</option>
                      <option value="Walker">Walker</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Fee Status</label>
                    <select name="fee_status" defaultValue={addingMoreDetailsStudent.fee_status || "Pending"} className="w-full p-2 border rounded-lg bg-white outline-none">
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Academic Status</label>
                    <select name="status" defaultValue={addingMoreDetailsStudent.status || "Active"} className="w-full p-2 border rounded-lg bg-white outline-none">
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Transferred">Transferred / TC Issued</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 mb-1">Medical Notes / Allergies</label>
                    <input name="medical_notes" defaultValue={addingMoreDetailsStudent.medical_notes || ""} placeholder="e.g. Asthma, No specific allergy" className="w-full p-2 border rounded-lg outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t sticky bottom-0 bg-white">
                <button type="button" onClick={() => setAddingMoreDetailsStudent(null)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                  {isSaving ? "Saving..." : "Save All Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD STAFF */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Register Staff Member</h2>
            <form onSubmit={handleSaveStaff} noValidate className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Staff Category</label>
                <select value={staffCategory} onChange={(e) => setStaffCategory(e.target.value)} className="w-full p-2 border rounded-lg bg-white outline-none">
                  <option value="Teacher">Teacher</option>
                  <option value="Office Staff">Office Staff</option>
                  <option value="Support Staff">Support Staff</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Full Name *</label>
                <input name="full_name" required placeholder="Staff Full Name" className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Designation</label>
                  <input name="designation" placeholder="e.g. Senior Teacher" className="w-full p-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Phone Number *</label>
                  <input name="phone" required placeholder="10-digit number" className="w-full p-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Subject</label>
                  <input name="subject" placeholder="Primary Subject" className="w-full p-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Monthly Salary</label>
                  <input name="salary" type="number" placeholder="Salary in INR" className="w-full p-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => setShowAddStaff(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                  {isSaving ? "Saving..." : "Save Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD CLASS */}
      {showAddClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Add New Class</h2>
            <form onSubmit={handleSaveClass} noValidate className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Class Name *</label>
                <input name="class_name" required placeholder="e.g. Class 10" className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Section</label>
                  <input name="section" defaultValue="A" className="w-full p-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block font-bold text-gray-600 mb-1">Room No</label>
                  <input name="room_no" placeholder="R-101" className="w-full p-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Class Teacher</label>
                <input name="class_teacher_name" placeholder="Teacher Full Name" className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => setShowAddClass(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                  {isSaving ? "Saving..." : "Save Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD NOTICE */}
      {showAddNotice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Post Announcement</h2>
            <form onSubmit={handleSaveNotice} noValidate className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-600 mb-1">Notice Title *</label>
                <input name="title" required placeholder="Title" className="w-full p-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block font-bold text-gray-600 mb-1">Description *</label>
                <textarea name="description" rows={3} required placeholder="Details..." className="w-full p-2 border rounded-lg outline-none resize-none" />
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => setShowAddNotice(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
                  {isSaving ? "Posting..." : "Post Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: EXAM MARKS INPUT */}
      {editingExamStudent && (
        <ExamMarksModal
          student={editingExamStudent}
          existingRecord={marksRecords[editingExamStudent.admission_no]}
          userRole={userRole}
          onClose={() => setEditingExamStudent(null)}
          onSave={handleSaveExamMarks}
          isSaving={isSaving}
        />
      )}

      {/* MODAL 8: REPORT CARD PRINT */}
      {printModalData && (
        <ReportCardPrintModal cards={printModalData} onClose={() => setPrintModalData(null)} />
      )}
    </div>
  );
}

// SUB-COMPONENT: MARKS & DUAL REMARKS MODAL
function ExamMarksModal({ student, existingRecord, userRole, onClose, onSave, isSaving }: any) {
  const [subjectMarks, setSubjectMarks] = useState<Record<string, number>>(existingRecord?.subject_marks || {});
  const [subjectRemarks, setSubjectRemarks] = useState<Record<string, string>>(existingRecord?.subject_remarks || {});
  const [overallRemarks, setOverallRemarks] = useState<string>(
    existingRecord?.overall_remarks || "Demonstrates strong overall discipline and academic effort."
  );

  const isLocked = existingRecord?.status === "LOCKED";
  const canEdit = !isLocked || userRole === "Admin";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b pb-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Academic Marks Upload</h2>
            <p className="text-xs text-gray-500">{student.full_name} ({student.admission_no})</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">&times;</button>
        </div>

        <div className="space-y-2">
          {CORE_SUBJECTS.map((sub) => (
            <div key={sub.name} className="flex items-center space-x-2 text-xs">
              <span className="w-32 font-bold text-gray-800">{sub.name}</span>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!canEdit}
                value={subjectMarks[sub.name] ?? ""}
                onChange={(e) => setSubjectMarks({ ...subjectMarks, [sub.name]: parseInt(e.target.value) || 0 })}
                placeholder="0-100"
                className="w-20 p-1.5 border rounded-lg text-center font-bold font-mono outline-none disabled:bg-gray-100"
              />
              <input
                type="text"
                disabled={!canEdit}
                value={subjectRemarks[sub.name] ?? ""}
                onChange={(e) => setSubjectRemarks({ ...subjectRemarks, [sub.name]: e.target.value })}
                placeholder="Subject remark..."
                className="flex-1 p-1.5 border rounded-lg outline-none text-xs disabled:bg-gray-100"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1">Class Teacher Overall Remarks</label>
          <textarea
            rows={2}
            disabled={!canEdit}
            value={overallRemarks}
            onChange={(e) => setOverallRemarks(e.target.value)}
            className="w-full p-2 border rounded-xl text-xs outline-none resize-none disabled:bg-gray-100"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t">
          <button onClick={onClose} className="px-3 py-1.5 border rounded-xl text-xs font-bold text-gray-600">Cancel</button>
          {canEdit && (
            <button
              disabled={isSaving}
              onClick={() => onSave(student, subjectMarks, subjectRemarks, overallRemarks, "SUBMITTED")}
              className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
            >
              Submit Marks
            </button>
          )}
          {userRole === "Office Staff" && !isLocked && (
            <button
              disabled={isSaving}
              onClick={() => onSave(student, subjectMarks, subjectRemarks, overallRemarks, "LOCKED")}
              className="px-4 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700"
            >
              🔒 Lock Marks
            </button>
          )}
          {userRole === "Admin" && isLocked && (
            <button
              disabled={isSaving}
              onClick={() => onSave(student, subjectMarks, subjectRemarks, overallRemarks, "SUBMITTED")}
              className="px-4 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700"
            >
              🔓 Unlock Record (Admin Override)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// SUB-COMPONENT: REPORT CARD PRINT MODAL
function ReportCardPrintModal({ cards, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-3xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-3 bg-gray-900 text-white flex justify-between items-center print:hidden">
          <span className="text-xs font-bold">Report Card Print Preview ({cards.length} Student/s)</span>
          <div className="space-x-2">
            <button onClick={() => window.print()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold transition">
              Print Report Cards
            </button>
            <button onClick={onClose} className="text-gray-300 font-bold hover:text-white">&times;</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-100 print:bg-white print:p-0">
          {cards.map(({ student, record, termName }: any) => (
            <div key={student.admission_no} className="bg-white border-2 border-gray-900 p-6 space-y-4 print:page-break-after-always">
              <div className="text-center border-b-2 border-gray-900 pb-2">
                <h1 className="text-xl font-black uppercase tracking-wider">MODEL PUBLIC SCHOOL</h1>
                <p className="text-[10px] font-bold text-gray-600 uppercase">PROGRESS REPORT CARD — {termName}</p>
              </div>

              <div className="text-xs grid grid-cols-2 gap-2 border p-2 bg-gray-50">
                <div>Student Name: <strong>{student.full_name}</strong></div>
                <div>Admission No: <strong>{student.admission_no}</strong></div>
                <div>Class & Sec: <strong>{student.class_name || "Class 10"} ({student.section || "A"})</strong></div>
                <div>Roll No: <strong>{student.roll_no || "101"}</strong></div>
              </div>

              <table className="w-full text-left border border-gray-900 text-xs">
                <thead className="bg-gray-100 border-b border-gray-900 font-bold uppercase">
                  <tr>
                    <th className="p-1.5 border-r border-gray-900">Subject</th>
                    <th className="p-1.5 border-r border-gray-900 text-center w-16">Max</th>
                    <th className="p-1.5 border-r border-gray-900 text-center w-16">Obtained</th>
                    <th className="p-1.5">Subject Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {CORE_SUBJECTS.map((sub) => (
                    <tr key={sub.name} className="border-b border-gray-900">
                      <td className="p-1.5 border-r border-gray-900 font-semibold">{sub.name}</td>
                      <td className="p-1.5 border-r border-gray-900 text-center">{sub.maxMarks}</td>
                      <td className="p-1.5 border-r border-gray-900 text-center font-bold font-mono">
                        {record.subject_marks?.[sub.name] ?? 0}
                      </td>
                      <td className="p-1.5 text-gray-600 italic text-[11px]">{record.subject_remarks?.[sub.name] || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border border-gray-900 p-2 text-xs italic">
                <strong>Overall Teacher Remarks:</strong> "{record.overall_remarks || "Demonstrates good effort."}"
              </div>

              <div className="grid grid-cols-3 gap-2 pt-8 text-center text-[10px] font-bold text-gray-800">
                <div className="border-t border-gray-900 pt-1">Class Teacher</div>
                <div className="border-t border-gray-900 pt-1">Office Verified</div>
                <div className="border-t border-gray-900 pt-1">Principal Signature</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminPortal;