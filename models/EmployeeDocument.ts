import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployeeDocument extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  documentType:
    | 'nid'
    | 'passport'
    | 'photo'
    | 'cv'
    | 'certificate'
    | 'offer_letter'
    | 'appointment_letter'
    | 'increment_letter'
    | 'experience_certificate'
    | 'tax_document'
    | 'bank_statement'
    | 'academic_certificate'
    | 'training_certificate'
    | 'other';
  documentName: string;
  fileUrl: string;
  deleteUrl?: string;
  storageType: 'imgbb' | 'base64';
  fileType: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  notes?: string;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeDocumentSchema = new Schema<IEmployeeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentType: {
      type: String,
      enum: [
        'nid', 'passport', 'photo', 'cv', 'certificate',
        'offer_letter', 'appointment_letter', 'increment_letter',
        'experience_certificate', 'tax_document', 'bank_statement',
        'academic_certificate', 'training_certificate', 'other',
      ],
      required: true,
    },
    documentName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    deleteUrl: { type: String, default: null },
    storageType: {
      type: String,
      enum: ['imgbb', 'base64'],
      required: true,
    },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

const EmployeeDocument: Model<IEmployeeDocument> =
  mongoose.models.EmployeeDocument ||
  mongoose.model<IEmployeeDocument>('EmployeeDocument', EmployeeDocumentSchema);

export default EmployeeDocument;
