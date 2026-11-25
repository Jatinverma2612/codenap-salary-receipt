import mongoose from 'mongoose';

const ALLOWED_LOGO_MIME_TYPES = ['', 'image/png', 'image/jpeg', 'image/webp'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const companySettingsSchema = new mongoose.Schema(
  {
    // Ensures a single active settings document is maintained for the company.
    settingsKey: {
      type: String,
      unique: true,
      default: 'default',
      immutable: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      default: 'Codenap IT Services Private Limited',
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    tagline: {
      type: String,
      trim: true,
      default: '',
      maxlength: [200, 'Tagline cannot exceed 200 characters'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: [400, 'Address cannot exceed 400 characters'],
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'info@codenap.co.in',
      maxlength: [254, 'Contact email cannot exceed 254 characters'],
      validate: {
        validator(value) {
          return !value || EMAIL_REGEX.test(value);
        },
        message: 'Please provide a valid contact email address',
      },
    },
    website: {
      type: String,
      trim: true,
      default: 'https://codenap.in/',
      maxlength: [255, 'Website URL cannot exceed 255 characters'],
    },
    signatoryName: {
      type: String,
      trim: true,
      default: 'Authorized Signatory',
      maxlength: [120, 'Signatory name cannot exceed 120 characters'],
    },
    receiptPrefix: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'CNP',
      maxlength: [15, 'Receipt prefix cannot exceed 15 characters'],
      match: [/^[A-Z0-9-]+$/, 'Receipt prefix may only contain letters, numbers, and hyphens'],
    },
    // Relative safe filename inside backend/uploads/ for the admin software logo.
    logoPath: {
      type: String,
      trim: true,
      default: '',
      maxlength: [255, 'Logo path cannot exceed 255 characters'],
    },
    logoUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Logo URL cannot exceed 500 characters'],
    },
    logoMimeType: {
      type: String,
      enum: ALLOWED_LOGO_MIME_TYPES,
      default: '',
    },
    logoData: {
      type: String,
      default: '',
    },
    // Separate custom logo used exclusively on generated Stipend & Salary Receipts.
    receiptLogoPath: {
      type: String,
      trim: true,
      default: '',
      maxlength: [255, 'Receipt logo path cannot exceed 255 characters'],
    },
    receiptLogoUrl: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Receipt logo URL cannot exceed 500 characters'],
    },
    receiptLogoMimeType: {
      type: String,
      enum: ALLOWED_LOGO_MIME_TYPES,
      default: '',
    },
    receiptLogoData: {
      type: String,
      default: '',
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

const CompanySettings = mongoose.model('CompanySettings', companySettingsSchema);

export default CompanySettings;
