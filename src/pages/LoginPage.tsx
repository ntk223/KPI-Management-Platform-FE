import React from 'react';
import { LoginForm } from '../features/auth';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative abstract elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl transform -translate-x-12 -translate-y-12 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full filter blur-3xl transform translate-x-12 translate-y-12 pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6 z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-md text-xl">
            K
          </div>
          <span className="text-slate-800 font-extrabold tracking-wider text-lg uppercase">KPI Portal</span>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <LoginForm />
      </div>
    </div>
  );
};
