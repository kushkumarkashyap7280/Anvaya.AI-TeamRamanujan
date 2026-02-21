import { prisma } from "../config/prisma";
import Api, { apiError } from "../utils/apiRes.util";
import { z } from "zod";

import { ai } from "../lib/gemini";

import fs from "fs";

export const createProject = async (req: any, res: any, next: any) => {
  try {
    const { userId, projectName, project_description } = req.body;

    if (!userId || !projectName || !project_description) {
      return next(
        new apiError(
          400,
          "Missing required fields: userId, projectName, project_description",
        ),
      );
    }

    const project = await prisma.project.create({
      data: {
        projectName,
        project_description,
        userId,
      } as any,
    });

    return Api.success(res, project, "Project created successfully");
  } catch (error: any) {
    console.error(error);
    return next(
      new apiError(
        500,
        "Failed to create project",
        [error?.message || String(error)],
        error?.stack,
      ),
    );
  }
};

export const getProjectsByUserId = async (req: any, res: any, next: any) => {
  try {
    const userId = req.params.userId || req.query.userId || req.body.userId;
    if (!userId) return next(new apiError(400, "userId is required"));

    const projects = await prisma.project.findMany({ where: { userId } });
    return Api.success(res, projects, "Projects fetched successfully");
  } catch (error: any) {
    console.error(error);
    return next(
      new apiError(
        500,
        "Failed to fetch projects",
        [error?.message || String(error)],
        error?.stack,
      ),
    );
  }
};

export const getProjectById = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    if (!projectId) return next(new apiError(400, "projectId is required"));

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return next(new apiError(404, "Project not found"));

    return Api.success(res, project, "Project fetched successfully");
  } catch (error: any) {
    console.error(error);
    return next(
      new apiError(
        500,
        "Failed to fetch project",
        [error?.message || String(error)],
        error?.stack,
      ),
    );
  }
};

export const updateProject = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    const { projectName, project_description, status } = req.body;

    if (!projectId) return next(new apiError(400, "projectId is required"));

    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!existingProject) return next(new apiError(404, "Project not found"));

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        projectName,
        project_description,
        status,
      } as any,
    });

    return Api.success(res, updatedProject, "Project updated successfully");
  } catch (error: any) {
    console.error(error);
    return next(
      new apiError(
        500,
        "Failed to update project",
        [error?.message || String(error)],
        error?.stack,
      ),
    );
  }
};

export const deleteProject = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    if (!projectId) return next(new apiError(400, "projectId is required"));

    const existingProject = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!existingProject) return next(new apiError(404, "Project not found"));

    await prisma.project.delete({ where: { id: projectId } });
    return Api.success(res, null, "Project deleted successfully");
  } catch (error: any) {
    console.error(error);
    return next(
      new apiError(
        500,
        "Failed to delete project",
        [error?.message || String(error)],
        error?.stack,
      ),
    );
  }
};

// step 0 - receive files and projectId

/*
  const myfile = await ai.files.upload({
    file: "path/to/sample.mp3",
    config: { mimeType: "audio/mpeg" },
  });

  const fileName = myfile.name;
  const fetchedFile = await ai.files.get({ name: fileName });
  console.log(fetchedFile);
}
   */

export const uploadProjectFiles = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!projectId) return next(new apiError(400, "ProjectId is required"));
    if (!files || files.length === 0)
      return next(new apiError(400, "No files uploaded"));

    // 2. Process and Upload to Google Files API
    const uploadPromises = files.map(async (file) => {
      // Upload using the new syntax
      const uploadResponse = await ai.files.upload({
        file: file.path,
        config: {
          mimeType: file.mimetype,
          displayName: file.originalname,
        },
      });

      // Cleanup local disk immediately after upload
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      // Return the data structure your DB expects
      return {
        name: file.originalname,
        url: uploadResponse.uri ?? "", // Ensure url is always a string
      };
    });

    const uploadedFileData = await Promise.all(uploadPromises);

    // 3. Update Project Status & Store File Metadata
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        files: {
          push: uploadedFileData, // Prisma handles the array push in MongoDB
        },
        status: 1, // Progress to "Context Ingested"
      },
    });

    return Api.success(
      res,
      updatedProject,
      "Files ingested and synced to Google AI Cloud.",
    );
  } catch (error: any) {
    console.error("Unified Ingestion Error:", error);
    return next(new apiError(500, "Ingestion Failed", [error.message]));
  }
};

const extractionSchema = z.object({
  stakeholders: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      influence: z.string(),
      stance: z.string(),
    }),
  ),
});

// Schema for validating facts + optional relatedChats returned by the AI
const extractFactsDataSchema = z.object({
  facts: z.array(
    z.object({
      content: z.string().describe("Verifiable claim or requirement."),
      source: z.string().describe("Convention: [Channel]/[Thread or Subject]"),
      tone: z.string().describe("Sentiment/Tone of the statement."),
      when: z.string().describe("ISO timestamp or date string."),
      sourceType: z.enum(["messaging", "file"]),
      stackHolderId: z.string().optional().describe("The ID of the stakeholder who made the claim."),
    }),
  ),
  relatedChats: z
    .array(
      z.object({
        speaker: z.string(),
        text: z.string(),
        when: z.string().optional(),
        id: z.string().optional(),
      }),
    )
    .optional(),
});

export const mapStakeholders = async (req: any, res: any, next: any) => {
  const { projectId } = req.params;
  const { relevantChats } = req.body; // Expecting an array of chat objects or a joined string

  if (!projectId) return next(new apiError(400, "ProjectId is required"));
  if (
    !relevantChats ||
    (Array.isArray(relevantChats) && relevantChats.length === 0)
  ) {
    return next(new apiError(400, "Relevant chat history is required"));
  }

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return next(new apiError(404, "Project not found"));

  const prompt = `
  SYSTEM ROLE: Expert Business Systems Analyst & Entity Extractor.
  
  TASK: Extract a clean list of stakeholders from the provided Project Context and Communication Data. 
  
  STRICT GROUNDING RULES:
  1. ONLY extract individuals or entities explicitly named in the "relevant" data streams.
  2. DO NOT hallucinate or "fill in" missing data. If Influence or Stance is not clear, use "Neutral" or "Medium".
  3. IGNORE all entries where "is_relevant" is false (e.g., family chats, social football groups).
  4. PROJECT SCOPE: Focus exclusively on stakeholders related to "${project.projectName}".

  INPUT DATA:
  - Project Description: ${project.project_description}
  - Data Vault JSON: ${JSON.stringify(relevantChats)}

  EXTRACTION LOGIC:
  - Identify Name & Role from Participant lists, Signatures, or Speaker tags.
  - Determine 'Influence': Look for budget authority (CFO), technical veto power (CTO), or final decision rights (CEO).
  - Determine 'Stance': Analyze sentiment. (e.g., Is the CFO "Blocking" a budget? Is the CEO "Supportive" of speed over security?)

  OUTPUT: Return a JSON object with a 'stakeholders' array.
`;

  // Define plain JSON schema for Gemini (must match our Zod `extractionSchema`)
  const extractionJsonSchema = {
    type: "object",
    properties: {
      stakeholders: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            role: { type: "string" },
            influence: { type: "string", enum: ["High", "Medium", "Low"] },
            stance: {
              type: "string",
              enum: ["Supportive", "Neutral", "Skeptical", "Blocking"],
            },
          },
          required: ["name", "role", "influence", "stance"],
        },
      },
    },
    required: ["stakeholders"],
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: extractionJsonSchema,
      },
    });

    const parsedData = JSON.parse(response.text ?? "{}");
    const stakeholders = extractionSchema.parse(parsedData).stakeholders;

    // Save stakeholders to DB (assuming a Stakeholder model with name, role, and projectId)
    const savedStakeholders = await Promise.all(
      stakeholders.map((s: any) =>
        prisma.stakeholder.create({
          data: {
            name: s.name,
            role: s.role,
            influence: s.influence ?? null,
            stance: s.stance ?? null,
            projectId: projectId,
          },
        }),
      ),
    );

    return Api.success(
      res,
      savedStakeholders,
      "Stakeholders extracted and saved successfully",
    );
  } catch (error: any) {
    console.error("Stakeholder Extraction Error:", error);
    return next(
      new apiError(500, "Failed to extract stakeholders", [error.message]),
    );
  }
};

export const deleteStakeholder = async (req: any, res: any, next: any) => {
  try {
    const { projectId, stakeholderId } = req.params;
    if (!projectId) return next(new apiError(400, "projectId is required"));
    if (!stakeholderId) return next(new apiError(400, "stakeholderId is required"));

    const stakeholder = await prisma.stakeholder.findFirst({
      where: { id: stakeholderId, projectId },
    });
    if (!stakeholder) return next(new apiError(404, "Stakeholder not found"));

    await prisma.stakeholder.delete({ where: { id: stakeholderId } });
    return Api.success(res, null, "Stakeholder deleted successfully");
  } catch (error: any) {
    console.error("Delete Stakeholder Error:", error);
    return next(
      new apiError(500, "Failed to delete stakeholder", [error.message]),
    );
  }
};

/*
type File {
  name String
  url  String
}

model Project {
  id                        String          @id @default(auto()) @map("_id") @db.ObjectId
  projectName               String
  project_description       String
  included_messaging_source String[]      @default([])
files                        File[]
  brdMdx                    String?
  status                    Int              @default(0)
  userId                    String          @db.ObjectId
  createdAt                 DateTime        @default(now())
  updatedAt                 DateTime        @updatedAt

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  stakeholders   Stakeholder[]
  facts          Fact[]
  contradictions Contradiction[]
  resolutions    Resolution[]
}

model Stakeholder {
  id        String @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  role      String
  influence String
  stance    String
  projectId String @db.ObjectId

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

model Fact {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  content    String
  source     String
  tone       String
  when       DateTime
  resolved   Boolean @default(true)
  projectId  String   @db.ObjectId
 sourceType FactSourceType
 stackHolderId String?  @db.ObjectId

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

enum FactSourceType {
  messaging
  file
}


// algo :
/* 
1. Receive projectId and relevant chat history from frontend.
2. Fetch project details (name, description, files) from DB using projectId.
3. fetch stackholders from db using projectId so it can map in facts 
4. convention of source is if 
it whatsapp  whataspp/chatname
if email email/to
3. Construct a prompt combining project details and chat history.


*/

export const increamentProjectStatus = async (
  req: any,
  res: any,
  next: any,
) => {
  try {
    const { projectId } = req.params;
    if (!projectId) return next(new apiError(400, "ProjectId is required"));

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return next(new apiError(404, "Project not found"));

    const newStatus = (project.status || 0) + 1;

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { status: newStatus },
    });

    return Api.success(
      res,
      updatedProject,
      "Project status incremented successfully",
    );
  } catch (error: any) {
    console.error(error);
    return next(
      new apiError(500, "Failed to increment project status", [error.message]),
    );
  }
};


export const mapFacts = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    const { userData } = req.body; // frontend now sends full userData

    console.log('mapFacts called with projectId:', projectId);
    console.log('Received userData sample:', userData); // Log a sample of userData

    if (!projectId) return next(new apiError(400, "ProjectId is required"));
    if (!userData) return next(new apiError(400, "userData is required"));

    // Fetch project and stakeholders for grounding
    const [project, stakeholders] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.stakeholder.findMany({ where: { projectId } }),
    ]);
    if (!project) return next(new apiError(404, "Project not found"));

    // Build prompt for AI
    const prompt = `
      SYSTEM ROLE: Forensic Requirements Analyst for Anvaya.Ai.
      TASK: Decompose the communication stream into Atomic Facts.

      GROUNDING CONTEXT:
      - Project Name: ${project.projectName}
      - Project Files: ${project.files.map((f: any) => f.name).join(", ")}
      - Verified Stakeholders (MUST use these IDs): 
        ${stakeholders.map((s) => `${s.name} (Role: ${s.role}, ID: ${s.id})`).join("\n")}

      STRICT RULES:
      1. Every fact must be an independent, verifiable claim relevant to the project.
      2. Each fact must be linked to a source in the communication stream.
      3. Link 'stackHolderId' ONLY if the speaker matches a verified stakeholder name.
      4. Use source naming convention like 'whatsapp/[GroupName]' or 'email/[Subject]'.

      COMMUNICATION STREAM:
      ${JSON.stringify(userData)}
    `;

    // JSON schema for AI
    const factJsonSchema: any = {
      type: "object",
      properties: {
        facts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              content: { type: "string" },
              source: { type: "string" },
              tone: { type: "string" },
              when: { type: "string" },
              sourceType: { type: "string", enum: ["messaging", "file"] },
              stackHolderId: { type: "string" },
            },
            required: ["content", "source", "tone", "when", "sourceType"],
          },
        },
        relatedChats: {
          type: "array",
          items: {
            type: "object",
            properties: {
              speaker: { type: "string" },
              text: { type: "string" },
              when: { type: "string" },
              id: { type: "string" },
            },
          },
        },
      },
      required: ["facts"],
    };

    // Call AI
    const aiResult = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: factJsonSchema,
      },
    } as any);

    const tryParseJSON = (raw: any) => {
      if (!raw) throw new Error("Empty response from model");
      if (typeof raw === "object") return raw;
      let s = String(raw).trim();
      s = s.replace(/```json|```/gi, "").trim();
      try { return JSON.parse(s); } catch (e) {}
      const jsonMatch = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[0]); } catch (e) {}
      }
      const firstIdx = s.search(/[\{\[]/);
      if (firstIdx !== -1) {
        const sub = s.slice(firstIdx);
        try { return JSON.parse(sub); } catch (e) {}
      }
      try { return JSON.parse(s.replace(/'/g, '"')); } catch (e) {}
      throw new Error("Unable to parse JSON from model response");
    };

    const rawCandidate = (aiResult as any).text ?? (aiResult as any).response ?? JSON.stringify(aiResult);
    let parsedObj: any = tryParseJSON(rawCandidate);

    // Validate with Zod
    const parsedData = extractFactsDataSchema.parse(parsedObj as any);

    // Persist facts
    const savedFacts: any[] = [];
    for (const f of parsedData.facts) {
      try {
        const created = await prisma.fact.create({
          data: {
            content: f.content as any,
            source: f.source,
            tone: f.tone,
            when: isNaN(Date.parse(f.when)) ? new Date() : new Date(f.when),
            sourceType: f.sourceType as any,
            stackHolderId: f.stackHolderId || null,
            projectId,
            resolved: true,
          },
        });
        savedFacts.push(created);
      } catch (err) {
        console.error('mapFacts: failed to save fact', err);
      }
    }

    // Fetch all facts for the project to return
    const factsFromDb = await prisma.fact.findMany({ where: { projectId } });
    const relatedChats = parsedData.relatedChats ?? [];
    const rawSnippet = typeof rawCandidate === 'string' ? rawCandidate.slice(0, 2000) : rawCandidate;
    const fileLinks = (project.files || []).map((f: any) => ({ name: f.name, url: f.url }));

    return Api.success(res, { savedFacts: factsFromDb, relatedChats, rawModelResponse: rawSnippet, fileLinks }, 'Neural FactID sequence complete.');

  } catch (error: any) {
    console.error('FactID Extraction Failure:', error);
    return next(new apiError(500, 'Neural Logic Error', [error?.message || String(error)]));
  }
};


// find conflicts 
// algorithm for contradictions
/*
1. Receive projectId
2. Fetch all facts for the project from DB
3. compare facts and find groups of contradictions (e.g., same source but different content, or same claim but different sources)
4. Store contradictions in DB and return them with options to chose by user above one fact in a given 
*/


// model Contradiction {
//   id                  String   @id @default(auto()) @map("_id") @db.ObjectId
//   contradiction_facts String[]      @default([])
//   context             String
//   projectId           String   @db.ObjectId

//   project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
// }



// 1. Zod Schema for AI Output Validation
const contradictionOutputSchema = z.object({
  contradictions: z.array(
    z.object({
      factIds: z.array(z.string()).describe("List of MongoDB Fact IDs that clash."),
      context: z.string().describe("A professional summary of why these facts contradict each other."),
    })
  )
});

export const deleteFact = async (req: any, res: any, next: any) => {
  try {
    const { projectId, factId } = req.params;
    if (!projectId || !factId) return next(new apiError(400, "projectId and factId are required"));

    const fact = await prisma.fact.findUnique({ where: { id: factId } });
    if (!fact) return next(new apiError(404, "Fact not found"));
    if (fact.projectId !== projectId) return next(new apiError(403, "Fact does not belong to this project"));

    await prisma.fact.delete({ where: { id: factId } });
    return Api.success(res, { factId }, "Fact deleted successfully");
  } catch (error: any) {
    console.error("Delete Fact Error:", error);
    return next(new apiError(500, "Failed to delete fact", [error?.message || String(error)]));
  }
};

export const findContradictions = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;

    if (!projectId) return next(new apiError(400, "ProjectId is required"));

    // 2. Fetch all project facts and stakeholders
    const [facts, stakeholders] = await Promise.all([
      prisma.fact.findMany({ where: { projectId } }),
      prisma.stakeholder.findMany({ where: { projectId } })
    ]);

    if (facts.length < 2) {
      return Api.success(res, [], "Insufficient facts to perform contradiction analysis.");
    }

    // 3. Prepare Grounded Prompt for Logic Audit
    // We map stakeholders to their IDs so the AI can mention names in the context
    const factList = facts.map(f => {
      const owner = stakeholders.find(s => s.id === f.stackHolderId);
      return `[ID: ${f.id}] Source: ${f.source} | Stakeholder: ${owner?.name || "Unknown"} | Content: ${typeof f.content === 'string' ? f.content : JSON.stringify(f.content)}`;
    }).join("\n");

    const prompt = `
      SYSTEM ROLE: Logic Reconciliation & Conflict Auditor for Anvaya.Ai.
      TASK: Analyze the provided Fact Set and identify direct or indirect contradictions.
      
      LOGIC RULES:
      1. BUDGET CLASH: Identify if stakeholders mention different cost limits or figures.
      2. TIMELINE DRIFT: Identify if dates for milestones or launches do not match.
      3. SCOPE CREEP: Identify if a stakeholder suggests a requirement that another says is out-of-scope or blocked.
      4. MANDATORY VS OPTIONAL: Identify if a compliance requirement is marked as 'required' by one and 'skippable' by another.

      FACT SET:
      ${factList}

      OUTPUT INSTRUCTIONS:
      - Return a JSON object with a 'contradictions' array.
      - Each item must contain 'factIds' (the original MongoDB IDs) and a 'context' explaining the clash.
      - ONLY report actual contradictions. If logic is consistent, return an empty array.
    `;

    // 4. Gemini Configuration
    const contradictionJsonSchema = {
      type: "object",
      properties: {
        contradictions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              factIds: { type: "array", items: { type: "string" } },
              context: { type: "string" }
            },
            required: ["factIds", "context"]
          }
        }
      },
      required: ["contradictions"]
    };

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: contradictionJsonSchema,
      },
    } as any);

    // 5. Safe Parsing
    const rawText = (result.text ?? "").replace(/```json|```/gi, "").trim();
    const parsedData = contradictionOutputSchema.parse(JSON.parse(rawText));

    // 6. Persistence: Clear old contradictions and save new ones
    // We use a transaction to ensure we don't have duplicate or stale conflicts
    const savedContradictions = await prisma.$transaction(async (tx) => {
      await tx.contradiction.deleteMany({ where: { projectId } });

      const created = await Promise.all(
        parsedData.contradictions.map(c => 
          tx.contradiction.create({
            data: {
              contradiction_facts: c.factIds,
              context: c.context,
              projectId: projectId
            }
          })
        )
      );
      return created;
    });

    return Api.success(res, savedContradictions, "Logic Audit Complete: Contradictions identified.");

  } catch (error: any) {
    console.error("Conflict Detection Error:", error);
    return next(new apiError(500, "Logic Engine Failure at Step 3", [error.message]));
  }
};

/*
model Resolution {
  id               String @id @default(auto()) @map("_id") @db.ObjectId
  final_decision   String
  winnerFactId     String @db.ObjectId
  custom_input     String
  reasoning        String
  contradiction_id String @db.ObjectId
  projectId        String @db.ObjectId

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
*/


// algorithm for resolution
/*
1. Receive projectId with (either winnerFactId or custom_input) and contradictionId from frontend.
2. check if both field (winnerFactId and custom_input) are not provided or both are provided then return error
3. check reasoning is provided or not if not return error
4. Fetch the contradiction from DB using contradictionId to get the context and the conflicting facts.
5. If winnerFactId is provided then fetch the winning fact and use its content in prompt otherwise use custom_input as winning argument

*/





export const generateBRD = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    if (!projectId) return next(new apiError(400, "ProjectId is required"));

    // Fetch all project data for grounding
    const [project, stakeholders, facts, resolutions] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.stakeholder.findMany({ where: { projectId } }),
      prisma.fact.findMany({ where: { projectId } }),
      prisma.resolution.findMany({ where: { projectId } }),
    ]);

    if (!project) return next(new apiError(404, "Project not found"));

    const resolvedFacts = facts.filter(f => f.resolved);
    const supersededFacts = facts.filter(f => !f.resolved);

    const stakeholderList = stakeholders.map(s =>
      `- ${s.name} (${s.role}) | Influence: ${s.influence} | Stance: ${s.stance}`
    ).join('\n');

    const factList = resolvedFacts.map((f, i) => {
      const content = typeof f.content === 'string' ? f.content : JSON.stringify(f.content);
      const owner = stakeholders.find(s => s.id === f.stackHolderId);
      return `[FACT-${String(i+1).padStart(3,'0')}] ${content}\n  ↳ Source: ${f.source} | Owner: ${owner?.name || 'Unknown'} | Tone: ${f.tone}`;
    }).join('\n\n');

    const resolutionList = resolutions.map((r, i) =>
      `[RES-${String(i+1).padStart(3,'0')}] Final Decision: ${r.final_decision}\n  ↳ Reasoning: ${r.reasoning}`
    ).join('\n\n');

    const prompt = `
      SYSTEM ROLE: Senior Business Analyst & Technical Writer at Anvaya.Ai.
      TASK: Generate a comprehensive, audit-ready Business Requirements Document (BRD) in Markdown format.

      STRICT RULES:
      1. Do NOT include any reference markers like [Ref: FACT-001] or similar citations in the output. The BRD must read as a clean, standalone professional document.
      2. Include ALL verified stakeholders in the Authority Matrix.
      3. Format output as clean Markdown with proper headers (# for H1, ## for H2, ### for H3).
      4. Be professional, forensic, and precise. No hallucinations.
      5. Use proper Markdown table syntax (| Header | Header |, |---|---|, | cell | cell |) for the Stakeholder Authority Matrix and any other tabular data. NEVER use dash-lists for tabular data.
      6. For the Stakeholder Authority Matrix table, include columns: Name, Role, Influence, Stance.
      7. Write requirements naturally, as final polished prose — do not cite internal fact IDs.

      PROJECT CONTEXT:
      - Project Name: ${project.projectName}
      - Description: ${project.project_description}
      - Files Analyzed: ${project.files.map((f: any) => f.name).join(', ') || 'None'}

      STAKEHOLDER AUTHORITY MATRIX:
      ${stakeholderList || 'No stakeholders identified'}

      VERIFIED ATOMIC FACTS (USE AS GROUNDING — DO NOT CITE IDs IN OUTPUT):
      ${factList || 'No facts available'}

      CONFLICT RESOLUTIONS APPLIED:
      ${resolutionList || 'No resolutions required — all facts were consistent'}

      SUPERSEDED FACTS (Excluded from BRD):
      ${supersededFacts.map(f => typeof f.content === 'string' ? f.content : JSON.stringify(f.content)).join('; ') || 'None'}

      OUTPUT: A complete, clean BRD in Markdown, including sections:
      # Business Requirements Document: ${project.projectName}
      ## Executive Summary
      ## Project Scope
      ## Stakeholder Authority Matrix
      ## Functional Requirements
      ## Non-Functional Requirements
      ## Compliance & Risk Constraints
      ## Resolved Conflicts Log
      ## Approval & Sign-Off
    `;

    const brdResult = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "text/plain",
      },
    } as any);

    const brdMarkdown = (brdResult.text ?? "").trim();

    // Save BRD and increment status to 5
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        brdMdx: brdMarkdown,
        status: 5,
      } as any,
    });

    return Api.success(res, updatedProject, "BRD synthesized and saved successfully");
  } catch (error: any) {
    console.error("BRD Generation Error:", error);
    return next(new apiError(500, "Failed to generate BRD", [error?.message || String(error)]));
  }
};

export const getResolutions = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    if (!projectId) return next(new apiError(400, "ProjectId is required"));

    const resolutions = await prisma.resolution.findMany({
      where: { projectId },
    });

    // Fetch associated contradictions for context
    const contradictions = await prisma.contradiction.findMany({
      where: { projectId },
    });

    // Merge contradiction context into each resolution
    const enriched = resolutions.map((r: any) => {
      const contradiction = contradictions.find((c: any) => c.id === r.contradiction_id);
      return {
        ...r,
        contradiction_context: contradiction?.context || "",
        contradiction_facts: contradiction?.contradiction_facts || [],
      };
    });

    return Api.success(res, enriched, "Resolutions fetched successfully");
  } catch (error: any) {
    console.error("Get Resolutions Error:", error);
    return next(new apiError(500, "Failed to fetch resolutions", [error.message]));
  }
};

export const ResolveContradiction = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    const payload = req.body;

    if (!projectId) return next(new apiError(400, "ProjectId is required"));

    // Normalize to an array to support batch and single-item calls
    const items = Array.isArray(payload) ? payload : [payload];

    if (items.length === 0) return next(new apiError(400, "No resolution items provided"));

    // Validate all items first
    for (const item of items) {
      const { contradictionId, winnerFactId, custom_input, reasoning } = item;
      if (!contradictionId) return next(new apiError(400, "contradictionId is required for each item"));
      // XOR requirement
      if ((!winnerFactId && !custom_input) || (winnerFactId && custom_input)) {
        return next(new apiError(400, "Provide either winnerFactId or custom_input for each item, not both or neither."));
      }
      if (!reasoning) return next(new apiError(400, "Resolution reasoning is mandatory for each item."));
    }

    // Process all items in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const createdResolutions: any[] = [];

      for (const item of items) {
        const { contradictionId, winnerFactId, custom_input, reasoning } = item;

        const contradiction = await tx.contradiction.findUnique({ where: { id: contradictionId } });
        if (!contradiction) throw new Error(`Contradiction ${contradictionId} not found`);

        let finalDecisionText = "";
        if (winnerFactId) {
          const winningFact = await tx.fact.findUnique({ where: { id: winnerFactId } });
          if (!winningFact) throw new Error(`Winning fact ${winnerFactId} not found`);
          finalDecisionText = typeof winningFact.content === 'object' ? (winningFact.content as any).statement ?? JSON.stringify(winningFact.content) : String(winningFact.content);
        } else {
          finalDecisionText = custom_input || '';
        }

        const resolution = await tx.resolution.create({
          data: {
            final_decision: finalDecisionText,
            winnerFactId: winnerFactId || null,
            custom_input: custom_input || "",
            reasoning,
            contradiction_id: contradictionId,
            projectId,
          },
        });

        // Mark all involved facts as superseded (resolved = false)
        await tx.fact.updateMany({ where: { id: { in: contradiction.contradiction_facts } }, data: { resolved: false } });

        if (winnerFactId) {
          await tx.fact.update({ where: { id: winnerFactId }, data: { resolved: true } });
        }

        createdResolutions.push(resolution);
      }

      return createdResolutions;
    });

    return Api.success(res, results, "Logic Reconciled: Resolutions recorded.");
  } catch (error: any) {
    console.error("Resolution Error:", error);
    return next(new apiError(500, "Failed to resolve contradictions", [error?.message || String(error)]));
  }
};
export const refineBRD = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    const { userInput } = req.body;

    if (!projectId) return next(new apiError(400, "ProjectId is required"));
    if (!userInput || !userInput.trim()) return next(new apiError(400, "userInput is required"));

    const [project, stakeholders, facts] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.stakeholder.findMany({ where: { projectId } }),
      prisma.fact.findMany({ where: { projectId, resolved: true } }),
    ]);

    if (!project) return next(new apiError(404, "Project not found"));

    const currentBRD = project.brdMdx || "(No BRD generated yet)";

    const factGrounding = facts.map((f, i) => {
      const content = typeof f.content === "string" ? f.content : JSON.stringify(f.content);
      const owner = stakeholders.find(s => s.id === f.stackHolderId);
      return `[FACT-${String(i+1).padStart(3,"0")}] ${content}\n  ↳ Source: ${f.source} | Owner: ${owner?.name || "Unknown"}`;
    }).join("\n\n");

    const prompt = `
      SYSTEM ROLE: You are the Anvaya.Ai BRD Refinement Engine.
      TASK: Refine the existing BRD based on the user's instruction.

      USER INSTRUCTION: "${userInput}"

      CURRENT BRD:
      ${currentBRD}

      VERIFIED FACT GROUNDING (use as context only — DO NOT add [Ref: FACT-xxx] citations):
      ${factGrounding}

      RULES:
      1. Apply the user's instruction precisely.
      2. Do NOT include any reference markers like [Ref: FACT-001] in the output. Strip any existing ones. The output must be clean, professional Markdown.
      3. Keep the document in clean Markdown format.
      4. Do not hallucinate new requirements not supported by the fact set.

      OUTPUT: The complete refined BRD in clean Markdown format only, no reference markers.
    `;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "text/plain" },
    } as any);

    const refinedBRD = (result.text ?? "").trim();

    return Api.success(res, { refinedBRD }, "BRD refined successfully");
  } catch (error: any) {
    console.error("BRD Refinement Error:", error);
    return next(new apiError(500, "Failed to refine BRD", [error?.message || String(error)]));
  }
};

export const saveBRD = async (req: any, res: any, next: any) => {
  try {
    const { projectId } = req.params;
    const { brdMdx } = req.body;

    if (!projectId) return next(new apiError(400, "ProjectId is required"));
    if (!brdMdx) return next(new apiError(400, "brdMdx content is required"));

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { brdMdx } as any,
    });

    return Api.success(res, updatedProject, "BRD saved successfully");
  } catch (error: any) {
    console.error("Save BRD Error:", error);
    return next(new apiError(500, "Failed to save BRD", [error?.message || String(error)]));
  }
};

   