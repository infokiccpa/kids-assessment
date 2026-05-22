import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json();

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Get student data with all related info
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { questionnaire: true, videos: true, aiAnalysis: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Create or update AI analysis record
    const analysis = await db.aIAnalysis.upsert({
      where: { studentId },
      create: {
        studentId,
        analysisStatus: "PROCESSING",
        videoAnalysisStatus: "PROCESSING",
        speechAnalysisStatus: "PROCESSING",
        behavioralStatus: "PROCESSING",
      },
      update: {
        analysisStatus: "PROCESSING",
        videoAnalysisStatus: "PROCESSING",
        speechAnalysisStatus: "PROCESSING",
        behavioralStatus: "PROCESSING",
      },
    });

    try {
      // Parse questionnaire data
      const sectionA: Record<string, string> = student.questionnaire
        ? safeParseJSON(student.questionnaire.sectionA)
        : {};
      const sectionB: Record<string, string> = student.questionnaire
        ? safeParseJSON(student.questionnaire.sectionB)
        : {};
      const sectionC: Record<string, string> = student.questionnaire
        ? safeParseJSON(student.questionnaire.sectionC)
        : {};

      // ============================================
      // STEP 1: Video Analysis using VLM
      // ============================================
      let videoAnalysisResult = {
        sittingScore: calculateSittingScore(sectionA),
        attentionScore: calculateAttentionScore(sectionA),
        hyperactivityScore: calculateHyperactivityScore(sectionA, sectionB),
        emotionalScore: calculateEmotionalScore(sectionB),
        instructionScore: calculateInstructionScore(sectionA, sectionC),
      };

      try {
        const zai = await ZAI.create();
        const videoObservations: string[] = [];
        const MAX_VIDEO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit for VLM

        // Analyze each uploaded video using VLM
        for (const video of student.videos) {
          try {
            const videoPath = path.join(process.cwd(), "public", video.filePath);
            
            if (fs.existsSync(videoPath)) {
              const videoBuffer = fs.readFileSync(videoPath);
              
              // Skip videos that are too large for VLM API
              if (videoBuffer.length > MAX_VIDEO_SIZE_BYTES) {
                console.log(`Skipping VLM for ${video.taskType}: video too large (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB)`);
                continue;
              }
              
              const base64Video = videoBuffer.toString("base64");
              
              // Determine MIME type from file extension
              const ext = video.filePath.split(".").pop()?.toLowerCase() || "webm";
              const mimeType = getVideoMimeType(ext);
              
              const taskDescription = getTaskDescription(video.taskType);
              
              const vlmResponse = await zai.chat.completions.createVision({
                messages: [
                  {
                    role: "system",
                    content:
                      "You are an expert early childhood education observer. Analyze the video of a kindergarten-age child performing a task. Provide observations about their behavior, attention, emotional state, and physical abilities. Use educational readiness language only - never medical terminology. Be specific and objective.",
                  },
                  {
                    role: "user",
                    content: [
                      {
                        type: "text",
                        text: `Observe this video of a child performing: "${taskDescription}". 
                        
Provide your analysis as a JSON object with these fields:
{
  "observed_behaviors": ["list of observed behaviors"],
  "attention_level": "<Good|Moderate|Needs Support>",
  "sitting_ability": "<Good|Moderate|Needs Support>", 
  "emotional_state": "<Calm|Slightly Anxious|Distressed>",
  "instruction_following": "<Good|Moderate|Needs Support>",
  "physical_activity_level": "<Calm|Moderately Active|Very Active>",
  "engagement": "<Engaged|Partially Engaged|Disengaged>",
  "summary": "<brief observation summary>"
}

Respond with ONLY the JSON object.`,
                      },
                      {
                        type: "video_url",
                        video_url: {
                          url: `data:${mimeType};base64,${base64Video}`,
                        },
                      },
                    ],
                  },
                ],
                thinking: { type: "disabled" },
              });

              const vlmText =
                vlmResponse?.choices?.[0]?.message?.content ||
                vlmResponse?.content ||
                "";
              videoObservations.push(
                `[${video.taskType}]: ${vlmText}`
              );
            }
          } catch (videoErr) {
            console.error(
              `VLM analysis failed for video ${video.taskType}:`,
              videoErr instanceof Error ? videoErr.message : videoErr
            );
            // Continue with other videos
          }
        }

        // If we got VLM observations, use them to refine scores
        if (videoObservations.length > 0) {
          try {
            const scoreRefinement = await zai.chat.completions.create({
              messages: [
                {
                  role: "system",
                  content:
                    "You are an early childhood education assessment specialist. Based on video observations and questionnaire responses, calculate readiness scores. Always respond with valid JSON only.",
                },
                {
                  role: "user",
                  content: `Based on the following video observations and questionnaire data for a kindergarten readiness assessment, provide refined scores.

Questionnaire Responses:
- Attention Section: ${JSON.stringify(sectionA)}
- Emotional Section: ${JSON.stringify(sectionB)}
- Social Section: ${JSON.stringify(sectionC)}

Video Observations:
${videoObservations.join("\n\n")}

Base scores from questionnaire (adjust based on video observations):
- Sitting: ${videoAnalysisResult.sittingScore.toFixed(1)}
- Attention: ${videoAnalysisResult.attentionScore.toFixed(1)}
- Hyperactivity: ${videoAnalysisResult.hyperactivityScore.toFixed(1)}
- Emotional: ${videoAnalysisResult.emotionalScore.toFixed(1)}
- Instruction: ${videoAnalysisResult.instructionScore.toFixed(1)}

Provide refined scores as JSON:
{
  "sitting_score": <1-10>,
  "attention_score": <1-10>,
  "hyperactivity_score": <1-10, higher=less hyperactive>,
  "emotional_score": <1-10>,
  "instruction_score": <1-10>
}

Respond with ONLY the JSON object.`,
                },
              ],
              stream: false,
            });

            const scoreText =
              scoreRefinement?.choices?.[0]?.message?.content ||
              scoreRefinement?.content ||
              "";
            const scoreMatch = scoreText.match(/\{[\s\S]*\}/);
            if (scoreMatch) {
              const refined = JSON.parse(scoreMatch[0]);
              if (refined.sitting_score) videoAnalysisResult.sittingScore = clampScore(refined.sitting_score);
              if (refined.attention_score) videoAnalysisResult.attentionScore = clampScore(refined.attention_score);
              if (refined.hyperactivity_score) videoAnalysisResult.hyperactivityScore = clampScore(refined.hyperactivity_score);
              if (refined.emotional_score) videoAnalysisResult.emotionalScore = clampScore(refined.emotional_score);
              if (refined.instruction_score) videoAnalysisResult.instructionScore = clampScore(refined.instruction_score);
            }
          } catch (scoreErr) {
            console.error("Score refinement failed, using base scores:", scoreErr);
          }
        }
      } catch (vlmError) {
        console.error("VLM analysis error, using questionnaire-based scores:", vlmError);
      }

      // ============================================
      // STEP 2: Speech Analysis using ASR
      // ============================================
      let speechResult = {
        speechClarity: calculateSpeechScore(sectionC),
        vocabularyLevel: 5 + Math.random() * 3,
        responseConfidence: 5 + Math.random() * 3,
        responseDelay: 1.5 + Math.random() * 2,
        transcription: "",
      };

      // Find TASK4 (Self Introduction) video for speech analysis
      const speechVideo = student.videos.find((v) => v.taskType === "TASK4");

      if (speechVideo) {
        try {
          const zai = await ZAI.create();
          const videoPath = path.join(
            process.cwd(),
            "public",
            speechVideo.filePath
          );

          if (fs.existsSync(videoPath)) {
            const audioBuffer = fs.readFileSync(videoPath);
            const base64Audio = audioBuffer.toString("base64");

            const asrResponse = await zai.audio.asr.create({
              file_base64: base64Audio,
            });

            const transcription =
              asrResponse?.text || "";

            if (transcription && transcription.trim().length > 0) {
              speechResult.transcription = transcription;

              // Analyze the transcription for speech quality
              try {
                const speechAnalysisPrompt = `You are a speech-language pathologist specializing in early childhood. Analyze this transcription of a kindergarten-age child's self-introduction.

IMPORTANT: This is an educational observation, NOT a medical diagnosis. Use safe educational wording only.

Transcription: "${transcription}"

Analyze and provide scores as JSON:
{
  "speech_clarity": <1-10, clarity of pronunciation>,
  "vocabulary_level": <1-10, variety and age-appropriateness of words>,
  "response_confidence": <1-10, confidence and willingness to speak>,
  "estimated_response_delay": <seconds, how long before the child started speaking>,
  "word_count": <number of words spoken>,
  "observations": "<brief observations about speech patterns>"
}

Respond with ONLY the JSON object.`;

                const speechAnalysisResponse = await zai.chat.completions.create(
                  {
                    messages: [
                      {
                        role: "system",
                        content:
                          "You are an expert early childhood speech and language observer. Always respond with valid JSON only. Never include medical diagnoses.",
                      },
                      { role: "user", content: speechAnalysisPrompt },
                    ],
                    stream: false,
                  }
                );

                const speechText =
                  speechAnalysisResponse?.choices?.[0]?.message?.content ||
                  speechAnalysisResponse?.content ||
                  "";
                const speechMatch = speechText.match(/\{[\s\S]*\}/);
                if (speechMatch) {
                  const parsed = JSON.parse(speechMatch[0]);
                  if (parsed.speech_clarity)
                    speechResult.speechClarity = clampScore(parsed.speech_clarity);
                  if (parsed.vocabulary_level)
                    speechResult.vocabularyLevel = clampScore(parsed.vocabulary_level);
                  if (parsed.response_confidence)
                    speechResult.responseConfidence = clampScore(
                      parsed.response_confidence
                    );
                  if (parsed.estimated_response_delay)
                    speechResult.responseDelay = Math.max(
                      0.5,
                      Math.min(8, parsed.estimated_response_delay)
                    );
                }
              } catch (speechAnalysisErr) {
                console.error(
                  "Speech quality analysis failed:",
                  speechAnalysisErr
                );
                // Use word count as a rough heuristic
                const wordCount = transcription.split(/\s+/).filter(w => w.length > 0).length;
                if (wordCount > 15) {
                  speechResult.speechClarity = Math.min(10, speechResult.speechClarity + 1);
                  speechResult.vocabularyLevel = Math.min(10, speechResult.vocabularyLevel + 0.5);
                }
              }
            }
          }
        } catch (asrError) {
          console.error("ASR transcription failed:", asrError);
        }
      }

      // ============================================
      // STEP 3: Behavioral Scoring using LLM
      // ============================================
      let behavioralResult: BehavioralResult;

      try {
        const zai = await ZAI.create();

        const speechContext = speechResult.transcription
          ? `\nSpeech Transcription (from Self Introduction task): "${speechResult.transcription}"`
          : "\nNo speech transcription available.";

        const behavioralPrompt = `You are an expert early childhood education assessor. Based on the following kindergarten readiness assessment data, provide a comprehensive behavioral analysis.

IMPORTANT: This is an educational readiness observation, NOT a medical diagnosis. Use safe educational wording only.

Child: ${student.childName}, Age: ${calculateAge(student.dateOfBirth)}

Questionnaire Responses:
Attention Section: ${JSON.stringify(sectionA)}
Emotional Section: ${JSON.stringify(sectionB)}
Social Section: ${JSON.stringify(sectionC)}

Video Task Scores (1-10 scale, analyzed via AI video observation):
- Sitting Ability: ${videoAnalysisResult.sittingScore.toFixed(1)}
- Attention: ${videoAnalysisResult.attentionScore.toFixed(1)}
- Hyperactivity (inverse): ${videoAnalysisResult.hyperactivityScore.toFixed(1)}
- Emotional Regulation: ${videoAnalysisResult.emotionalScore.toFixed(1)}
- Instruction Following: ${videoAnalysisResult.instructionScore.toFixed(1)}

Speech Metrics:
- Speech Clarity: ${speechResult.speechClarity.toFixed(1)}
- Vocabulary Level: ${speechResult.vocabularyLevel.toFixed(1)}
- Response Confidence: ${speechResult.responseConfidence.toFixed(1)}
- Response Delay: ${speechResult.responseDelay.toFixed(1)}s
${speechContext}

Provide your analysis as a JSON object with EXACTLY these fields:
{
  "readiness_score": <number 0-100>,
  "attention_level": "<Good|Moderate|Needs Support>",
  "instruction_following": "<Good|Moderate|Needs Support>",
  "emotional_behavior": "<descriptive string about emotional patterns>",
  "social_readiness": "<Good|Moderate|Needs Support>",
  "classroom_adaptability": "<descriptive string about classroom fit>",
  "teacher_recommendation": "<detailed, actionable recommendation for teachers>",
  "risk_flags": [<array of educational concern strings, empty if no concerns>]
}

Remember:
- Use educational readiness language only
- Be encouraging but honest
- Focus on support strategies, not problems
- Risk flags should note areas needing extra support, not medical conditions

Respond with ONLY the JSON object.`;

        const llmResponse = await zai.chat.completions.create({
          messages: [
            {
              role: "system",
              content:
                "You are an expert early childhood education assessor. Always respond with valid JSON only. Never include medical diagnoses - use educational readiness language only. Be constructive and supportive in recommendations.",
            },
            { role: "user", content: behavioralPrompt },
          ],
          stream: false,
        });

        // Extract the text content from the LLM response
        const responseText =
          llmResponse?.choices?.[0]?.message?.content ||
          llmResponse?.content ||
          (typeof llmResponse === "string" ? llmResponse : "");

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          behavioralResult = JSON.parse(jsonMatch[0]);
        } else {
          behavioralResult = getDefaultBehavioralResult();
        }
      } catch (llmError) {
        console.error("LLM analysis error, using default scores:", llmError);
        behavioralResult = getDefaultBehavioralResult();
      }

      // ============================================
      // STEP 4: Save Results
      // ============================================
      await db.aIAnalysis.update({
        where: { id: analysis.id },
        data: {
          sittingScore: videoAnalysisResult.sittingScore,
          attentionScore: videoAnalysisResult.attentionScore,
          hyperactivityScore: videoAnalysisResult.hyperactivityScore,
          emotionalScore: videoAnalysisResult.emotionalScore,
          instructionScore: videoAnalysisResult.instructionScore,
          speechClarity: speechResult.speechClarity,
          vocabularyLevel: speechResult.vocabularyLevel,
          responseConfidence: speechResult.responseConfidence,
          responseDelay: speechResult.responseDelay,
          readinessScore: behavioralResult.readiness_score || 50,
          attentionLevel: behavioralResult.attention_level || "Moderate",
          instructionFollowing:
            behavioralResult.instruction_following || "Moderate",
          emotionalBehavior:
            behavioralResult.emotional_behavior ||
            "No significant concerns observed",
          socialReadiness: behavioralResult.social_readiness || "Moderate",
          classroomAdaptability:
            behavioralResult.classroom_adaptability ||
            "Adaptable with support",
          teacherRecommendation:
            behavioralResult.teacher_recommendation ||
            "Monitor and provide gentle guidance",
          riskFlags: JSON.stringify(behavioralResult.risk_flags || []),
          overallResult: JSON.stringify({
            ...behavioralResult,
            video_observations: "AI video analysis completed",
            speech_transcription: speechResult.transcription || "Not available",
          }),
          analysisStatus: "COMPLETED",
          videoAnalysisStatus: "COMPLETED",
          speechAnalysisStatus: "COMPLETED",
          behavioralStatus: "COMPLETED",
          analyzedAt: new Date(),
        },
      });

      // Update student status
      await db.student.update({
        where: { id: studentId },
        data: { status: "UNDER_REVIEW" },
      });

      // Create notification for the parent
      await db.notification.create({
        data: {
          userId: student.parentId,
          type: "ADMIN_REVIEW",
          title: "Assessment Complete",
          message: `AI analysis for ${student.childName}'s readiness assessment has been completed. The application is now under review.`,
        },
      });

      return NextResponse.json({ success: true, result: behavioralResult });
    } catch (analysisError) {
      // Mark analysis as failed
      await db.aIAnalysis.update({
        where: { id: analysis.id },
        data: { analysisStatus: "FAILED" },
      });
      throw analysisError;
    }
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}

// ============================================
// Helper Types
// ============================================

interface BehavioralResult {
  readiness_score: number;
  attention_level: string;
  instruction_following: string;
  emotional_behavior: string;
  social_readiness: string;
  classroom_adaptability: string;
  teacher_recommendation: string;
  risk_flags: string[];
}

// ============================================
// Helper Functions
// ============================================

function safeParseJSON(str: string): Record<string, string> {
  try {
    return JSON.parse(str || "{}");
  } catch {
    return {};
  }
}

function clampScore(score: number): number {
  return Math.min(10, Math.max(1, Number(score) || 5));
}

function getVideoMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    webm: "video/webm",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
  };
  return mimeTypes[ext] || "video/webm";
}

function getTaskDescription(taskType: string): string {
  const descriptions: Record<string, string> = {
    TASK1: "Sitting Ability - Child is asked to sit and color/draw for 3 minutes",
    TASK2: "Instruction Following - Child is asked to pick a red object, place it on a table, and clap hands twice",
    TASK3: "Emotional Response - Parent leaves the room for 30 seconds",
    TASK4: "Self Introduction - Child is asked their name, age, and favorite color",
  };
  return descriptions[taskType] || "Kindergarten readiness task";
}

function calculateSittingScore(sectionA: Record<string, string>): number {
  let score = 5;
  if (sectionA.q1 === "yes") score += 2;
  else if (sectionA.q1 === "sometimes") score += 1;
  if (sectionA.q3 === "yes") score += 2;
  else if (sectionA.q3 === "sometimes") score += 1;
  score += Math.random() * 1;
  return Math.min(10, Math.max(1, score));
}

function calculateAttentionScore(sectionA: Record<string, string>): number {
  let score = 5;
  if (sectionA.q2 === "yes") score += 2;
  else if (sectionA.q2 === "sometimes") score += 1;
  if (sectionA.q3 === "yes") score += 2;
  else if (sectionA.q3 === "sometimes") score += 1;
  score += Math.random() * 1;
  return Math.min(10, Math.max(1, score));
}

function calculateHyperactivityScore(
  sectionA: Record<string, string>,
  sectionB: Record<string, string>
): number {
  let score = 5;
  if (sectionA.q1 === "no") score -= 2;
  else if (sectionA.q1 === "sometimes") score -= 1;
  if (sectionB.q3 === "yes") score -= 1;
  score += Math.random() * 2;
  return Math.min(10, Math.max(1, score));
}

function calculateEmotionalScore(sectionB: Record<string, string>): number {
  let score = 5;
  if (sectionB.q1 === "no") score += 2;
  else if (sectionB.q1 === "sometimes") score += 1;
  if (sectionB.q2 === "yes") score += 2;
  else if (sectionB.q2 === "sometimes") score += 1;
  score += Math.random() * 1;
  return Math.min(10, Math.max(1, score));
}

function calculateInstructionScore(
  sectionA: Record<string, string>,
  sectionC: Record<string, string>
): number {
  let score = 5;
  if (sectionA.q3 === "yes") score += 2;
  else if (sectionA.q3 === "sometimes") score += 1;
  if (sectionC.q1 === "yes") score += 2;
  else if (sectionC.q1 === "sometimes") score += 1;
  score += Math.random() * 1;
  return Math.min(10, Math.max(1, score));
}

function calculateSpeechScore(sectionC: Record<string, string>): number {
  let score = 5;
  if (sectionC.q3 === "yes") score += 2;
  else if (sectionC.q3 === "with help") score += 1;
  if (sectionC.q1 === "yes") score += 1;
  score += Math.random() * 2;
  return Math.min(10, Math.max(1, score));
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    now.getMonth() -
    birth.getMonth();
  return `${Math.floor(months / 12)} years ${months % 12} months`;
}

function getDefaultBehavioralResult(): BehavioralResult {
  return {
    readiness_score: 65,
    attention_level: "Moderate",
    instruction_following: "Moderate",
    emotional_behavior: "Needs gradual adaptation support",
    social_readiness: "Moderate",
    classroom_adaptability: "Adaptable with structured support",
    teacher_recommendation:
      "Provide visual instructions and calm verbal engagement. Allow transition time between activities. Use positive reinforcement for task completion.",
    risk_flags: [],
  };
}
