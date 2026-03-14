'use client';

import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { badgeIn } from '@/lib/animations';

interface LeaveStatusBadgeProps {
  status: string;
}

export default function LeaveStatusBadge({ status }: LeaveStatusBadgeProps) {
  const badge = (() => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 gap-1.5">
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"
            />
            Pending
          </Badge>
        );
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  })();

  return (
    <motion.span variants={badgeIn} initial="hidden" animate="visible" className="inline-flex">
      {badge}
    </motion.span>
  );
}
