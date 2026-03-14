import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceRecord extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'present' | 'late' | 'absent' | 'half-day' | 'on-leave';
  isLate: boolean;
  minutesLate: number;
  workingHours?: number;
  notes?: string;
  markedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true },
    checkInTime: { type: Date, default: null },
    checkOutTime: { type: Date, default: null },
    status: {
      type: String,
      enum: ['present', 'late', 'absent', 'half-day', 'on-leave'],
      required: true,
    },
    isLate: { type: Boolean, default: false },
    minutesLate: { type: Number, default: 0 },
    workingHours: { type: Number, default: null },
    notes: { type: String, default: '' },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

AttendanceRecordSchema.index({ userId: 1, date: 1 }, { unique: true });

const AttendanceRecord: Model<IAttendanceRecord> =
  mongoose.models.AttendanceRecord ||
  mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);

export default AttendanceRecord;
