// Seed script to create demo admin user and sample data
// Run with: bun run seed

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      email: "admin@school.com",
      name: "School Admin",
      password: adminPassword,
      role: "ADMIN",
      phone: "+91-9876543210",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create demo parent user
  const parentPassword = await bcrypt.hash("parent123", 12);
  const parent = await prisma.user.upsert({
    where: { email: "parent@example.com" },
    update: {},
    create: {
      email: "parent@example.com",
      name: "Rajesh Kumar",
      password: parentPassword,
      role: "PARENT",
      phone: "+91-9876543211",
    },
  });
  console.log("Created parent user:", parent.email);

  // Create a demo student with completed assessment
  const existingStudent = await prisma.student.findFirst({
    where: { parentId: parent.id },
  });

  if (!existingStudent) {
    const student = await prisma.student.create({
      data: {
        applicationId: "KRA-10001",
        parentId: parent.id,
        childName: "Aarav Kumar",
        dateOfBirth: "2020-03-15",
        gender: "Male",
        nationality: "Indian",
        languagesSpoken: "English, Hindi",
        previousSchool: "Little Tots Playhouse",
        specialMedicalNotes: "",
        fatherName: "Rajesh Kumar",
        motherName: "Priya Kumar",
        mobileNumber: "+91-9876543211",
        parentEmail: "parent@example.com",
        address: "45, MG Road, Bangalore, Karnataka 560001",
        schoolApplied: "Sunshine Kindergarten",
        gradeApplied: "Kindergarten",
        consentGiven: true,
        status: "UNDER_REVIEW",
        currentStep: 4,
      },
    });
    console.log("Created demo student:", student.childName);

    // Create questionnaire
    await prisma.questionnaire.create({
      data: {
        studentId: student.id,
        sectionA: JSON.stringify({ q1: "yes", q2: "yes", q3: "sometimes" }),
        sectionB: JSON.stringify({ q1: "sometimes", q2: "yes", q3: "no" }),
        sectionC: JSON.stringify({ q1: "yes", q2: "sometimes", q3: "with help" }),
        completedAt: new Date(),
      },
    });
    console.log("Created demo questionnaire");

    // Create AI analysis
    await prisma.aIAnalysis.create({
      data: {
        studentId: student.id,
        sittingScore: 7.5,
        attentionScore: 8.2,
        hyperactivityScore: 6.8,
        emotionalScore: 7.0,
        instructionScore: 6.5,
        speechClarity: 7.8,
        vocabularyLevel: 6.5,
        responseConfidence: 7.0,
        responseDelay: 1.5,
        readinessScore: 78,
        attentionLevel: "Good",
        instructionFollowing: "Moderate",
        emotionalBehavior: "Shows gradual adaptation to new environments. Occasional separation anxiety observed which is age-appropriate.",
        socialReadiness: "Good",
        classroomAdaptability: "Adapts well with structured routines and visual cues. Benefits from transition time between activities.",
        teacherRecommendation: "Provide visual instructions and calm verbal engagement. Allow transition time between activities. Use positive reinforcement for task completion. Pair with socially confident peers for group activities.",
        riskFlags: JSON.stringify([]),
        overallResult: JSON.stringify({
          readiness_score: 78,
          attention_level: "Good",
          instruction_following: "Moderate",
          emotional_behavior: "Shows gradual adaptation to new environments",
          social_readiness: "Good",
          classroom_adaptability: "Adapts well with structured routines",
          teacher_recommendation: "Provide visual instructions and calm verbal engagement",
          risk_flags: [],
        }),
        analysisStatus: "COMPLETED",
        videoAnalysisStatus: "COMPLETED",
        speechAnalysisStatus: "COMPLETED",
        behavioralStatus: "COMPLETED",
        analyzedAt: new Date(),
      },
    });
    console.log("Created demo AI analysis");

    // Create a second student
    const student2 = await prisma.student.create({
      data: {
        applicationId: "KRA-10002",
        parentId: parent.id,
        childName: "Ananya Sharma",
        dateOfBirth: "2020-07-22",
        gender: "Female",
        nationality: "Indian",
        languagesSpoken: "English, Hindi, Kannada",
        previousSchool: "",
        specialMedicalNotes: "Mild dust allergy",
        fatherName: "Vikram Sharma",
        motherName: "Meera Sharma",
        mobileNumber: "+91-9876543212",
        parentEmail: "parent@example.com",
        address: "12, Brigade Road, Bangalore, Karnataka 560025",
        schoolApplied: "Green Meadows School",
        gradeApplied: "Pre-K",
        consentGiven: true,
        status: "QUESTIONNAIRE",
        currentStep: 2,
      },
    });
    console.log("Created demo student 2:", student2.childName);

    // Create notification for parent
    await prisma.notification.create({
      data: {
        userId: parent.id,
        type: "STATUS_CHANGE",
        title: "Application Under Review",
        message: "Your child Aarav Kumar's application (KRA-10001) is now under review. AI analysis has been completed.",
        read: false,
      },
    });
    console.log("Created demo notification");
  }

  console.log("\nSeed completed successfully!");
  console.log("\nDemo accounts:");
  console.log("  Admin: admin@school.com / admin123");
  console.log("  Parent: parent@example.com / parent123");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
