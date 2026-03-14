'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { getDocumentIcon, formatFileSize } from '@/lib/helpers';
import PageWrapper from '@/components/layout/PageWrapper';

export default function EmployeeProfile() {
  const { data: session } = useSession();
  const [employee, setEmployee] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sameAddress, setSameAddress] = useState(false);

  // Document upload state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docType, setDocType] = useState('');
  const [docName, setDocName] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const [empRes, docRes] = await Promise.all([
        fetch(`/api/employees/${session.user.id}`),
        fetch(`/api/employees/${session.user.id}/documents`),
      ]);
      const empData = await empRes.json();
      const docData = await docRes.json();
      setEmployee(empData.employee);
      setDocuments(docData.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveProfile = async (section: string, data: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${session?.user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setEmployee(result.employee);
      toast.success(`${section} updated successfully`);
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
      const res = await fetch(`/api/employees/${session?.user?.id}/avatar`, {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEmployee(data.employee);
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDocUpload = async () => {
    if (!selectedFile || !docType || !docName) {
      toast.error('Please fill in document type and name');
      return;
    }

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await fetch('/api/upload/document', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error);

      const docRes = await fetch(`/api/employees/${session?.user?.id}/documents`, {
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
          notes: docNotes,
        }),
      });
      const docData = await docRes.json();
      if (!docRes.ok) throw new Error(docData.error);

      toast.success('Document uploaded');
      setDocType('');
      setDocName('');
      setDocNotes('');
      setSelectedFile(null);
      setPreviewUrl('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/employees/${session?.user?.id}/documents/${docId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Document deleted');
      fetchData();
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
    onDrop: (files) => {
      const file = files[0];
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl('');
      }
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  if (loading) {
    return <div className="h-96 bg-white rounded-lg animate-pulse" />;
  }

  if (!employee) {
    return <p className="text-center text-slate-500">Employee not found</p>;
  }

  return (
    <PageWrapper>
    <div className="space-y-4 sm:space-y-6">
      <Tabs defaultValue="personal" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4 md:grid-cols-7">
            <TabsTrigger value="personal" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Personal</TabsTrigger>
            <TabsTrigger value="address" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Address</TabsTrigger>
            <TabsTrigger value="emergency" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Emergency</TabsTrigger>
            <TabsTrigger value="education" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Education</TabsTrigger>
            <TabsTrigger value="experience" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Experience</TabsTrigger>
            <TabsTrigger value="device" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">📱 Device</TabsTrigger>
            <TabsTrigger value="documents" className="min-h-[44px] sm:min-h-0 whitespace-nowrap">Documents</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Personal Info */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-200 flex items-center justify-center text-xl sm:text-2xl font-bold text-slate-600 overflow-hidden">
                    {employee.avatar?.url ? (
                      <img src={employee.avatar.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      employee.name?.charAt(0)
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center cursor-pointer hover:bg-slate-700">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
                    </svg>
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-base sm:text-lg font-semibold">{employee.name}</p>
                  <p className="text-sm text-slate-500">{employee.employeeId} · {employee.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={employee.name || ''} disabled className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input value={employee.employeeId || ''} disabled className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={employee.email || ''} disabled className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={employee.phone || ''}
                    onChange={(e) => setEmployee({ ...employee, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alternate Phone</Label>
                  <Input
                    value={employee.alternatePhone || ''}
                    onChange={(e) => setEmployee({ ...employee, alternatePhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().split('T')[0] : ''}
                    onChange={(e) => setEmployee({ ...employee, dateOfBirth: e.target.value })}
                  />
                </div>
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
                <div className="space-y-2">
                  <Label>Blood Group</Label>
                  <Input value={employee.bloodGroup || ''} onChange={(e) => setEmployee({ ...employee, bloodGroup: e.target.value })} />
                </div>
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
                <div className="space-y-2">
                  <Label>NID Number</Label>
                  <Input value={employee.nidNumber || ''} onChange={(e) => setEmployee({ ...employee, nidNumber: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nationality</Label>
                  <Input value={employee.nationality || ''} onChange={(e) => setEmployee({ ...employee, nationality: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Religion</Label>
                  <Input value={employee.religion || ''} onChange={(e) => setEmployee({ ...employee, religion: e.target.value })} />
                </div>
              </div>

              <Button
                onClick={() => saveProfile('Personal info', {
                  phone: employee.phone,
                  alternatePhone: employee.alternatePhone,
                  dateOfBirth: employee.dateOfBirth,
                  gender: employee.gender,
                  bloodGroup: employee.bloodGroup,
                  maritalStatus: employee.maritalStatus,
                  nidNumber: employee.nidNumber,
                  nationality: employee.nationality,
                  religion: employee.religion,
                })}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Address */}
        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <h3 className="font-medium text-slate-900">Present Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['street', 'city', 'district', 'division', 'postalCode', 'country'].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input
                      value={employee.presentAddress?.[field] || ''}
                      onChange={(e) => setEmployee({
                        ...employee,
                        presentAddress: { ...employee.presentAddress, [field]: e.target.value },
                      })}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={sameAddress}
                  onCheckedChange={(checked) => {
                    setSameAddress(!!checked);
                    if (checked) {
                      setEmployee({ ...employee, permanentAddress: { ...employee.presentAddress } });
                    }
                  }}
                />
                <Label className="text-sm">Same as present address</Label>
              </div>

              <h3 className="font-medium text-slate-900">Permanent Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['street', 'city', 'district', 'division', 'postalCode', 'country'].map((field) => (
                  <div key={field} className="space-y-2">
                    <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                    <Input
                      value={employee.permanentAddress?.[field] || ''}
                      onChange={(e) => setEmployee({
                        ...employee,
                        permanentAddress: { ...employee.permanentAddress, [field]: e.target.value },
                      })}
                      disabled={sameAddress}
                    />
                  </div>
                ))}
              </div>

              <Button
                onClick={() => saveProfile('Address', {
                  presentAddress: employee.presentAddress,
                  permanentAddress: employee.permanentAddress,
                })}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Address'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Emergency Contact */}
        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={employee.emergencyContact?.name || ''}
                    onChange={(e) => setEmployee({
                      ...employee,
                      emergencyContact: { ...employee.emergencyContact, name: e.target.value },
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input
                    value={employee.emergencyContact?.relationship || ''}
                    onChange={(e) => setEmployee({
                      ...employee,
                      emergencyContact: { ...employee.emergencyContact, relationship: e.target.value },
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={employee.emergencyContact?.phone || ''}
                    onChange={(e) => setEmployee({
                      ...employee,
                      emergencyContact: { ...employee.emergencyContact, phone: e.target.value },
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={employee.emergencyContact?.address || ''}
                    onChange={(e) => setEmployee({
                      ...employee,
                      emergencyContact: { ...employee.emergencyContact, address: e.target.value },
                    })}
                  />
                </div>
              </div>
              <Button
                onClick={() => saveProfile('Emergency contact', { emergencyContact: employee.emergencyContact })}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Emergency Contact'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Education */}
        <TabsContent value="education">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Education</CardTitle>
              <Button
                size="sm"
                onClick={() => setEmployee({
                  ...employee,
                  education: [...(employee.education || []), { degree: '', institution: '', board: '', passingYear: '', result: '', majorSubject: '' }],
                })}
                className="bg-slate-900 hover:bg-slate-700 text-white"
              >
                + Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {(employee.education || []).map((edu: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Education #{idx + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        const updated = [...employee.education];
                        updated.splice(idx, 1);
                        setEmployee({ ...employee, education: updated });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['degree', 'institution', 'board', 'passingYear', 'result', 'majorSubject'].map((field) => (
                      <div key={field} className="space-y-2">
                        <Label className="capitalize">{field.replace(/([A-Z])/g, ' $1')}</Label>
                        <Input
                          value={edu[field] || ''}
                          onChange={(e) => {
                            const updated = [...employee.education];
                            updated[idx] = { ...updated[idx], [field]: e.target.value };
                            setEmployee({ ...employee, education: updated });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(employee.education || []).length === 0 && (
                <p className="text-center py-4 text-slate-500">No education records. Click &quot;+ Add&quot; to add one.</p>
              )}
              <Button
                onClick={() => saveProfile('Education', { education: employee.education })}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Education'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Experience */}
        <TabsContent value="experience">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Work Experience</CardTitle>
              <Button
                size="sm"
                onClick={() => setEmployee({
                  ...employee,
                  experience: [...(employee.experience || []), { companyName: '', designation: '', startDate: '', endDate: '', responsibilities: '', reasonForLeaving: '' }],
                })}
                className="bg-slate-900 hover:bg-slate-700 text-white"
              >
                + Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {(employee.experience || []).map((exp: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Experience #{idx + 1}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        const updated = [...employee.experience];
                        updated.splice(idx, 1);
                        setEmployee({ ...employee, experience: updated });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company</Label>
                      <Input value={exp.companyName || ''} onChange={(e) => {
                        const updated = [...employee.experience];
                        updated[idx] = { ...updated[idx], companyName: e.target.value };
                        setEmployee({ ...employee, experience: updated });
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input value={exp.designation || ''} onChange={(e) => {
                        const updated = [...employee.experience];
                        updated[idx] = { ...updated[idx], designation: e.target.value };
                        setEmployee({ ...employee, experience: updated });
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''} onChange={(e) => {
                        const updated = [...employee.experience];
                        updated[idx] = { ...updated[idx], startDate: e.target.value };
                        setEmployee({ ...employee, experience: updated });
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''} onChange={(e) => {
                        const updated = [...employee.experience];
                        updated[idx] = { ...updated[idx], endDate: e.target.value };
                        setEmployee({ ...employee, experience: updated });
                      }} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Responsibilities</Label>
                      <Textarea value={exp.responsibilities || ''} onChange={(e) => {
                        const updated = [...employee.experience];
                        updated[idx] = { ...updated[idx], responsibilities: e.target.value };
                        setEmployee({ ...employee, experience: updated });
                      }} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Reason for Leaving</Label>
                      <Input value={exp.reasonForLeaving || ''} onChange={(e) => {
                        const updated = [...employee.experience];
                        updated[idx] = { ...updated[idx], reasonForLeaving: e.target.value };
                        setEmployee({ ...employee, experience: updated });
                      }} />
                    </div>
                  </div>
                </div>
              ))}
              {(employee.experience || []).length === 0 && (
                <p className="text-center py-4 text-slate-500">No experience records. Click &quot;+ Add&quot; to add one.</p>
              )}
              <Button
                onClick={() => saveProfile('Experience', { experience: employee.experience })}
                disabled={saving}
                className="bg-slate-900 hover:bg-slate-700 text-white"
              >
                {saving ? 'Saving...' : 'Save Experience'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Documents */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload form */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium">Upload New Document</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Document Type</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {['nid', 'passport', 'photo', 'cv', 'certificate', 'offer_letter', 'appointment_letter', 'academic_certificate', 'training_certificate', 'other'].map((t) => (
                          <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Document Name</Label>
                    <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. National ID Card" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input value={docNotes} onChange={(e) => setDocNotes(e.target.value)} placeholder="Additional notes..." />
                </div>

                <motion.div
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ duration: 0.2 }}
                >
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-slate-400 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      {previewUrl ? (
                        <img src={previewUrl} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-red-50 rounded flex items-center justify-center text-red-500 text-lg">📄</div>
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-500">Drag & drop a file here, or click to select</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP, PDF — Max 10MB</p>
                    </div>
                  )}
                </div>
                </motion.div>

                <Button
                  onClick={handleDocUpload}
                  disabled={uploadingDoc || !selectedFile || !docType || !docName}
                  className="bg-slate-900 hover:bg-slate-700 text-white"
                >
                  {uploadingDoc ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>

              {/* Document List */}
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <p className="text-center py-4 text-slate-500">No documents uploaded yet.</p>
                ) : (
                  documents.map((doc: any) => (
                    <div key={doc._id} className="flex items-center gap-3 border rounded-lg p-3">
                      <div className="text-2xl">{getDocumentIcon(doc.documentType)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{doc.documentName}</p>
                          {doc.isVerified && (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Verified ✓</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {doc.documentType.replace(/_/g, ' ')} · {formatFileSize(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openDocument(doc)}>View</Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => deleteDocument(doc._id)}>Delete</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Device Info */}
        <TabsContent value="device">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2">📱 Registered Device</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {employee?.registeredDevice?.fingerprint ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="font-medium text-green-800 text-sm mb-3">✅ Device Registered</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Browser:</span><span className="ml-2 font-medium">{employee.registeredDevice.browser || 'Unknown'}</span></div>
                      <div><span className="text-slate-500">OS:</span><span className="ml-2 font-medium">{employee.registeredDevice.os || 'Unknown'}</span></div>
                      <div><span className="text-slate-500">Screen:</span><span className="ml-2 font-medium">{employee.registeredDevice.screenResolution || 'Unknown'}</span></div>
                      <div><span className="text-slate-500">Language:</span><span className="ml-2 font-medium">{employee.registeredDevice.language || 'Unknown'}</span></div>
                      <div><span className="text-slate-500">Timezone:</span><span className="ml-2 font-medium">{employee.registeredDevice.timezone || 'Unknown'}</span></div>
                      <div><span className="text-slate-500">Registered:</span><span className="ml-2 font-medium">{employee.registeredDevice.registeredAt ? new Date(employee.registeredDevice.registeredAt).toLocaleDateString() : 'Unknown'}</span></div>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                    Only this device can be used for marking attendance. If you changed your device, contact HR to reset it.
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <p className="font-medium mb-1">📱 No device registered yet</p>
                  <p className="text-xs text-amber-700">Go to the Attendance page to register your device. Once registered, only that device can be used for marking attendance.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </PageWrapper>
  );
}
