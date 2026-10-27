/**
 * TEST YOUR ENGINEERING BRAIN - Official Question Bank
 * Curated for MGR IEI Students Chapter Technical Quiz Challenge.
 * Contains 10 multiple-choice questions covering core engineering, technology, and foundational science.
 */

const questions = [
  {
    id: 1,
    category: "Computer Science and Programming",
    difficulty: "Easy",
    question: "Which of the following is a basic programming language?",
    options: {
      A: "Python",
      B: "HTML",
      C: "CSS",
      D: "SQL"
    },
    correctOption: "A",
    explanation: "Python is a high-level, versatile programming language. HTML and CSS are markup and stylesheet languages for web design, while SQL is a domain-specific query language for relational databases."
  },
  {
    id: 2,
    category: "Physics and Engineering Mechanics",
    difficulty: "Easy",
    question: "What is the SI unit of force?",
    options: {
      A: "Joule",
      B: "Newton",
      C: "Watt",
      D: "Pascal"
    },
    correctOption: "B",
    explanation: "The SI unit of force is the Newton (N), defined as the force needed to accelerate 1 kilogram of mass at the rate of 1 meter per second squared (1 N = 1 kg·m/s²)."
  },
  {
    id: 3,
    category: "Electrical and Electronics Engineering",
    difficulty: "Easy",
    question: "Which component is used to store electrical energy?",
    options: {
      A: "Resistor",
      B: "Capacitor",
      C: "Switch",
      D: "Fuse"
    },
    correctOption: "B",
    explanation: "A capacitor stores electrical energy in an electrostatic field between two conductive plates. Resistors oppose current flow and dissipate heat, while switches control circuit continuity."
  },
  {
    id: 4,
    category: "Computer Science and Systems",
    difficulty: "Easy",
    question: "What does CPU stand for?",
    options: {
      A: "Central Processing Unit",
      B: "Computer Power Unit",
      C: "Central Program Utility",
      D: "Control Processing User"
    },
    correctOption: "A",
    explanation: "CPU stands for Central Processing Unit. It is the primary hardware component that interprets, processes, and executes instructions in modern computers."
  },
  {
    id: 5,
    category: "General Engineering and Energy",
    difficulty: "Easy",
    question: "Which of the following is a renewable energy source?",
    options: {
      A: "Coal",
      B: "Petrol",
      C: "Solar energy",
      D: "Diesel"
    },
    correctOption: "C",
    explanation: "Solar energy is a clean, infinitely replenishing renewable energy source harnessed directly from solar radiation. Coal, petrol, and diesel are finite fossil fuels."
  },
  {
    id: 6,
    category: "Engineering Mathematics",
    difficulty: "Easy",
    question: "What is the value of π (pi), approximately?",
    options: {
      A: "2.14",
      B: "3.14",
      C: "4.13",
      D: "1.34"
    },
    correctOption: "B",
    explanation: "The mathematical constant π (pi) represents the ratio of any circle's circumference to its diameter and is approximately equal to 3.14159 (or 22/7)."
  },
  {
    id: 7,
    category: "Electrical and Mechanical Engineering",
    difficulty: "Easy",
    question: "Which device converts electrical energy into mechanical energy?",
    options: {
      A: "Generator",
      B: "Electric motor",
      C: "Transformer",
      D: "Battery"
    },
    correctOption: "B",
    explanation: "An electric motor uses magnetic and electrical interactions to produce mechanical rotational force. Conversely, an electrical generator converts mechanical work into electricity."
  },
  {
    id: 8,
    category: "Information Technology and Web Development",
    difficulty: "Easy",
    question: "Which of the following is used to create web pages?",
    options: {
      A: "HTML",
      B: "Excel",
      C: "PowerPoint",
      D: "Photoshop"
    },
    correctOption: "A",
    explanation: "HTML (HyperText Markup Language) is the core foundational markup language interpreted by web browsers to build and structure web pages on the Internet."
  },
  {
    id: 9,
    category: "Engineering Chemistry and Science",
    difficulty: "Easy",
    question: "What is the chemical formula of water?",
    options: {
      A: "CO₂",
      B: "O₂",
      C: "H₂O",
      D: "NaCl"
    },
    correctOption: "C",
    explanation: "Water is composed of two hydrogen atoms bonded to a single oxygen atom, represented by the chemical formula H₂O."
  },
  {
    id: 10,
    category: "Civil Engineering",
    difficulty: "Easy",
    question: "Which engineering branch mainly deals with the design and construction of buildings and bridges?",
    options: {
      A: "Mechanical Engineering",
      B: "Civil Engineering",
      C: "Computer Science Engineering",
      D: "Electrical Engineering"
    },
    correctOption: "B",
    explanation: "Civil Engineering is the foundational discipline dedicated to the planning, structural design, construction, and maintenance of infrastructure like buildings, bridges, roads, and dams."
  }
];

/**
 * Returns questions sanitized for client delivery (without correctOption or explanation)
 */
function getSanitizedQuestions() {
  return questions.map(q => ({
    id: q.id,
    category: q.category,
    difficulty: q.difficulty,
    question: q.question,
    options: q.options
  }));
}

/**
 * Returns the full question with explanation and correct answer
 */
function getQuestionById(id) {
  return questions.find(q => q.id === id);
}

/**
 * Calculates score securely on the server
 * @param {Object} answers - Map of { questionId: selectedOptionLetter }
 * @returns {Object} Score evaluation details
 */
function evaluateQuiz(answers = {}) {
  let score = 0;
  const totalQuestions = questions.length;
  const breakdown = [];

  questions.forEach(q => {
    const selected = answers[q.id] || answers[String(q.id)] || null;
    const isCorrect = selected === q.correctOption;
    if (isCorrect) score += 1;

    breakdown.push({
      id: q.id,
      category: q.category,
      question: q.question,
      options: q.options,
      selectedOption: selected,
      correctOption: q.correctOption,
      isCorrect,
      explanation: q.explanation
    });
  });

  const percentage = Math.round((score / totalQuestions) * 100);
  const correctAnswers = score;
  const incorrectAnswers = totalQuestions - score;

  let performanceMessage = "";
  let performanceBadge = "";
  if (score >= 9) {
    performanceMessage = "Outstanding! You have an excellent engineering brain!";
    performanceBadge = "Master Engineer 🏆";
  } else if (score >= 7) {
    performanceMessage = "Great Job! Your engineering knowledge is impressive!";
    performanceBadge = "Senior Innovator ⭐";
  } else if (score >= 5) {
    performanceMessage = "Good Effort! Keep learning and improving!";
    performanceBadge = "Aspiring Engineer 💡";
  } else {
    performanceMessage = "Keep Practising! Every engineer starts with curiosity!";
    performanceBadge = "Engineering Explorer 🚀";
  }

  return {
    score,
    totalQuestions,
    percentage,
    correctAnswers,
    incorrectAnswers,
    performanceMessage,
    performanceBadge,
    breakdown
  };
}

module.exports = {
  questions,
  getSanitizedQuestions,
  getQuestionById,
  evaluateQuiz
};
