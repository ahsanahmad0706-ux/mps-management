import { Suspense } from "react";
import { SchoolApp } from "@/components/school-app";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-[#EFF6FF] text-xl font-bold text-[#2E3192]">
          Model Public School
        </div>
      }
    >
      <SchoolApp />
    </Suspense>
  );
}
