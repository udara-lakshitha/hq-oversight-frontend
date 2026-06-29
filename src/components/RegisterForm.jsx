import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function RegisterForm({ setView }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!showToast) return;
    const toastTimer = setTimeout(() => {
      setShowToast(false);
    }, 4000);
    return () => clearTimeout(toastTimer);
  }, [showToast]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setView('login');
      return;
    }
    const redirectTimer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(redirectTimer);
  }, [countdown, setView]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setShowToast(false);

    const payload = {
      name,
      email,
      phone_number: phoneNumber,
      password,
      profile_pic_path: null
    };

    try {
      const response = await fetch(`${API_BASE_URL}/students/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage(`Success! Profile built. Assigned ID: STU-${data.id.toString().padStart(4, '0')}`);
        setShowToast(true);
        setName(''); setEmail(''); setPhoneNumber(''); setPassword('');
        setCountdown(3);
      } else {
        setIsError(true);
        setMessage(data.detail || 'Registration parameters failed architectural validation checks.');
        setShowToast(true);
      }
    } catch (error) {
      setIsError(true);
      setMessage('Network connectivity failure. Ensure FastAPI engine is online.');
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className={`fixed top-6 right-6 z-50 transform transition-all duration-300 ease-out max-w-sm w-full ${
        showToast ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'
      }`}>
        <div className={`p-4 rounded-lg shadow-2xl border flex items-start gap-3 ${
          isError 
            ? 'bg-red-50 border-red-200 text-red-950' 
            : 'bg-[#EBF7EE] border-[#1BA94C] text-[#194D26]'
        }`}>
          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white ${
            isError ? 'bg-red-600' : 'bg-[#1BA94C]'
          }`}>
            {isError ? '!' : '✓'}
          </div>

          <div className="flex-1 space-y-0.5">
            <h4 className={`text-xs font-black tracking-wider uppercase ${isError ? 'text-red-800' : 'text-[#1AA148]'}`}>
              {isError ? 'System Exception Error' : 'Success'}
            </h4>
            <p className="text-xs font-bold leading-relaxed opacity-95">{message}</p>
            {!isError && countdown !== null && (
              <p className="text-[10px] font-black text-[#2E7D42] italic pt-0.5">
                Routing to core console authentication in {countdown}s...
              </p>
            )}
          </div>

          <button onClick={() => setShowToast(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs px-1 cursor-pointer">
            ✕
          </button>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6 z-10">
        <div>
          <button 
            onClick={() => setView('landing')} 
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            ← Back to Main Menu
          </button>
          <h2 className="text-2xl font-black text-slate-900 mt-3">Student Registration</h2>
          <p className="text-sm font-medium text-slate-500">Set up your unified secure account layout profile</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Udara Lakshitha" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" disabled={countdown !== null} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" disabled={countdown !== null} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile number</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="0771234567" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" disabled={countdown !== null} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" disabled={countdown !== null} />
          </div>

          <button 
            type="submit" 
            disabled={countdown !== null}
            className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition-all duration-150 ${
              countdown !== null 
                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
          >
            {countdown !== null ? 'Initializing Redirect...' : 'Verify & Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}