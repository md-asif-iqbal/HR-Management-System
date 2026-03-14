'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface LeaveBalanceCardProps {
  total: number;
  used: number;
}

export default function LeaveBalanceCard({ total, used }: LeaveBalanceCardProps) {
  const remaining = total - used;
  const percentage = total > 0 ? (used / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">Leave Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between mb-2">
          <span className="text-2xl sm:text-3xl font-bold text-slate-900">{remaining}</span>
          <span className="text-xs sm:text-sm text-slate-500">of {total} remaining</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>{used} used</span>
          <span>{remaining} left</span>
        </div>
      </CardContent>
    </Card>
  );
}
