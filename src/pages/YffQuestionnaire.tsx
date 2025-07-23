
/**
 * @fileoverview Young Founders Floor AI-Powered Application Questionnaire
 * 
 * This component handles the second phase of the YFF application process where
 * users answer business-related questions with real-time AI feedback.
 * 
 * @version 1.0.0
 * @author 26ideas Development Team
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

/**
 * AI-Powered Questionnaire Component
 * Provides dynamic questionnaire with real-time AI feedback
 */
const YffQuestionnaire = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Application state
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedStage, setSelectedStage] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, any>>({});
  const [loadingFeedback, setLoadingFeedback] = useState<Record<string, boolean>>({});
  const [questions, setQuestions] = useState<any[]>([]);

  // Question sets based on startup stage
  const baseQuestions = [
    {
      id: "q1",
      text: "What is your current academic level and field of study?",
      maxWords: 300,
      required: true
    },
    {
      id: "q2",
      text: "What stage is your product/service currently at?",
      type: "radio",
      options: [
        { value: "idea", label: "Idea Stage" },
        { value: "mvp", label: "Minimum Lovable Product" },
        { value: "revenue", label: "Early Revenue" }
      ],
      required: true
    }
  ];

  const ideaStageQuestions = [
    {
      id: "q3",
      text: "How many years of entrepreneurial experience do you have?",
      maxWords: 300,
      required: true
    },
    {
      id: "q4",
      text: "Describe your business idea in 2-3 sentences",
      maxWords: 300,
      required: true
    },
    {
      id: "q5",
      text: "What specific problem does your idea solve? How are people currently coping with this problem?",
      maxWords: 300,
      required: true
    },
    {
      id: "q6",
      text: "Who is your target customer? Be specific about demographics, behavior, and needs",
      maxWords: 300,
      required: true
    },
    {
      id: "q7",
      text: "How large is your target market? Provide market size estimates",
      maxWords: 300,
      required: true
    },
    {
      id: "q8",
      text: "What is your revenue model? How will you make money?",
      maxWords: 300,
      required: true
    },
    {
      id: "q9",
      text: "Name 3 direct competitors and explain how you differentiate from them",
      maxWords: 300,
      required: true
    },
    {
      id: "q10",
      text: "What validation have you done for your idea so far?",
      maxWords: 300,
      required: true
    },
    {
      id: "q11",
      text: "What are your biggest challenges currently?",
      maxWords: 300,
      required: true
    }
  ];

  const revenueStageQuestions = [
    {
      id: "q3",
      text: "What is your current monthly revenue?",
      maxWords: 300,
      required: true
    },
    {
      id: "q4",
      text: "Describe your business model and value proposition",
      maxWords: 300,
      required: true
    },
    {
      id: "q5",
      text: "What specific problem does your product solve?",
      maxWords: 300,
      required: true
    },
    {
      id: "q6",
      text: "Who are your current customers and how do you acquire them?",
      maxWords: 300,
      required: true
    },
    {
      id: "q7",
      text: "What is your customer acquisition cost and lifetime value?",
      maxWords: 300,
      required: true
    },
    {
      id: "q8",
      text: "What are your key revenue streams?",
      maxWords: 300,
      required: true
    },
    {
      id: "q9",
      text: "Who are your main competitors and what's your market position?",
      maxWords: 300,
      required: true
    },
    {
      id: "q10",
      text: "What growth metrics are you tracking?",
      maxWords: 300,
      required: true
    },
    {
      id: "q11",
      text: "What are your scaling challenges and funding needs?",
      maxWords: 300,
      required: true
    }
  ];

  // Initialize component
  useEffect(() => {
    if (!user) {
      navigate("/young-founders-floor");
      return;
    }
    
    // Check if team information is completed
    checkTeamInformation();
    loadExistingAnswers();
  }, [user, navigate]);

  // Update questions when stage is selected
  useEffect(() => {
    if (selectedStage) {
      let stageQuestions;
      if (selectedStage === "revenue") {
        stageQuestions = revenueStageQuestions;
      } else {
        stageQuestions = ideaStageQuestions;
      }
      setQuestions([...baseQuestions, ...stageQuestions]);
    } else {
      setQuestions(baseQuestions);
    }
  }, [selectedStage]);

  /**
   * Check if team information is completed
   */
  const checkTeamInformation = async () => {
    try {
      const { data, error } = await supabase
        .from('yff_applications')
        .select('status, answers')
        .eq('individual_id', user?.id)
        .eq('application_round', 'Round 1')
        .single();

      if (!data || !data.answers?.team) {
        toast({
          title: "Complete Team Information First",
          description: "Please complete your team information before proceeding to the questionnaire.",
          variant: "destructive",
        });
        navigate('/yff/team-information');
        return;
      }
    } catch (error) {
      navigate('/yff/team-information');
    }
  };

  /**
   * Load existing questionnaire answers
   */
  const loadExistingAnswers = async () => {
    try {
      const { data, error } = await supabase
        .from('yff_applications')
        .select('answers, ai_feedback')
        .eq('individual_id', user?.id)
        .eq('application_round', 'Round 1')
        .single();

      if (data?.answers?.questionnaire) {
        setAnswers(data.answers.questionnaire);
        setSelectedStage(data.answers.questionnaire.q2 || "");
      }
      
      if (data?.ai_feedback) {
        setFeedback(data.ai_feedback);
      }
    } catch (error) {
      console.log("No existing questionnaire data found");
    }
  };

  /**
   * Calculate word count
   */
  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  /**
   * Handle answer change
   */
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    // Update selected stage if this is Q2
    if (questionId === "q2") {
      setSelectedStage(value);
    }
  };

  /**
   * Get AI feedback for an answer
   */
  const getAIFeedback = async (questionId: string, answer: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !answer.trim()) return;

    const prompt = `
ROLE: Expert startup evaluator for Young Founders Floor competition

CONTEXT: Evaluating answer for question: "${question.text}"
Applicant Stage: ${selectedStage || "Not specified"}
Question ID: ${questionId}

ANSWER TO EVALUATE: "${answer}"

EVALUATION CRITERIA:
- Clarity and specificity of response
- Depth of understanding shown
- Market awareness and research
- Feasibility and realistic approach
- Evidence and data supporting claims

CONSTRAINTS:
- Evaluate ONLY based on the provided answer
- Do not reference external information not mentioned
- Answer limit is 300 words - focus on content quality
- Provide constructive, actionable feedback

RESPONSE FORMAT (STRICT):
SCORE: [X/10]
STRENGTHS:
- [List specific positive aspects]

AREAS FOR IMPROVEMENT:
- [List specific actionable suggestions]

SCORING GUIDE:
9-10: Exceptional clarity, strong evidence, comprehensive understanding
7-8: Good understanding, clear explanation, adequate evidence
5-6: Basic understanding, needs more detail or evidence
3-4: Limited understanding, significant gaps in explanation
1-2: Poor understanding or irrelevant response
`;

    try {
      const response = await supabase.functions.invoke('ai-feedback', {
        body: { prompt, answer, questionId }
      });

      if (response.error) throw response.error;

      const result = response.data;
      return {
        score: result.score || "N/A",
        strengths: result.strengths || [],
        improvements: result.improvements || [],
        message: result.message || "Feedback generated successfully"
      };
    } catch (error) {
      console.error("AI feedback error:", error);
      return {
        score: "N/A",
        message: "Feedback temporarily unavailable. Your answer has been saved.",
        strengths: [],
        improvements: []
      };
    }
  };

  /**
   * Submit answer and get feedback
   */
  const submitAnswer = async (questionId: string, answer: string) => {
    const wordCount = getWordCount(answer);
    if (wordCount > 300) {
      toast({
        title: "Word Limit Exceeded",
        description: "Answer must be 300 words or less",
        variant: "destructive",
      });
      return;
    }

    // Save answer to database immediately
    setLoadingFeedback(prev => ({ ...prev, [questionId]: true }));
    
    try {
      // Update answers in database
      const { error } = await supabase
        .from('yff_applications')
        .update({
          answers: { questionnaire: { ...answers, [questionId]: answer } },
          updated_at: new Date().toISOString()
        })
        .eq('individual_id', user.id)
        .eq('application_round', 'Round 1');

      if (error) throw error;

      // Get AI feedback (non-blocking)
      const feedbackResult = await getAIFeedback(questionId, answer);
      setFeedback(prev => ({
        ...prev,
        [questionId]: feedbackResult
      }));

      // Save feedback to database
      await supabase
        .from('yff_applications')
        .update({
          ai_feedback: { ...feedback, [questionId]: feedbackResult }
        })
        .eq('individual_id', user.id)
        .eq('application_round', 'Round 1');

      toast({
        title: "Answer Saved",
        description: "Your answer has been saved and feedback generated.",
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save answer",
        variant: "destructive",
      });
    } finally {
      setLoadingFeedback(prev => ({ ...prev, [questionId]: false }));
    }
  };

  /**
   * Calculate completion percentage
   */
  const calculateProgress = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(answers).filter(key => 
      answers[key] && answers[key].toString().trim().length > 0
    ).length;
    
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  };

  /**
   * Navigate to previous question
   */
  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  /**
   * Navigate to next question
   */
  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  /**
   * Handle final submission
   */
  const handleFinalSubmission = async () => {
    // Validate all required questions are answered
    const unansweredQuestions = questions.filter(q => 
      q.required && (!answers[q.id] || !answers[q.id].toString().trim())
    );

    if (unansweredQuestions.length > 0) {
      toast({
        title: "Incomplete Application",
        description: `Please answer all required questions. ${unansweredQuestions.length} questions remaining.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('yff_applications')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString(),
          answers: { questionnaire: answers },
          ai_feedback: feedback
        })
        .eq('individual_id', user.id)
        .eq('application_round', 'Round 1');

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Your YFF application has been submitted successfully.",
      });

      // Redirect to homepage with success message
      navigate('/young-founders-floor', { 
        state: { 
          showSuccess: true,
          message: "Application submitted successfully! You will be notified about next steps via email." 
        }
      });
    } catch (error: any) {
      toast({
        title: "Submission Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Question Card Component
   */
  const QuestionCard = ({ question, index }: { question: any; index: number }) => {
    const currentAnswer = answers[question.id] || "";
    const questionFeedback = feedback[question.id];
    const isLoading = loadingFeedback[question.id];
    const wordCount = getWordCount(currentAnswer);
    const hasChanged = currentAnswer !== (answers[question.id] || "");

    if (question.type === "radio") {
      return (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Question {index + 1} of {questions.length}</span>
              <Badge variant="outline">Required</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">{question.text}</h3>
            
            <RadioGroup
              value={currentAnswer}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
              className="space-y-2"
            >
              {question.options.map((option: any) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value}>{option.label}</Label>
                </div>
              ))}
            </RadioGroup>
            
            {currentAnswer && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle size={16} />
                <span className="text-sm">Answer saved</span>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Question {index + 1} of {questions.length}</span>
            <Badge variant="outline">Required</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-lg font-semibold">{question.text}</h3>
          
          <div className="space-y-2">
            <Textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer here..."
              className="min-h-32"
              rows={4}
            />
            
            <div className="flex justify-between items-center">
              <span className={`text-sm ${wordCount > 300 ? 'text-red-500' : 'text-gray-500'}`}>
                {wordCount}/300 words
              </span>
              
              <Button
                onClick={() => submitAnswer(question.id, currentAnswer)}
                disabled={!currentAnswer.trim() || wordCount > 300 || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Getting Feedback...
                  </>
                ) : (
                  'Save & Get Feedback'
                )}
              </Button>
            </div>
          </div>

          {/* AI Feedback Display */}
          {questionFeedback && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md border">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-lg">AI Feedback</span>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={
                      parseInt(questionFeedback.score) >= 8 ? "default" :
                      parseInt(questionFeedback.score) >= 6 ? "secondary" : "destructive"
                    }
                  >
                    Score: {questionFeedback.score}/10
                  </Badge>
                </div>
              </div>
              
              {questionFeedback.strengths && questionFeedback.strengths.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <strong className="text-green-600">Strengths:</strong>
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-6">
                    {questionFeedback.strengths.map((strength: string, idx: number) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {questionFeedback.improvements && questionFeedback.improvements.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <strong className="text-orange-600">Areas for Improvement:</strong>
                  </div>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-6">
                    {questionFeedback.improvements.map((improvement: string, idx: number) => (
                      <li key={idx}>{improvement}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Young Founders Floor Application</h1>
          <p className="text-muted-foreground mb-4">Step 2 of 2: Application Questionnaire</p>
          <Progress value={calculateProgress()} className="w-full max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            {calculateProgress()}% Complete • {Object.keys(answers).length} of {questions.length} questions answered
          </p>
        </div>

        {/* Question Display */}
        {questions.length > 0 && (
          <div className="space-y-6">
            <QuestionCard 
              question={questions[currentQuestion]} 
              index={currentQuestion}
            />
            
            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline"
                onClick={goToPrevious}
                disabled={currentQuestion === 0}
              >
                Previous Question
              </Button>
              
              <div className="flex space-x-2">
                {questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={index === currentQuestion ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 ${
                      answers[questions[index]?.id] ? 'bg-green-100 border-green-500' : ''
                    }`}
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              
              {currentQuestion === questions.length - 1 ? (
                <Button 
                  onClick={handleFinalSubmission}
                  disabled={loading || calculateProgress() < 100}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={goToNext}
                  disabled={currentQuestion === questions.length - 1}
                >
                  Next Question
                </Button>
              )}
            </div>

            {/* Application Overview */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Application Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {Object.keys(answers).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Questions Answered
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {Object.keys(feedback).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      AI Feedback Received
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {calculateProgress()}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Completion
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default YffQuestionnaire;
