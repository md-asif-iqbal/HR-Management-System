'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import PageWrapper from '@/components/layout/PageWrapper';
import { isNonEmptyText, isValidEmail } from '@/lib/frontendValidation';

export default function HREmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add employee dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    department: '',
    designation: '',
    role: 'employee',
    joiningDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (deptFilter !== 'all') params.set('department', deptFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/employees?${params}`);
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchEmployees, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, deptFilter, statusFilter]);

  const handleAddEmployee = async () => {
    if (!isNonEmptyText(newEmployee.name, 2)) {
      toast.error('Name must be at least 2 characters');
      return;
    }

    if (!isValidEmail(newEmployee.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!isNonEmptyText(newEmployee.password, 6)) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployee),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Employee ${data.employee.name} created (${data.employee.employeeId})`);
      setAddOpen(false);
      setNewEmployee({ name: '', email: '', password: '', phone: '', department: '', designation: '', role: 'employee', joiningDate: new Date().toISOString().split('T')[0] });
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEmployee = async (employee: any) => {
    const confirmed = window.confirm(`Delete ${employee.name} (${employee.employeeId})? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(employee._id);
    try {
      const res = await fetch(`/api/employees/${employee._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete employee');

      toast.success(data.message || 'Employee deleted');
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete employee');
    } finally {
      setDeletingId(null);
    }
  };

  const departments = Array.from(new Set(employees.map((e: any) => e.department).filter(Boolean)));

  if (loading) {
    return <div className="h-96 bg-white rounded-lg animate-pulse" />;
  }

  return (
    <PageWrapper>
    <div className="space-y-4 sm:space-y-6">
      {/* Filters / Actions */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
        <div className="flex-1 min-w-0 sm:min-w-[200px]">
          <Input
            placeholder="Search by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-[44px] sm:min-h-0"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-40 min-h-[44px] sm:min-h-0"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d: any) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-32 min-h-[44px] sm:min-h-0"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-700 text-white">+ Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={newEmployee.email} onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input type="password" value={newEmployee.password} onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={newEmployee.phone} onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={newEmployee.department} onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Designation</Label>
                  <Input value={newEmployee.designation} onChange={(e) => setNewEmployee({ ...newEmployee, designation: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newEmployee.role} onValueChange={(v) => setNewEmployee({ ...newEmployee, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Joining Date</Label>
                  <Input type="date" value={newEmployee.joiningDate} onChange={(e) => setNewEmployee({ ...newEmployee, joiningDate: e.target.value })} />
                </div>
              </div>
              <Button
                onClick={handleAddEmployee}
                disabled={adding || !newEmployee.name || !newEmployee.email || !newEmployee.password}
                className="w-full bg-slate-900 hover:bg-slate-700 text-white"
              >
                {adding ? 'Creating...' : 'Create Employee'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees - Mobile card view */}
      <div className="sm:hidden space-y-3">
        {employees.length === 0 ? (
          <p className="text-center py-8 text-slate-500">No employees found</p>
        ) : (
          employees.map((emp: any) => (
            <Card key={emp._id} className="cursor-pointer active:bg-slate-50" onClick={() => router.push(`/hr/employees/${emp._id}`)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold overflow-hidden flex-shrink-0">
                    {emp.avatar?.url ? (
                      <img src={emp.avatar.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      emp.name?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{emp.name}</p>
                    <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400">{emp.employeeId}</span>
                      <Badge className={emp.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100 text-[10px]' : 'bg-red-100 text-red-800 hover:bg-red-100 text-[10px]'}>
                        {emp.status || 'active'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingId === emp._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEmployee(emp);
                      }}
                    >
                      {deletingId === emp._id ? '...' : 'Delete'}
                    </Button>
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Employees Table - Desktop */}
      <Card className="hidden sm:block">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Designation</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">No employees found</TableCell>
                </TableRow>
              ) : (
                employees.map((emp: any) => (
                  <TableRow key={emp._id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/hr/employees/${emp._id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold overflow-hidden">
                          {emp.avatar?.url ? (
                            <img src={emp.avatar.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            emp.name?.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{emp.employeeId}</TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{emp.department || '—'}</TableCell>
                    <TableCell className="text-sm hidden lg:table-cell">{emp.designation || '—'}</TableCell>
                    <TableCell>
                      <Badge className={emp.role === 'hr' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 'bg-slate-100 text-slate-800 hover:bg-slate-100'}>
                        {emp.role?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={emp.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                        {emp.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); router.push(`/hr/employees/${emp._id}`); }}
                        >
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingId === emp._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEmployee(emp);
                          }}
                        >
                          {deletingId === emp._id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </PageWrapper>
  );
}
