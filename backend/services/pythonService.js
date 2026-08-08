const axios = require('axios');

const PYTHON_ML_URL = process.env.PYTHON_ML_URL || 'http://127.0.0.1:8000';

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
  async analyzeComplaint(title, description, category = 'Other') {
    try {
      const response = await axios.post(`${PYTHON_ML_URL}/classify-complaint`, {
        title,
        description,
        category
      }, { timeout: 3000 });

      if (response.data && response.data.success) {
        return response.data.analysis;
      }
    } catch (error) {
      console.warn(`[Python ML Service] Fallback triggered for analyzeComplaint: ${error.message}`);
    }

    // Fallback NLP heuristic
    const combined = (title + " " + description).toLowerCase();
    let priority = "Medium";
    let score = 50;

    if (combined.includes('danger') || combined.includes('fatal') || combined.includes('emergency') || combined.includes('harassment') || combined.includes('bribe')) {
      priority = "High";
      score = 90;
    } else if (combined.includes('leak') || combined.includes('pothole') || combined.includes('broken')) {
      priority = "Medium";
      score = 65;
    } else {
      priority = "Low";
      score = 35;
    }

    return {
      predictedCategory: category !== 'Other' ? category : 'General Public Service',
      priority,
      priorityScore: score,
      nlpSummary: "Rule-based fallback triage score calculated."
    };
  }

  /**
   * Send question to Python Chatbot Engine.
   */
  async queryChatbot(message) {
    try {
      const response = await axios.post(`${PYTHON_ML_URL}/chat`, {
        message
      }, { timeout: 12000 });

      if (response.data && response.data.success) {
        return response.data;
      }
    } catch (error) {
      console.warn(`[Python ML Service] Fallback triggered for queryChatbot: ${error.message}`);
    }

    return {
      reply: "Welcome to Civic Welfare Assistant! I can help you find eligible schemes, guide document requirements, or submit civic grievance complaints.",
      source: "Express Assistant Service",
      suggestedActions: ["Find Schemes", "File Complaint", "Track Grievances"]
    };
  }
}

module.exports = new PythonMLService();
