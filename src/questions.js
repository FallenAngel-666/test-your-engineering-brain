/**
 * TEST YOUR ENGINEERING BRAIN - Official Question Bank
 * Curated for undergraduate engineering students across diverse disciplines.
 * Contains 10 challenging, balanced questions covering core engineering disciplines.
 */

const questions = [
  {
    id: 1,
    category: "Computer Science and Programming",
    difficulty: "Medium",
    question: "What is the worst-case time complexity of finding an element in a balanced Binary Search Tree (such as an AVL or Red-Black Tree) with N nodes?",
    options: {
      A: "O(1)",
      B: "O(log N)",
      C: "O(N)",
      D: "O(N log N)"
    },
    correctOption: "B",
    explanation: "In a self-balancing binary search tree (like AVL or Red-Black trees), the height of the tree is strictly maintained at O(log N). Therefore, search, insertion, and deletion operations all take O(log N) time in both average and worst cases."
  },
  {
    id: 2,
    category: "Electrical and Electronics Engineering",
    difficulty: "Medium",
    question: "According to the Maximum Power Transfer Theorem, maximum power is delivered from a source with internal resistance Rs to a load resistance RL when:",
    options: {
      A: "RL = 0 (Short circuit)",
      B: "RL = ∞ (Open circuit)",
      C: "RL = Rs",
      D: "RL = 0.5 × Rs"
    },
    correctOption: "C",
    explanation: "The Maximum Power Transfer Theorem states that maximum DC power is transferred from a source network to a resistive load when the load resistance equals the Thévenin equivalent resistance of the source (RL = Rs). For AC circuits with impedances, ZL must equal the complex conjugate of Zs."
  },
  {
    id: 3,
    category: "Mechanical Engineering",
    difficulty: "Medium",
    question: "A Carnot heat engine operates between a heat source at 600 K and a heat sink at 300 K. What is the maximum theoretical thermal efficiency of this engine?",
    options: {
      A: "25%",
      B: "50%",
      C: "75%",
      D: "100%"
    },
    correctOption: "B",
    explanation: "Carnot efficiency is defined as η = 1 - (T_cold / T_hot). Substituting the absolute temperatures: η = 1 - (300 K / 600 K) = 1 - 0.5 = 0.5, or 50%."
  },
  {
    id: 4,
    category: "Civil Engineering",
    difficulty: "Easy",
    question: "For a simply supported beam of length L carrying a uniformly distributed load (UDL) of intensity 'w' per unit length across its entire span, what is the maximum bending moment occurring at the midspan?",
    options: {
      A: "wL / 2",
      B: "wL² / 4",
      C: "wL² / 8",
      D: "wL² / 12"
    },
    correctOption: "C",
    explanation: "For a simply supported beam carrying a UDL of w over length L, the support reactions are wL/2. The bending moment at midspan (x = L/2) is M = (wL/2)(L/2) - w(L/2)(L/4) = wL²/4 - wL²/8 = wL²/8."
  },
  {
    id: 5,
    category: "Engineering Mathematics and Physics",
    difficulty: "Challenging",
    question: "For any square matrix A, what is the relationship between the sum of its eigenvalues and the elements of the matrix?",
    options: {
      A: "Sum of eigenvalues equals the determinant of A",
      B: "Sum of eigenvalues equals the trace of A (sum of main diagonal elements)",
      C: "Sum of eigenvalues equals the rank of A",
      D: "Sum of eigenvalues is always equal to 1"
    },
    correctOption: "B",
    explanation: "A fundamental linear algebra theorem states that the sum of the eigenvalues of a matrix is equal to the trace of the matrix (the sum of the elements on its main diagonal), while the product of the eigenvalues is equal to its determinant."
  },
  {
    id: 6,
    category: "Artificial Intelligence and Emerging Technologies",
    difficulty: "Medium",
    question: "In deep artificial neural networks, which activation function was introduced primarily to mitigate the vanishing gradient problem during backpropagation?",
    options: {
      A: "Sigmoid (Logistic)",
      B: "Hyperbolic Tangent (tanh)",
      C: "Rectified Linear Unit (ReLU)",
      D: "Binary Step Function"
    },
    correctOption: "C",
    explanation: "The Rectified Linear Unit (ReLU), defined as f(x) = max(0, x), has a constant derivative of 1 for all positive inputs. Unlike sigmoid and tanh, whose derivatives saturate towards zero for large inputs, ReLU prevents the vanishing gradient problem and accelerates gradient descent convergence."
  },
  {
    id: 7,
    category: "General Engineering Knowledge",
    difficulty: "Easy",
    question: "In fluid mechanics, what dimensionless quantity is used to predict whether fluid flow in a pipe will be laminar or turbulent?",
    options: {
      A: "Mach Number",
      B: "Reynolds Number",
      C: "Froude Number",
      D: "Nusselt Number"
    },
    correctOption: "B",
    explanation: "The Reynolds number (Re = ρvD/μ) represents the ratio of inertial forces to viscous forces in a fluid. In circular pipe flow, flow is generally laminar for Re < 2000, transitional between 2000 and 4000, and turbulent for Re > 4000."
  },
  {
    id: 8,
    category: "Computer Networks and Systems",
    difficulty: "Medium",
    question: "At which layer of the standard ISO-OSI 7-layer reference model do routers primarily operate to direct packets between different networks?",
    options: {
      A: "Data Link Layer (Layer 2)",
      B: "Network Layer (Layer 3)",
      C: "Transport Layer (Layer 4)",
      D: "Session Layer (Layer 5)"
    },
    correctOption: "B",
    explanation: "Routers operate at the Network Layer (Layer 3) of the OSI model. They inspect IP addresses in packet headers and use routing tables and protocols (such as OSPF and BGP) to forward data across interconnected networks."
  },
  {
    id: 9,
    category: "Electronics and Microcontrollers",
    difficulty: "Medium",
    question: "In digital electronics, what is the minimum clock frequency required to reliably sample an analog band-limited signal containing frequencies up to 20 kHz without aliasing?",
    options: {
      A: "10 kHz",
      B: "20 kHz",
      C: "40 kHz",
      D: "80 kHz"
    },
    correctOption: "C",
    explanation: "According to the Nyquist-Shannon Sampling Theorem, to accurately reconstruct a continuous signal without aliasing, the sampling frequency fs must be at least twice the maximum frequency component present in the signal (fs ≥ 2 × f_max). For 20 kHz, fs ≥ 40 kHz."
  },
  {
    id: 10,
    category: "Materials Science and Mechanics",
    difficulty: "Challenging",
    question: "On an engineering tensile stress-strain curve for a ductile material like mild steel, what is the point beyond which permanent (plastic) deformation occurs?",
    options: {
      A: "Proportional Limit",
      B: "Yield Point (Elastic Limit)",
      C: "Ultimate Tensile Strength (UTS)",
      D: "Fracture Point"
    },
    correctOption: "B",
    explanation: "Up to the elastic limit (closely corresponding to the yield point), deformation is fully recoverable upon unloading. Once stress exceeds the yield strength, dislocations move permanently through the crystal lattice, causing irreversible plastic deformation."
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
