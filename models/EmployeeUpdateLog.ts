import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IChangeEntry {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
}

export interface IEmployeeUpdateLog extends Document {
  _id: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  updatedByName: string;
  updatedByRole: string;
  section: string;
  sectionLabel: string;
  changes: IChangeEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const ChangeEntrySchema = new Schema<IChangeEntry>(
  {
    field: { type: String, required: true },
    fieldLabel: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const EmployeeUpdateLogSchema = new Schema<IEmployeeUpdateLog>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedByName: { type: String, required: true },
    updatedByRole: { type: String, required: true },
    section: { type: String, required: true },
    sectionLabel: { type: String, required: true },
    changes: { type: [ChangeEntrySchema], required: true },
  },
  {
    timestamps: true,
  }
);

EmployeeUpdateLogSchema.index({ employeeId: 1, createdAt: -1 });

const EmployeeUpdateLog: Model<IEmployeeUpdateLog> =
  mongoose.models.EmployeeUpdateLog ||
  mongoose.model<IEmployeeUpdateLog>('EmployeeUpdateLog', EmployeeUpdateLogSchema);

export default EmployeeUpdateLog;
