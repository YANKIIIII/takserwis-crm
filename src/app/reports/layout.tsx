'use client';

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="reports-layout flex flex-col w-full h-full">
      <div className="reports-content animate-fade-in w-full">
        {children}
      </div>
    </div>
  );
}
