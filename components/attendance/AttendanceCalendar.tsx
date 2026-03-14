'use client';

import { useState, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { isWeekend, getHolidayName } from '@/lib/holidays';
import { scaleIn, staggerContainer } from '@/lib/animations';
import CountUp from 'react-countup';

interface AttendanceCalendarProps {
  records: any[];
  month: number;
  year: number;
  onMonthChange?: (month: number, year: number) => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AttendanceCalendar({ records, month, year, onMonthChange }: AttendanceCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef(0);

  const daysInMonth = new Date(year, month, 0).getDate();
  // getDay() returns 0=Sun → we need 0=Mon (ISO)
  const firstDayWeekday = new Date(year, month - 1, 1).getDay();
  const offset = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;

  const getRecord = useCallback(
    (day: number) => {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return records.find((r: any) => r.date === dateStr);
    },
    [records, month, year]
  );

  const getDayInfo = (day: number) => {
    const date = new Date(year, month - 1, day);
    const isWknd = isWeekend(date);
    const holidayName = getHolidayName(date);
    const isToday = isCurrentMonth && today.getDate() === day;
    const record = getRecord(day);

    if (holidayName && !record) {
      return { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400', label: holidayName, status: 'holiday', isToday, isWeekend: isWknd };
    }

    if (isWknd && !record) {
      return { bg: 'bg-slate-50', text: 'text-slate-400', dot: '', label: 'Weekend (Fri/Sat)', status: 'weekend', isToday, isWeekend: true };
    }

    if (!record) {
      return { bg: 'bg-white', text: 'text-slate-600', dot: '', label: 'No record', status: 'none', isToday, isWeekend: isWknd };
    }

    switch (record.status) {
      case 'present':
        return { bg: 'bg-green-50', text: 'text-green-800', dot: 'bg-green-500', label: `Present – On Time${holidayName ? ` (${holidayName})` : ''}`, status: 'present', isToday, isWeekend: isWknd, record };
      case 'late':
        return { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: `Late by ${record.minutesLate || '?'} min`, status: 'late', isToday, isWeekend: isWknd, record };
      case 'absent':
        return { bg: 'bg-red-100', text: 'text-red-800', dot: '', label: 'Absent', status: 'absent', isToday, isWeekend: isWknd, record };
      case 'on-leave':
        return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', label: 'On Leave', status: 'on-leave', isToday, isWeekend: isWknd, record };
      default:
        return { bg: 'bg-white', text: 'text-slate-600', dot: '', label: record.status, status: record.status, isToday, isWeekend: isWknd, record };
    }
  };

  const summary = {
    present: records.filter((r) => r.status === 'present').length,
    late: records.filter((r) => r.status === 'late').length,
    absent: records.filter((r) => r.status === 'absent').length,
    onLeave: records.filter((r) => r.status === 'on-leave').length,
  };

  const navMonth = (dir: -1 | 1) => {
    setDirection(dir);
    let newMonth = month + dir;
    let newYear = year;
    if (newMonth < 1) { newMonth = 12; newYear--; }
    if (newMonth > 12) { newMonth = 1; newYear++; }
    setSelectedDay(null);
    setFilterStatus(null);
    onMonthChange?.(newMonth, newYear);
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 60) navMonth(diff > 0 ? -1 : 1);
  };

  const toggleFilter = (status: string) => {
    setFilterStatus((prev) => (prev === status ? null : status));
  };

  const isHighlighted = (day: number) => {
    if (!filterStatus) return true;
    const info = getDayInfo(day);
    return info.status === filterStatus;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const slideVariants = {
    enter: (d: number) => ({ x: d * 30, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.25, ease: 'easeOut' as const } },
    exit: (d: number) => ({ x: d * -30, opacity: 0, transition: { duration: 0.2 } }),
  };

  return (
    <motion.div variants={scaleIn} initial="hidden" animate="visible" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
        <button
          onClick={() => navMonth(-1)}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.h3
            key={`${month}-${year}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="text-base sm:text-lg font-semibold text-slate-900"
          >
            {monthNames[month - 1]} {year}
          </motion.h3>
        </AnimatePresence>
        <button
          onClick={() => navMonth(1)}
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div
        className="p-3 sm:p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Day name headers — Fri (idx 4) & Sat (idx 5) are BD weekends */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d, idx) => (
            <div key={d} className={`text-center text-[10px] sm:text-xs font-medium uppercase py-1 ${idx === 4 || idx === 5 ? 'text-orange-400' : 'text-slate-400'}`}>
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d.charAt(0)}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`grid-${month}-${year}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div
              className="grid grid-cols-7 gap-1 sm:gap-1.5"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Empty offset cells */}
              {Array.from({ length: offset }, (_, i) => (
                <div key={`e-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const info = getDayInfo(day);
                const isSelected = selectedDay === day;
                const dimmed = !isHighlighted(day);

                return (
                  <motion.div
                    key={day}
                    variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } } }}
                    whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                    className="relative"
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                  >
                    <div
                      className={cn(
                        'aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer min-w-[44px] min-h-[44px] transition-colors duration-200',
                        isSelected
                          ? 'bg-slate-900 text-white'
                          : info.bg,
                        !isSelected && info.text,
                        info.isToday && !isSelected && 'ring-2 ring-slate-900 ring-offset-1',
                        info.status === 'absent' && !isSelected && 'border border-red-200',
                        dimmed && 'opacity-30',
                      )}
                    >
                      <span className={cn('text-xs sm:text-sm', info.isToday && 'font-bold')}>{day}</span>
                      {info.dot && !isSelected && <span className={cn('w-1.5 h-1.5 rounded-full mt-0.5', info.dot)} />}
                      {info.status === 'absent' && !isSelected && <span className="text-red-500 text-[8px] sm:text-[10px] leading-none mt-0.5">&times;</span>}
                      {info.status === 'holiday' && !isSelected && <span className="text-orange-500 text-[7px] leading-none mt-0.5 font-bold">PH</span>}
                      {info.status === 'weekend' && !isSelected && <span className="text-slate-400 text-[7px] leading-none mt-0.5">W</span>}
                    </div>

                    {/* Tooltip */}
                    <AnimatePresence>
                      {hoveredDay === day && (info.record || info.status === 'holiday' || info.status === 'weekend') && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 pointer-events-none"
                        >
                          <div className="bg-slate-900 text-white text-[10px] sm:text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
                            <p className="font-medium">{info.label}</p>
                            {info.record?.checkInTime && (
                              <p className="text-slate-300">In: {new Date(info.record.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                            )}
                            {info.record?.checkOutTime && (
                              <p className="text-slate-300">Out: {new Date(info.record.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                            )}
                            {info.record?.workingHours != null && (
                              <p className="text-slate-300">{info.record.workingHours}h worked</p>
                            )}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Legend */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 sm:px-6 py-3 border-t border-slate-50"
      >
        {[
          { dot: 'bg-green-500', label: 'Present' },
          { dot: 'bg-red-500', label: 'Late' },
          { dot: 'bg-red-300', label: 'Absent', border: true },
          { dot: 'bg-blue-500', label: 'On Leave' },
          { dot: 'bg-slate-300', label: 'Weekend (Fri/Sat)' },
          { dot: 'bg-orange-400', label: 'Public Holiday' },
        ].map((item) => (
          <motion.span
            key={item.label}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            className="flex items-center gap-1.5 text-[10px] sm:text-xs text-slate-500"
          >
            <span className={cn('w-2 h-2 rounded-full', item.dot, item.border && 'ring-1 ring-red-300')} />
            {item.label}
          </motion.span>
        ))}
      </motion.div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 px-4 sm:px-6 pb-4">
        {[
          { key: 'present', label: 'Present', val: summary.present, color: 'bg-green-50 text-green-700 border-green-200' },
          { key: 'late', label: 'Late', val: summary.late, color: 'bg-red-50 text-red-700 border-red-200' },
          { key: 'absent', label: 'Absent', val: summary.absent, color: 'bg-red-50 text-red-600 border-red-200' },
          { key: 'on-leave', label: 'On Leave', val: summary.onLeave, color: 'bg-blue-50 text-blue-700 border-blue-200' },
        ].map((pill) => (
          <button
            key={pill.key}
            onClick={() => toggleFilter(pill.key)}
            className={cn(
              'text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200',
              filterStatus === pill.key ? 'ring-2 ring-slate-900 ring-offset-1' : '',
              pill.color,
            )}
          >
            {pill.label}{' '}
            <CountUp key={`${month}-${year}-${pill.key}`} end={pill.val} duration={1} preserveValue />
          </button>
        ))}
      </div>
    </motion.div>
  );
}
