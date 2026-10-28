/**
 * ENGINEERING ARENA - Core Game Levels Configuration & Validation Engine
 * 
 * Defines the 4 interactive engineering game levels:
 * - Level 1: Circuit Master (Theme: Blue & Cyan)
 * - Level 2: Spin Arena (Theme: Purple & Gold)
 * - Level 3: Build Zone (Theme: Green & Teal)
 * - Level 4: Engineering Escape Room (Theme: Futuristic Laboratory)
 */

// ==========================================
// LEVEL 1: CIRCUIT MASTER (Max Score: 100)
// ==========================================
const circuitMasterData = {
  id: 'circuitMaster',
  name: 'Circuit Master',
  levelNumber: 1,
  theme: {
    primary: '#00b4d8',
    secondary: '#0077b6',
    accent: '#90e0ef',
    name: 'Blue & Cyan'
  },
  maxScore: 100,
  puzzleScore: 50,
  questionScore: 50,
  hintPenalty: 10,
  hintText: "Electric current requires an unbroken, closed loop from the positive terminal of the power source, through the switch and bulb, returning to the negative terminal.",
  question: {
    id: "cm_q1",
    question: "What is required for electric current to flow continuously?",
    options: {
      A: "A complete circuit",
      B: "A broken wire",
      C: "An open circuit",
      D: "An empty battery"
    },
    correctOption: "A",
    explanation: "Electric current can only flow through an unbroken, closed conductive pathway (a complete circuit) connecting the power source to the load."
  }
};

// ==========================================
// LEVEL 2: SPIN ARENA (Max Score: 100)
// ==========================================
const spinArenaCategories = [
  { id: 'electrical', name: 'Electrical Engineering', color: '#7209b7', isBonus: false },
  { id: 'computer', name: 'Computer Engineering', color: '#b5179e', isBonus: false },
  { id: 'mechanical', name: 'Mechanical Engineering', color: '#4361ee', isBonus: false },
  { id: 'civil', name: 'Civil Engineering', color: '#f72585', isBonus: false },
  { id: 'science', name: 'Basic Science', color: '#4cc9f0', isBonus: false },
  { id: 'teaser', name: 'Brain Teaser', color: '#9b5de5', isBonus: false },
  { id: 'bonus', name: 'Bonus Points', color: '#ffd166', isBonus: true },
  { id: 'surprise', name: 'Surprise Challenge', color: '#f15bb5', isBonus: false }
];

const spinArenaQuestionBank = {
  electrical: [
    {
      id: "sa_elec_1",
      category: "Electrical Engineering",
      question: "Which device converts electrical energy into mechanical energy?",
      options: {
        A: "Electric motor",
        B: "Generator",
        C: "Transformer",
        D: "Battery"
      },
      correctOption: "A",
      explanation: "An electric motor uses electromagnetic principles to convert electrical energy into rotational mechanical motion."
    },
    {
      id: "sa_elec_2",
      category: "Electrical Engineering",
      question: "Which passive component opposes any change in electrical current?",
      options: {
        A: "Inductor",
        B: "Resistor",
        C: "Capacitor",
        D: "Diode"
      },
      correctOption: "A",
      explanation: "An inductor opposes changes in current through the creation of a self-induced back-EMF according to Lenz's law."
    }
  ],
  computer: [
    {
      id: "sa_comp_1",
      category: "Computer Engineering",
      question: "What primary logic gate produces an output of HIGH (1) only when all its inputs are HIGH (1)?",
      options: {
        A: "AND gate",
        B: "OR gate",
        C: "XOR gate",
        D: "NOT gate"
      },
      correctOption: "A",
      explanation: "The AND gate performs logical multiplication; its output is 1 if and only if every single input is 1."
    },
    {
      id: "sa_comp_2",
      category: "Computer Engineering",
      question: "Which memory type is volatile and loses its data immediately when power is disconnected?",
      options: {
        A: "RAM (Random Access Memory)",
        B: "ROM (Read Only Memory)",
        C: "Flash SSD",
        D: "Hard Disk Drive"
      },
      correctOption: "A",
      explanation: "RAM is volatile primary memory that requires active electrical power to maintain its stored states."
    }
  ],
  mechanical: [
    {
      id: "sa_mech_1",
      category: "Mechanical Engineering",
      question: "Which thermodynamic cycle serves as the ideal benchmark model for internal combustion petrol engines?",
      options: {
        A: "Otto cycle",
        B: "Diesel cycle",
        C: "Rankine cycle",
        D: "Carnot cycle"
      },
      correctOption: "A",
      explanation: "The Otto cycle consists of constant-volume heat addition and heat rejection, modeling four-stroke spark-ignition petrol engines."
    },
    {
      id: "sa_mech_2",
      category: "Mechanical Engineering",
      question: "What mechanical device is primarily used to transmit rotational power between non-intersecting, non-parallel perpendicular shafts?",
      options: {
        A: "Worm gear",
        B: "Spur gear",
        C: "Bevel gear",
        D: "Rack and pinion"
      },
      correctOption: "A",
      explanation: "Worm gears transmit high torque reductions between perpendicular, non-intersecting shafts."
    }
  ],
  civil: [
    {
      id: "sa_civil_1",
      category: "Civil Engineering",
      question: "Which construction material is exceptionally strong under compressive forces but relatively weak under tension?",
      options: {
        A: "Plain Concrete",
        B: "Structural Steel",
        C: "Carbon Fiber",
        D: "Aluminum Alloy"
      },
      correctOption: "A",
      explanation: "Concrete has high compressive strength but only roughly 10% tensile strength, which is why steel reinforcement rebar is embedded."
    },
    {
      id: "sa_civil_2",
      category: "Civil Engineering",
      question: "What surveying instrument combines an electronic theodolite with an electronic distance meter (EDM)?",
      options: {
        A: "Total Station",
        B: "Dumpy Level",
        C: "Prismatic Compass",
        D: "Planimeter"
      },
      correctOption: "A",
      explanation: "A Total Station integrates digital angle measurement and laser EDM to compute 3D coordinate points."
    }
  ],
  science: [
    {
      id: "sa_sci_1",
      category: "Basic Science",
      question: "According to Newton's Second Law of Motion, what is the mathematical relationship between Force (F), Mass (m), and Acceleration (a)?",
      options: {
        A: "F = m · a",
        B: "F = m / a",
        C: "F = m + a",
        D: "F = a / m"
      },
      correctOption: "A",
      explanation: "Newton's second law states that acceleration is directly proportional to net force and inversely proportional to mass: F = ma."
    }
  ],
  teaser: [
    {
      id: "sa_teas_1",
      category: "Brain Teaser",
      question: "If a gear with 20 teeth turns clockwise, and is meshed directly with a second gear of 40 teeth, which way does the second gear turn and at what relative speed?",
      options: {
        A: "Counter-clockwise at half speed",
        B: "Clockwise at double speed",
        C: "Counter-clockwise at double speed",
        D: "Clockwise at half speed"
      },
      correctOption: "A",
      explanation: "Directly meshed external gears turn in opposite directions. The gear ratio 20:40 means the larger gear turns at half the speed."
    }
  ],
  surprise: [
    {
      id: "sa_surp_1",
      category: "Surprise Challenge",
      question: "Which breakthrough algorithm concept underpins modern Large Language Models and AI architectures?",
      options: {
        A: "Transformer Self-Attention",
        B: "Bubble Sort",
        C: "Linear Regression",
        D: "Dijkstra's Shortest Path"
      },
      correctOption: "A",
      explanation: "The Transformer architecture with multi-head self-attention mechanisms enables parallelized sequence processing in state-of-the-art AI models."
    }
  ]
};

// ==========================================
// LEVEL 3: BUILD ZONE (Max Score: 100)
// ==========================================
const buildZoneData = {
  id: 'buildZone',
  name: 'Build Zone',
  levelNumber: 3,
  theme: {
    primary: '#06d6a0',
    secondary: '#118ab2',
    accent: '#2ec4b6',
    name: 'Green & Teal'
  },
  maxScore: 100,
  assemblyScore: 50,
  questionScore: 50,
  hintPenalty: 10,
  hintText: "Place the Triangular Support Truss under the piers first, lock the Roadway Deck across the gap, and mount the Suspension Arch on top.",
  targetSlots: [
    { id: 'slot_truss', label: 'Foundation Truss Support', expectedPiece: 'piece_truss' },
    { id: 'slot_deck', label: 'Reinforced Roadway Deck', expectedPiece: 'piece_deck' },
    { id: 'slot_arch', label: 'Suspension Arch Beam', expectedPiece: 'piece_arch' }
  ],
  pieces: [
    { id: 'piece_truss', name: 'Triangular Support Truss', icon: '📐', hint: 'Absorbs downward loads' },
    { id: 'piece_deck', name: 'Reinforced Bridge Deck', icon: '🛣️', hint: 'Direct vehicle roadway' },
    { id: 'piece_arch', name: 'Suspension Steel Arch', icon: '🌉', hint: 'Distributes lateral tension' }
  ],
  question: {
    id: "bz_q1",
    question: "Why are support beams and trusses used in bridge structures?",
    options: {
      A: "To improve structural stability and distribute tension/compression loads",
      B: "To generate electricity from passing vehicles",
      C: "To produce acoustic sound warnings",
      D: "To measure ambient atmospheric temperature"
    },
    correctOption: "A",
    explanation: "Support beams and trusses organize members into rigid geometric patterns (triangles) that efficiently channel compression and tension forces to the foundation piers."
  }
};

// ==========================================
// LEVEL 4: ENGINEERING ESCAPE ROOM (Max Score: 100)
// ==========================================
const escapeRoomData = {
  id: 'escapeRoom',
  name: 'Engineering Escape Room',
  levelNumber: 4,
  theme: {
    primary: '#00f0ff',
    secondary: '#ff0055',
    accent: '#7b2cbf',
    name: 'Futuristic Engineering Laboratory'
  },
  maxScore: 100,
  challenge1Score: 35,
  challenge2Score: 35,
  challenge3Score: 30,
  hintPenalty: 10,
  introMessage: "Welcome, Engineer! Your mission is to solve three challenges and unlock the engineering laboratory.",
  challenge1: {
    id: "er_c1",
    title: "Challenge 1: Logic Lock",
    question: "Find the missing number in the geometric progression: 2 → 4 → 8 → 16 → ?",
    options: {
      A: "18",
      B: "24",
      C: "32",
      D: "36"
    },
    correctOption: "C",
    explanation: "Each term is multiplied by 2 (2^1=2, 2^2=4, 2^3=8, 2^4=16, 2^5=32)."
  },
  challenge2: {
    id: "er_c2",
    title: "Challenge 2: Hardware Component Identification",
    question: "Which component converts electrical energy into mechanical energy?",
    components: [
      { id: "motor", name: "Electric Motor", icon: "⚙️" },
      { id: "battery", name: "Battery", icon: "🔋" },
      { id: "bulb", name: "Light Bulb", icon: "💡" },
      { id: "resistor", name: "Resistor", icon: "⚡" }
    ],
    options: {
      A: "Electric motor",
      B: "Battery",
      C: "Light bulb",
      D: "Resistor"
    },
    correctOption: "A",
    explanation: "An electric motor uses magnetic fields and conductors to convert incoming electric current into rotational mechanical torque."
  },
  challenge3: {
    id: "er_c3",
    title: "Challenge 3: Digital Blast Door Override Code",
    puzzleText: "Decipher the 2-digit digital key: Convert 4-bit binary code 1010 into its standard decimal override key.",
    hint: "Binary place values: (1×8) + (0×4) + (1×2) + (0×1) = 8 + 2 = ?",
    correctCode: "10",
    options: {
      A: "8",
      B: "10",
      C: "12",
      D: "14"
    },
    correctOption: "B",
    explanation: "Binary 1010 corresponds to (1×2³) + (0×2²) + (1×2¹) + (0×2⁰) = 8 + 0 + 2 + 0 = 10."
  }
};

// ==========================================
// SANITIZED DATA (Client Safe)
// ==========================================
function getSanitizedArenaConfig() {
  const cMaster = {
    id: circuitMasterData.id,
    name: circuitMasterData.name,
    levelNumber: circuitMasterData.levelNumber,
    theme: circuitMasterData.theme,
    maxScore: circuitMasterData.maxScore,
    hintText: circuitMasterData.hintText,
    question: {
      id: circuitMasterData.question.id,
      question: circuitMasterData.question.question,
      options: circuitMasterData.question.options
    }
  };

  const sArena = {
    id: 'spinArena',
    name: 'Spin Arena',
    levelNumber: 2,
    theme: { primary: '#7209b7', secondary: '#ffd166', name: 'Purple & Gold' },
    maxScore: 100,
    categories: spinArenaCategories,
    questionsByCategory: Object.keys(spinArenaQuestionBank).reduce((acc, cat) => {
      acc[cat] = spinArenaQuestionBank[cat].map(q => ({
        id: q.id,
        category: q.category,
        question: q.question,
        options: q.options
      }));
      return acc;
    }, {})
  };

  const bZone = {
    id: buildZoneData.id,
    name: buildZoneData.name,
    levelNumber: buildZoneData.levelNumber,
    theme: buildZoneData.theme,
    maxScore: buildZoneData.maxScore,
    hintText: buildZoneData.hintText,
    targetSlots: buildZoneData.targetSlots,
    pieces: buildZoneData.pieces,
    question: {
      id: buildZoneData.question.id,
      question: buildZoneData.question.question,
      options: buildZoneData.question.options
    }
  };

  const eRoom = {
    id: escapeRoomData.id,
    name: escapeRoomData.name,
    levelNumber: escapeRoomData.levelNumber,
    theme: escapeRoomData.theme,
    maxScore: escapeRoomData.maxScore,
    introMessage: escapeRoomData.introMessage,
    challenge1: {
      id: escapeRoomData.challenge1.id,
      title: escapeRoomData.challenge1.title,
      question: escapeRoomData.challenge1.question,
      options: escapeRoomData.challenge1.options
    },
    challenge2: {
      id: escapeRoomData.challenge2.id,
      title: escapeRoomData.challenge2.title,
      question: escapeRoomData.challenge2.question,
      components: escapeRoomData.challenge2.components,
      options: escapeRoomData.challenge2.options
    },
    challenge3: {
      id: escapeRoomData.challenge3.id,
      title: escapeRoomData.challenge3.title,
      puzzleText: escapeRoomData.challenge3.puzzleText,
      options: escapeRoomData.challenge3.options,
      hint: escapeRoomData.challenge3.hint
    }
  };

  return {
    circuitMaster: cMaster,
    spinArena: sArena,
    buildZone: bZone,
    escapeRoom: eRoom,
    // Aliases for level index access
    level1: cMaster,
    level2: sArena,
    level3: bZone,
    level4: eRoom
  };
}

// ==========================================
// SERVER-SIDE VALIDATION & SCORING
// ==========================================
function validateLevel1(data = {}) {
  let score = 0;
  const isCircuitOk = Boolean(data.circuitCompleted || data.wireConnected);
  if (!isCircuitOk) {
    return {
      levelKey: 'circuitMaster',
      score: 0,
      maxScore: 100,
      completed: false,
      correct: false,
      isCircuitOk: false,
      isQuestionOk: false,
      message: 'Incomplete circuit. Connect the conductive wire first.'
    };
  }

  score += circuitMasterData.puzzleScore;

  const isQuestionOk = (data.selectedOption || "").toUpperCase() === circuitMasterData.question.correctOption;
  if (isQuestionOk) score += circuitMasterData.questionScore;

  if (data.usedHint && score > 20) {
    score = Math.max(0, score - circuitMasterData.hintPenalty);
  }

  score = Math.min(100, Math.max(0, score));
  const completed = isCircuitOk && isQuestionOk;

  return {
    levelKey: 'circuitMaster',
    score,
    maxScore: 100,
    completed,
    correct: completed,
    isCircuitOk,
    isQuestionOk,
    correctOption: circuitMasterData.question.correctOption,
    explanation: circuitMasterData.question.explanation,
    message: completed ? 'Circuit Master Unlocked!' : (score > 0 ? 'Circuit assembled. Review theory question.' : 'Incomplete circuit.')
  };
}

function validateLevel2(data = {}) {
  let score = 0;
  const isBonus = Boolean(data.isBonus || data.category === 'Bonus Points');
  let correctOption = null;
  let explanation = null;
  let isQuestionOk = false;

  if (isBonus) {
    score = 100;
    isQuestionOk = true;
    explanation = "Wheel stopped on Bonus Points segment! Awarded maximum 100 bonus points.";
  } else {
    const questionId = data.questionId;
    let targetQuestion = null;

    if (questionId) {
      // Search across question bank
      for (const cat of Object.keys(spinArenaQuestionBank)) {
        const match = spinArenaQuestionBank[cat].find(q => q.id === questionId);
        if (match) {
          targetQuestion = match;
          break;
        }
      }
    } else if (data.category) {
      // Match by category
      const catKey = String(data.category).toLowerCase().includes('electric') ? 'electrical'
        : String(data.category).toLowerCase().includes('comp') ? 'computer'
        : String(data.category).toLowerCase().includes('mech') ? 'mechanical'
        : String(data.category).toLowerCase().includes('civil') ? 'civil'
        : 'electrical';

      if (spinArenaQuestionBank[catKey]) {
        targetQuestion = spinArenaQuestionBank[catKey][0];
      }
    } else {
      targetQuestion = spinArenaQuestionBank.electrical[0];
    }

    if (targetQuestion) {
      correctOption = targetQuestion.correctOption;
      explanation = targetQuestion.explanation;
      isQuestionOk = (data.selectedOption || "").toUpperCase() === correctOption;
      if (isQuestionOk) {
        score = 100;
      }
    }
  }

  score = Math.min(100, Math.max(0, score));
  const completed = isBonus || isQuestionOk;

  return {
    levelKey: 'spinArena',
    score,
    maxScore: 100,
    completed,
    correct: completed,
    isBonus,
    isQuestionOk,
    correctOption,
    explanation,
    message: 'Spin Arena Completed!'
  };
}

function validateLevel3(data = {}) {
  let score = 0;
  const isBridgeOk = Boolean(data.bridgeCompleted || (data.placedComponents && data.placedComponents.foundation && data.placedComponents.deck && data.placedComponents.arch));
  if (!isBridgeOk) {
    return {
      levelKey: 'buildZone',
      score: 0,
      maxScore: 100,
      completed: false,
      correct: false,
      isBridgeOk: false,
      isQuestionOk: false,
      message: 'Incomplete structure. Assemble all bridge components first.'
    };
  }

  score += buildZoneData.assemblyScore;

  const isQuestionOk = (data.selectedOption || "").toUpperCase() === buildZoneData.question.correctOption;
  if (isQuestionOk) score += buildZoneData.questionScore;

  if (data.usedHint && score > 20) {
    score = Math.max(0, score - buildZoneData.hintPenalty);
  }

  score = Math.min(100, Math.max(0, score));
  const completed = isBridgeOk && isQuestionOk;

  return {
    levelKey: 'buildZone',
    score,
    maxScore: 100,
    completed,
    correct: completed,
    isBridgeOk,
    isQuestionOk,
    correctOption: buildZoneData.question.correctOption,
    explanation: buildZoneData.question.explanation,
    message: completed ? 'Junior Engineer Unlocked!' : (score > 0 ? 'Structure assembled. Review structural question.' : 'Incomplete structure.')
  };
}

function validateLevel4(data = {}) {
  let score = 0;
  const c1Ok = (data.c1Option || data.challenge1Answer || "").toUpperCase() === escapeRoomData.challenge1.correctOption;
  const c2Ok = (data.c2Component === 'motor' || (data.challenge2Answer || "").toUpperCase() === escapeRoomData.challenge2.correctOption);
  const c3Ok = String(data.c3Pin || data.unlockCode || "").trim() === escapeRoomData.challenge3.correctCode ||
               (data.challenge3Answer || "").toUpperCase() === escapeRoomData.challenge3.correctOption;

  if (c1Ok) score += escapeRoomData.challenge1Score;
  if (c2Ok) score += escapeRoomData.challenge2Score;
  if (c3Ok) score += escapeRoomData.challenge3Score;

  if (data.usedHint && score > 20) {
    score = Math.max(0, score - escapeRoomData.hintPenalty);
  }

  score = Math.min(100, Math.max(0, score));
  const allCompleted = c1Ok && c2Ok && c3Ok;

  return {
    levelKey: 'escapeRoom',
    score,
    maxScore: 100,
    completed: allCompleted,
    correct: allCompleted,
    c1Ok,
    c2Ok,
    c3Ok,
    badge: allCompleted ? "ENGINEERING ESCAPE MASTER" : null,
    badgeAwarded: allCompleted ? "ENGINEERING ESCAPE MASTER" : null,
    message: allCompleted ? "Engineering Escape Master Unlocked!" : "Laboratory door locked.",
    explanation: "All three laboratory puzzles solved! Binary 1010 translated to decimal override code 10."
  };
}

function evaluateLevel(levelKey, data) {
  switch (levelKey) {
    case 'circuitMaster':
      return validateLevel1(data);
    case 'spinArena':
      return validateLevel2(data);
    case 'buildZone':
      return validateLevel3(data);
    case 'escapeRoom':
      return validateLevel4(data);
    default:
      throw new Error(`Unknown level: ${levelKey}`);
  }
}

function calculateArenaTotal(levels = {}) {
  const l1 = levels.circuitMaster?.score || 0;
  const l2 = levels.spinArena?.score || 0;
  const l3 = levels.buildZone?.score || 0;
  const l4 = levels.escapeRoom?.score || 0;

  const totalScore = Math.min(400, l1 + l2 + l3 + l4);
  const percentage = Math.round((totalScore / 400) * 100);

  const completedCount = [
    Boolean(levels.circuitMaster?.completed),
    Boolean(levels.spinArena?.completed),
    Boolean(levels.buildZone?.completed),
    Boolean(levels.escapeRoom?.completed)
  ].filter(Boolean).length;

  const isChampion = completedCount === 4;

  let performanceMessage = "Keep Practising! Every engineer starts with curiosity and hands-on experiments!";
  if (totalScore >= 360) {
    performanceMessage = "Outstanding! You are an Engineering Arena Champion with elite technical mastery!";
  } else if (totalScore >= 280) {
    performanceMessage = "Great Job! Your cross-disciplinary engineering knowledge is truly impressive!";
  } else if (totalScore >= 200) {
    performanceMessage = "Good Effort! Solid engineering intuition across electrical, civil & computing!";
  }

  return {
    score: totalScore,
    totalScore,
    scoreMax: 400,
    maxScore: 400,
    percentage,
    completedCount,
    completedGamesCount: completedCount,
    isChampion,
    performanceBadge: isChampion ? "ENGINEERING ARENA CHAMPION 🏆" : (totalScore >= 360 ? "Master Engineer 🏆" : "Junior Engineer 💡"),
    performanceMessage
  };
}

module.exports = {
  circuitMasterData,
  spinArenaCategories,
  spinArenaQuestionBank,
  buildZoneData,
  escapeRoomData,
  getSanitizedArenaConfig,
  evaluateLevel,
  validateLevel1,
  validateLevel2,
  validateLevel3,
  validateLevel4,
  calculateArenaTotal
};
