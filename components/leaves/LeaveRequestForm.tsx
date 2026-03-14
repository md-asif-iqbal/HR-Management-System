'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { countWorkingDays } from '@/lib/helpers';
import { isNonEmptyText } from '@/lib/frontendValidation';

interface LeaveRequestFormProps {
  balance: { totalLeaves: number; usedLeaves: number; remainingLeaves: number };
  onSuccess: () => void;
}

export default function LeaveRequestForm({ balance, onSuccess }: LeaveRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [calculatedDays, setCalculatedDays] = useState(0);

  const today = new Date().toISOString().split('T')[0];

  const handleDateChange = (start: string, end: string) => {
    if (start && end) {
      const days = countWorkingDays(new Date(start), new Date(end));
      setCalculatedDays(days);
    } else {
      setCalculatedDays(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leaveType) {
      toast.error('Please select a leave type');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please select start and end date');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    if (!isNonEmptyText(reason, 3)) {
      toast.error('Reason must be at least 3 characters');
      return;
    }

    if (calculatedDays <= 0) {
      toast.error('Selected dates do not contain valid working days');
      return;
    }

    if (calculatedDays > balance.remainingLeaves) {
      toast.error('Selected leave days exceed your remaining balance');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/leaves/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveType, startDate, endDate, reason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Leave request submitted successfully');
      setLeaveType('');
      setStartDate('');
      setEndDate('');
      setReason('');
      setCalculatedDays(0);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Apply for Leave</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="casual">Casual Leave</SelectItem>
                  <SelectItem value="earned">Earned Leave</SelectItem>
                  <SelectItem value="emergency">Emergency Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Days (auto-calculated)</Label>
              <div className="h-10 flex items-center px-3 border rounded-md bg-slate-50 text-sm">
                {calculatedDays > 0 ? (
                  <span>
                    {calculatedDays} working day{calculatedDays > 1 ? 's' : ''}
                    {calculatedDays > balance.remainingLeaves && (
                      <span className="text-red-500 ml-2">(Exceeds balance!)</span>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-400">Select dates</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleDateChange(e.target.value, endDate);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                min={startDate || today}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleDateChange(startDate, e.target.value);
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Textarea
              placeholder="Provide reason for leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !leaveType || !startDate || !endDate || !reason || calculatedDays === 0}
            className="w-full bg-slate-900 hover:bg-slate-700 text-white"
          >
            {loading ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
