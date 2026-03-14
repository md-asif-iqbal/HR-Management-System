import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hr-attendance';

// Schemas that match the real model field names exactly
// checkInTime is NOT required here so we can create absent records

const addressSchema = new mongoose.Schema({
  street: { type: String, default: '' },
  city: { type: String, default: '' },
  district: { type: String, default: '' },
  division: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, default: 'Bangladesh' },
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, default: '' },
  relationship: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
}, { _id: false });

const educationSchema = new mongoose.Schema({
  degree: { type: String, default: '' },
  institution: { type: String, default: '' },
  board: { type: String, default: '' },
  passingYear: { type: Number },
  result: { type: String, default: '' },
  majorSubject: { type: String, default: '' },
}, { _id: true });

const experienceSchema = new mongoose.Schema({
  companyName: { type: String, default: '' },
  designation: { type: String, default: '' },
  startDate: { type: Date },
  endDate: { type: Date },
  responsibilities: { type: String, default: '' },
  reasonForLeaving: { type: String, default: '' },
}, { _id: true });

const salarySchema = new mongoose.Schema({
  basic: { type: Number, default: 0 },
  houseRent: { type: Number, default: 0 },
  medicalAllowance: { type: Number, default: 0 },
  transportAllowance: { type: Number, default: 0 },
  otherAllowance: { type: Number, default: 0 },
  grossSalary: { type: Number, default: 0 },
  bankName: { type: String, default: '' },
  bankAccountNumber: { type: String, default: '' },
  bankBranch: { type: String, default: '' },
  taxId: { type: String, default: '' },
}, { _id: false });

const userSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['employee', 'hr'], default: 'employee' },
  phone: { type: String, default: '' },
  alternatePhone: { type: String, default: '' },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  bloodGroup: { type: String, default: '' },
  maritalStatus: { type: String, enum: ['single', 'married', 'divorced'] },
  nationality: { type: String, default: 'Bangladeshi' },
  religion: { type: String, default: '' },
  nidNumber: { type: String, default: '' },
  passportNumber: { type: String, default: '' },
  presentAddress: { type: addressSchema, default: () => ({}) },
  permanentAddress: { type: addressSchema, default: () => ({}) },
  emergencyContact: { type: emergencyContactSchema, default: () => ({}) },
  department: { type: String, default: '' },
  designation: { type: String, default: '' },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contractual', 'intern'], default: 'full-time' },
  joiningDate: { type: Date },
  confirmationDate: { type: Date },
  resignationDate: { type: Date },
  status: { type: String, enum: ['active', 'inactive', 'terminated', 'resigned'], default: 'active' },
  reportingTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workLocation: { type: String, default: '' },
  shift: { type: String, default: 'General' },
  salary: { type: salarySchema, default: () => ({}) },
  education: { type: [educationSchema], default: [] },
  experience: { type: [experienceSchema], default: [] },
  avatar: { url: { type: String, default: '' }, deleteUrl: { type: String, default: '' } },
  totalLeaves: { type: Number, default: 12 },
  usedLeaves: { type: Number, default: 0 },
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true },
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  status: { type: String, enum: ['present', 'late', 'absent', 'half-day', 'on-leave'], required: true },
  isLate: { type: Boolean, default: false },
  minutesLate: { type: Number, default: 0 },
  workingHours: { type: Number, default: null },
  notes: { type: String, default: '' },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const leaveRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  leaveType: { type: String, enum: ['sick', 'casual', 'earned', 'emergency'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  hrComment: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt: { type: Date, default: null },
}, { timestamps: true });

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  documentType: { type: String, enum: ['nid', 'passport', 'photo', 'cv', 'birth_certificate', 'certificate', 'offer_letter', 'appointment_letter', 'experience_letter', 'salary_certificate', 'academic_certificate', 'training_certificate', 'tin_certificate', 'other'], required: true },
  documentName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  deleteUrl: { type: String },
  storageType: { type: String, enum: ['imgbb', 'base64'], default: 'imgbb' },
  fileType: { type: String },
  fileSize: { type: Number },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
}, { timestamps: true });

const updateLogSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedByName: { type: String, default: '' }, updatedByRole: { type: String, default: '' },
  section: { type: String }, sectionLabel: { type: String },
  changes: [{ field: String, fieldLabel: String, oldValue: String, newValue: String }],
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const AttendanceRecord = mongoose.models.AttendanceRecord || mongoose.model('AttendanceRecord', attendanceSchema);
const LeaveRequest = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', leaveRequestSchema);
const EmployeeDocument = mongoose.models.EmployeeDocument || mongoose.model('EmployeeDocument', documentSchema);
const EmployeeUpdateLog = mongoose.models.EmployeeUpdateLog || mongoose.model('EmployeeUpdateLog', updateLogSchema);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Bangladesh weekends: Friday (5) and Saturday (6) */
function isBDWeekend(date: Date): boolean {
  return date.getDay() === 5 || date.getDay() === 6;
}

/** Fixed BD public holidays (month 1-based, day) */
const BD_FIXED_HOLIDAYS: [number, number][] = [
  [2, 21], // International Mother Language Day
  [3, 17], // Bangabandhu's Birthday
  [3, 26], // Independence Day
  [4, 14], // Pohela Boishakh
  [5, 1],  // International Labour Day
  [8, 15], // National Mourning Day
  [12, 16], // Victory Day
  [12, 25], // Christmas
];

function isBDHoliday(date: Date): boolean {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return BD_FIXED_HOLIDAYS.some(([hm, hd]) => hm === m && hd === d);
}

function isDayOff(date: Date): boolean {
  return isBDWeekend(date) || isBDHoliday(date);
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Deterministic pseudo-random 0–1 based on seed */
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── Attendance profiles ──────────────────────────────────────────────────────

type AttendanceProfile = 'excellent' | 'good' | 'average' | 'poor';

function getProbs(profile: AttendanceProfile) {
  switch (profile) {
    case 'excellent': return { absentProb: 0.02, leaveProb: 0.03, lateProb: 0.05 };
    case 'good':      return { absentProb: 0.05, leaveProb: 0.05, lateProb: 0.12 };
    case 'average':   return { absentProb: 0.10, leaveProb: 0.08, lateProb: 0.22 };
    case 'poor':      return { absentProb: 0.18, leaveProb: 0.12, lateProb: 0.32 };
  }
}

// ─── Employee definitions ─────────────────────────────────────────────────────

const EMPLOYEES = [
  { name: 'Rahim Ahmed',      email: 'rahim.ahmed@company.com',      phone: '01711000001', dob: '1993-05-20', gender: 'male'   as const, blood: 'A+',  marital: 'married'  as const, nid: '1993502001001', dept: 'Engineering',      desig: 'Senior Software Engineer', join: '2023-03-01', salary: { basic: 55000, houseRent: 22000, medicalAllowance: 5000, transportAllowance: 3000, otherAllowance: 2000, grossSalary: 87000 },  profile: 'excellent' as AttendanceProfile, used: 2,  city: 'Gulshan',       home: 'Comilla',    postHome: '3500', emergName: 'Karim Ahmed',     emergRel: 'Father'  },
  { name: 'Fatima Begum',     email: 'fatima.begum@company.com',     phone: '01711000002', dob: '1995-08-12', gender: 'female' as const, blood: 'B+',  marital: 'married'  as const, nid: '1995082002002', dept: 'Engineering',      desig: 'Frontend Developer',       join: '2023-06-15', salary: { basic: 45000, houseRent: 18000, medicalAllowance: 4000, transportAllowance: 2500, otherAllowance: 1500, grossSalary: 71000 },  profile: 'good'      as AttendanceProfile, used: 3,  city: 'Banani',        home: 'Khulna',     postHome: '9000', emergName: 'Habib Begum',     emergRel: 'Husband' },
  { name: 'Karim Hassan',     email: 'karim.hassan@company.com',     phone: '01711000003', dob: '1990-01-08', gender: 'male'   as const, blood: 'AB+', marital: 'married'  as const, nid: '1990010003003', dept: 'Marketing',        desig: 'Marketing Manager',        join: '2022-11-01', salary: { basic: 60000, houseRent: 24000, medicalAllowance: 5000, transportAllowance: 4000, otherAllowance: 3000, grossSalary: 96000 },  profile: 'excellent' as AttendanceProfile, used: 1,  city: 'Dhanmondi',     home: 'Rajshahi',   postHome: '6000', emergName: 'Roksana Hassan',  emergRel: 'Wife'    },
  { name: 'Nusrat Jahan',     email: 'nusrat.jahan@company.com',     phone: '01711000004', dob: '1994-11-25', gender: 'female' as const, blood: 'O-',  marital: 'single'   as const, nid: '1994112004004', dept: 'Finance',          desig: 'Senior Accountant',        join: '2023-01-10', salary: { basic: 38000, houseRent: 15000, medicalAllowance: 3500, transportAllowance: 2500, otherAllowance: 1000, grossSalary: 60000 },  profile: 'good'      as AttendanceProfile, used: 4,  city: 'Mirpur',        home: 'Barisal',    postHome: '8200', emergName: 'Abdul Jahan',     emergRel: 'Father'  },
  { name: 'Tanvir Islam',     email: 'tanvir.islam@company.com',     phone: '01711000005', dob: '1997-02-14', gender: 'male'   as const, blood: 'A-',  marital: 'single'   as const, nid: '1997020005005', dept: 'Engineering',      desig: 'Backend Developer',        join: '2024-02-01', salary: { basic: 42000, houseRent: 17000, medicalAllowance: 4000, transportAllowance: 2500, otherAllowance: 1500, grossSalary: 67000 },  profile: 'average'   as AttendanceProfile, used: 5,  city: 'Uttara',        home: 'Sylhet',     postHome: '3100', emergName: 'Sohel Islam',     emergRel: 'Brother' },
  { name: 'Sadia Akter',      email: 'sadia.akter@company.com',      phone: '01711000006', dob: '1996-04-30', gender: 'female' as const, blood: 'B-',  marital: 'single'   as const, nid: '1996040006006', dept: 'Design',           desig: 'UI/UX Designer',           join: '2023-09-01', salary: { basic: 40000, houseRent: 16000, medicalAllowance: 3500, transportAllowance: 2500, otherAllowance: 1000, grossSalary: 63000 },  profile: 'good'      as AttendanceProfile, used: 2,  city: 'Mohammadpur',   home: 'Narayanganj',postHome: '1400', emergName: 'Rashed Akter',    emergRel: 'Father'  },
  { name: 'Rafiqul Islam',    email: 'rafiqul.islam@company.com',    phone: '01711000007', dob: '1988-07-19', gender: 'male'   as const, blood: 'O+',  marital: 'married'  as const, nid: '1988071907007', dept: 'Sales',            desig: 'Sales Manager',            join: '2022-08-01', salary: { basic: 65000, houseRent: 26000, medicalAllowance: 5000, transportAllowance: 5000, otherAllowance: 4000, grossSalary: 105000 }, profile: 'average'   as AttendanceProfile, used: 6,  city: 'Rampura',       home: 'Gazipur',    postHome: '1700', emergName: 'Nasrin Islam',    emergRel: 'Wife'    },
  { name: 'Meherun Nahar',    email: 'meherun.nahar@company.com',    phone: '01711000008', dob: '1991-03-05', gender: 'female' as const, blood: 'AB-', marital: 'married'  as const, nid: '1991030508008', dept: 'Human Resources',  desig: 'HR Executive',             join: '2023-04-01', salary: { basic: 35000, houseRent: 14000, medicalAllowance: 3000, transportAllowance: 2000, otherAllowance: 1000, grossSalary: 55000 },  profile: 'good'      as AttendanceProfile, used: 3,  city: 'Gulshan',       home: 'Dhaka',      postHome: '1200', emergName: 'Shamim Nahar',    emergRel: 'Husband' },
  { name: 'Jahangir Alam',    email: 'jahangir.alam@company.com',    phone: '01711000009', dob: '1992-09-10', gender: 'male'   as const, blood: 'A+',  marital: 'married'  as const, nid: '1992091009009', dept: 'Engineering',      desig: 'DevOps Engineer',          join: '2023-07-01', salary: { basic: 50000, houseRent: 20000, medicalAllowance: 4500, transportAllowance: 3000, otherAllowance: 2000, grossSalary: 79500 },  profile: 'excellent' as AttendanceProfile, used: 1,  city: 'Banani',        home: 'Mymensingh', postHome: '2200', emergName: 'Amena Alam',      emergRel: 'Wife'    },
  { name: 'Sharmin Sultana',  email: 'sharmin.sultana@company.com',  phone: '01711000010', dob: '1998-12-22', gender: 'female' as const, blood: 'B+',  marital: 'single'   as const, nid: '1998122210010', dept: 'Marketing',        desig: 'Content Writer',           join: '2024-01-15', salary: { basic: 25000, houseRent: 10000, medicalAllowance: 2500, transportAllowance: 1500, otherAllowance: 1000, grossSalary: 40000 },  profile: 'poor'      as AttendanceProfile, used: 7,  city: 'Dhanmondi',     home: 'Cumilla',    postHome: '3500', emergName: 'Shamsul Sultana', emergRel: 'Father'  },
  { name: 'Mahbubur Rahman',  email: 'mahbubur.rahman@company.com',  phone: '01711000011', dob: '1985-06-15', gender: 'male'   as const, blood: 'O+',  marital: 'married'  as const, nid: '1985061511011', dept: 'Finance',          desig: 'Finance Manager',          join: '2022-05-01', salary: { basic: 70000, houseRent: 28000, medicalAllowance: 6000, transportAllowance: 4000, otherAllowance: 3000, grossSalary: 111000 }, profile: 'excellent' as AttendanceProfile, used: 2,  city: 'Uttara',        home: 'Dhaka',      postHome: '1100', emergName: 'Taslima Rahman',  emergRel: 'Wife'    },
  { name: 'Taslima Khanam',   email: 'taslima.khanam@company.com',   phone: '01711000012', dob: '1996-02-18', gender: 'female' as const, blood: 'A-',  marital: 'single'   as const, nid: '1996021812012', dept: 'Engineering',      desig: 'QA Engineer',              join: '2023-10-01', salary: { basic: 35000, houseRent: 14000, medicalAllowance: 3000, transportAllowance: 2000, otherAllowance: 1000, grossSalary: 55000 },  profile: 'good'      as AttendanceProfile, used: 2,  city: 'Mirpur',        home: 'Jessore',    postHome: '7400', emergName: 'Moslem Khanam',   emergRel: 'Father'  },
  { name: 'Asif Hossain',     email: 'asif.hossain@company.com',     phone: '01711000013', dob: '1987-10-24', gender: 'male'   as const, blood: 'B+',  marital: 'married'  as const, nid: '1987102413013', dept: 'Operations',       desig: 'Operations Manager',       join: '2022-01-01', salary: { basic: 62000, houseRent: 25000, medicalAllowance: 5000, transportAllowance: 4000, otherAllowance: 3000, grossSalary: 99000 },  profile: 'excellent' as AttendanceProfile, used: 3,  city: 'Mohammadpur',   home: 'Tangail',    postHome: '1900', emergName: 'Rumana Hossain',  emergRel: 'Wife'    },
  { name: 'Maliha Islam',     email: 'maliha.islam@company.com',     phone: '01711000014', dob: '1999-07-07', gender: 'female' as const, blood: 'O+',  marital: 'single'   as const, nid: '1999070714014', dept: 'Design',           desig: 'Graphic Designer',         join: '2024-03-01', salary: { basic: 28000, houseRent: 11000, medicalAllowance: 2500, transportAllowance: 1500, otherAllowance: 1000, grossSalary: 44000 },  profile: 'average'   as AttendanceProfile, used: 4,  city: 'Rampura',       home: 'Narsingdi',  postHome: '1600', emergName: 'Jalal Islam',     emergRel: 'Father'  },
];

// ─── Attendance generator ─────────────────────────────────────────────────────

async function generateAttendance(
  users: { _id: any; role: string; profile: AttendanceProfile }[],
  hrId: any,
  year: number,
  month: number,
  upToDay: number,
  isTodayMonth: boolean,
): Promise<number> {
  const total = Math.min(daysInMonth(year, month), upToDay);
  const records: any[] = [];

  for (let day = 1; day <= total; day++) {
    const date = new Date(year, month - 1, day);
    if (isDayOff(date)) continue;
    const ds = dateStr(year, month, day);
    const isToday = isTodayMonth && day === upToDay;

    for (let ui = 0; ui < users.length; ui++) {
      const user = users[ui];
      const probs = getProbs(user.profile);
      const r1 = seededRand(ui * 13337 + year * 777 + month * 31 + day);

      if (user.role === 'hr') {
        const checkIn = new Date(year, month - 1, day, 9, 0, 0);
        const checkOut = isToday ? null : new Date(year, month - 1, day, 18, 5, 0);
        records.push({ userId: user._id, date: ds, checkInTime: checkIn, checkOutTime: checkOut, status: 'present', isLate: false, minutesLate: 0, workingHours: checkOut ? 9.08 : null, notes: '', markedBy: hrId });
        continue;
      }

      if (r1 < probs.absentProb) {
        records.push({ userId: user._id, date: ds, checkInTime: null, checkOutTime: null, status: 'absent', isLate: false, minutesLate: 0, workingHours: null, notes: 'Absent without notice', markedBy: null });
        continue;
      }
      if (r1 < probs.absentProb + probs.leaveProb) {
        records.push({ userId: user._id, date: ds, checkInTime: null, checkOutTime: null, status: 'on-leave', isLate: false, minutesLate: 0, workingHours: null, notes: 'On approved leave', markedBy: null });
        continue;
      }

      const r2 = seededRand(ui * 99991 + year * 53 + month * 17 + day * 7);
      const isLate = r2 < probs.lateProb;
      const lateMin = isLate ? Math.floor(seededRand(ui * day + month) * 50) + 5 : 0;
      const ciH = isLate ? 10 + Math.floor(lateMin / 60) : 9;
      const ciM = isLate ? (2 + (lateMin % 60)) % 60 : Math.floor(seededRand(ui + day) * 20);
      const checkIn = new Date(year, month - 1, day, ciH, ciM, Math.floor(seededRand(ui * day) * 60));

      const r3 = seededRand(ui * 77777 + day * 11 + month * 3);
      const coExtra = Math.floor(r3 * 90);
      const checkOut = isToday ? null : new Date(year, month - 1, day, 18 + Math.floor(coExtra / 60), coExtra % 60, 0);
      const workingHours = checkOut ? parseFloat(((checkOut.getTime() - checkIn.getTime()) / 3600000).toFixed(2)) : null;

      records.push({ userId: user._id, date: ds, checkInTime: checkIn, checkOutTime: checkOut, status: isLate ? 'late' : 'present', isLate, minutesLate: lateMin, workingHours, notes: isLate ? `Late by ${lateMin} minutes` : '', markedBy: hrId });
    }
  }

  if (records.length > 0) await AttendanceRecord.insertMany(records, { ordered: false });
  return records.length;
}

// ─── Main seed ────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected!\n');

  await Promise.all([
    User.deleteMany({}),
    AttendanceRecord.deleteMany({}),
    LeaveRequest.deleteMany({}),
    EmployeeDocument.deleteMany({}),
    EmployeeUpdateLog.deleteMany({}),
  ]);
  console.log('🗑️  Cleared all existing data\n');

  const hashedHR = await bcrypt.hash('hr123', 12);
  const hashedEmp = await bcrypt.hash('emp123', 12);

  // ── HR Admin ─────────────────────────────────────────────────────────────
  const hr = await User.create({
    employeeId: 'EMP-001', name: 'Arif Rahman', email: 'hr@company.com',
    password: hashedHR, role: 'hr', phone: '01711000000', alternatePhone: '01811000000',
    dateOfBirth: new Date('1982-04-10'), gender: 'male', bloodGroup: 'O+',
    maritalStatus: 'married', nationality: 'Bangladeshi', religion: 'Islam',
    nidNumber: '1982041000000', department: 'Human Resources', designation: 'HR Manager',
    employmentType: 'full-time', joiningDate: new Date('2021-01-01'), status: 'active',
    confirmationDate: new Date('2021-07-01'), workLocation: 'Head Office', shift: 'General',
    salary: { basic: 75000, houseRent: 30000, medicalAllowance: 6000, transportAllowance: 5000, otherAllowance: 4000, grossSalary: 120000, bankName: 'Dutch-Bangla Bank', bankAccountNumber: '1010000000001', bankBranch: 'Gulshan', taxId: 'TIN-0000001' },
    presentAddress: { street: '45 Gulshan Avenue', city: 'Dhaka', district: 'Dhaka', division: 'Dhaka', postalCode: '1212', country: 'Bangladesh' },
    permanentAddress: { street: '45 Gulshan Avenue', city: 'Dhaka', district: 'Dhaka', division: 'Dhaka', postalCode: '1212', country: 'Bangladesh' },
    emergencyContact: { name: 'Nasrin Rahman', relationship: 'Wife', phone: '01711099999', address: '45 Gulshan Avenue, Dhaka' },
    education: [{ degree: 'MBA in HRM', institution: 'University of Dhaka', board: '', passingYear: 2006, result: '3.85', majorSubject: 'Human Resource Management' }],
    experience: [{ companyName: 'PeopleFirst Corporation', designation: 'HR Manager', startDate: new Date('2007-03-01'), endDate: new Date('2020-12-31'), responsibilities: 'Full HR operations: recruitment, payroll, compliance, employee engagement', reasonForLeaving: 'Better leadership opportunity' }],
    totalLeaves: 15, usedLeaves: 0,
  });
  console.log(`✅ HR Admin: ${hr.email}  (EMP-001)`);

  // ── 14 Employees ──────────────────────────────────────────────────────────
  const banks = ['Dutch-Bangla Bank', 'BRAC Bank', 'Islami Bank', 'Sonali Bank', 'Agrani Bank', 'Eastern Bank', 'Standard Chartered'];
  const postal = ['1212', '1207', '1215', '1205', '1230', '1209', '1216', '1208', '1213', '1219', '1000', '1218', '1214', '1217'];

  const createdEmps: any[] = [];
  for (let i = 0; i < EMPLOYEES.length; i++) {
    const d = EMPLOYEES[i];
    const empNum = String(i + 2).padStart(3, '0');
    const emp = await User.create({
      employeeId: `EMP-${empNum}`, name: d.name, email: d.email,
      password: hashedEmp, role: 'employee',
      phone: d.phone, alternatePhone: d.phone.replace('1711', '1811'),
      dateOfBirth: new Date(d.dob), gender: d.gender, bloodGroup: d.blood,
      maritalStatus: d.marital, nationality: 'Bangladeshi', religion: 'Islam',
      nidNumber: d.nid, department: d.dept, designation: d.desig,
      employmentType: 'full-time', joiningDate: new Date(d.join),
      confirmationDate: new Date(new Date(d.join).getTime() + 180 * 86400000),
      status: 'active', workLocation: 'Head Office', shift: 'General',
      reportingTo: hr._id,
      salary: { ...d.salary, bankName: banks[i % banks.length], bankAccountNumber: `101${empNum}99999`, bankBranch: d.city, taxId: `TIN-${empNum}0001` },
      presentAddress: { street: `${i + 10} ${d.city} Road`, city: 'Dhaka', district: 'Dhaka', division: 'Dhaka', postalCode: postal[i], country: 'Bangladesh' },
      permanentAddress: { street: `${i + 1} Village Para`, city: d.home, district: d.home, division: d.home, postalCode: d.postHome, country: 'Bangladesh' },
      emergencyContact: { name: d.emergName, relationship: d.emergRel, phone: `0190099${String(i).padStart(4, '0')}`, address: `${d.home}, Bangladesh` },
      education: [], experience: [],
      totalLeaves: 12, usedLeaves: d.used,
    });
    createdEmps.push({ _id: emp._id, role: 'employee', profile: d.profile });
    console.log(`✅ ${emp.name.padEnd(18)} ${emp.email.padEnd(35)} (EMP-${empNum})`);
  }

  // ── Attendance: Jan 2026 + Feb 2026 + Mar 1–10 2026 ─────────────────────
  console.log('\n📅 Generating attendance (BD weekends: Fri/Sat)...');
  const allUsers = [{ _id: hr._id, role: 'hr', profile: 'excellent' as AttendanceProfile }, ...createdEmps];
  const r1 = await generateAttendance(allUsers, hr._id, 2026, 1, 31, false);
  console.log(`   January 2026:   ${r1} records`);
  const r2 = await generateAttendance(allUsers, hr._id, 2026, 2, 28, false);
  console.log(`   February 2026:  ${r2} records`);
  const r3 = await generateAttendance(allUsers, hr._id, 2026, 3, 10, true);
  console.log(`   March 2026:     ${r3} records (up to today, 10 Mar)`);
  console.log(`   Total:          ${r1 + r2 + r3} attendance records\n`);

  // ── Leave Requests ────────────────────────────────────────────────────────
  const e = createdEmps;
  const leaves = [
    { userId: e[0]._id,  leaveType: 'sick',      startDate: new Date('2026-01-07'), endDate: new Date('2026-01-08'), totalDays: 2, reason: 'High fever — doctor advised 2 days rest.',              status: 'approved', reviewedBy: hr._id, reviewedAt: new Date('2026-01-07'), hrComment: 'Approved. Get well soon.' },
    { userId: e[3]._id,  leaveType: 'casual',    startDate: new Date('2026-01-12'), endDate: new Date('2026-01-14'), totalDays: 3, reason: "Mother's surgery in Barisal — needs family support.",    status: 'approved', reviewedBy: hr._id, reviewedAt: new Date('2026-01-11'), hrComment: 'Approved. Take care.' },
    { userId: e[6]._id,  leaveType: 'earned',    startDate: new Date('2026-01-19'), endDate: new Date('2026-01-23'), totalDays: 5, reason: "Annual leave — family vacation to Cox's Bazar.",         status: 'approved', reviewedBy: hr._id, reviewedAt: new Date('2026-01-15'), hrComment: 'Approved. Enjoy!' },
    { userId: e[9]._id,  leaveType: 'casual',    startDate: new Date('2026-01-27'), endDate: new Date('2026-01-29'), totalDays: 3, reason: 'Personal trip to home town.',                            status: 'rejected', reviewedBy: hr._id, reviewedAt: new Date('2026-01-26'), hrComment: 'Project deadline. Cannot approve this time.' },
    { userId: e[1]._id,  leaveType: 'sick',      startDate: new Date('2026-02-04'), endDate: new Date('2026-02-05'), totalDays: 2, reason: 'Viral flu — doctor certificate attached.',               status: 'approved', reviewedBy: hr._id, reviewedAt: new Date('2026-02-04'), hrComment: 'Approved. Rest well.' },
    { userId: e[5]._id,  leaveType: 'emergency', startDate: new Date('2026-02-10'), endDate: new Date('2026-02-11'), totalDays: 2, reason: 'Father hospitalised at Dhaka Medical College.',           status: 'approved', reviewedBy: hr._id, reviewedAt: new Date('2026-02-10'), hrComment: 'Emergency leave approved.' },
    { userId: e[10]._id, leaveType: 'earned',    startDate: new Date('2026-02-16'), endDate: new Date('2026-02-20'), totalDays: 5, reason: 'Annual planned vacation — Sundarbans trip.',             status: 'approved', reviewedBy: hr._id, reviewedAt: new Date('2026-02-14'), hrComment: 'Approved. Safe travels!' },
    { userId: e[2]._id,  leaveType: 'sick',      startDate: new Date('2026-03-03'), endDate: new Date('2026-03-04'), totalDays: 2, reason: 'Stomach infection — under medical treatment.',           status: 'approved', reviewedBy: hr._id, reviewedAt: new Date('2026-03-03'), hrComment: 'Approved.' },
    { userId: e[11]._id, leaveType: 'casual',    startDate: new Date('2026-03-12'), endDate: new Date('2026-03-13'), totalDays: 2, reason: 'Personal work in Jessore — property matter.',            status: 'pending' },
    { userId: e[4]._id,  leaveType: 'earned',    startDate: new Date('2026-03-18'), endDate: new Date('2026-03-20'), totalDays: 3, reason: 'Visiting parents in Sylhet — annual visit.',             status: 'pending' },
    { userId: e[7]._id,  leaveType: 'casual',    startDate: new Date('2026-03-25'), endDate: new Date('2026-03-27'), totalDays: 3, reason: "Nephew's wedding in Dhaka — family function.",           status: 'pending' },
    { userId: e[8]._id,  leaveType: 'sick',      startDate: new Date('2026-03-15'), endDate: new Date('2026-03-16'), totalDays: 2, reason: 'Scheduled cardiac checkup at National Heart Foundation.', status: 'pending' },
    { userId: e[12]._id, leaveType: 'casual',    startDate: new Date('2026-04-01'), endDate: new Date('2026-04-02'), totalDays: 2, reason: 'Official errand outside Dhaka.',                         status: 'pending' },
    { userId: e[13]._id, leaveType: 'sick',      startDate: new Date('2026-03-22'), endDate: new Date('2026-03-23'), totalDays: 2, reason: 'Migraine attack — neurologist consultation.',            status: 'pending' },
  ];
  await LeaveRequest.insertMany(leaves);
  console.log(`📋 Created ${leaves.length} leave requests\n`);

  // ── Documents ─────────────────────────────────────────────────────────────
  const docTemplates = [
    { documentType: 'nid',                  label: 'National ID Card',      url: 'https://placehold.co/600x400/1d4ed8/white?text=NID+Card',          mime: 'image/jpeg',      size: 180000 },
    { documentType: 'academic_certificate', label: 'Degree Certificate',    url: 'https://placehold.co/600x800/15803d/white?text=Degree+Certificate', mime: 'image/jpeg',      size: 250000 },
    { documentType: 'cv',                   label: 'Curriculum Vitae',      url: 'https://placehold.co/600x800/7e22ce/white?text=CV',                mime: 'application/pdf', size: 320000 },
    { documentType: 'offer_letter',         label: 'Offer Letter',          url: 'https://placehold.co/600x800/b91c1c/white?text=Offer+Letter',      mime: 'application/pdf', size: 150000 },
    { documentType: 'experience_letter',    label: 'Experience Letter',     url: 'https://placehold.co/600x800/c2410c/white?text=Experience+Letter',  mime: 'application/pdf', size: 120000 },
    { documentType: 'tin_certificate',      label: 'TIN Certificate',       url: 'https://placehold.co/600x400/0f766e/white?text=TIN+Certificate',   mime: 'image/jpeg',      size: 90000  },
    { documentType: 'appointment_letter',   label: 'Appointment Letter',    url: 'https://placehold.co/600x800/854d0e/white?text=Appointment+Letter', mime: 'application/pdf', size: 140000 },
  ];

  const docs: any[] = [];
  for (let i = 0; i < createdEmps.length; i++) {
    const empId = createdEmps[i]._id;
    const numDocs = 2 + (i % 4); // 2–5 docs per employee
    for (let d = 0; d < numDocs; d++) {
      const t = docTemplates[d % docTemplates.length];
      const isVerified = d === 0 && i < 8;
      docs.push({ userId: empId, documentType: t.documentType, documentName: `${t.label} — ${EMPLOYEES[i].name}`, fileUrl: t.url, storageType: 'imgbb', fileType: t.mime, fileSize: t.size, isVerified, verifiedBy: isVerified ? hr._id : undefined, verifiedAt: isVerified ? new Date('2026-01-20') : undefined });
    }
  }
  await EmployeeDocument.insertMany(docs);
  console.log(`📄 Created ${docs.length} documents\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅  SEED COMPLETE — 15 employees (1 HR + 14 staff)');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  HR Login:   hr@company.com         password: hr123');
  console.log('  Emp Login:  rahim.ahmed@company.com password: emp123');
  console.log('              (all other employees also use emp123)');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Attendance: January + February + March 2026 (BD weekends Fri/Sat)`);
  console.log(`  Leave reqs: ${leaves.length}  |  Documents: ${docs.length}`);
  console.log(`  IDs:        EMP-001 (HR) → EMP-015`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});