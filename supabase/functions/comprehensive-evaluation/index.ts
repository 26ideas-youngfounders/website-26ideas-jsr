
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Comprehensive Evaluation Edge Function
 * 
 * Provides REST API endpoint for triggering comprehensive AI evaluations
 * of YFF applications with full prompt mapping and structured scoring.
 */

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openAIApiKey) {
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured',
        code: 'MISSING_API_KEY'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { applicationId } = await req.json();

    if (!applicationId) {
      return new Response(JSON.stringify({
        error: 'applicationId is required',
        code: 'MISSING_APPLICATION_ID'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`🔄 Starting comprehensive evaluation for: ${applicationId}`);

    // Fetch application data
    const { data: application, error: fetchError } = await supabase
      .from('yff_applications')
      .select('*')
      .eq('application_id', applicationId)
      .single();

    if (fetchError || !application) {
      return new Response(JSON.stringify({
        error: 'Application not found',
        code: 'APPLICATION_NOT_FOUND'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update status to processing
    await supabase
      .from('yff_applications')
      .update({ 
        evaluation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    // Parse application answers
    let answers: Record<string, any> = {};
    try {
      if (typeof application.answers === 'string') {
        answers = JSON.parse(application.answers);
      } else if (typeof application.answers === 'object' && application.answers !== null) {
        answers = application.answers as Record<string, any>;
      }
    } catch (error) {
      console.error('Failed to parse application answers:', error);
      answers = {};
    }

    // Define system prompts with exact mapping for Idea Stage applications
    const SYSTEM_PROMPTS: Record<string, string> = {
      tell_us_about_idea: `ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses.
OBJECTIVE: Assess the participant's business-idea articulation for maximum clarity, originality, and feasibility so evaluators can distinguish truly innovative, actionable ventures from generic or vague submissions.
INSTRUCTIONS:
Base every judgment solely on the applicant's text; never add outside facts or assumptions.The response is limited to 300 words; ignore length overruns when scoring content quality.
EVALUATION CRITERIA:
Problem–Solution Fit – Precise statement of a meaningful problem and a logical solution.
Innovation – Novelty or differentiated approach versus existing alternatives.
Realism – Plausible execution path given typical resource and market constraints.
Communication Clarity – Specific, concrete language that avoids jargon and vagueness.
SCORING GUIDELINES (1–10):
9–10 = Clear + Unique + Realistic – exact problem, innovative solution, feasible plan.
7–8 = Clear but common – well-articulated idea with standard market approach.
5–6 = Somewhat clear – basic concept with partial ambiguity or limited novelty.
2–4 = Vague – unclear problem/solution, generic buzzwords, or implausible claims.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      problem_statement: `ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses.
OBJECTIVE: Ensure each participant articulates the problem their business idea addresses with maximum specificity, significance, and credibility. The aim is to encourage responses that are not only clear but also supported by concrete data, quantifiable impact, and a demonstration of why the problem is important and worth solving.
INSTRUCTIONS:
Only use information provided in the applicant's response; do not introduce or reference external facts beyond their answer.
The response is limited to 300 words; focus on content quality, not length.
EVALUATION CRITERIA:
Problem Specificity — Clear definition of the pain point, not a vague or generic issue.
Significance — Demonstrates the problem's importance on a realistic scale.
Quantifiable Impact — Incorporates relevant data, statistics, or research to substantiate the problem (when supplied by applicant).
Credibility — Uses cited evidence, research, or logical reasoning given in the answer to support claims.
SCORING GUIDELINES (1–10):
9–10: Very specific, significant problem; clearly described with good supporting data and quantified impact.
7–8: Clearly defined problem and significance, but limited supporting data or quantification.
5–6: Somewhat clear problem but missing strong relevance or lacks enough proof/data.
2–4: Vague, generic, or unconvincing; questionable if this is a meaningful problem.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      whose_problem: `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on customer understanding and market validation.
OBJECTIVE: Ensure participants demonstrate a nuanced understanding of their target customers, existing solutions, and the market landscape through concrete evidence and supporting research. The goal is to verify that applicants have precisely identified their ideal customer, understand how these customers currently address the problem, recognize real pain points, and can back up their claims with relevant market research or data.
INSTRUCTIONS:
Evaluate using only the information found in the applicant's answer; do not add or assume facts from outside their submission.
The response is limited to 300 words; judge on quality and depth, not length.
EVALUATION CRITERIA:
Customer Definition: Clearly identifies a specific, well-described ideal customer or customer segment (avoid vagueness such as "everyone").
Current Solutions: Provides a detailed, accurate picture of what existing alternatives or workarounds these customers use today (including paid or unpaid/DIY methods).
Pain Evidence: Presents concrete examples or anecdotes of customer frustration, limitations, or dissatisfaction with existing solutions.
Market Research: Supports claims about customer behavior or pain points with relevant market data, user interviews, credible statistics, or third-party research (if any is provided in the answer).
SCORING GUIDELINES (1–10):
9–10: Response offers a detailed description of current solutions, strong evidence of customer pain, and integrates market research/data validation.
7–8: Clearly identifies customer and solutions with some evidence of pain or market validation.
5–6: Demonstrates a basic understanding of the customer and current solution environment; may lack depth or strong evidence.
2–4: Vague, generic, or speculative; no clear customer definition or demonstration of real customer pain.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      how_solve_problem: `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on solution effectiveness and clarity.
OBJECTIVE: Ensure participants clearly explain how their solution directly addresses the core problem with a logical, actionable, and realistic approach. The aim is to encourage responses that are focused, feasible, and tailored to solving the stated issue.
INSTRUCTIONS:
Evaluate using only the information found in the applicant's answer; do not add or assume facts from outside their submission.
The response is limited to 300 words; judge on quality and depth, not length.
EVALUATION CRITERIA:
Solution Clarity – Clear, step-by-step explanation of how the solution works and addresses the identified problem.
Logical Connection – Direct, logical link between the solution's features/actions and the core problem's resolution.
Practical Actions – Realistic, specific, and actionable steps and processes that can be implemented by the venture.
Intended Outcomes – Clear articulation of what changes or results are expected if this solution is applied.
SCORING GUIDELINES (1–10):
9–10: Solution is clear, logical, and realistic—each action directly tackles the problem as per industry standards.
7–8: Well-defined solution with a solid problem connection and mostly practical actions.
5–6: Demonstrates a basic approach but has limited detail, depth, or practicality.
2–4: Vague, generic, lacks specificity, or not tailored to the problem.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      how_make_money: `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on revenue model viability and business understanding.
OBJECTIVE: Ensure participants present comprehensive, data-backed revenue models that feature multiple streams of income and, where applicable, provide clear Annual Recurring Revenue (ARR) or Monthly Recurring Revenue (MRR) projections. The goal is to determine not just how ventures plan to make money, but that they understand proven models for their industry and can justify their projections with logical calculation or evidence.
INSTRUCTIONS:
Evaluate using only the information provided in the applicant's response; do not supplement or assume facts from outside their submission.
The response is limited to 300 words, with an optional PDF/Excel upload for supporting details.
EVALUATION CRITERIA:
Revenue Streams – Does the venture outline multiple, diversified, and specific ways of generating income (e.g., product sales, subscriptions, services, advertising, licensing, etc.)?
Model Clarity – Is the monetization strategy clearly described and understandable? Does it unambiguously state how money will be earned?
Projections – Are ARR or MRR estimates provided and supported by transparent calculations, logic, or industry-standard methodologies?
Industry Fit – Does the revenue model reflect proven business practices or established monetization patterns for the given sector?
SCORING GUIDELINES (1–10):
9–10: Multiple revenue streams detailed, ARR/MRR projections included with sound justification and methodology that fit industry practice.
7–8: Single, clear revenue stream with a viable model and sound explanation.
5–6: Basic or generic model, projections are present but not well justified or industry-aligned.
2–4: Monetization approach is unclear, implausible, or unsupported.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      acquire_customers: `ROLE: You are an expert startup evaluator for Young Founders Floor, reviewing participant responses about customer acquisition and relationship management at the idea stage.
OBJECTIVE: Ensure each participant presents a deeply developed customer acquisition and relationship strategy that covers first customer acquisition, multi-stage engagement, specific touchpoints, retention planning, and customer satisfaction. The aim is to reward responses that go beyond superficial tactics—demonstrating practical, lifecycle-based thinking appropriate to early-stage startups.
INSTRUCTIONS:
Evaluate responses using only information in the applicant's text; do not introduce or reference external facts from outside their answer.
The response should be concise (max 300 words), but score based on depth, specificity, and actionability, not length.
EVALUATION CRITERIA:
Initial Acquisition Strategy: Clearly identifies how the first paying customers will be approached, engaged, and converted using appropriate channels (digital, field-based, partnerships, etc.), considering constraints typical for idea-stage startups.
Customer Relationship Mapping: Demonstrates comprehensive understanding of the entire customer journey—articulating all key relationship touchpoints from first contact through onboarding, engagement, and ongoing support.
Retention & Satisfaction Planning: Presents specific, actionable plans for building loyalty, ensuring retention, and fostering customer satisfaction—personalized outreach, proactive support, loyalty initiatives, or feedback loops.
Relationship Depth: Shows commitment to ongoing relationship-building (not one-off sales), such as personalized communication, value-added services, or community creation.
Lifecycle Management: Explains how the customer relationship evolves with maturity—touchpoints for nurturing, upselling, gathering feedback, and resolving churn risks.
Practicality & Realism: Uses strategies and touchpoints suited to the venture's resources, customer profile, and early-stage constraints.
SCORING GUIDELINES (1–10):
9–10:
Multi-touchpoint acquisition plan plus retention strategy;
Deep relationship mapping across lifecycle;
Clear, actionable retention/satisfaction tactics;
Strategies fit resources/industry;
Demonstrates customer-centric thinking.
7–8:
Good multi-stage plan with specific acquisition and relationship touchpoints;
Good focus on retention but lacks maximum depth or some stages.
5–6:
Basic or generic strategy; some touchpoints or retention methods present but not comprehensive.
2–4:
Weak or unclear strategy; missing multi-touchpoint planning or depth on retention/satisfaction.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      competitors: `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on competitive analysis and differentiation strategy.
OBJECTIVE: Ensure participants demonstrate a thorough, evidence-based understanding of their competitive landscape by accurately identifying at least three direct or indirect competitors, analyzing their strengths and weaknesses, and clearly articulating how their idea is differentiated. The response should reflect clarity, market awareness, and a nuanced grasp of competitive dynamics. If claiming no competitors, credible evidence or data must be provided to support the assertion.
INSTRUCTIONS:
Assess responses based solely on the applicant's text; do not introduce external information or assumptions.
Maximum response length is 300 words; focus on the depth and quality of content rather than sheer length.
EVALUATION CRITERIA:
Competitor Identification: Accurately names at least three direct or indirect competitors aiming to solve a similar problem or serve a similar customer segment.
Competitive Analysis: Provides specific analysis of the competitors' strengths and weaknesses, demonstrating real understanding of the market.
Differentiation: Clearly explains the unique value proposition or advantages that set the applicant's idea apart from competitors.
Market Understanding: Shows evidence of a nuanced and realistic perspective on how the market functions, including overlap, gaps, and dynamics.
No competition claim: If claiming there are no competitors, the answer must include credible market research, patent analysis, or industry data to substantiate the claim.
SCORING GUIDELINES (1–10):
9–10: Identifies at least three competitors, provides detailed analysis, and presents clear, credible points of differentiation; demonstrates strong market understanding.
7–8: Identifies two or more competitors with good analysis and some differentiation; may lack full depth or nuance.
5–6: Demonstrates only basic knowledge of competitors or surface-level differentiation.
1–3: Claims no competition without credible evidence, or provides incomplete/missing competitor identification or analysis.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      product_development: `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on product development capability and resource strategy at the idea stage.
OBJECTIVE: Ensure participants demonstrate a deliberate, resource-appropriate, and strategic approach to how their product will be developed at the earliest stage. The response should reveal thoughtful allocation of technical resources (in-house, co-founder, outsource, or hybrid), a realistic match between development approach and product requirements, and practical awareness of the strengths and risks associated with each choice at the idea stage.
INSTRUCTIONS:
Evaluate each response strictly based on the applicant's own text; do not supplement with assumptions or outside information.
The response should focus on how and why this setup is selected, not just state the mode.
Prioritize depth, reasoning, and fit over generic descriptions.
EVALUATION CRITERIA:
Development Mode Clarity: Clearly and unambiguously states the chosen product development model (e.g., solo founder, technical co-founder, in-house team, agency, partner, hybrid).
Strategic Fit: Justifies why this development mode is best for the current stage, considering prototype speed, iteration ability, ownership of IP, and budget constraints.
Resource Alignment: Explains the technical skills available (within founding team or partners) or what gaps exist, and describes actionable plans to fill those gaps where needed.
Risk Awareness: Recognizes potential risks—such as communication breakdown (outsourcing), skills shortages (no tech co-founder), or slow iterations—and includes realistic mitigation steps.
Early-Stage Adaptiveness: Shows the setup supports rapid learning cycles, feedback incorporation, and pivoting—critical for idea-stage development.
Cost & Control Balance: Evaluates how this approach balances upfront cost, speed, and product ownership.
Long-Term Scalability: Comments on whether the setup is intended for MVP/prototype only or is designed for maintainable long-term scaling post-idea stage.
SCORING GUIDELINES (1–10):
9–10: Chosen mode is justified, well-fitted to resources/stage, risks acknowledged, mitigation plans clear, enables rapid iteration, and shows forward planning.
7–8: Clear mode and good reasoning; some strategic fit but may lack in-depth mitigation or long-term view.
5–6: Basic explanation of mode with limited rationale or awareness of risks/challenges; superficial fit to stage or needs.
2–4: Vague, unclear, generic, or mismatched to product needs or stage; lacks reasoning or real strategy.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      team_roles: `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on founder-market fit and team capabilities.
OBJECTIVE: Assess whether the founder or founding team has relevant background, domain expertise, and unique advantages necessary for successful execution of the business idea. Responses should illustrate not only who is on the team and their roles, but also why their individual and collective backgrounds, skills, and perspectives make them uniquely qualified to solve the identified problem.
INSTRUCTIONS:
Evaluate strictly on information provided in the participant's text; do not supplement with assumptions or external knowledge.
The response is limited to 300 words; prioritize depth and relevance over length.
EVALUATION CRITERIA:
Relevant Experience: Clearly describes how each founder's and core team member's background and skills are directly linked to the problem/industry.
Domain Expertise: Demonstrates depth of knowledge (technical, sectoral, business) in the specific market or technology area.
Unique Insights: Identifies special perspectives or tangible advantages—such as industry connections, first-hand experience, or proprietary knowledge—that other teams are unlikely to have.
Passion/Commitment: Provides evidence of genuine, sustained interest and the drive to build this solution, such as prior work, motivation, or long-term dedication.
SCORING GUIDELINES (1–10):
9–10: Strong domain expertise, highly relevant experience, clear unique insights, and compelling evidence of passion/commitment.
7–8: Good background with relevant experience and some sector knowledge. Moderate insight and passion.
5–6: Describes some relevant skills but shows limited domain depth or passion.
2–4: Weak founder-market fit; skills and motivation not clearly related to the problem or industry.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`,

      when_proceed: `ROLE: You are an expert startup evaluator for Young Founders Floor, assessing participant responses on the urgency, execution readiness, and commitment regarding their venture timeline.
OBJECTIVE: Rigorously evaluate whether the participant demonstrates a compelling sense of urgency and concrete readiness to begin working on their idea. The aim is to ensure founders provide a specific, actionable timeline that reflects intentional planning, proactive commitment, and a strong bias for action—key indicators of high-potential founders. Responses should move beyond vague intentions and offer tangible evidence of momentum.
INSTRUCTIONS:
Judge strictly on the information provided in the applicant's answer; do not make assumptions or supplement from external knowledge.
Focus on the level of specificity, immediacy, and confidence in the stated timeline and next steps.
Score for action-orientation, resource preparation, and demonstrated momentum, not just verbal eagerness.
EVALUATION CRITERIA:
Timeline Specificity: States an exact start date (e.g., "already working on it," or "commencing August 2025") and/or identifies time-bound, actionable milestones.
Readiness to Execute: Presents evidence of groundwork already laid (partnerships, prototypes, initial hires, resource commitments, etc.), or describes immediate next steps.
Sense of Urgency: Clearly communicates active intent and a strong drive to build quickly, not delayed or passive language.
Proactive Commitment: Shows the founder/team is taking ownership—has adjusted schedules, sourced critical resources, and is prepared to prioritize the venture.
Momentum Evidence: Provides proof of recent progress, pre-launch activities, or decisive preparatory actions.
SCORING GUIDELINES (1–10):
9–10: Initiation is immediate or underway; timeline is precise; concrete proof of action and high commitment.
7–8: Planned start within the next 1–3 months with clear milestones; action-oriented but not yet executing.
5–6: Expresses interest and some intent to proceed but lacks specific dates, milestones, or urgency.
2–4: Vague, generic, or passive; timeline is unclear or commitment is questionable.
RESPONSE FORMAT (strict):
SCORE: [X/10]
FEEDBACK:
– Strengths: ...
– Areas for Improvement: ...`
    };

    // Score each question
    const scoringResults: Array<{
      questionId: string;
      score: number;
      strengths: string[];
      areas_for_improvement: string[];
      raw_feedback: string;
    }> = [];

    for (const [questionId, answer] of Object.entries(answers)) {
      if (typeof answer === 'string' && answer.trim().length >= 10) {
        const systemPrompt = SYSTEM_PROMPTS[questionId];
        if (systemPrompt) {
          try {
            console.log(`🔍 Scoring question: ${questionId}`);
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: answer }
                ],
                temperature: 0.3,
                max_tokens: 800,
              }),
            });

            if (!response.ok) {
              throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices?.[0]?.message?.content || '';

            // Parse AI response
            const scoreMatch = aiResponse.match(/SCORE:\s*(\d+(?:\.\d+)?)/i);
            const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

            const strengthsMatch = aiResponse.match(/–\s*Strengths:\s*(.*?)(?=–\s*Areas for Improvement:|$)/is);
            const strengthsText = strengthsMatch ? strengthsMatch[1].trim() : '';
            const strengths = strengthsText ? [strengthsText] : [];

            const improvementsMatch = aiResponse.match(/–\s*Areas for Improvement:\s*(.*?)$/is);
            const improvementsText = improvementsMatch ? improvementsMatch[1].trim() : '';
            const areas_for_improvement = improvementsText ? [improvementsText] : [];

            scoringResults.push({
              questionId,
              score: Math.max(0, Math.min(10, score)),
              strengths,
              areas_for_improvement,
              raw_feedback: aiResponse
            });

          } catch (error) {
            console.error(`❌ Failed to score question ${questionId}:`, error);
            scoringResults.push({
              questionId,
              score: 0,
              strengths: [],
              areas_for_improvement: ['Evaluation failed - please review manually'],
              raw_feedback: `Error: ${error.message}`
            });
          }
        }
      }
    }

    // Calculate overall score
    const overallScore = scoringResults.length > 0 
      ? Math.round((scoringResults.reduce((sum, result) => sum + result.score, 0) / scoringResults.length) * 10) / 10
      : 0;

    // Build evaluation data
    const scores: Record<string, any> = {};
    scoringResults.forEach(result => {
      scores[result.questionId] = {
        score: result.score,
        strengths: result.strengths,
        areas_for_improvement: result.areas_for_improvement,
        raw_feedback: result.raw_feedback
      };
    });

    const evaluationData = {
      scores,
      average_score: overallScore,
      evaluation_completed_at: new Date().toISOString(),
      evaluation_status: 'completed',
      evaluation_metadata: {
        total_questions: Object.keys(SYSTEM_PROMPTS).length,
        questions_scored: scoringResults.length,
        model_used: 'gpt-4o-mini',
        evaluation_version: '2.1'
      }
    };

    // Store results
    const { error: updateError } = await supabase
      .from('yff_applications')
      .update({
        evaluation_data: evaluationData,
        overall_score: overallScore,
        evaluation_status: 'completed',
        evaluation_completed_at: evaluationData.evaluation_completed_at,
        updated_at: new Date().toISOString()
      })
      .eq('application_id', applicationId);

    if (updateError) {
      throw new Error(`Failed to store results: ${updateError.message}`);
    }

    // Create evaluation record
    await supabase
      .from('yff_evaluations')
      .insert({
        application_id: applicationId,
        overall_score: overallScore,
        question_scores: evaluationData.scores,
        evaluation_completed_at: evaluationData.evaluation_completed_at,
        evaluation_metadata: evaluationData.evaluation_metadata
      });

    console.log(`✅ Comprehensive evaluation completed for ${applicationId} with score: ${overallScore}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Evaluation completed successfully with score: ${overallScore}/10`,
      result: {
        overall_score: overallScore,
        questions_scored: scoringResults.length,
        evaluation_completed_at: evaluationData.evaluation_completed_at
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Comprehensive evaluation error:', error);
    
    return new Response(JSON.stringify({
      error: 'Evaluation failed',
      message: error.message,
      code: 'EVALUATION_ERROR'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
