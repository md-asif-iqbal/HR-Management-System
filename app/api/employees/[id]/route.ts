import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import EmployeeUpdateLog from '@/models/EmployeeUpdateLog';
import {
  ApiValidationError,
  optionalDate,
  optionalNumber,
  optionalString,
  requireBodyObject,
  requireEmail,
  requireEnum,
} from '@/lib/validation';

// Field labels for audit logging
const FIELD_LABELS: Record<string, string> = {
  name: 'Name', email: 'Email', phone: 'Phone', alternatePhone: 'Alternate Phone',
  dateOfBirth: 'Date of Birth', gender: 'Gender', bloodGroup: 'Blood Group',
  maritalStatus: 'Marital Status', nidNumber: 'NID Number', nationality: 'Nationality',
  religion: 'Religion', passportNumber: 'Passport Number',
  employeeId: 'Employee ID',
  department: 'Department', designation: 'Designation', role: 'Role', status: 'Status',
  joiningDate: 'Joining Date', totalLeaves: 'Total Leaves', employmentType: 'Employment Type',
  confirmationDate: 'Confirmation Date', resignationDate: 'Resignation Date',
  workLocation: 'Work Location', shift: 'Shift',
};

const SECTION_MAP: Record<string, { section: string; label: string }> = {
  name: { section: 'personal', label: 'Personal Information' },
  email: { section: 'personal', label: 'Personal Information' },
  phone: { section: 'personal', label: 'Personal Information' },
  alternatePhone: { section: 'personal', label: 'Personal Information' },
  dateOfBirth: { section: 'personal', label: 'Personal Information' },
  gender: { section: 'personal', label: 'Personal Information' },
  bloodGroup: { section: 'personal', label: 'Personal Information' },
  maritalStatus: { section: 'personal', label: 'Personal Information' },
  nidNumber: { section: 'personal', label: 'Personal Information' },
  nationality: { section: 'personal', label: 'Personal Information' },
  religion: { section: 'personal', label: 'Personal Information' },
  employeeId: { section: 'job', label: 'Job Information' },
  department: { section: 'job', label: 'Job Information' },
  designation: { section: 'job', label: 'Job Information' },
  role: { section: 'job', label: 'Job Information' },
  status: { section: 'job', label: 'Job Information' },
  joiningDate: { section: 'job', label: 'Job Information' },
  totalLeaves: { section: 'job', label: 'Job Information' },
  employmentType: { section: 'job', label: 'Job Information' },
  presentAddress: { section: 'address', label: 'Address' },
  permanentAddress: { section: 'address', label: 'Address' },
  emergencyContact: { section: 'emergency', label: 'Emergency Contact' },
  salary: { section: 'salary', label: 'Salary Information' },
};

function formatValue(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function detectChanges(oldDoc: any, newBody: any): { section: string; sectionLabel: string; changes: any[] }[] {
  const grouped: Record<string, { section: string; sectionLabel: string; changes: any[] }> = {};

  for (const key of Object.keys(newBody)) {
    const mapping = SECTION_MAP[key];
    if (!mapping) continue;

    const oldVal = oldDoc[key];
    const newVal = newBody[key];

    // Handle nested objects (address, emergency, salary)
    if (typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)) {
      const oldObj = oldVal || {};
      for (const subKey of Object.keys(newVal)) {
        const oldSub = formatValue(oldObj[subKey]);
        const newSub = formatValue(newVal[subKey]);
        if (oldSub !== newSub) {
          if (!grouped[mapping.section]) {
            grouped[mapping.section] = { section: mapping.section, sectionLabel: mapping.label, changes: [] };
          }
          const label = key === 'salary'
            ? subKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())
            : `${key.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())} - ${subKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}`;
          grouped[mapping.section].changes.push({
            field: `${key}.${subKey}`,
            fieldLabel: label,
            oldValue: oldSub,
            newValue: newSub,
          });
        }
      }
    } else {
      const oldStr = formatValue(oldVal);
      const newStr = formatValue(newVal);
      if (oldStr !== newStr) {
        if (!grouped[mapping.section]) {
          grouped[mapping.section] = { section: mapping.section, sectionLabel: mapping.label, changes: [] };
        }
        grouped[mapping.section].changes.push({
          field: key,
          fieldLabel: FIELD_LABELS[key] || key,
          oldValue: oldStr,
          newValue: newStr,
        });
      }
    }
  }

  return Object.values(grouped).filter((g) => g.changes.length > 0);
}

function normalizeEmployeePatchBody(body: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = { ...body };

  if ('name' in body) normalized.name = optionalString(body.name, 'Name', { maxLength: 120 });
  if ('email' in body) normalized.email = requireEmail(body.email, 'Email');
  if ('phone' in body) normalized.phone = optionalString(body.phone, 'Phone', { maxLength: 30 });
  if ('alternatePhone' in body) normalized.alternatePhone = optionalString(body.alternatePhone, 'Alternate Phone', { maxLength: 30 });
  if ('dateOfBirth' in body) normalized.dateOfBirth = optionalDate(body.dateOfBirth, 'Date of Birth');
  if ('gender' in body && body.gender !== '') normalized.gender = requireEnum(body.gender, 'Gender', ['male', 'female', 'other']);
  if ('bloodGroup' in body) normalized.bloodGroup = optionalString(body.bloodGroup, 'Blood Group', { maxLength: 10 });
  if ('maritalStatus' in body && body.maritalStatus !== '') normalized.maritalStatus = requireEnum(body.maritalStatus, 'Marital Status', ['single', 'married', 'divorced']);
  if ('nidNumber' in body) normalized.nidNumber = optionalString(body.nidNumber, 'NID Number', { maxLength: 40 });
  if ('nationality' in body) normalized.nationality = optionalString(body.nationality, 'Nationality', { maxLength: 80 });
  if ('religion' in body) normalized.religion = optionalString(body.religion, 'Religion', { maxLength: 80 });

  if ('employeeId' in body) normalized.employeeId = optionalString(body.employeeId, 'Employee ID', { maxLength: 30 });
  if ('department' in body) normalized.department = optionalString(body.department, 'Department', { maxLength: 120 });
  if ('designation' in body) normalized.designation = optionalString(body.designation, 'Designation', { maxLength: 120 });
  if ('role' in body && body.role !== '') normalized.role = requireEnum(body.role, 'Role', ['employee', 'hr']);
  if ('status' in body && body.status !== '') normalized.status = requireEnum(body.status, 'Status', ['active', 'inactive', 'terminated', 'resigned']);
  if ('joiningDate' in body) normalized.joiningDate = optionalDate(body.joiningDate, 'Joining Date');
  if ('employmentType' in body && body.employmentType !== '') normalized.employmentType = requireEnum(body.employmentType, 'Employment Type', ['full-time', 'part-time', 'contractual', 'intern']);
  if ('totalLeaves' in body) normalized.totalLeaves = optionalNumber(body.totalLeaves, 'Total Leaves', { integer: true, min: 0, max: 365 });
  if ('confirmationDate' in body) normalized.confirmationDate = optionalDate(body.confirmationDate, 'Confirmation Date');
  if ('resignationDate' in body) normalized.resignationDate = optionalDate(body.resignationDate, 'Resignation Date');

  if ('presentAddress' in body && body.presentAddress) {
    if (typeof body.presentAddress !== 'object' || Array.isArray(body.presentAddress)) {
      throw new ApiValidationError('Present Address must be an object');
    }
    normalized.presentAddress = {
      street: optionalString(body.presentAddress.street, 'Present Address Street', { maxLength: 200 }) ?? '',
      city: optionalString(body.presentAddress.city, 'Present Address City', { maxLength: 120 }) ?? '',
      district: optionalString(body.presentAddress.district, 'Present Address District', { maxLength: 120 }) ?? '',
      division: optionalString(body.presentAddress.division, 'Present Address Division', { maxLength: 120 }) ?? '',
      postalCode: optionalString(body.presentAddress.postalCode, 'Present Address Postal Code', { maxLength: 20 }) ?? '',
      country: optionalString(body.presentAddress.country, 'Present Address Country', { maxLength: 120 }) ?? '',
    };
  }

  if ('permanentAddress' in body && body.permanentAddress) {
    if (typeof body.permanentAddress !== 'object' || Array.isArray(body.permanentAddress)) {
      throw new ApiValidationError('Permanent Address must be an object');
    }
    normalized.permanentAddress = {
      street: optionalString(body.permanentAddress.street, 'Permanent Address Street', { maxLength: 200 }) ?? '',
      city: optionalString(body.permanentAddress.city, 'Permanent Address City', { maxLength: 120 }) ?? '',
      district: optionalString(body.permanentAddress.district, 'Permanent Address District', { maxLength: 120 }) ?? '',
      division: optionalString(body.permanentAddress.division, 'Permanent Address Division', { maxLength: 120 }) ?? '',
      postalCode: optionalString(body.permanentAddress.postalCode, 'Permanent Address Postal Code', { maxLength: 20 }) ?? '',
      country: optionalString(body.permanentAddress.country, 'Permanent Address Country', { maxLength: 120 }) ?? '',
    };
  }

  if ('emergencyContact' in body && body.emergencyContact) {
    if (typeof body.emergencyContact !== 'object' || Array.isArray(body.emergencyContact)) {
      throw new ApiValidationError('Emergency Contact must be an object');
    }
    normalized.emergencyContact = {
      name: optionalString(body.emergencyContact.name, 'Emergency Contact Name', { maxLength: 120 }) ?? '',
      relationship: optionalString(body.emergencyContact.relationship, 'Emergency Contact Relationship', { maxLength: 120 }) ?? '',
      phone: optionalString(body.emergencyContact.phone, 'Emergency Contact Phone', { maxLength: 30 }) ?? '',
      address: optionalString(body.emergencyContact.address, 'Emergency Contact Address', { maxLength: 220 }) ?? '',
    };
  }

  if ('salary' in body && body.salary) {
    if (typeof body.salary !== 'object' || Array.isArray(body.salary)) {
      throw new ApiValidationError('Salary must be an object');
    }
    normalized.salary = {
      basic: optionalNumber(body.salary.basic, 'Basic Salary', { min: 0 }),
      houseRent: optionalNumber(body.salary.houseRent, 'House Rent', { min: 0 }),
      medicalAllowance: optionalNumber(body.salary.medicalAllowance, 'Medical Allowance', { min: 0 }),
      transportAllowance: optionalNumber(body.salary.transportAllowance, 'Transport Allowance', { min: 0 }),
      otherAllowance: optionalNumber(body.salary.otherAllowance, 'Other Allowance', { min: 0 }),
      grossSalary: optionalNumber(body.salary.grossSalary, 'Gross Salary', { min: 0 }),
      bankName: optionalString(body.salary.bankName, 'Bank Name', { maxLength: 120 }) ?? '',
      bankAccountNumber: optionalString(body.salary.bankAccountNumber, 'Bank Account Number', { maxLength: 80 }) ?? '',
      bankBranch: optionalString(body.salary.bankBranch, 'Bank Branch', { maxLength: 120 }) ?? '',
      taxId: optionalString(body.salary.taxId, 'Tax ID', { maxLength: 80 }) ?? '',
    };
  }

  return normalized;
}

// GET single employee
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const isHR = session.user.role === 'hr';
    const isOwnProfile = session.user.id === params.id;

    if (!isHR && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // HR can see salary; employees cannot
    const selectFields = isHR ? '-password' : '-password -salary';

    const employee = await User.findById(params.id)
      .select(selectFields)
      .populate('reportingTo', 'name employeeId')
      .lean();

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update employee
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const isHR = session.user.role === 'hr';
    const isOwnProfile = session.user.id === params.id;

    if (!isHR && !isOwnProfile) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const rawBody = requireBodyObject(await req.json());
    const body = normalizeEmployeePatchBody(rawBody);

    // Employees cannot update certain fields
    if (!isHR) {
      delete body.role;
      delete body.salary;
      delete body.employeeId;
      delete body.status;
      delete body.totalLeaves;
      delete body.usedLeaves;
      delete body.department;
      delete body.designation;
      delete body.employmentType;
      delete body.joiningDate;
      delete body.confirmationDate;
      delete body.resignationDate;
    }

    // Never update password through this route
    delete body.password;

    // Fetch current employee data for audit logging
    const currentEmployee = await User.findById(params.id).select('-password').lean();
    if (!currentEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = await User.findByIdAndUpdate(
      params.id,
      { $set: body },
      { new: true, runValidators: true }
    )
      .select(isHR ? '-password' : '-password -salary')
      .lean();

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Create audit logs for detected changes
    try {
      const changeGroups = detectChanges(currentEmployee, body);
      if (changeGroups.length > 0) {
        const logEntries = changeGroups.map((group) => ({
          employeeId: params.id,
          updatedBy: session.user.id,
          updatedByName: session.user.name || 'Unknown',
          updatedByRole: session.user.role || 'employee',
          section: group.section,
          sectionLabel: group.sectionLabel,
          changes: group.changes,
        }));
        await EmployeeUpdateLog.insertMany(logEntries);
      }
    } catch (logError) {
      // Don't fail the update if logging fails
      console.error('Audit log error:', logError);
    }

    return NextResponse.json({ employee });
  } catch (error: any) {
    if (error instanceof ApiValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error.code === 11000 && error.keyPattern?.employeeId) {
      return NextResponse.json({ error: 'Employee ID already in use by another employee.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
