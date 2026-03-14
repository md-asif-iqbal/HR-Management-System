import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddress {
  street?: string;
  city?: string;
  district?: string;
  division?: string;
  postalCode?: string;
  country?: string;
}

export interface IEmergencyContact {
  name?: string;
  relationship?: string;
  phone?: string;
  address?: string;
}

export interface ISalary {
  basic?: number;
  houseRent?: number;
  medicalAllowance?: number;
  transportAllowance?: number;
  otherAllowance?: number;
  grossSalary?: number;
  bankName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  taxId?: string;
}

export interface IEducation {
  degree?: string;
  institution?: string;
  board?: string;
  passingYear?: number;
  result?: string;
  majorSubject?: string;
}

export interface IExperience {
  companyName?: string;
  designation?: string;
  startDate?: Date;
  endDate?: Date;
  responsibilities?: string;
  reasonForLeaving?: string;
}

export interface IRegisteredDevice {
  fingerprint: string;
  browser?: string;
  os?: string;
  screenResolution?: string;
  language?: string;
  timezone?: string;
  registeredAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: string;
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'hr';
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  maritalStatus?: 'single' | 'married' | 'divorced';
  nationality?: string;
  religion?: string;
  nidNumber?: string;
  passportNumber?: string;
  presentAddress?: IAddress;
  permanentAddress?: IAddress;
  emergencyContact?: IEmergencyContact;
  department?: string;
  designation?: string;
  employmentType?: 'full-time' | 'part-time' | 'contractual' | 'intern';
  joiningDate?: Date;
  confirmationDate?: Date;
  resignationDate?: Date;
  status: 'active' | 'inactive' | 'terminated' | 'resigned';
  reportingTo?: mongoose.Types.ObjectId;
  workLocation?: string;
  shift?: string;
  salary?: ISalary;
  education?: IEducation[];
  experience?: IExperience[];
  avatar?: {
    url?: string;
    deleteUrl?: string;
  };
  registeredDevice?: IRegisteredDevice;
  deviceTrackingEnabled: boolean;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  totalLeaves: number;
  usedLeaves: number;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    division: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: 'Bangladesh' },
  },
  { _id: false }
);

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, default: '' },
    relationship: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  { _id: false }
);

const SalarySchema = new Schema<ISalary>(
  {
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
  },
  { _id: false }
);

const EducationSchema = new Schema<IEducation>(
  {
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    board: { type: String, default: '' },
    passingYear: { type: Number },
    result: { type: String, default: '' },
    majorSubject: { type: String, default: '' },
  },
  { _id: true }
);

const ExperienceSchema = new Schema<IExperience>(
  {
    companyName: { type: String, default: '' },
    designation: { type: String, default: '' },
    startDate: { type: Date },
    endDate: { type: Date },
    responsibilities: { type: String, default: '' },
    reasonForLeaving: { type: String, default: '' },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
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

    presentAddress: { type: AddressSchema, default: () => ({}) },
    permanentAddress: { type: AddressSchema, default: () => ({}) },
    emergencyContact: { type: EmergencyContactSchema, default: () => ({}) },

    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contractual', 'intern'],
      default: 'full-time',
    },
    joiningDate: { type: Date },
    confirmationDate: { type: Date },
    resignationDate: { type: Date },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated', 'resigned'],
      default: 'active',
    },
    reportingTo: { type: Schema.Types.ObjectId, ref: 'User' },
    workLocation: { type: String, default: '' },
    shift: { type: String, default: 'General' },

    salary: { type: SalarySchema, default: () => ({}) },

    education: { type: [EducationSchema], default: [] },
    experience: { type: [ExperienceSchema], default: [] },

    avatar: {
      url: { type: String, default: '' },
      deleteUrl: { type: String, default: '' },
    },

    registeredDevice: {
      fingerprint: { type: String, default: '' },
      browser: { type: String, default: '' },
      os: { type: String, default: '' },
      screenResolution: { type: String, default: '' },
      language: { type: String, default: '' },
      timezone: { type: String, default: '' },
      registeredAt: { type: Date },
    },
    deviceTrackingEnabled: { type: Boolean, default: true },

    resetPasswordToken: { type: String, default: '' },
    resetPasswordExpires: { type: Date, default: null },

    totalLeaves: { type: Number, default: 12 },
    usedLeaves: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Auto-generate employeeId before validation
UserSchema.pre('validate', async function (this: any) {
  if (this.isNew && !this.employeeId) {
    const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
    const lastUser = await UserModel.findOne({}, { employeeId: 1 })
      .sort({ createdAt: -1 })
      .lean();

    let nextNum = 1;
    if (lastUser && (lastUser as any).employeeId) {
      const match = (lastUser as any).employeeId.match(/EMP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    this.employeeId = `EMP-${String(nextNum).padStart(3, '0')}`;
  }
  // Do NOT call next() — Mongoose 9 async hooks resolve via the returned promise
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
