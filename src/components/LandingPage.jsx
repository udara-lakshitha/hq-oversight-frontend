import React from 'react';

export default function LandingPage({ setView }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-3xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-1.5 rounded-full text-blue-700 text-sm font-semibold tracking-wide shadow-sm">
          Next-Gen Evaluation Engine
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
          HQ-Oversight: <span className="text-blue-600">Combined Mathematics</span> Portal
        </h1>
        
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium">
          The premier automated ecosystem for tracking, evaluating, and mastering structural testing analytics for advanced level students across Sri Lanka.
        </p>

        <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => setView('login')}
            className="w-full sm:w-44 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Student Login
          </button>
          
          <button 
            onClick={() => setView('register')}
            className="w-full sm:w-44 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}