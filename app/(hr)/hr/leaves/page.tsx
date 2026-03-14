'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import PageWrapper from '@/components/layout/PageWrapper';
import { StaggeredStatsCentered } from '@/components/ui/StaggeredStats';

export default function HRLeavesPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Review dialog state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');
  const [hrComment, setHrComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const fetchLeaves = async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/leaves/all${params}`);
      const data = await res.json();
      setLeaves(data.requests || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openReview = (leave: any, action: 'approved' | 'rejected') => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setHrComment('');
    setReviewOpen(true);
  };

  const submitReview = async () => {
    if (!selectedLeave) return;
    setReviewing(true);
    try {
      const res = await fetch(`/api/leaves/${selectedLeave._id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reviewAction, hrComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Leave request ${reviewAction}`);
      setReviewOpen(false);
      fetchLeaves();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReviewing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 hover:bg-amber-100';
      case 'approved': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'rejected': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-slate-100 text-slate-800 hover:bg-slate-100';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'casual': return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'sick': return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'earned': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'unpaid': return 'bg-slate-100 text-slate-800 hover:bg-slate-100';
      default: return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    }
  };

  if (loading) return <div className="h-96 bg-white rounded-lg animate-pulse" />;

  const pendingCount = leaves.filter((l: any) => l.status === 'pending').length;

  return (
    <PageWrapper>
    <div className="space-y-4 sm:space-y-6">
      {/* Stats */}
      <StaggeredStatsCentered
        cards={[
          { label: 'Pending', value: pendingCount, color: 'text-amber-600' },
          { label: 'Approved', value: leaves.filter((l: any) => l.status === 'approved').length, color: 'text-green-600' },
          { label: 'Rejected', value: leaves.filter((l: any) => l.status === 'rejected').length, color: 'text-red-600' },
          { label: 'Total', value: leaves.length, color: 'text-slate-900' },
        ]}
        className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4"
      />

      {/* Filter */}
      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40 min-h-[44px] sm:min-h-0"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile card view */}
      <div className="sm:hidden space-y-3">
        {leaves.length === 0 ? (
          <p className="text-center py-8 text-slate-500">No leave requests</p>
        ) : leaves.map((leave: any) => (
          <Card key={leave._id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{leave.userId?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500">{leave.userId?.employeeId}</p>
                </div>
                <Badge className={getStatusBadge(leave.status)}>{leave.status}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge className={getTypeBadge(leave.leaveType)}>{leave.leaveType}</Badge>
                <span className="text-slate-500">{leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
              </div>
              <p className="text-xs text-slate-500">
                {format(new Date(leave.startDate), 'dd MMM')} - {format(new Date(leave.endDate), 'dd MMM yyyy')}
              </p>
              <p className="text-sm text-slate-600 line-clamp-2">{leave.reason}</p>
              {leave.status === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-9 flex-1 min-h-[44px]" onClick={() => openReview(leave, 'approved')}>Approve</Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-9 flex-1 min-h-[44px]" onClick={() => openReview(leave, 'rejected')}>Reject</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden sm:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead className="hidden lg:table-cell">Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No leave requests</TableCell></TableRow>
              ) : leaves.map((leave: any) => (
                <TableRow key={leave._id}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{leave.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">{leave.userId?.employeeId}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadge(leave.leaveType)}>{leave.leaveType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm hidden md:table-cell">
                    {format(new Date(leave.startDate), 'dd MMM')} — {format(new Date(leave.endDate), 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">{leave.totalDays}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate hidden lg:table-cell">{leave.reason}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(leave.status)}>{leave.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {leave.status === 'pending' ? (
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7" onClick={() => openReview(leave, 'approved')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-7" onClick={() => openReview(leave, 'rejected')}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {leave.reviewedAt ? format(new Date(leave.reviewedAt), 'dd MMM yyyy') : '—'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reviewAction === 'approved' ? 'Approve' : 'Reject'} Leave Request</DialogTitle>
          </DialogHeader>
          {selectedLeave && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <p className="text-sm"><strong>Employee:</strong> {selectedLeave.userId?.name}</p>
                <p className="text-sm"><strong>Type:</strong> {selectedLeave.leaveType}</p>
                <p className="text-sm"><strong>Dates:</strong> {format(new Date(selectedLeave.startDate), 'dd MMM yyyy')} — {format(new Date(selectedLeave.endDate), 'dd MMM yyyy')}</p>
                <p className="text-sm"><strong>Days:</strong> {selectedLeave.totalDays}</p>
                <p className="text-sm"><strong>Reason:</strong> {selectedLeave.reason}</p>
              </div>
              <div className="space-y-2">
                <Label>Comment (optional)</Label>
                <Textarea value={hrComment} onChange={(e) => setHrComment(e.target.value)} placeholder="Add a comment..." />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
                <Button
                  onClick={submitReview}
                  disabled={reviewing}
                  className={reviewAction === 'approved' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}
                >
                  {reviewing ? 'Processing...' : reviewAction === 'approved' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </PageWrapper>
  );
}
