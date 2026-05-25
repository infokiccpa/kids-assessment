import mongoose, { Schema, Document, Model } from 'mongoose';

// ============================================
// USER MODEL
// ============================================
export interface IUser extends Document {
  _id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'PARENT' },
  phone: { type: String },
}, { timestamps: true });

// ============================================
// STUDENT MODEL
// ============================================
export interface IStudent extends Document {
  _id: string;
  applicationId: string;
  parentId: string;
  childName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  languagesSpoken: string;
  previousSchool: string;
  specialMedicalNotes: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  parentEmail: string;
  address: string;
  schoolApplied: string;
  gradeApplied: string;
  consentGiven: boolean;
  status: string;
  currentStep: number;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  applicationId: { type: String, required: true, unique: true },
  parentId: { type: String, required: true },
  childName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  gender: { type: String, required: true },
  nationality: { type: String, default: '' },
  languagesSpoken: { type: String, default: '' },
  previousSchool: { type: String, default: '' },
  specialMedicalNotes: { type: String, default: '' },
  fatherName: { type: String, default: '' },
  motherName: { type: String, default: '' },
  mobileNumber: { type: String, default: '' },
  parentEmail: { type: String, default: '' },
  address: { type: String, default: '' },
  schoolApplied: { type: String, default: '' },
  gradeApplied: { type: String, default: '' },
  consentGiven: { type: Boolean, default: false },
  status: { type: String, default: 'DRAFT' },
  currentStep: { type: Number, default: 1 },
}, { timestamps: true });

// ============================================
// QUESTIONNAIRE MODEL
// ============================================
export interface IQuestionnaire extends Document {
  _id: string;
  studentId: string;
  sectionA: string;
  sectionB: string;
  sectionC: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QuestionnaireSchema = new Schema<IQuestionnaire>({
  studentId: { type: String, required: true, unique: true },
  sectionA: { type: String, default: '{}' },
  sectionB: { type: String, default: '{}' },
  sectionC: { type: String, default: '{}' },
  completedAt: { type: Date },
}, { timestamps: true });

// ============================================
// VIDEO MODEL
// ============================================
export interface IVideo extends Document {
  _id: string;
  studentId: string;
  taskType: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  duration: number;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>({
  studentId: { type: String, required: true },
  taskType: { type: String, required: true },
  filePath: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

VideoSchema.index({ studentId: 1, taskType: 1 }, { unique: true });

// ============================================
// AI ANALYSIS MODEL
// ============================================
export interface IAIAnalysis extends Document {
  _id: string;
  studentId: string;
  sittingScore: number;
  attentionScore: number;
  hyperactivityScore: number;
  emotionalScore: number;
  instructionScore: number;
  speechClarity: number;
  vocabularyLevel: number;
  responseConfidence: number;
  responseDelay: number;
  readinessScore: number;
  attentionLevel: string;
  instructionFollowing: string;
  emotionalBehavior: string;
  socialReadiness: string;
  classroomAdaptability: string;
  teacherRecommendation: string;
  riskFlags: string;
  overallResult: string;
  analysisStatus: string;
  videoAnalysisStatus: string;
  speechAnalysisStatus: string;
  behavioralStatus: string;
  analyzedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIAnalysisSchema = new Schema<IAIAnalysis>({
  studentId: { type: String, required: true, unique: true },
  sittingScore: { type: Number, default: 0 },
  attentionScore: { type: Number, default: 0 },
  hyperactivityScore: { type: Number, default: 0 },
  emotionalScore: { type: Number, default: 0 },
  instructionScore: { type: Number, default: 0 },
  speechClarity: { type: Number, default: 0 },
  vocabularyLevel: { type: Number, default: 0 },
  responseConfidence: { type: Number, default: 0 },
  responseDelay: { type: Number, default: 0 },
  readinessScore: { type: Number, default: 0 },
  attentionLevel: { type: String, default: '' },
  instructionFollowing: { type: String, default: '' },
  emotionalBehavior: { type: String, default: '' },
  socialReadiness: { type: String, default: '' },
  classroomAdaptability: { type: String, default: '' },
  teacherRecommendation: { type: String, default: '' },
  riskFlags: { type: String, default: '[]' },
  overallResult: { type: String, default: '{}' },
  analysisStatus: { type: String, default: 'PENDING' },
  videoAnalysisStatus: { type: String, default: 'PENDING' },
  speechAnalysisStatus: { type: String, default: 'PENDING' },
  behavioralStatus: { type: String, default: 'PENDING' },
  analyzedAt: { type: Date },
}, { timestamps: true });

// ============================================
// REPORT MODEL
// ============================================
export interface IReport extends Document {
  _id: string;
  studentId: string;
  filePath: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>({
  studentId: { type: String, required: true, unique: true },
  filePath: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// ============================================
// NOTIFICATION MODEL
// ============================================
export interface INotification extends Document {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

// ============================================
// ADMIN NOTE MODEL
// ============================================
export interface IAdminNote extends Document {
  _id: string;
  studentId: string;
  adminId: string;
  note: string;
  action: string;
  createdAt: Date;
}

const AdminNoteSchema = new Schema<IAdminNote>({
  studentId: { type: String, required: true },
  adminId: { type: String, required: true },
  note: { type: String, default: '' },
  action: { type: String, required: true },
}, { timestamps: true });

// ============================================
// EXPORT MODELS (singleton pattern to avoid model re-registration)
// ============================================
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);
export const Questionnaire: Model<IQuestionnaire> = mongoose.models.Questionnaire || mongoose.model<IQuestionnaire>('Questionnaire', QuestionnaireSchema);
export const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>('Video', VideoSchema);
export const AIAnalysis: Model<IAIAnalysis> = mongoose.models.AIAnalysis || mongoose.model<IAIAnalysis>('AIAnalysis', AIAnalysisSchema);
export const Report: Model<IReport> = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);
export const Notification: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const AdminNote: Model<IAdminNote> = mongoose.models.AdminNote || mongoose.model<IAdminNote>('AdminNote', AdminNoteSchema);
