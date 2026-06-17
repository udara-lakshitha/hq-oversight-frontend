import React, { useState } from 'react';

export default function RegisterForm({ setView }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    const payload = {
      name,
      email,
      phone_number: phoneNumber,
      password,
      profile_pic_path: null
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setMessage(`Success! Registered successfully with Student ID: ${data.id}`);
        setName(''); setEmail(''); setPhoneNumber(''); setPassword('');
      } else {
        setIsError(true);
        setMessage(data.detail || 'Registration parameters failed validation check.');
      }
    } catch (error) {
      setIsError(true);
      setMessage('Network connectivity failure. Ensure FastAPI engine is online.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6">
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Udara Lakshitha" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Mobile number</label>
            <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="0771234567" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
          </div>

          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors duration-150 cursor-pointer">
            Verify & Create Profile
          </button>
        </form>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold text-center border ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}