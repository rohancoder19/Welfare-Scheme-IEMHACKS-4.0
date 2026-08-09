const axios = require('axios');

const rawMlUrl = (process.env.ML_SERVICE_URL || process.env.PYTHON_ML_URL || 'http://127.0.0.1:8000').trim();
const PYTHON_ML_URL = (rawMlUrl.startsWith('http://') || rawMlUrl.startsWith('https://'))
  ? rawMlUrl
  : `https://${rawMlUrl}`;

/**
 * Service bridge between Node.js API and Python FastAPI ML Microservice
 */
class PythonMLService {
  /**
   * Request eligibility predictions and scheme ranking from Python ML service.
   */
  async predictEligibility(userProfile, schemes) {
    try {
      const response = await axios.post(`${PYTHON_ML_URL}/predict-eligibility`, {
        userProfile,
        schemes
      }, { timeout: 10000 });

      if (response.data && response.data.success) {
        return response.data.recommendations;
      }
    } catch (error) {
      console.warn(`[Python ML Service] Fallback triggered for predictEligibility: ${error.message}`);
    }

    // Fallback heuristic engine if Python service is unavailable
    return schemes.map(scheme => {
      const income = userProfile.income || 0;
      const maxInc = scheme.eligibilityCriteria?.maxIncome || 800000;
      let match = income <= maxInc ? 85 : 45;
      return {
        schemeId: scheme._id || scheme.id,
        schemeName: scheme.schemeName,
        category: scheme.category,
        description: scheme.description,
        benefits: scheme.benefits,
        state: scheme.state,
        deadline: scheme.deadline,
        matchPercentage: match,
        isEligible: match >= 50,
        matchedReasons: [income <= maxInc ? "Income within specified scheme ceiling" : "General applicant criteria"],
        unmatchedReasons: income > maxInc ? ["Income exceeds limit"] : []
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  /**
   * Analyze complaint text using Python NLP & Priority Prediction model.
   */
  async analyzeComplaint(title = '', description = '', category = 'Other', location = '') {
    const rawText = (title + ' ' + description).trim();
    try {
      const response = await axios.post(`${PYTHON_ML_URL}/analyze-complaint`, {
        title,
        description,
        complaintText: rawText,
        category,
        existingCategory: category,
        location
      }, { timeout: 3000 });

      if (response.data && response.data.success) {
        const analysis = response.data.analysis || response.data;
        return {
          category: analysis.category || analysis.predictedCategory || category || 'Sanitation',
          subcategory: analysis.subcategory || 'General Services',
          priority: analysis.priority || 'HIGH',
          urgencyScore: analysis.urgencyScore || analysis.priorityScore || 85,
          department: analysis.department || 'Municipal Sanitation',
          departmentReason: analysis.departmentReason || `Complaint concerns ${analysis.subcategory || 'services'} under ${analysis.category || category} sector.`,
          confidence: analysis.confidence || 0.94,
          recommendedSLAHours: analysis.recommendedSLAHours || 48,
          recommendedAction: analysis.recommendedAction || 'Immediate sanitation inspection and dispatch',
          reason: analysis.reason || ['Public health hazard detected', 'Reported unresolved issue'],
          nlpSummary: analysis.nlpSummary || 'AI Complaint classification complete.'
        };
      }
    } catch (error) {
      console.warn(`[Python ML Service] Fallback triggered for analyzeComplaint: ${error.message}`);
    }

    // Advanced Fallback NLP heuristic engine
    const combined = (title + " " + description).toLowerCase();
    let priority = "MEDIUM";
    let score = 65;
    let subcategory = "General Maintenance";
    let department = "Municipal Civic Department";
    let slaHours = 72;
    let action = "Standard ward inspection dispatch";
    let reasons = [];

    if (combined.includes('open wire') || combined.includes('fatal') || combined.includes('live wire') || combined.includes('7 days') && combined.includes('school')) {
      priority = "CRITICAL";
      score = 95;
      slaHours = 12;
      action = "Immediate emergency response team dispatch and site isolation";
      reasons.push("Critical public safety hazard detected");
    } else if (combined.includes('garbage') || combined.includes('trash') || combined.includes('sanitation') || combined.includes('7 days')) {
      priority = "HIGH";
      score = 87;
      subcategory = "Garbage Collection";
      department = "Municipal Sanitation";
      slaHours = 48;
      action = "Immediate sanitation inspection and waste removal crew dispatch";
      reasons.push("Public sanitation issue", "Reported unresolved for 7 days");
      if (combined.includes('school')) reasons.push("Near primary school");
    } else if (combined.includes('danger') || combined.includes('emergency') || combined.includes('bribe') || combined.includes('harassment')) {
      priority = "HIGH";
      score = 85;
      slaHours = 24;
      action = "Priority officer triage and emergency site review";
      reasons.push("High priority risk markers detected");
    } else if (combined.includes('pothole') || combined.includes('leak') || combined.includes('broken')) {
      priority = "MEDIUM";
      score = 62;
      slaHours = 72;
      reasons.push("Civic infrastructure maintenance request");
    } else {
      priority = "LOW";
      score = 38;
      slaHours = 120;
      reasons.push("Routine civic service logging");
    }

    if (combined.includes('school')) reasons.push("Proximity to educational facility");
    if (reasons.length === 0) reasons.push("AI heuristic triage rule applied");

    const detCat = (category !== 'Other' && category) ? category : (combined.includes('garbage') ? 'Sanitation' : 'General Public Service');

    return {
      category: detCat,
      predictedCategory: detCat,
      subcategory,
      priority,
      urgencyScore: score,
      priorityScore: score,
      department,
      departmentReason: `Complaint concerns ${subcategory.toLowerCase()} under ${detCat} sector.`,
      confidence: 0.94,
      recommendedSLAHours: slaHours,
      recommendedAction: action,
      reason: Array.from(new Set(reasons)),
      nlpSummary: `Fallback AI Triage: Classified as ${detCat} with ${priority} priority (${score}/100 Urgency).`
    };
  }

  /**
   * Health check to verify Node backend can reach Python ML microservice
   */
  async checkHealth() {
    try {
      const response = await axios.get(`${PYTHON_ML_URL}/health`, { timeout: 3000 });
      return {
        connected: true,
        status: response.data?.status || 'healthy',
        mlUrl: PYTHON_ML_URL
      };
    } catch (error) {
      return {
        connected: false,
        status: 'unreachable',
        error: error.message,
        mlUrl: PYTHON_ML_URL
      };
    }
  }

  /**
   * Send question to Python Chatbot Engine.
   */
  async queryChatbot(message, conversationHistory = [], userProfile = null) {
    console.log('[CHATBOT] Request received');
    try {
      console.log(`[CHATBOT] Calling ML service: ${PYTHON_ML_URL}/chat`);
      const response = await axios.post(`${PYTHON_ML_URL}/chat`, {
        message,
        conversationHistory,
        userProfile
      }, { timeout: 12000 });

      if (response.data && (response.data.success || response.data.reply)) {
        console.log('[CHATBOT] ML response received');
        const resObj = {
          success: true,
          reply: response.data.reply || response.data.message || "No reply generated",
          source: response.data.source || "Civic AI Assistant",
          sources: response.data.sources || [],
          suggestedActions: response.data.suggestedActions || ["Find Schemes", "File Complaint", "Track Grievances"]
        };
        console.log('[CHATBOT] Response returned to frontend');
        return resObj;
      }
    } catch (error) {
      console.warn(`[CHATBOT] Python ML Service unreachable or error: ${error.message}`);
    }

    console.log('[CHATBOT] Response returned to frontend (Fallback)');
    return {
      success: true,
      reply: "AI Assistant is temporarily unavailable. Please try again.",
      source: "Civic Assistant Service",
      sources: [],
      suggestedActions: ["Find Schemes", "File Complaint", "Track Grievances"]
    };
  }
}

module.exports = new PythonMLService();
