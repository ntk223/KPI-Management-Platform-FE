import React from 'react';
import { DashboardLayout } from './layouts';
import { LoginForm, useAuth } from './features/auth';

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout currentUser={user || undefined}>
      <div className="space-y-6">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-blue-700 via-primary to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-y-6 translate-x-6">
            <svg className="w-80 h-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0 4H7v-2h10v2zm0-8H7V7h10v2z" />
            </svg>
          </div>
          
          <div className="max-w-xl">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hệ Thống Quản Trị KPI
            </h1>
            <p className="mt-2 text-blue-100 text-sm leading-relaxed">
              Chào mừng bạn đến với Cổng quản lý KPI Tập đoàn. Đây là giao diện nguyên mẫu (Prototype) sử dụng kiến trúc Feature-Based, TypeScript, và TailwindCSS mở rộng.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20 font-medium">Vite + React</span>
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20 font-medium">TypeScript Strict</span>
              <span className="bg-white/10 px-3 py-1 rounded-full border border-white/20 font-medium">Modular Architecture</span>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column - Mock stats and metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-success/10 text-success rounded-xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tiến độ cá nhân</p>
                  <p className="text-2xl font-bold text-slate-800">84.5%</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ngày còn lại (Q3)</p>
                  <p className="text-2xl font-bold text-slate-800">45 ngày</p>
                </div>
              </div>
            </div>

            {/* Department KPIs Simulation */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800 text-lg">KPIs Phòng Ban (Demo)</h3>
                <span className="text-xs text-slate-500 font-medium">Cập nhật: Hôm nay</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                    <span>1. Hoàn thiện Core API System</span>
                    <span>90%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '90%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                    <span>2. Tối ưu hóa UI/UX Core Flow</span>
                    <span>65%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-role-manager h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600">
                    <span>3. Viết Unit Test & Integration Test</span>
                    <span>30%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-danger h-2 rounded-full" style={{ width: '30%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Auth LoginForm Component */}
          <div className="flex flex-col justify-start">
            <LoginForm />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default App;

