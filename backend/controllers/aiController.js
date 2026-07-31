const aiService = require('../services/aiService');

exports.summarize = async (req, res) => {
  try {
    const { text, maxLength } = req.body;
    const summary = await aiService.summarize(text, { maxLength });
    res.status(200).json({ success: true, data: { summary } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.sentiment = async (req, res) => {
  try {
    const { text } = req.body;
    const result = await aiService.sentiment(text);
    res.status(200).json({ success: true, data: { sentiment: result } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.suggestReplies = async (req, res) => {
  try {
    const { context } = req.body;
    const replies = await aiService.suggestReplies(context);
    res.status(200).json({ success: true, data: replies });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.extractEntities = async (req, res) => {
  try {
    const { text } = req.body;
    const entities = await aiService.extractEntities(text);
    res.status(200).json({ success: true, data: entities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDashboardInsights = async (req, res) => {
  try {
    // Stub: in a real implementation, aggregate data and call AI for insights
    res.status(200).json({
      success: true,
      data: {
        insights: [
          'Attendance rate is stable this week.',
          'Fee collection is on track for the current session.',
          'Library has 3 overdue books requiring follow-up.'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
