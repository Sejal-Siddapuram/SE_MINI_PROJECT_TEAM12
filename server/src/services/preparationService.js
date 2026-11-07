const MockTest = require('../models/MockTest');
const MockAttempt = require('../models/MockAttempt');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');

const interviewContent = Object.freeze([
  { topic: 'Projects', question: 'Describe a project you built and the problem it solves.',
    guidance: 'Explain the user need, your contribution, a design decision, and a measurable result or lesson.' },
  { topic: 'Problem solving', question: 'Tell me about a difficult bug you diagnosed.',
    guidance: 'Describe how you reproduced it, narrowed down the cause, verified the fix, and prevented a recurrence.' },
  { topic: 'Teamwork', question: 'How did you handle a disagreement within a team?',
    guidance: 'Give a specific example, how you listened and reached a decision, and what happened afterward.' },
  { topic: 'Technical fundamentals', question: 'How would you explain a database index?',
    guidance: 'Discuss faster reads, the kinds of queries it helps, and the cost to storage and writes.' },
]);

function getInterviewContent() { return interviewContent; }

async function listTests() {
  const tests = await MockTest.find().select('title questions.prompt').sort({ title: 1 }).lean();
  return tests.map((test) => ({ id: test._id.toString(), title: test.title, questionCount: test.questions.length }));
}

async function getTest(id) {
  const test = await MockTest.findById(id).select('title questions.prompt questions.options').lean();
  if (!test) throw new AppError(404, 'TEST_NOT_FOUND', 'Mock test not found.');
  return { id: test._id.toString(), title: test.title,
    questions: test.questions.map(({ prompt, options }) => ({ prompt, options })) };
}

/** One point per correct answer; null means skipped. All scoring is server-side. */
async function submitTest(studentId, id, answers, ip) {
  const test = await MockTest.findById(id).select('+questions.correctOption');
  if (!test) throw new AppError(404, 'TEST_NOT_FOUND', 'Mock test not found.');
  if (!Array.isArray(answers) || answers.length !== test.questions.length ||
      answers.some((answer, i) => answer !== null &&
        (!Number.isInteger(answer) || answer < 0 || answer >= test.questions[i].options.length))) {
    throw new AppError(400, 'INVALID_ANSWERS', 'Send one option index or null for each question.');
  }
  const score = answers.reduce((sum, answer, i) => sum + (answer === test.questions[i].correctOption ? 1 : 0), 0);
  const total = test.questions.length;
  const attempt = await MockAttempt.create({
    studentId, testId: id, answers, score, total, percentage: Math.round(score * 10000 / total) / 100,
  });
  await AuditLog.create({ userId: studentId, action: 'SUBMIT_MOCK_TEST',
    targetType: 'MockAttempt', targetId: attempt._id, details: score + '/' + total, ip });
  return attempt;
}

async function listAttempts(studentId) {
  return MockAttempt.find({ studentId }).sort({ createdAt: -1, _id: -1 }).limit(50)
    .populate('testId', 'title');
}

module.exports = { listTests, getTest, submitTest, listAttempts, getInterviewContent };
