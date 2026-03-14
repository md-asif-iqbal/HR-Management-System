'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { getDocumentIcon, formatFileSize, getStatusColor } from '@/lib/helpers';
import PageWrapper from '@/components/layout/PageWrapper';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';
import { isNonEmptyText, isNonNegativeNumber, isValidEmail, toSafeNumber } from '@/lib/frontendValidation';

type ViewMode = 'tabs' | 'full';

interface ChangeEntry {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
}

interface UpdateLog {
  _id: string;
  section: string;
  sectionLabel: string;
  updatedByName: string;
  updatedByRole: string;
  updatedBy?: { name?: string; avatar?: { url?: string } };
  changes: ChangeEntry[];
  createdAt: string;
}

export default function HREmployeeDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [sameAddress, setSameAddress] = useState(false);
  const [attMonth, setAttMonth] = useState(new Date().getMonth() + 1);
  const [attYear, setAttYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('tabs');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('');
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<UpdateLog[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const historyTotal = useRef(0);
  const [editingSection, setEditingSection] = useState<string | null>(null);

  const fetchEmployee = useCallback(async () => {
    try {
      const [empRes, docRes] = await Promise.all([
        fetch(`/api/employees/${id}`),
        fetch(`/api/employees/${id}/documents`),
      ]);
      const empData = await empRes.json();
      const docData = await docRes.json();
      if (!empRes.ok) throw new Error(empData.error);
      setEmployee(empData.employee);
      setDocuments(docData.documents || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await fetch(`/api/reports/employee/${id}?month=${attMonth}&year=${attYear}`);
      const data = await res.json();
      setAttendanceRecords(data.records || []);
    } catch (err) {
      console.error(err);
    }
  }, [id, attMonth, attYear]);

  const fetchHistory = useCallback(async (section?: string) => {
    setHistoryLoading(true);
    try {
      const sectionParam = section && section !== 'all' ? `&section=${section}` : '';
      const res = await fetch(`/api/employees/${id}/history?limit=50${sectionParam}`);
      const data = await res.json();
      setHistoryLogs(data.logs || []);
      historyTotal.current = data.total || 0;
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEmployee(); }, [fetchEmployee]);
  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  useEffect(() => {
    if (historyOpen) fetchHistory(historyFilter);
  }, [historyOpen, historyFilter, fetchHistory]);

  const saveProfile = async (section: string, data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setEmployee(result.employee);
      toast.success(`${section} updated`);
      setSavedSection(section);
      setEditingSection(null);
      setTimeout(() => setSavedSection(null), 2000);
      if (historyOpen) fetchHistory(historyFilter);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/employees/${id}/avatar`, { method: 'PATCH', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmployee(data.employee);
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDocUpload = async () => {
    if (!selectedFile || !docType || !docName) return;
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadRes = await fetch('/api/upload/document', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);
      const docRes = await fetch(`/api/employees/${id}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: docType,
          documentName: docName,
          fileUrl: uploadData.url,
          deleteUrl: uploadData.deleteUrl,
          storageType: uploadData.storageType,
          fileType: uploadData.fileType,
          fileSize: uploadData.fileSize,
        }),
      });
      if (!docRes.ok) throw new Error('Failed to save document');
      toast.success('Document uploaded');
      setDocType(''); setDocName(''); setSelectedFile(null);
      fetchEmployee();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const verifyDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/employees/${id}/documents/${docId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true }),
      });
      if (!res.ok) throw new Error('Failed to verify');
      toast.success('Document verified');
      fetchEmployee();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/employees/${id}/documents/${docId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Document deleted');
      fetchEmployee();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const openDocument = (doc: any) => {
    if (doc.storageType === 'base64') {
      const base64 = doc.fileUrl.split(',')[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      window.open(URL.createObjectURL(blob), '_blank');
    } else {
      window.open(doc.fileUrl, '_blank');
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => setSelectedFile(files[0]),
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'application/pdf': [] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  if (loading) return <div className="h-96 bg-white rounded-lg animate-pulse" />;
  if (!employee) return <p className="text-center text-slate-500">Employee not found</p>;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const sectionHighlight = (s: string) => savedSection === s ? 'ring-2 ring-green-400 transition-all duration-500' : '';

  const FullSection = ({ title, sectionKey, children, onSave }: { title: string; sectionKey: string; children: React.ReactNode; onSave: () => void }) => {
    const isEditing = editingSection === sectionKey;
    return (
      <motion.div variants={staggerItem} className={`relative pl-6 border-l-2 border-slate-200 pb-6 ${sectionHighlight(title)}`}>
        <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-slate-400" />
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={() => setEditingSection(sectionKey)} className="text-slate-500 hover:text-slate-700 gap-1.5 h-8">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>
                Edit
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => setEditingSection(null)} className="h-8">Cancel</Button>
                <Button size="sm" onClick={onSave} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white h-8">{saving ? 'Saving...' : 'Save'}</Button>
              </>
            )}
          </div>
        </div>
        <div className={isEditing ? '' : 'pointer-events-none opacity-80'}>{children}</div>
      </motion.div>
    );
  };

  const InfoRow = ({ label, value }: { label: string; value: any }) => (
    <div className="py-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
    </div>
  );

  const PersonalInfoForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2"><Label>Name</Label><Input value={employee.name || ''} onChange={(e) => setEmployee({ ...employee, name: e.target.value })} /></div>
      <div className="space-y-2"><Label>Email</Label><Input type="email" value={employee.email || ''} onChange={(e) => setEmployee({ ...employee, email: e.target.value })} /></div>
      <div className="space-y-2"><Label>Phone</Label><Input value={employee.phone || ''} onChange={(e) => setEmployee({ ...employee, phone: e.target.value })} /></div>
      <div className="space-y-2"><Label>Alternate Phone</Label><Input value={employee.alternatePhone || ''} onChange={(e) => setEmployee({ ...employee, alternatePhone: e.target.value })} /></div>
      <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : ''} onChange={(e) => setEmployee({ ...employee, dateOfBirth: e.target.value })} /></div>
      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={employee.gender || ''} onValueChange={(v) => setEmployee({ ...employee, gender: v })}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Blood Group</Label><Input value={employee.bloodGroup || ''} onChange={(e) => setEmployee({ ...employee, bloodGroup: e.target.value })} /></div>
      <div className="space-y-2">
        <Label>Marital Status</Label>
        <Select value={employee.maritalStatus || ''} onValueChange={(v) => setEmployee({ ...employee, maritalStatus: v })}>
          <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="married">Married</SelectItem>
            <SelectItem value="divorced">Divorced</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>NID Number</Label><Input value={employee.nidNumber || ''} onChange={(e) => setEmployee({ ...employee, nidNumber: e.target.value })} /></div>
      <div className="space-y-2"><Label>Nationality</Label><Input value={employee.nationality || ''} onChange={(e) => setEmployee({ ...employee, nationality: e.target.value })} /></div>
      <div className="space-y-2"><Label>Religion</Label><Input value={employee.religion || ''} onChange={(e) => setEmployee({ ...employee, religion: e.target.value })} /></div>
    </div>
  );

  const JobInfoForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Employee ID <span className="text-xs text-slate-400 font-normal">(Company ID)</span></Label>
        <Input value={employee.employeeId || ''} placeholder="e.g. EMP-001" onChange={(e) => setEmployee({ ...employee, employeeId: e.target.value })} />
      </div>
      <div className="space-y-2"><Label>Department</Label><Input value={employee.department || ''} onChange={(e) => setEmployee({ ...employee, department: e.target.value })} /></div>
      <div className="space-y-2"><Label>Designation</Label><Input value={employee.designation || ''} onChange={(e) => setEmployee({ ...employee, designation: e.target.value })} /></div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={employee.role || 'employee'} onValueChange={(v) => setEmployee({ ...employee, role: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="hr">HR</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={employee.status || 'active'} onValueChange={(v) => setEmployee({ ...employee, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Joining Date</Label><Input type="date" value={employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : ''} onChange={(e) => setEmployee({ ...employee, joiningDate: e.target.value })} /></div>
      <div className="space-y-2"><Label>Total Leaves</Label><Input type="number" value={employee.totalLeaves ?? 12} onChange={(e) => setEmployee({ ...employee, totalLeaves: e.target.value })} /></div>
    </div>
  );

  const AddressForm = () => (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-slate-600">Present Address</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['street', 'city', 'district', 'division', 'postalCode', 'country'].map((f) => (
          <div key={f} className="space-y-2">
            <Label className="capitalize">{f.replace(/([A-Z])/g, ' $1')}</Label>
            <Input value={employee.presentAddress?.[f] || ''} onChange={(e) => setEmployee({ ...employee, presentAddress: { ...employee.presentAddress, [f]: e.target.value } })} />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox checked={sameAddress} onCheckedChange={(c) => { setSameAddress(!!c); if (c) setEmployee({ ...employee, permanentAddress: { ...employee.presentAddress } }); }} />
        <Label className="text-sm">Same as present address</Label>
      </div>
      <h4 className="font-medium text-sm text-slate-600">Permanent Address</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['street', 'city', 'district', 'division', 'postalCode', 'country'].map((f) => (
          <div key={f} className="space-y-2">
            <Label className="capitalize">{f.replace(/([A-Z])/g, ' $1')}</Label>
            <Input value={employee.permanentAddress?.[f] || ''} disabled={sameAddress} onChange={(e) => setEmployee({ ...employee, permanentAddress: { ...employee.permanentAddress, [f]: e.target.value } })} />
          </div>
        ))}
      </div>
    </div>
  );

  const EmergencyForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {['name', 'relationship', 'phone', 'address'].map((f) => (
        <div key={f} className="space-y-2">
          <Label className="capitalize">{f}</Label>
          <Input value={employee.emergencyContact?.[f] || ''} onChange={(e) => setEmployee({ ...employee, emergencyContact: { ...employee.emergencyContact, [f]: e.target.value } })} />
        </div>
      ))}
    </div>
  );

  const SalaryForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2"><Label>Basic Salary</Label><Input type="number" value={employee.salary?.basic ?? ''} onChange={(e) => setEmployee({ ...employee, salary: { ...employee.salary, basic: e.target.value } })} /></div>
      <div className="space-y-2"><Label>House Rent</Label><Input type="number" value={employee.salary?.houseRent ?? ''} onChange={(e) => setEmployee({ ...employee, salary: { ...employee.salary, houseRent: e.target.value } })} /></div>
      <div className="space-y-2"><Label>Medical Allowance</Label><Input type="number" value={employee.salary?.medicalAllowance ?? ''} onChange={(e) => setEmployee({ ...employee, salary: { ...employee.salary, medicalAllowance: e.target.value } })} /></div>
      <div className="space-y-2"><Label>Transport Allowance</Label><Input type="number" value={employee.salary?.transportAllowance ?? ''} onChange={(e) => setEmployee({ ...employee, salary: { ...employee.salary, transportAllowance: e.target.value } })} /></div>
      <div className="space-y-2"><Label>Other Allowance</Label><Input type="number" value={employee.salary?.otherAllowance ?? ''} onChange={(e) => setEmployee({ ...employee, salary: { ...employee.salary, otherAllowance: e.target.value } })} /></div>
      <div className="space-y-2">
        <Label>Total (auto-calculated)</Label>
        <Input disabled className="bg-slate-50 font-bold" value={(Number(employee.salary?.basic || 0) + Number(employee.salary?.houseRent || 0) + Number(employee.salary?.medicalAllowance || 0) + Number(employee.salary?.transportAllowance || 0) + Number(employee.salary?.otherAllowance || 0)).toLocaleString()} />
      </div>
    </div>
  );

  const savePersonal = () => {
    if (!isNonEmptyText(employee.name, 2)) {
      toast.error('Name must be at least 2 characters');
      return;
    }
    if (!isValidEmail(employee.email || '')) {
      toast.error('Please enter a valid email address');
      return;
    }
    saveProfile('Personal info', { name: employee.name, email: employee.email, phone: employee.phone, alternatePhone: employee.alternatePhone, dateOfBirth: employee.dateOfBirth, gender: employee.gender, bloodGroup: employee.bloodGroup, maritalStatus: employee.maritalStatus, nidNumber: employee.nidNumber, nationality: employee.nationality, religion: employee.religion });
  };

  const saveJob = () => {
    if (!isNonEmptyText(employee.employeeId || '', 3)) {
      toast.error('Employee ID is required');
      return;
    }
    if (!isNonNegativeNumber(employee.totalLeaves)) {
      toast.error('Total leaves must be a non-negative number');
      return;
    }
    saveProfile('Job info', { employeeId: employee.employeeId, department: employee.department, designation: employee.designation, role: employee.role, status: employee.status, joiningDate: employee.joiningDate, totalLeaves: toSafeNumber(employee.totalLeaves) ?? 0 });
  };
  const saveAddress = () => saveProfile('Address', { presentAddress: employee.presentAddress, permanentAddress: employee.permanentAddress });
  const saveEmergency = () => saveProfile('Emergency contact', { emergencyContact: employee.emergencyContact });
  const saveSalary = () => {
    const salaryFields: Array<[string, unknown]> = [
      ['Basic Salary', employee.salary?.basic],
      ['House Rent', employee.salary?.houseRent],
      ['Medical Allowance', employee.salary?.medicalAllowance],
      ['Transport Allowance', employee.salary?.transportAllowance],
      ['Other Allowance', employee.salary?.otherAllowance],
    ];

    for (const [label, value] of salaryFields) {
      if (value !== '' && value !== undefined && value !== null && !isNonNegativeNumber(value)) {
        toast.error(`${label} must be a non-negative number`);
        return;
      }
    }

    saveProfile('Salary', {
      salary: {
        ...employee.salary,
        basic: toSafeNumber(employee.salary?.basic) ?? 0,
        houseRent: toSafeNumber(employee.salary?.houseRent) ?? 0,
        medicalAllowance: toSafeNumber(employee.salary?.medicalAllowance) ?? 0,
        transportAllowance: toSafeNumber(employee.salary?.transportAllowance) ?? 0,
        otherAllowance: toSafeNumber(employee.salary?.otherAllowance) ?? 0,
      },
    });
  };

  const AttendanceSection = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle>Attendance History</CardTitle>
          <div className="flex gap-2">
            <Select value={String(attMonth)} onValueChange={(v) => setAttMonth(Number(v))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map((m, i) => (<SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>))}</SelectContent>
            </Select>
            <Select value={String(attYear)} onValueChange={(v) => setAttYear(Number(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{[2023, 2024, 2025, 2026].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceRecords.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No records</TableCell></TableRow>
              ) : attendanceRecords.map((r: any, i: number) => (
                <TableRow key={i}>
                  <TableCell className="text-sm">{r.date}</TableCell>
                  <TableCell><Badge className={getStatusColor(r.status)}>{r.isLate ? 'Late' : r.status}</Badge></TableCell>
                  <TableCell className="text-sm">{r.checkInTime ? format(new Date(r.checkInTime), 'hh:mm a') : '—'}</TableCell>
                  <TableCell className="text-sm">{r.checkOutTime ? format(new Date(r.checkOutTime), 'hh:mm a') : '—'}</TableCell>
                  <TableCell className="text-sm">{r.workingHours ? `${r.workingHours.toFixed(1)}h` : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  const DeviceTrackingSection = () => {
    const [deviceData, setDeviceData] = useState<any>(null);
    const [deviceLoading, setDeviceLoading] = useState(true);
    const [resetting, setResetting] = useState(false);
    const [toggling, setToggling] = useState(false);

    useEffect(() => {
      fetchDeviceInfo();
    }, []);

    const fetchDeviceInfo = async () => {
      setDeviceLoading(true);
      try {
        const res = await fetch(`/api/employees/${id}`);
        const data = await res.json();
        setDeviceData({
          registeredDevice: data.employee?.registeredDevice || null,
          deviceTrackingEnabled: data.employee?.deviceTrackingEnabled ?? true,
        });
      } catch { /* ignore */ } finally {
        setDeviceLoading(false);
      }
    };

    const handleReset = async () => {
      if (!confirm('Reset this employee\'s registered device? They will need to register a new device to mark attendance.')) return;
      setResetting(true);
      try {
        const res = await fetch('/api/device/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(data.message);
        fetchDeviceInfo();
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setResetting(false);
      }
    };

    const handleToggleTracking = async (enabled: boolean) => {
      setToggling(true);
      try {
        const res = await fetch('/api/device/reset', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: id, enabled }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(data.message);
        fetchDeviceInfo();
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setToggling(false);
      }
    };

    const device = deviceData?.registeredDevice;
    const trackingEnabled = deviceData?.deviceTrackingEnabled ?? true;

    return (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">📱 Device Tracking</CardTitle>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={trackingEnabled}
                  onChange={(e) => handleToggleTracking(e.target.checked)}
                  disabled={toggling || deviceLoading}
                  className="w-4 h-4"
                />
                <span className={trackingEnabled ? 'text-green-700 font-medium' : 'text-slate-500'}>
                  {trackingEnabled ? 'Tracking Enabled' : 'Tracking Disabled'}
                </span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {deviceLoading ? (
            <div className="text-center py-8 text-slate-500">Loading device info...</div>
          ) : !trackingEnabled ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p className="font-medium">⚠️ Device tracking is disabled for this employee</p>
              <p className="text-xs mt-1">This employee can mark attendance from any device. Enable tracking to restrict them to one device.</p>
            </div>
          ) : !device?.fingerprint ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium">📱 No device registered yet</p>
              <p className="text-xs mt-1">This employee hasn&apos;t registered their device. They will be prompted to register when they try to mark attendance.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-medium text-green-800 text-sm mb-3">✅ Device Registered</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Browser:</span>
                    <span className="ml-2 font-medium">{device.browser || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">OS:</span>
                    <span className="ml-2 font-medium">{device.os || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Screen:</span>
                    <span className="ml-2 font-medium">{device.screenResolution || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Language:</span>
                    <span className="ml-2 font-medium">{device.language || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Timezone:</span>
                    <span className="ml-2 font-medium">{device.timezone || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Registered:</span>
                    <span className="ml-2 font-medium">{device.registeredAt ? format(new Date(device.registeredAt), 'dd MMM yyyy, hh:mm a') : 'Unknown'}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-xs text-slate-500 break-all">
                    <span className="font-medium">Fingerprint:</span> {device.fingerprint}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleReset}
                disabled={resetting}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                {resetting ? 'Resetting...' : '🔄 Reset Device'}
              </Button>
              <p className="text-xs text-slate-500">
                Resetting will remove the registered device. The employee will need to register their new device for attendance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const DocumentsSection = () => (
    <Card>
      <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="text-sm font-medium">Upload Document</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {['nid', 'passport', 'photo', 'cv', 'certificate', 'offer_letter', 'appointment_letter', 'academic_certificate', 'training_certificate', 'other'].map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Name</Label><Input value={docName} onChange={(e) => setDocName(e.target.value)} /></div>
          </div>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${isDragActive ? 'border-slate-400 bg-slate-50' : 'border-slate-200'}`}
          >
            <input {...getInputProps()} />
            {selectedFile
              ? <p className="text-sm">{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
              : <p className="text-sm text-slate-500">Drop file here or click to select</p>
            }
          </div>
          <Button onClick={handleDocUpload} disabled={uploadingDoc || !selectedFile || !docType || !docName} className="bg-slate-900 hover:bg-slate-700 text-white">
            {uploadingDoc ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
        <div className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-center py-4 text-slate-500">No documents</p>
          ) : documents.map((doc: any) => (
            <div key={doc._id} className="flex items-center gap-3 border rounded-lg p-3">
              <span className="text-2xl">{getDocumentIcon(doc.documentType)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{doc.documentName}</p>
                  {doc.isVerified && <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Verified</Badge>}
                </div>
                <p className="text-xs text-slate-500">{doc.documentType.replace(/_/g, ' ')} · {formatFileSize(doc.fileSize)}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openDocument(doc)}>View</Button>
                {!doc.isVerified && <Button variant="ghost" size="sm" className="text-green-600" onClick={() => verifyDocument(doc._id)}>Verify</Button>}
                <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteDocument(doc._id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const HistoryItem = ({ log, index }: { log: UpdateLog; index: number }) => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="relative pl-6 pb-6 border-l border-slate-200 last:border-0">
      <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white" />
      <div className="text-xs text-slate-500 mb-1">{format(new Date(log.createdAt), 'dd MMM yyyy, hh:mm a')}</div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold overflow-hidden">
          {log.updatedBy?.avatar?.url
            ? <img src={log.updatedBy.avatar.url} alt="" className="w-full h-full object-cover" />
            : log.updatedByName?.charAt(0) || '?'
          }
        </div>
        <span className="text-xs font-medium text-slate-700">{log.updatedByName}</span>
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{log.sectionLabel}</Badge>
      </div>
      <div className="space-y-1.5">
        {log.changes.map((change, ci) => (
          <div key={ci} className="text-xs bg-slate-50 rounded p-2">
            <span className="font-medium text-slate-600">{change.fieldLabel}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-red-500 line-through max-w-[120px] truncate">{change.oldValue || '—'}</span>
              <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
              <span className="text-green-600 font-medium max-w-[120px] truncate">{change.newValue || '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <PageWrapper>
      <div className="space-y-4 sm:space-y-6">
        {/* Profile Header Card */}
        <motion.div variants={fadeInUp} initial="hidden" animate="visible">
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-200 flex items-center justify-center text-xl sm:text-2xl font-bold overflow-hidden">
                    {employee.avatar?.url ? <img src={employee.avatar.url} alt="" className="w-full h-full object-cover" /> : employee.name?.charAt(0)}
                  </div>
                  <label className="absolute bottom-0 right-0 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h2 className="text-lg sm:text-xl font-bold truncate">{employee.name}</h2>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{employee.employeeId} · {employee.email}</p>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">{employee.department} · {employee.designation}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-center">
                  <Badge className={employee.role === 'hr' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 'bg-slate-100 text-slate-800 hover:bg-slate-100'}>
                    {employee.role?.toUpperCase()}
                  </Badge>
                  <Badge className={employee.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}>
                    {employee.status || 'active'}
                  </Badge>
                  <div className="flex border rounded-md ml-2">
                    <button onClick={() => setViewMode('tabs')} className={`px-2.5 py-1 text-xs font-medium rounded-l-md transition-colors ${viewMode === 'tabs' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                      Tabs
                    </button>
                    <button onClick={() => setViewMode('full')} className={`px-2.5 py-1 text-xs font-medium rounded-r-md transition-colors ${viewMode === 'full' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                      Full View
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* TABBED VIEW */}
        {viewMode === 'tabs' && (
          <Tabs defaultValue="personal" className="space-y-4 sm:space-y-6">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4 md:grid-cols-8">
                <TabsTrigger value="personal" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Personal</TabsTrigger>
                <TabsTrigger value="job" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Job Info</TabsTrigger>
                <TabsTrigger value="address" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Address</TabsTrigger>
                <TabsTrigger value="emergency" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Emergency</TabsTrigger>
                <TabsTrigger value="salary" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Salary</TabsTrigger>
                <TabsTrigger value="attendance" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Attendance</TabsTrigger>
                <TabsTrigger value="device" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">📱 Device</TabsTrigger>
                <TabsTrigger value="documents" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Documents</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="personal">
              <Card className={sectionHighlight('Personal info')}>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <PersonalInfoForm />
                  <Button onClick={savePersonal} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white">{saving ? 'Saving...' : 'Save'}</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="job">
              <Card className={sectionHighlight('Job info')}>
                <CardHeader><CardTitle>Job Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <JobInfoForm />
                  <Button onClick={saveJob} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white">{saving ? 'Saving...' : 'Save'}</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="address">
              <Card className={sectionHighlight('Address')}>
                <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <AddressForm />
                  <Button onClick={saveAddress} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white">{saving ? 'Saving...' : 'Save'}</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="emergency">
              <Card className={sectionHighlight('Emergency contact')}>
                <CardHeader><CardTitle>Emergency Contact</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <EmergencyForm />
                  <Button onClick={saveEmergency} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white">{saving ? 'Saving...' : 'Save'}</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="salary">
              <Card className={sectionHighlight('Salary')}>
                <CardHeader><CardTitle>Salary Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <SalaryForm />
                  <Button onClick={saveSalary} disabled={saving} className="bg-slate-900 hover:bg-slate-700 text-white">{saving ? 'Saving...' : 'Save'}</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="attendance"><AttendanceSection /></TabsContent>
            <TabsContent value="device"><DeviceTrackingSection /></TabsContent>
            <TabsContent value="documents"><DocumentsSection /></TabsContent>
          </Tabs>
        )}

        {/* FULL DETAILS VIEW */}
        {viewMode === 'full' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left sticky profile sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-20 space-y-4">
                <Card>
                  <CardContent className="p-4 text-center space-y-3">
                    <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-2xl font-bold overflow-hidden mx-auto">
                      {employee.avatar?.url ? <img src={employee.avatar.url} alt="" className="w-full h-full object-cover" /> : employee.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{employee.name}</h3>
                      <p className="text-xs text-slate-500">{employee.employeeId}</p>
                      <p className="text-xs text-slate-500">{employee.email}</p>
                    </div>
                    <div className="flex justify-center gap-2 flex-wrap">
                      <Badge className={employee.role === 'hr' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'}>{employee.role?.toUpperCase()}</Badge>
                      <Badge className={employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{employee.status}</Badge>
                    </div>
                    <div className="text-left space-y-1 border-t pt-3">
                      <InfoRow label="Department" value={employee.department} />
                      <InfoRow label="Designation" value={employee.designation} />
                      <InfoRow label="Joining Date" value={employee.joiningDate ? format(new Date(employee.joiningDate), 'dd MMM yyyy') : null} />
                      <InfoRow label="Phone" value={employee.phone} />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <h4 className="text-sm font-semibold text-slate-700">Leave Balance</h4>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Total</span><span className="font-medium">{employee.totalLeaves ?? 12}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Used</span><span className="font-medium">{employee.usedLeaves ?? 0}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Remaining</span><span className="font-bold text-green-600">{(employee.totalLeaves ?? 12) - (employee.usedLeaves ?? 0)}</span></div>
                  </CardContent>
                </Card>
                {employee.salary && (
                  <Card>
                    <CardContent className="p-4 space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700">Salary Overview</h4>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Basic</span><span className="font-medium">৳{(employee.salary.basic || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-slate-700 font-medium">Total</span>
                        <span className="font-bold text-slate-900">৳{((employee.salary.basic || 0) + (employee.salary.houseRent || 0) + (employee.salary.medicalAllowance || 0) + (employee.salary.transportAllowance || 0) + (employee.salary.otherAllowance || 0)).toLocaleString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            {/* Right scrollable sections */}
            <div className="lg:col-span-2">
              <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
                <FullSection title="Personal Information" sectionKey="personal" onSave={savePersonal}><PersonalInfoForm /></FullSection>
                <FullSection title="Job Information" sectionKey="job" onSave={saveJob}><JobInfoForm /></FullSection>
                <FullSection title="Address" sectionKey="address" onSave={saveAddress}><AddressForm /></FullSection>
                <FullSection title="Emergency Contact" sectionKey="emergency" onSave={saveEmergency}><EmergencyForm /></FullSection>
                <FullSection title="Salary Information" sectionKey="salary" onSave={saveSalary}><SalaryForm /></FullSection>
                <motion.div variants={staggerItem}><AttendanceSection /></motion.div>
                <motion.div variants={staggerItem}><DeviceTrackingSection /></motion.div>
                <motion.div variants={staggerItem}><DocumentsSection /></motion.div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Floating History Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setHistoryOpen(true)}
          className="fixed bottom-6 right-6 bg-slate-900 text-white rounded-full px-4 py-3 shadow-lg hover:bg-slate-700 flex items-center gap-2 z-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-sm font-medium">History</span>
        </motion.button>

        {/* History Slide-in Panel */}
        <AnimatePresence>
          {historyOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40"
                onClick={() => setHistoryOpen(false)}
              />
              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h3 className="font-semibold text-lg">Update History</h3>
                    <p className="text-xs text-slate-500">{historyTotal.current} total changes</p>
                  </div>
                  <button onClick={() => setHistoryOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-3 border-b">
                  <Select value={historyFilter} onValueChange={setHistoryFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="job">Job Info</SelectItem>
                      <SelectItem value="address">Address</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="salary">Salary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {historyLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />)}
                    </div>
                  ) : historyLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                      <p className="text-sm text-slate-500">No update history yet</p>
                    </div>
                  ) : (
                    <div>
                      {historyLogs.map((log, i) => <HistoryItem key={log._id} log={log} index={i} />)}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}
