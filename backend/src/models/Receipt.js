import mongoose from 'mongoose';

const deductionItemSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: [true, 'Deduction label is required'],
      trim: true,
      maxlength: [80, 'Deduction label cannot exceed 80 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Deduction amount is required'],
      min: [0, 'Deduction amount cannot be negative'],
    },
  },
  { _id: false }
);

const payPeriodSchema = new mongoose.Schema(
  {
    month: {
      type: Number,
      required: [true, 'Pay period month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Pay period year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [2100, 'Year cannot exceed 2100'],
    },
    label: {
      type: String,
      trim: true,
      default: '',
      maxlength: [40, 'Pay period label cannot exceed 40 characters'],
    },
  },
  { _id: false }
);

const logoSnapshotSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      trim: true,
      default: 'Codenap IT Services Private Limited',
      maxlength: [150, 'Company name snapshot cannot exceed 150 characters'],
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Tagline snapshot cannot exceed 200 characters'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: [400, 'Address snapshot cannot exceed 400 characters'],
    },
    contactEmail: {
      type: String,
      trim: true,
      default: 'info@codenap.co.in',
      maxlength: [254, 'Contact email snapshot cannot exceed 254 characters'],
    },
    website: {
      type: String,
      trim: true,
      default: 'https://codenap.in/',
      maxlength: [255, 'Website snapshot cannot exceed 255 characters'],
    },
    signatoryName: {
      type: String,
      trim: true,
      default: 'Authorized Signatory',
      maxlength: [120, 'Signatory name snapshot cannot exceed 120 characters'],
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Logo URL snapshot cannot exceed 500 characters'],
    },
    logoData: {
      type: String,
      default: '',
    },
    receiptLogoUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Receipt logo URL snapshot cannot exceed 500 characters'],
    },
    receiptLogoData: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: [true, 'Receipt number is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [40, 'Receipt number cannot exceed 40 characters'],
    },
    recipientType: {
      type: String,
      required: true,
      enum: {
        values: ['intern', 'worker', 'employee'],
        message: 'Recipient type must be intern, worker, or employee',
      },
      default: 'intern',
    },
    employeeName: {
      type: String,
      required: [true, 'Recipient name is required'],
      trim: true,
      minlength: [2, 'Recipient name must be at least 2 characters'],
      maxlength: [120, 'Recipient name cannot exceed 120 characters'],
    },
    employeeId: {
      type: String,
      required: [true, 'Employee/Intern ID is required'],
      trim: true,
      uppercase: true,
      maxlength: [40, 'Employee/Intern ID cannot exceed 40 characters'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
      maxlength: [100, 'Designation cannot exceed 100 characters'],
    },
    department: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    dateOfJoining: {
      type: Date,
      default: null,
    },
    payPeriod: {
      type: payPeriodSchema,
      required: [true, 'Pay period is required'],
    },
    workingDays: {
      type: Number,
      required: [true, 'Total working days are required'],
      min: [1, 'Working days must be at least 1'],
      max: [31, 'Working days cannot exceed 31'],
    },
    paidDays: {
      type: Number,
      required: [true, 'Paid days are required'],
      min: [0, 'Paid days cannot be negative'],
      max: [31, 'Paid days cannot exceed 31'],
      validate: {
        validator(value) {
          return this.workingDays == null || value <= this.workingDays;
        },
        message: 'Paid days cannot exceed total working days',
      },
    },
    monthlyAmount: {
      type: Number,
      required: [true, 'Monthly stipend/salary amount is required'],
      min: [0, 'Monthly amount cannot be negative'],
    },
    grossEarnings: {
      type: Number,
      required: [true, 'Gross earnings are required'],
      min: [0, 'Gross earnings cannot be negative'],
    },
    deductions: {
      type: [deductionItemSchema],
      default: [],
    },
    totalDeductions: {
      type: Number,
      required: [true, 'Total deductions are required'],
      min: [0, 'Total deductions cannot be negative'],
      default: 0,
    },
    netPayable: {
      type: Number,
      required: [true, 'Net payable amount in INR is required'],
      min: [0, 'Net payable cannot be negative'],
    },
    amountInWords: {
      type: String,
      required: [true, 'Amount in words is required'],
      trim: true,
      maxlength: [300, 'Amount in words cannot exceed 300 characters'],
    },
    paymentMode: {
      type: String,
      required: true,
      enum: {
        values: ['Bank Transfer', 'UPI', 'Cash'],
        message: 'Unsupported payment mode',
      },
      default: 'Bank Transfer',
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
    },
    // Snapshot preserves the exact logo and company header shown when the slip was issued.
    logoSnapshot: {
      type: logoSnapshotSchema,
      default: () => ({}),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

receiptSchema.index({ 'payPeriod.year': -1, 'payPeriod.month': -1, createdAt: -1 });
receiptSchema.index({ recipientType: 1, createdAt: -1 });
receiptSchema.index({ employeeName: 'text', employeeId: 'text', receiptNumber: 'text' });

const Receipt = mongoose.model('Receipt', receiptSchema);

export default Receipt;
