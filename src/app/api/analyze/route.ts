import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Student, AIAnalysis, Notification } from "@/lib/models";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { downloadFromS3 } from "@/lib/s3";

// Allow up to 5 minutes for this route (AI analysis can be slow)
export const maxDuration = 300;


// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Gemini model configs
const FLASH_MODEL = "gemini-2.0-flash";
const PRO_MODEL = "gemini-2.5-pro"; // Most powerful model for best accuracy

// ============================================
// Retry helper with exponential backoff
// ============================================
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// ============================================
// Robust JSON extraction from LLM response
// ============================================
function extractJSON(text: string): Record<string, unknown> | null {
  // Try to find JSON in markdown code blocks first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch { /* fall through */ }
  }

  // Try to find raw JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch { /* fall through */ }
  }

  return null;
}

// ============================================
// TASK-SPECIFIC VLM PROMPTS (detailed per task)
// ============================================
function getTaskSpecificVLMPrompt(taskType: string): { system: string; user: string; focusMetrics: string[] } {
  const prompts: Record<string, { system: string; user: string; focusMetrics: string[] }> = {
    TASK1: {
      system: `You are a certified early childhood behavioral observer specializing in motor development and sustained attention. You observe children in educational settings and document their behaviors objectively. You NEVER diagnose — you only describe observable behaviors using educational readiness language.`,
      user: `Analyze this video of a kindergarten-age child performing a SITTING & COLORING TASK (3 minutes).

WHAT TO OBSERVE CAREFULLY:
1. POSTURE & SITTING: Can the child maintain an upright seated position? Do they slump, slide off chair, or need support? How long before any postural shift?
2. SUSTAINED ATTENTION: Does the child stay focused on coloring? How many seconds of continuous focus before looking away? Are there frequent interruptions?
3. FIDGETING & MOVEMENT: Any repetitive movements (leg shaking, hand tapping, squirming)? How frequent?
4. TASK COMPLETION: Does the child continue coloring throughout, or stop and restart frequently? 
5. BODY ORIENTATION: Is the child's body oriented toward the table/task, or turned away?

Provide your detailed analysis as a JSON object:
{
  "sitting_steadiness": <1-10, 10=perfectly still and steady>,
  "posture_quality": <1-10, 10=excellent upright posture>,
  "attention_duration": "<estimated seconds of continuous focus before first break>",
  "focus_quality": <1-10, 10=deeply engaged, no distractions>,
  "fidget_frequency": "<None|Rare|Occasional|Frequent|Constant>",
  "task_persistence": <1-10, 10=stayed on task entire time>,
  "body_orientation": "<Fully toward task|Mostly toward|Mixed|Mostly away>",
  "observed_behaviors": ["specific observable behaviors you see"],
  "emotional_state": "<Calm|Content|Slightly Restless|Restless|Anxious>",
  "confidence_level": "<High|Medium|Low>",
  "summary": "<2-3 sentence objective observation summary>"
}

Respond with ONLY the JSON object.`,
      focusMetrics: ["sitting_steadiness", "posture_quality", "focus_quality", "task_persistence"],
    },
    TASK2: {
      system: `You are a certified early childhood behavioral observer specializing in executive function and instruction following. You observe children's ability to understand, sequence, and execute multi-step directions. You NEVER diagnose — you only describe observable behaviors using educational readiness language.`,
      user: `Analyze this video of a kindergarten-age child performing an INSTRUCTION FOLLOWING TASK.

THE TASK: The child was asked to:
1. Pick up a RED object
2. Place it on the table  
3. Clap hands twice

WHAT TO OBSERVE CAREFULLY:
1. COMPREHENSION: Does the child appear to understand the instructions? Any signs of confusion?
2. SEQUENCING: Does the child perform steps in the correct order? Which steps are missed or reordered?
3. COMPLETENESS: How many of the 3 steps were completed? Any steps partially done?
4. RESPONSE TIME: How quickly does the child begin acting after instructions? Any significant delay?
5. ERROR CORRECTION: If the child makes a mistake, do they self-correct?
6. FOCUS DURING TASK: Does the child stay focused throughout all steps, or get distracted mid-sequence?

Provide your detailed analysis as a JSON object:
{
  "comprehension_level": <1-10, 10=clearly understood all instructions>,
  "steps_completed_correctly": <0-3, number of steps done right>,
  "sequencing_accuracy": <1-10, 10=perfect order>,
  "response_speed": "<Immediate|Slightly Delayed|Delayed|Very Delayed|No Response>",
  "error_correction": "<Self-corrected|Needed prompt|Did not correct|No errors>",
  "focus_during_execution": <1-10, 10=fully focused>,
  "distraction_events": <number of times child got distracted>,
  "observed_behaviors": ["specific observable behaviors you see"],
  "emotional_state": "<Confident|Hesitant|Confused|Reluctant>",
  "confidence_level": "<High|Medium|Low>",
  "summary": "<2-3 sentence objective observation summary>"
}

Respond with ONLY the JSON object.`,
      focusMetrics: ["comprehension_level", "sequencing_accuracy", "focus_during_execution", "steps_completed_correctly"],
    },
    TASK3: {
      system: `You are a certified early childhood behavioral observer specializing in emotional regulation and separation responses. You observe how children handle brief separation and reunite with caregivers. You NEVER diagnose — you only describe observable behaviors using educational readiness language. You are careful NOT to label normal separation discomfort as a concern.`,
      user: `Analyze this video of a kindergarten-age child during a SEPARATION RESPONSE TASK.

THE TASK: The parent leaves the room for approximately 30 seconds, then returns.

WHAT TO OBSERVE CAREFULLY:
1. INITIAL REACTION: What is the child's immediate response when parent leaves? (crying, looking for parent, continuing activity, etc.)
2. DISTRESS LEVEL: How distressed does the child become? (no distress, mild, moderate, significant)
3. RECOVERY TIME: How quickly does the child calm down or return to an activity? (seconds)
4. SELF-SOOTHING: Does the child attempt any self-soothing behaviors? (thumb sucking, hugging self, rocking, etc.)
5. REUNION RESPONSE: How does the child respond when the parent returns? (happy, clingy, ignores, angry)
6. ACTIVITY CONTINUATION: Does the child continue any activity during the parent's absence?

Provide your detailed analysis as a JSON object:
{
  "initial_reaction": "<No reaction|Brief look|Seeks parent|Calls out|Cries immediately>",
  "distress_level": <1-10, 1=no distress, 10=intense distress>,
  "recovery_speed": "<Immediate|Within 5 seconds|Within 15 seconds|Within 30 seconds|Did not recover>",
  "recovery_time_seconds": <estimated seconds to calm>,
  "self_soothing_behaviors": ["any self-soothing observed"],
  "reunion_response": "<Happy greeting|Clingy|Indifferent|Ambivalent>",
  "emotional_regulation": <1-10, 10=excellent regulation>,
  "activity_continuation": "<Continued throughout|Resumed after brief pause|Stopped completely>",
  "observed_behaviors": ["specific observable behaviors you see"],
  "confidence_level": "<High|Medium|Low>",
  "summary": "<2-3 sentence objective observation summary>"
}

Respond with ONLY the JSON object.`,
      focusMetrics: ["emotional_regulation", "distress_level", "recovery_speed"],
    },
    TASK4: {
      system: `You are a certified early childhood behavioral observer specializing in speech-language development and social communication. You observe children's expressive language, articulation, and social engagement during self-presentation. You NEVER diagnose — you only describe observable behaviors using educational readiness language.`,
      user: `Analyze this video of a kindergarten-age child performing a SELF INTRODUCTION TASK.

THE TASK: The child is asked to share their name, age, and favorite color.

WHAT TO OBSERVE CAREFULLY:
1. VERBAL RESPONSE: Does the child respond verbally? Can you hear/understand their words?
2. SPEECH CLARITY: How clearly does the child pronounce words? Is speech mostly intelligible?
3. VOCABULARY: Does the child use age-appropriate vocabulary? Any notable words or phrases?
4. CONFIDENCE: Does the child appear confident or hesitant when speaking? Eye contact?
5. RESPONSE COMPLETENESS: How many of the 3 questions (name, age, favorite color) does the child answer?
6. BODY LANGUAGE: Gestures, facial expressions, posture while speaking?
7. SPEECH RATE: Is the speech pace typical, very fast, or very slow for their age?

Provide your detailed analysis as a JSON object:
{
  "verbal_response": "<Full response|Partial response|Minimal response|No verbal response>",
  "speech_clarity": <1-10, 10=perfectly clear>,
  "vocabulary_richness": <1-10, 10=rich, age-appropriate>,
  "speaking_confidence": <1-10, 10=very confident>,
  "questions_answered": <0-3, number of questions answered>,
  "eye_contact": "<Consistent|Occasional|Minimal|None>",
  "speech_rate": "<Typical|Slightly fast|Very fast|Slightly slow|Very slow>",
  "body_language": "<Open and relaxed|Mildly tense|Very tense|Withdrawn>",
  "word_count_estimate": <estimated number of words spoken>,
  "transcription": "<exact words spoken by child, if audible>",
  "observed_behaviors": ["specific observable behaviors you see"],
  "confidence_level": "<High|Medium|Low>",
  "summary": "<2-3 sentence objective observation summary>"
}

Respond with ONLY the JSON object.`,
      focusMetrics: ["speech_clarity", "vocabulary_richness", "speaking_confidence", "questions_answered"],
    },
  };

  return prompts[taskType] || prompts.TASK1;
}

// ============================================
// MAIN ANALYSIS ENDPOINT
// ============================================
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { studentId } = await req.json();

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Get student data with all related info
    const student = await Student.findById(studentId).lean();

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Get questionnaire and videos in parallel
    const { Questionnaire, Video } = await import("@/lib/models");
    const [questionnaire, videos] = await Promise.all([
      Questionnaire.findOne({ studentId }).lean(),
      Video.find({ studentId }).lean(),
    ]);
    const studentWithRelations = { ...student, questionnaire, videos, parentId: student.parentId };

    // Create or update AI analysis record
    const analysis = await AIAnalysis.findOneAndUpdate(
      { studentId },
      { analysisStatus: "PROCESSING", videoAnalysisStatus: "PROCESSING", speechAnalysisStatus: "PROCESSING", behavioralStatus: "PROCESSING" },
      { new: true, upsert: true }
    );

    try {
      // Parse questionnaire data
      const sectionA: Record<string, string> = studentWithRelations.questionnaire
        ? safeParseJSON((studentWithRelations.questionnaire as any).sectionA)
        : {};
      const sectionB: Record<string, string> = studentWithRelations.questionnaire
        ? safeParseJSON((studentWithRelations.questionnaire as any).sectionB)
        : {};
      const sectionC: Record<string, string> = studentWithRelations.questionnaire
        ? safeParseJSON((studentWithRelations.questionnaire as any).sectionC)
        : {};

      // Calculate questionnaire-based baseline scores (deterministic, no random)
      const questionnaireScores = {
        sittingScore: calculateSittingScore(sectionA),
        attentionScore: calculateAttentionScore(sectionA),
        hyperactivityScore: calculateHyperactivityScore(sectionA, sectionB),
        emotionalScore: calculateEmotionalScore(sectionB),
        instructionScore: calculateInstructionScore(sectionA, sectionC),
      };

      // ============================================
      // STEP 1: Multi-Pass Video Analysis using Gemini VLM
      //   Enhancement: Videos analyzed IN PARALLEL (Promise.allSettled)
      //   Enhancement: Size cap raised 20MB → 80MB
      //   Enhancement: TASK4 VLM result captures transcription to avoid
      //                reloading the same file in the speech step
      // ============================================
      let videoAnalysisResult = { ...questionnaireScores };
      const allVideoObservations: Record<string, Record<string, unknown>> = {};
      const videoObservationSummaries: string[] = [];
      let videoAnalysisConfidence = 0;
      // Will be populated from TASK4 VLM observation to skip redundant file reload
      let task4TranscriptionFromVLM = "";

      try {
        const MAX_VIDEO_SIZE_BYTES = 80 * 1024 * 1024; // 80MB — Gemini supports inline up to ~1GB
        const vlmModel = genAI.getGenerativeModel({
          model: FLASH_MODEL,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        });

        // ---- PASS 1: Analyze ALL videos IN PARALLEL ----
        // Each video is processed concurrently; failures are isolated via allSettled.
        console.log(`[PASS 1] Analyzing ${(studentWithRelations.videos as any[]).length} videos in parallel...`);

        const videoAnalysisTasks = (studentWithRelations.videos as any[]).map(async (video) => {
          // Determine S3 key — new uploads use s3Key; legacy uploads fall back to filePath
          const s3Key: string | undefined = video.s3Key;
          if (!s3Key) {
            console.warn(`[PASS 1] ${video.taskType}: no s3Key found — skipping (legacy local video)`);
            return null;
          }

          let videoBuffer: Buffer;
          try {
            videoBuffer = await downloadFromS3(s3Key);
          } catch (dlErr) {
            console.error(`[PASS 1] ${video.taskType}: S3 download failed:`, dlErr);
            return null;
          }

          if (videoBuffer.length > MAX_VIDEO_SIZE_BYTES) {
            console.warn(`[PASS 1] Skipping VLM for ${video.taskType}: file too large (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB > 80MB)`);
            return null;
          }

          const base64Video = videoBuffer.toString("base64");
          // Derive mime type from the S3 key extension
          const ext = (s3Key.split(".").pop() ?? "webm").toLowerCase();
          const mimeType = getVideoMimeType(ext);
          const taskPrompt = getTaskSpecificVLMPrompt(video.taskType);

          console.log(`[PASS 1] → ${video.taskType} started (${(videoBuffer.length / 1024 / 1024).toFixed(1)}MB from S3)`);

          const vlmResult = await withRetry(async () =>
            vlmModel.generateContent([
              { inlineData: { data: base64Video, mimeType } },
              { text: taskPrompt.system + "\n\n" + taskPrompt.user },
            ])
          );

          const vlmText = vlmResult.response.text();
          const parsedObs = extractJSON(vlmText);

          if (parsedObs) {
            console.log(`[PASS 1] ✓ ${video.taskType} done. Confidence: ${parsedObs.confidence_level ?? "unknown"}`);
            return { taskType: video.taskType as string, obs: parsedObs, rawText: "" };
          } else {
            console.warn(`[PASS 1] ✗ ${video.taskType} — could not parse JSON, using raw text`);
            return { taskType: video.taskType as string, obs: null, rawText: vlmText.substring(0, 600) };
          }
        });

        const passOneResults = await Promise.allSettled(videoAnalysisTasks);

        for (const settled of passOneResults) {
          if (settled.status === "fulfilled" && settled.value) {
            const { taskType, obs, rawText } = settled.value;
            if (obs) {
              allVideoObservations[taskType] = obs;
              videoAnalysisConfidence++;
              videoObservationSummaries.push(`[${taskType}]: ${JSON.stringify(obs, null, 2)}`);
              // Capture TASK4 transcription from VLM to avoid reloading the file
              if (taskType === "TASK4" && typeof obs.transcription === "string" && obs.transcription.length > 0) {
                task4TranscriptionFromVLM = obs.transcription;
              }
            } else if (rawText) {
              videoObservationSummaries.push(`[${taskType}]: ${rawText}`);
            }
          } else if (settled.status === "rejected") {
            console.error(`[PASS 1] Video analysis rejected:`, settled.reason);
          }
        }

        console.log(`[PASS 1] Complete: ${videoAnalysisConfidence}/${(studentWithRelations.videos as any[]).length} videos analyzed successfully.`);

        // ---- PASS 2: Cross-validate observations across all videos ----
        if (Object.keys(allVideoObservations).length > 0) {
          try {
            console.log("[PASS 2] Cross-validating observations across all videos...");

            const crossValidationModel = genAI.getGenerativeModel({
              model: PRO_MODEL,
              generationConfig: {
                temperature: 0.15,
                topP: 0.8,
                maxOutputTokens: 2048,
              },
            });

            const crossValidationPrompt = `You are a senior early childhood assessment specialist. You have received video observation data from ${Object.keys(allVideoObservations).length} tasks performed by the same kindergarten-age child. Your job is to:

1. Cross-validate observations — do behaviors seen in one task correlate with other tasks?
2. Identify consistent patterns vs. one-off behaviors
3. Resolve any contradictions between task observations
4. Calculate final weighted scores

CHILD PROFILE:
- Name: ${(student as any).childName}
- Age: ${calculateAge((student as any).dateOfBirth)}
- Gender: ${(student as any).gender || "Not specified"}
- Languages Spoken: ${(student as any).languagesSpoken || "Not specified"}
- Nationality: ${(student as any).nationality || "Not specified"}

NOTE: Consider the child's language background when evaluating speech tasks. Non-native speakers may show lower confidence in verbal tasks even if cognitively capable.

VIDEO OBSERVATIONS FROM ALL TASKS:
${videoObservationSummaries.join("\n\n---\n\n")}

QUESTIONNAIRE BASELINE SCORES (from parent):
- Sitting Ability: ${questionnaireScores.sittingScore.toFixed(1)}
- Attention: ${questionnaireScores.attentionScore.toFixed(1)}
- Hyperactivity (inverse): ${questionnaireScores.hyperactivityScore.toFixed(1)}
- Emotional Regulation: ${questionnaireScores.emotionalScore.toFixed(1)}
- Instruction Following: ${questionnaireScores.instructionScore.toFixed(1)}

CROSS-VALIDATION RULES:
- Trust VIDEO over questionnaire when contradicted (video weight: 65%, questionnaire: 35%)
- If observations are consistent, reinforce the score
- Weight tasks by their relevance: TASK1→sitting/attention, TASK2→instruction, TASK3→emotional, TASK4→speech/confidence
- Account for task difficulty: TASK2 (3-step instruction) is harder than TASK4 (self-introduction)
- A single poor score in one task should NOT drag down unrelated dimensions
- Consider the overall_video_confidence per task observation when weighting

Provide your cross-validated analysis as a JSON object:
{
  "sitting_score": <1-10, cross-validated>,
  "attention_score": <1-10, cross-validated>,
  "hyperactivity_score": <1-10, cross-validated, higher=less hyperactive>,
  "emotional_regulation_score": <1-10, cross-validated>,
  "instruction_following_score": <1-10, cross-validated>,
  "cross_validation_notes": "<how scores were derived, what contradictions were resolved>",
  "consistent_patterns": ["behaviors seen consistently across multiple tasks"],
  "contradictions_resolved": ["specific contradictions between tasks or questionnaire and how resolved"],
  "overall_video_confidence": "<High|Medium|Low>",
  "tasks_used": ["list of taskTypes successfully used in this analysis"]
}

Respond with ONLY the JSON object.`;

            const crossResult = await withRetry(async () =>
              crossValidationModel.generateContent(crossValidationPrompt)
            );

            const crossParsed = extractJSON(crossResult.response.text());

            if (crossParsed) {
              if (crossParsed.sitting_score != null) videoAnalysisResult.sittingScore = clampScore(crossParsed.sitting_score as number);
              if (crossParsed.attention_score != null) videoAnalysisResult.attentionScore = clampScore(crossParsed.attention_score as number);
              if (crossParsed.hyperactivity_score != null) videoAnalysisResult.hyperactivityScore = clampScore(crossParsed.hyperactivity_score as number);
              if (crossParsed.emotional_regulation_score != null) videoAnalysisResult.emotionalScore = clampScore(crossParsed.emotional_regulation_score as number);
              if (crossParsed.instruction_following_score != null) videoAnalysisResult.instructionScore = clampScore(crossParsed.instruction_following_score as number);
              console.log(`[PASS 2] Cross-validation complete. Confidence: ${crossParsed.overall_video_confidence ?? "unknown"}. Tasks used: ${(crossParsed.tasks_used as string[] | undefined)?.join(", ") ?? "unknown"}`);
            } else {
              console.warn("[PASS 2] Could not parse cross-validation JSON — falling back to individual observation derivation");
              videoAnalysisResult = deriveScoresFromObservations(allVideoObservations, questionnaireScores);
            }
          } catch (crossErr) {
            console.error("[PASS 2] Cross-validation failed:", crossErr);
            videoAnalysisResult = deriveScoresFromObservations(allVideoObservations, questionnaireScores);
          }
        }
      } catch (vlmError) {
        console.error("[PASS 1] VLM outer error — using questionnaire baseline scores:", vlmError);
      }

      // ============================================
      // STEP 2: Enhanced Speech Analysis
      //   Enhancement: If TASK4 VLM already captured a transcription in
      //   Pass 1 (via the `transcription` field in the prompt response),
      //   we reuse it directly — no need to reload the video file.
      // ============================================
      let speechResult = {
        speechClarity: calculateSpeechScore(sectionC),
        vocabularyLevel: 5.0,
        responseConfidence: 5.0,
        responseDelay: 2.0,
        transcription: "",
      };

      const speechVideo = (studentWithRelations.videos as any[]).find((v) => v.taskType === "TASK4");

      if (speechVideo) {
        try {
          // OPTIMISATION: use transcription captured during Pass 1 VLM if available
          let rawTranscription = task4TranscriptionFromVLM;

          if (!rawTranscription) {
            // Fallback: download TASK4 from S3 for transcription
            const s3Key: string | undefined = speechVideo.s3Key;
            if (s3Key) {
              try {
                const audioBuffer = await downloadFromS3(s3Key);
                const ext = (s3Key.split(".").pop() ?? "webm").toLowerCase();
                const mimeType = getVideoMimeType(ext);

                console.log("[SPEECH] TASK4 transcription not captured in Pass 1 — transcribing from S3...");

                const asrModel = genAI.getGenerativeModel({
                  model: FLASH_MODEL,
                  generationConfig: { temperature: 0.1 },
                });

                const asrResult = await withRetry(async () =>
                  asrModel.generateContent([
                    { inlineData: { data: audioBuffer.toString("base64"), mimeType } },
                    {
                      text: `You are a professional transcriptionist for children's speech. Transcribe EXACTLY what the child says in this video.

RULES:
- Only transcribe the CHILD's speech, not adults
- Include filler words (um, uh, hmm) as they are clinically relevant
- Mark pauses longer than 2 seconds as [pause]
- Mark unclear words as [unclear]
- Mark non-verbal vocalizations as [giggle], [sigh], etc.
- If the child does not speak, respond with exactly: NO_SPEECH_DETECTED
- Do NOT add any commentary, analysis, or notes — ONLY the transcription`,
                    },
                  ])
                );

                rawTranscription = asrResult.response.text().trim();
                if (rawTranscription === "NO_SPEECH_DETECTED") rawTranscription = "";
              } catch (dlErr) {
                console.error("[SPEECH] S3 download for transcription failed:", dlErr);
              }
            } else {
              console.warn("[SPEECH] No s3Key for TASK4 — cannot transcribe.");
            }
          } else {
            console.log("[SPEECH] Reusing transcription captured from TASK4 VLM Pass 1 — skipping file reload.");
          }

          if (rawTranscription && rawTranscription.length > 0) {
            speechResult.transcription = rawTranscription;

            // ---- Deep speech quality analysis ----
            try {
              console.log("[SPEECH] Running deep speech quality analysis...");

              const speechModel = genAI.getGenerativeModel({
                model: PRO_MODEL,
                generationConfig: { temperature: 0.15, topP: 0.8, maxOutputTokens: 1024 },
              });

              const task4Obs = allVideoObservations["TASK4"];
              const task4SpeechContext = task4Obs
                ? `\n\nVideo Observer's Notes (behavioral + speech): ${JSON.stringify(task4Obs, null, 2)}`
                : "";

              const speechAnalysisResponse = await withRetry(async () =>
                speechModel.generateContent(
                  `You are a pediatric speech-language pathologist with 15+ years of experience assessing kindergarten-age children. You are performing an EDUCATIONAL observation, NOT a medical diagnosis. Use safe educational readiness language only.

CHILD LANGUAGE CONTEXT: Languages spoken: ${(student as any).languagesSpoken || "Not specified"}

TRANSCRIPTION OF CHILD'S SELF-INTRODUCTION:
"${rawTranscription}"
${task4SpeechContext}

The child was asked 3 questions: name, age, and favorite color.

Analyze the child's speech and provide detailed scores as JSON:
{
  "speech_clarity": <1-10, 10=crystal clear articulation>,
  "vocabulary_level": <1-10, 10=rich, varied, age-appropriate vocabulary>,
  "speaking_confidence": <1-10, 10=very confident and eager to speak>,
  "estimated_response_delay_seconds": <seconds before child starts speaking>,
  "fluency": <1-10, 10=no hesitations or repetitions>,
  "grammatical_complexity": <1-10, 10=complex age-appropriate sentences>,
  "questions_answered_count": <0-3>,
  "word_count": <total words spoken>,
  "phonological_observations": "<brief notes on speech sound patterns>",
  "social_communication": <1-10, 10=excellent eye contact, turn-taking, engagement>,
  "observations": "<2-3 sentence educational observation summary>"
}

IMPORTANT SCORING GUIDELINES:
- A typical 4-5 year old should score 5-7 on most metrics
- Scores below 4 indicate the child may benefit from additional support
- Scores above 8 indicate strong age-appropriate development
- Do NOT score harshly for minor articulation errors (normal for age)
- If child is multilingual, adjust expectations for vocabulary score accordingly
- Consider cultural background when assessing social communication norms

Respond with ONLY the JSON object.`
                )
              );

              const speechParsed = extractJSON(speechAnalysisResponse.response.text());

              if (speechParsed) {
                if (speechParsed.speech_clarity != null)
                  speechResult.speechClarity = clampScore(speechParsed.speech_clarity as number);
                if (speechParsed.vocabulary_level != null)
                  speechResult.vocabularyLevel = clampScore(speechParsed.vocabulary_level as number);
                if (speechParsed.speaking_confidence != null)
                  speechResult.responseConfidence = clampScore(speechParsed.speaking_confidence as number);
                if (speechParsed.estimated_response_delay_seconds != null)
                  speechResult.responseDelay = Math.max(0.5, Math.min(8, speechParsed.estimated_response_delay_seconds as number));
              }
            } catch (speechAnalysisErr) {
              console.error("[SPEECH] Deep analysis failed, using word-count heuristic:", speechAnalysisErr);
              const wordCount = rawTranscription.split(/\s+/).filter((w) => w.length > 0 && !w.startsWith("[")).length;
              if (wordCount > 20) {
                speechResult.speechClarity = Math.min(10, speechResult.speechClarity + 1.5);
                speechResult.vocabularyLevel = Math.min(10, 6 + wordCount * 0.1);
                speechResult.responseConfidence = Math.min(10, 6 + wordCount * 0.08);
              } else if (wordCount > 10) {
                speechResult.speechClarity = Math.min(10, speechResult.speechClarity + 0.5);
                speechResult.vocabularyLevel = Math.min(10, 5 + wordCount * 0.1);
              }
            }
          }
        } catch (asrError) {
          console.error("[SPEECH] Transcription step failed:", asrError);
        }
      }

      // ============================================
      // STEP 3: Comprehensive Behavioral Scoring
      // ============================================
      let behavioralResult: BehavioralResult;

      try {
        console.log("[BEHAVIORAL] Running comprehensive behavioral analysis...");

        const behavioralModel = genAI.getGenerativeModel({
          model: PRO_MODEL,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 2048,
          },
        });

        const speechContext = speechResult.transcription
          ? `\nSpeech Transcription (Self Introduction): "${speechResult.transcription}"`
          : "\nNo speech transcription available.";

        // Build detailed video observation context
        const videoContext = Object.keys(allVideoObservations).length > 0
          ? `\n\nDETAILED VIDEO OBSERVATIONS (per task):\n${videoObservationSummaries.join("\n\n---\n\n")}`
          : "\nNo video observations available (video analysis may have failed).";

        const behavioralPrompt = `You are a senior early childhood education assessor with 20+ years of experience in kindergarten readiness evaluation. You are conducting an EDUCATIONAL READINESS ASSESSMENT — this is NOT a medical diagnosis. Use safe, encouraging educational language only.

CHILD PROFILE:
- Name: ${(student as any).childName}
- Age: ${calculateAge((student as any).dateOfBirth)}

PARENT QUESTIONNAIRE RESPONSES:
- Attention & Sitting (Section A): ${JSON.stringify(sectionA)}
- Emotional Regulation (Section B): ${JSON.stringify(sectionB)}
- Social & Communication (Section C): ${JSON.stringify(sectionC)}
${videoContext}

AI-ANALYZED VIDEO TASK SCORES (1-10 scale):
- Sitting Ability: ${videoAnalysisResult.sittingScore.toFixed(1)}
- Attention Span: ${videoAnalysisResult.attentionScore.toFixed(1)}
- Hyperactivity Control (inverse): ${videoAnalysisResult.hyperactivityScore.toFixed(1)}
- Emotional Regulation: ${videoAnalysisResult.emotionalScore.toFixed(1)}
- Instruction Following: ${videoAnalysisResult.instructionScore.toFixed(1)}

SPEECH & COMMUNICATION METRICS:
- Speech Clarity: ${speechResult.speechClarity.toFixed(1)}/10
- Vocabulary Level: ${speechResult.vocabularyLevel.toFixed(1)}/10
- Speaking Confidence: ${speechResult.responseConfidence.toFixed(1)}/10
- Response Delay: ${speechResult.responseDelay.toFixed(1)}s
${speechContext}

Provide a comprehensive behavioral readiness analysis as a JSON object with EXACTLY these fields:
{
  "readiness_score": <number 0-100, overall kindergarten readiness>,
  "attention_level": "<Good|Moderate|Needs Support>",
  "instruction_following": "<Good|Moderate|Needs Support>",
  "emotional_behavior": "<2-3 sentence descriptive summary of emotional patterns observed>",
  "social_readiness": "<Good|Moderate|Needs Support>",
  "classroom_adaptability": "<2-3 sentence descriptive summary of how child will adapt to classroom>",
  "teacher_recommendation": "<detailed, specific, actionable recommendation (4-5 sentences) for teachers — include concrete strategies>",
  "risk_flags": [<array of educational concern strings — be specific, e.g., "May need additional support with sustained attention during seated tasks" — empty array if no concerns>],
  "strengths": [<array of observed strengths — at least 2 items>],
  "developmental_areas": {
    "cognitive": "<On Track|Progressing|Needs Support>",
    "social_emotional": "<On Track|Progressing|Needs Support>",
    "language_communication": "<On Track|Progressing|Needs Support>",
    "physical_motor": "<On Track|Progressing|Needs Support>"
  },
  "support_strategies": [<array of specific, actionable support strategies for home and school>]
}

SCORING GUIDELINES:
- readiness_score should be a weighted composite: Attention(25%) + Instruction(20%) + Emotional(20%) + Social(15%) + Speech(20%)
- Scores 70-100: Well prepared for kindergarten
- Scores 50-69: May benefit from additional preparation support
- Scores 0-49: Would benefit from significant readiness support
- Risk flags should be SPECIFIC and ACTIONABLE, not vague labels
- Always include strengths — every child has them
- Teacher recommendations should be practical and immediately implementable

Respond with ONLY the JSON object.`;

        const llmResult = await withRetry(async () => {
          return await behavioralModel.generateContent(behavioralPrompt);
        });
        const responseText = llmResult.response.text();
        const behavioralParsed = extractJSON(responseText);

        if (behavioralParsed) {
          behavioralResult = {
            readiness_score: (behavioralParsed.readiness_score as number) || 50,
            attention_level: (behavioralParsed.attention_level as string) || "Moderate",
            instruction_following: (behavioralParsed.instruction_following as string) || "Moderate",
            emotional_behavior: (behavioralParsed.emotional_behavior as string) || "No significant concerns observed",
            social_readiness: (behavioralParsed.social_readiness as string) || "Moderate",
            classroom_adaptability: (behavioralParsed.classroom_adaptability as string) || "Adaptable with support",
            teacher_recommendation: (behavioralParsed.teacher_recommendation as string) || "Monitor and provide gentle guidance",
            risk_flags: (behavioralParsed.risk_flags as string[]) || [],
          };
        } else {
          behavioralResult = getDefaultBehavioralResult();
        }
      } catch (llmError) {
        console.error("LLM analysis error, using default scores:", llmError);
        behavioralResult = getDefaultBehavioralResult();
      }

      // ============================================
      // STEP 4: Save Results with Enhanced Data
      // ============================================
      await AIAnalysis.findByIdAndUpdate(analysis._id, {
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
        instructionFollowing: behavioralResult.instruction_following || "Moderate",
        emotionalBehavior: behavioralResult.emotional_behavior || "No significant concerns observed",
        socialReadiness: behavioralResult.social_readiness || "Moderate",
        classroomAdaptability: behavioralResult.classroom_adaptability || "Adaptable with support",
        teacherRecommendation: behavioralResult.teacher_recommendation || "Monitor and provide gentle guidance",
        riskFlags: JSON.stringify(behavioralResult.risk_flags || []),
        overallResult: JSON.stringify({
          ...behavioralResult,
          video_observations: allVideoObservations,
          speech_transcription: speechResult.transcription || "Not available",
          videos_analyzed: videoAnalysisConfidence,
          total_videos: (studentWithRelations.videos as any[]).length,
          analysis_model: "Gemini 2.0 Flash",
          analysis_version: "2.0",
        }),
        analysisStatus: "COMPLETED",
        videoAnalysisStatus: videoAnalysisConfidence > 0 ? "COMPLETED" : "FAILED",
        speechAnalysisStatus: speechResult.transcription ? "COMPLETED" : "FAILED",
        behavioralStatus: "COMPLETED",
        analyzedAt: new Date(),
      });

      // Update student status
      await Student.findByIdAndUpdate(studentId, { status: "UNDER_REVIEW" });

      // Create notification for the parent
      await Notification.create({
        userId: (student as any).parentId,
        type: "ADMIN_REVIEW",
        title: "Assessment Complete",
        message: `AI analysis for ${(student as any).childName}'s readiness assessment has been completed. The application is now under review.`,
      });

      console.log(`[COMPLETE] Analysis finished for student ${studentId}. Videos analyzed: ${videoAnalysisConfidence}/${(studentWithRelations.videos as any[]).length}`);

      return NextResponse.json({ success: true, result: behavioralResult });
    } catch (analysisError) {
      // Mark analysis as failed
      await AIAnalysis.findByIdAndUpdate(analysis._id, { analysisStatus: "FAILED" });
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

interface VideoObservation {
  [key: string]: unknown;
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
  return Math.min(10, Math.max(1, Math.round(Number(score) * 10) / 10 || 5));
}

function getVideoMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    webm: "video/webm",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    ogg: "video/ogg",
    m4v: "video/mp4",
  };
  return mimeTypes[ext] || "video/webm";
}

// getTaskDescription was previously defined here but unused — removed.

// ============================================
// Derive scores from individual video observations
// (fallback when cross-validation fails)
// ============================================
function deriveScoresFromObservations(
  observations: Record<string, VideoObservation>,
  baseline: { sittingScore: number; attentionScore: number; hyperactivityScore: number; emotionalScore: number; instructionScore: number }
): { sittingScore: number; attentionScore: number; hyperactivityScore: number; emotionalScore: number; instructionScore: number } {
  const result = { ...baseline };

  // TASK1 observations -> sitting + attention
  const task1 = observations.TASK1;
  if (task1) {
    const sittingObs = (task1.sitting_steadiness as number) || (task1.posture_quality as number);
    const attentionObs = (task1.focus_quality as number) || (task1.task_persistence as number);
    if (sittingObs) result.sittingScore = weightedMerge(baseline.sittingScore, sittingObs, 0.35, 0.65);
    if (attentionObs) result.attentionScore = weightedMerge(baseline.attentionScore, attentionObs, 0.35, 0.65);
  }

  // TASK2 observations -> instruction following
  const task2 = observations.TASK2;
  if (task2) {
    const instructionObs = (task2.comprehension_level as number) || (task2.sequencing_accuracy as number);
    const focusObs = (task2.focus_during_execution as number);
    if (instructionObs) result.instructionScore = weightedMerge(baseline.instructionScore, instructionObs, 0.35, 0.65);
    if (focusObs) result.attentionScore = weightedMerge(result.attentionScore, focusObs, 0.5, 0.5);
  }

  // TASK3 observations -> emotional regulation
  const task3 = observations.TASK3;
  if (task3) {
    const emotionalObs = (task3.emotional_regulation as number);
    if (emotionalObs) result.emotionalScore = weightedMerge(baseline.emotionalScore, emotionalObs, 0.35, 0.65);
    // High distress + slow recovery = lower hyperactivity score (more activity)
    const distress = (task3.distress_level as number) || 5;
    if (distress > 7) {
      result.hyperactivityScore = weightedMerge(baseline.hyperactivityScore, 10 - distress + 2, 0.5, 0.5);
    }
  }

  // TASK4 observations -> speech (doesn't directly affect video scores, but confidence affects overall)
  const task4 = observations.TASK4;
  if (task4) {
    const speechConf = (task4.speaking_confidence as number);
    if (speechConf && speechConf < 4) {
      // Low speaking confidence may indicate broader attention/social concerns
      result.attentionScore = weightedMerge(result.attentionScore, speechConf + 2, 0.7, 0.3);
    }
  }

  // Clamp all scores
  result.sittingScore = clampScore(result.sittingScore);
  result.attentionScore = clampScore(result.attentionScore);
  result.hyperactivityScore = clampScore(result.hyperactivityScore);
  result.emotionalScore = clampScore(result.emotionalScore);
  result.instructionScore = clampScore(result.instructionScore);

  return result;
}

// Weighted merge of two scores
function weightedMerge(score1: number, score2: number, w1: number, w2: number): number {
  return score1 * w1 + score2 * w2;
}

// ============================================
// Deterministic Questionnaire Score Calculators
// (No Math.random() — fully reproducible)
// ============================================

function calculateSittingScore(sectionA: Record<string, string>): number {
  let score = 5;
  if (sectionA.q1 === "yes") score += 2;
  else if (sectionA.q1 === "sometimes") score += 1;
  if (sectionA.q3 === "yes") score += 2;
  else if (sectionA.q3 === "sometimes") score += 1;
  return Math.min(10, Math.max(1, score));
}

function calculateAttentionScore(sectionA: Record<string, string>): number {
  let score = 5;
  if (sectionA.q2 === "yes") score += 2;
  else if (sectionA.q2 === "sometimes") score += 1;
  if (sectionA.q3 === "yes") score += 2;
  else if (sectionA.q3 === "sometimes") score += 1;
  return Math.min(10, Math.max(1, score));
}

function calculateHyperactivityScore(
  sectionA: Record<string, string>,
  sectionB: Record<string, string>
): number {
  let score = 6;
  if (sectionA.q1 === "no") score -= 2;
  else if (sectionA.q1 === "sometimes") score -= 1;
  if (sectionB.q3 === "yes") score -= 1;
  return Math.min(10, Math.max(1, score));
}

function calculateEmotionalScore(sectionB: Record<string, string>): number {
  let score = 5;
  if (sectionB.q1 === "no") score += 2;
  else if (sectionB.q1 === "sometimes") score += 1;
  if (sectionB.q2 === "yes") score += 2;
  else if (sectionB.q2 === "sometimes") score += 1;
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
  return Math.min(10, Math.max(1, score));
}

function calculateSpeechScore(sectionC: Record<string, string>): number {
  let score = 5;
  if (sectionC.q3 === "yes") score += 2;
  else if (sectionC.q3 === "with help") score += 1;
  if (sectionC.q1 === "yes") score += 1;
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
      "Provide visual instructions and calm verbal engagement. Allow transition time between activities. Use positive reinforcement for task completion. Break multi-step instructions into single steps.",
    risk_flags: [],
  };
}
