'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { pulseRing } from '@/lib/animations';
import { generateDeviceFingerprint, DeviceInfo } from '@/lib/deviceFingerprint';

interface CheckInButtonProps {
  todayRecord: any;
  onUpdate: () => void;
}

export default function CheckInButton({ todayRecord, onUpdate }: CheckInButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<'loading' | 'registered' | 'unregistered' | 'disabled' | 'needs-password'>('loading');
  const [registering, setRegistering] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fingerprintUnavailableReason, setFingerprintUnavailableReason] = useState('');

  // Generate device fingerprint on mount
  useEffect(() => {
    (async () => {
      try {
        const result = await generateDeviceFingerprint();

        // Check registration status regardless of fingerprint result
        const res = await fetch('/api/device/register');
        const data = await res.json();

        if (!data.deviceTrackingEnabled) {
          setDeviceStatus('disabled');
          return;
        }

        if (!result.available) {
          // Browser cannot generate fingerprint → password fallback
          setFingerprintUnavailableReason(result.reason);
          setDeviceStatus('needs-password');
          return;
        }

        setDeviceInfo(result.info);

        if (data.hasDevice) {
          setDeviceStatus('registered');
        } else {
          setDeviceStatus('unregistered');
        }
      } catch {
        setDeviceStatus('needs-password'); // Safe fallback: require password
      }
    })();
  }, []);

  const handleRegisterDevice = async () => {
    if (!deviceInfo) return;
    setRegistering(true);
    try {
      const res = await fetch('/api/device/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceInfo),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Device registered successfully! You can now mark attendance from this device.');
      setDeviceStatus('registered');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      if (deviceStatus === 'needs-password') {
        if (!password.trim()) { toast.error('Please enter your password to verify identity.'); setLoading(false); return; }
        payload.fingerprintUnavailable = true;
        payload.password = password;
      } else {
        payload.deviceFingerprint = deviceInfo?.fingerprint;
      }
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowSuccess(true);
      setPassword('');
      toast.success(data.record.isLate ? `Checked in - Late by ${data.record.minutesLate} minutes` : 'Checked in on time!');
      setTimeout(() => { setShowSuccess(false); onUpdate(); }, 1200);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      if (deviceStatus === 'needs-password') {
        if (!password.trim()) { toast.error('Please enter your password to verify identity.'); setLoading(false); return; }
        payload.fingerprintUnavailable = true;
        payload.password = password;
      } else {
        payload.deviceFingerprint = deviceInfo?.fingerprint;
      }
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPassword('');
      toast.success(`Checked out! Working hours: ${data.record.workingHours}h`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Device registration required
  if (deviceStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-12 text-sm text-slate-500">
        Verifying device...
      </div>
    );
  }

  if (deviceStatus === 'unregistered') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          <p className="font-medium mb-1">📱 Device Registration Required</p>
          <p className="text-xs text-amber-700">
            Register this device to mark attendance. Once registered, only this device can be used for attendance. This prevents proxy attendance.
          </p>
        </div>
        <Button
          onClick={handleRegisterDevice}
          disabled={registering}
          className="w-full h-12 sm:h-14 text-base bg-amber-600 hover:bg-amber-700 text-white rounded-xl"
        >
          {registering ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Registering...
            </span>
          ) : (
            '📱 Register This Device'
          )}
        </Button>
        {deviceInfo && (
          <div className="text-xs text-slate-500 space-y-0.5">
            <p>{deviceInfo.browser} on {deviceInfo.os} • {deviceInfo.screenResolution}</p>
          </div>
        )}
      </motion.div>
    );
  }

  // Not checked in yet
  if (!todayRecord) {
    return (
      <div className="space-y-3">
        {/* Password fallback prompt */}
        {deviceStatus === 'needs-password' && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              <p className="font-medium mb-0.5">⚠️ Device fingerprint unavailable</p>
              <p>{fingerprintUnavailableReason || 'Your browser does not support device fingerprinting.'} Enter your password to verify identity before marking attendance.</p>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                placeholder="Enter your password"
                className="w-full h-10 px-3 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </motion.div>
        )}
        <div className="relative flex items-center justify-center">
          {/* Pulse ring */}
          {!loading && !showSuccess && deviceStatus !== 'needs-password' && (
            <motion.div
              variants={pulseRing}
              animate="pulse"
              className="absolute inset-0 rounded-xl bg-slate-900"
            />
          )}
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-full h-12 sm:h-14 rounded-xl bg-green-600 flex items-center justify-center text-white text-lg"
            >
              ✓
            </motion.div>
          ) : (
            <motion.div key="btn" className="w-full relative z-10" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.94 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
              <Button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full h-12 sm:h-14 text-base sm:text-lg min-h-[44px] bg-slate-900 hover:bg-slate-700 text-white rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Checking in...
                  </span>
                ) : (
                  '☀️ Check In'
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    );
  }

  // Checked in but not out
  if (!todayRecord.checkOutTime) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        {/* Password fallback prompt */}
        {deviceStatus === 'needs-password' && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
              <p className="font-medium mb-0.5">⚠️ Password required to check out</p>
              <p>Device fingerprinting unavailable. Enter your password to verify identity.</p>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckOut()}
                placeholder="Enter your password"
                className="w-full h-10 px-3 pr-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </motion.div>
        )}
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Checked in at</span>
          <span className="font-medium text-slate-900">
            {new Date(todayRecord.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </span>
        </div>
        {todayRecord.isLate && (
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded">
            Late by {todayRecord.minutesLate} minutes
          </motion.div>
        )}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleCheckOut}
            disabled={loading}
            variant="outline"
            className="w-full h-11 sm:h-12 text-sm sm:text-base min-h-[44px] border-slate-300"
          >
            {loading ? 'Checking out...' : '🌙 Check Out'}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // Both done
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Check In</span>
        <span className="font-medium">
          {new Date(todayRecord.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Check Out</span>
        <span className="font-medium">
          {new Date(todayRecord.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-500">Working Hours</span>
        <span className="font-medium">{todayRecord.workingHours}h</span>
      </div>
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`text-center text-xs font-medium px-2 py-1 rounded ${todayRecord.isLate ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
      >
        {todayRecord.isLate ? `Late by ${todayRecord.minutesLate} min` : 'On Time ✓'}
      </motion.div>
    </motion.div>
  );
}
