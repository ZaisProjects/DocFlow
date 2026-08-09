// MOCK AI SERVICE
// Later we can replace this with OpenAI / Gemini / Claude

export const generateSummary = async (content) => {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Very simple summary logic for learning
  const cleanContent = content.trim();

  const summary =
    cleanContent.length > 500
      ? cleanContent.slice(0, 500) + '...'
      : cleanContent;

  // Simple keyword extraction
  const words = cleanContent
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 4);

  const uniqueKeywords = [...new Set(words)].slice(0, 15);

  return {
    summary,
    keywords: uniqueKeywords,
  };
};