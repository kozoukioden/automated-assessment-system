import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      trim: true,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    englishLevel: {
      type: String,
      enum: {
        values: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        message: '{VALUE} is not a valid CEFR level',
      },
      default: 'B1',
    },
    preferences: {
      notificationEnabled: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: false,
      },
      language: {
        type: String,
        default: 'en',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
studentSchema.index({ userId: 1 });
studentSchema.index({ studentId: 1 });

// Auto-generate student ID if not provided
// IMPORTANT: Use pre('validate') not pre('save') because validation runs first
studentSchema.pre('validate', async function (next) {
  if (!this.studentId) {
    const count = await mongoose.model('Student').countDocuments();
    this.studentId = `STU${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
