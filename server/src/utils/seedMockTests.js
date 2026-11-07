const MockTest = require('../models/MockTest');
module.exports = async function seedMockTests() {
  await MockTest.updateOne({ seedKey: 'aptitude-basics-v1' }, { $setOnInsert: {
    title: 'Aptitude Basics',
    questions: [
      { prompt: 'What is 20% of 250?', options: ['25', '50', '75', '100'], correctOption: 1 },
      { prompt: 'Complete the sequence: 2, 4, 8, 16, ...', options: ['18', '24', '32', '64'], correctOption: 2 },
      { prompt: 'A train travels 120 km in 2 hours. What is its average speed?',
        options: ['40 km/h', '60 km/h', '80 km/h', '120 km/h'], correctOption: 1 },
      { prompt: 'What is the mean of 3, 5 and 7?', options: ['3', '4', '5', '6'], correctOption: 2 },
      { prompt: 'If x + 7 = 12, what is x?', options: ['3', '5', '7', '19'], correctOption: 1 },
      { prompt: 'What is 15 multiplied by 4?', options: ['45', '50', '60', '75'], correctOption: 2 },
      { prompt: 'Which number is prime?', options: ['9', '11', '15', '21'], correctOption: 1 },
      { prompt: 'What is the next number: 3, 6, 9, 12, ...?', options: ['13', '14', '15', '18'], correctOption: 2 },
      { prompt: 'A ₹800 item has a 25% discount. What is the sale price?', options: ['₹200', '₹500', '₹600', '₹700'], correctOption: 2 },
      { prompt: 'What is half of three quarters?', options: ['1/4', '3/8', '1/2', '3/4'], correctOption: 1 },
    ],
  } }, { upsert: true, runValidators: true });
};
