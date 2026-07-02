import React, { useState, useEffect } from 'react';
import api from '../config/api';
import Dashboard from './Dashboard';

export default function Login({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forceUpdateMode, setForceUpdateMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [stepTwoRequired, setStepTwoRequired] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [successUser, setSuccessUser] = useState(null);

  useEffect(() => {
    if (!showToast) return;
    const toastTimer = setTimeout(() => { setShowToast(false); }, 4000);
    return () => clearTimeout(toastTimer);
  }, [showToast]);

  const saveSessionAndAuthenticate = (data) => {
    if (data.student.is_temporary_password) {
      setForceUpdateMode(true);
      return;
    }

    localStorage.setItem('access_token', data.access_token);
    if (data.device_token) {
      localStorage.setItem('device_token', data.device_token);
    }
    
    setIsError(false);
    setMessage(`Session authenticated. Welcome back, ${data.student.name}!`);
    setShowToast(true);
    setSuccessUser(data.student);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setShowToast(false);
    const existingDeviceToken = localStorage.getItem('device_token');

    try {
      const response = await api.post('/auth/login', {
        email: email,
        password: password,
        device_token: existingDeviceToken || null,
      });

      if (response.data.step_two_required) {
        setStepTwoRequired(true);
        setIsError(false);
        setMessage('Verification passkey dispatched to registered mailbox.');
        setShowToast(true);
      } else {
        saveSessionAndAuthenticate(response.data);
      }
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.detail || 'Invalid credential parameters matched.');
      setShowToast(true);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("email", email);
      await api.post('/auth/forgot-password', formData);
      
      setIsError(false);
      setMessage("🔑 Temporary password transmitted! Check your email console.");
      setShowToast(true);
      setIsForgotMode(false);
    } catch (err) {
      setIsError(true);
      setMessage("Failed to run account recovery sequence.");
      setShowToast(true);
    }
  };

  const handleForceUpdateSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("❌ Passwords do not match.");
      setShowToast(true);
      return;
    }

    try {
      await api.post('/auth/update-forced-password', {
        email: email,
        new_password: newPassword,
        confirm_password: confirmPassword
      });

      setIsError(false);
      setMessage("🎉 Password successfully synchronized! Please login with your new password.");
      setShowToast(true);
      
      setForceUpdateMode(false);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.detail || "Validation error on password rewrite.");
      setShowToast(true);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); setIsError(false); setShowToast(false);
    try {
      const response = await api.post('/auth/verify-otp', { email: email, otp_code: otpCode });
      saveSessionAndAuthenticate(response.data);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.detail || 'Incorrect security verification passcode.');
      setShowToast(true);
    }
  };

  if (successUser && !forceUpdateMode) {
    return <Dashboard student={successUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      <div className={`fixed top-6 right-6 z-50 transform transition-all duration-300 ease-out max-w-sm w-full ${showToast ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'}`}>
        <div className={`p-4 rounded-lg shadow-2xl border flex items-start gap-3 ${isError ? 'bg-red-50 border-red-200 text-red-950' : 'bg-[#EBF7EE] border-[#1BA94C] text-[#194D26]'}`}>
          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white ${isError ? 'bg-red-600' : 'bg-[#1BA94C]'}`}>
            {isError ? '!' : '✓'}
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className={`text-xs font-black tracking-wider uppercase ${isError ? 'text-red-800' : 'text-[#1AA148]'}`}>
              {isError ? 'System Alert' : 'Success'}
            </h4>
            <p className="text-xs font-bold leading-relaxed opacity-95">{message}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs px-1 cursor-pointer">✕</button>
        </div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 space-y-6 z-10">
        
        {forceUpdateMode ? (
          <>
            <div>
              <h2 className="text-2xl font-black text-slate-900">Configure New Password</h2>
              <p className="text-sm font-medium text-amber-600 mt-1">⚠️ You logged in with a temporary password. Update it now to lock down your account.</p>
            </div>
            <form onSubmit={handleForceUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
              </div>
              <button type="submit" className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition-all duration-150 cursor-pointer">
                Save & Update Credentials
              </button>
            </form>
          </>
        ) : isForgotMode ? (
          
          <>
            <div>
              <button onClick={() => setIsForgotMode(false)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer">
                ← Back to Login
              </button>
              <h2 className="text-2xl font-black text-slate-900 mt-3">Recover Password</h2>
              <p className="text-sm font-medium text-slate-500">Provide account email to fetch a runtime passkey string</p>
            </div>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Registered Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
              </div>
              <button type="submit" className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all duration-150 cursor-pointer">
                Transmit Temporary Key
              </button>
            </form>
          </>
        ) : (
          
          <>
            <div>
              <button onClick={() => setView('landing')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer">
                ← Back to Main Menu
              </button>
              <h2 className="text-2xl font-black text-slate-900 mt-3">
                {!stepTwoRequired ? 'Student Authentication' : 'Device Verification Check'}
              </h2>
              <p className="text-sm font-medium text-slate-500">
                {!stepTwoRequired ? 'Access your unified secure study account' : 'Verify execution block fingerprint'}
              </p>
            </div>

            {!stepTwoRequired ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Password Registry</label>
                    <button type="button" onClick={() => setIsForgotMode(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer outline-none">
                      Forgot Password?
                    </button>
                  </div>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••••••" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-800" />
                </div>

                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all duration-150 cursor-pointer">
                  Validate Credentials
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="bg-blue-50 text-blue-950 text-xs font-bold p-3 rounded-xl border border-blue-200 leading-relaxed">
                  🔒 Security infrastructure has generated a cryptographic token signature block. Confirm payload token matrix below:
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 text-center">6-Digit Access Token Code</label>
                  <input type="text" maxLength="6" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required placeholder="000000" className="w-full px-4 py-3 tracking-[0.5em] text-center text-2xl font-black rounded-xl border border-slate-200 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all text-slate-800 bg-slate-50" />
                </div>
                <button type="submit" className="w-full py-3 bg-[#1BA94C] hover:bg-[#15873c] text-white font-bold rounded-xl shadow-md transition-all duration-150 cursor-pointer">
                  Authorize Device Block & Log In
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}