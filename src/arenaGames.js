/**
 * ENGINEERING ARENA - Core Game Levels, 40-Question Bank & Randomization Engine
 * 
 * 4 Mandatory Levels with Independent 10-Question Banks:
 * - Level 1: Circuit Master (Electrical & Circuits) - 10 Questions
 * - Level 2: Spin Arena (Multi-Disciplinary Engineering) - 10 Questions
 * - Level 3: Build Zone (Structural Stability & Civil) - 10 Questions
 * - Level 4: Engineering Escape Room (Logic, Hardware & Computing) - 10 Questions
 * 
 * Configurable question presentation: QUESTIONS_PER_LEVEL (default 5).
 */

const QUESTIONS_PER_LEVEL = 5; // Configurable: number of questions presented to each student per level

const LEVEL_ORDER = ['circuitMaster', 'spinArena', 'buildZone', 'escapeRoom'];

const LEVEL_METADATA = {
  circuitMaster: {
    id: 'circuitMaster',
    name: 'Circuit Master',
    levelNumber: 1,
    theme: 'Blue & Cyan',
    badge: 'CIRCUIT MASTER',
    icon: '⚡',
    nextLevel: 'spinArena',
    interactiveTitle: 'Assemble the Electrical Circuit',
    interactiveDesc: 'Connect the missing conductor wire across the open terminal gap to complete the circuit and power the filament bulb.'
  },
  spinArena: {
    id: 'spinArena',
    name: 'Spin Arena',
    levelNumber: 2,
    theme: 'Purple & Gold',
    badge: 'SPIN ARENA MASTER',
    icon: '🎡',
    nextLevel: 'buildZone',
    interactiveTitle: 'Engineering Wheel of Fortune',
    interactiveDesc: 'Click "SPIN THE WHEEL" to spin the category wheel and face high-impact engineering discipline questions.'
  },
  buildZone: {
    id: 'buildZone',
    name: 'Build Zone',
    levelNumber: 3,
    theme: 'Green & Teal',
    badge: 'JUNIOR ENGINEER',
    icon: '🌉',
    nextLevel: 'escapeRoom',
    interactiveTitle: 'Bridge Engineering Challenge',
    interactiveDesc: 'Assemble the structural bridge across the chasm by placing the foundation piers, roadway deck, and suspension arch into their correct slots.'
  },
  escapeRoom: {
    id: 'escapeRoom',
    name: 'Engineering Escape Room',
    levelNumber: 4,
    theme: 'Futuristic Neon',
    badge: 'ENGINEERING ESCAPE MASTER',
    icon: '🔐',
    nextLevel: null,
    interactiveTitle: 'Futuristic Research Lab Override',
    interactiveDesc: 'Solve the laboratory sequence, hardware identification, and binary-to-decimal keypad PIN override to unlock the facility.'
  }
};

// ========================================================
// 10-QUESTION BANKS PER LEVEL (40 UNIQUE QUESTIONS TOTAL)
// ========================================================

const QUESTION_BANKS = {
  // ------------------------------------------------------
  // LEVEL 1: CIRCUIT MASTER (10 Electrical & Circuit Questions)
  // ------------------------------------------------------
  circuitMaster: [
    {
      id: "cm_q1",
      question: "What is required for electric current to flow continuously?",
      options: {
        A: "A complete closed circuit",
        B: "A broken wire",
        C: "An open knife switch",
        D: "An empty battery"
      },
      correctOption: "A",
      explanation: "Electric current can only flow through an unbroken, closed conductive pathway connecting the power source to the load."
    },
    {
      id: "cm_q2",
      question: "Which fundamental law states that current through a conductor is directly proportional to voltage across it (V = I × R)?",
      options: {
        A: "Ohm's Law",
        B: "Faraday's Law of Induction",
        C: "Newton's Second Law",
        D: "Coulomb's Law"
      },
      correctOption: "A",
      explanation: "Ohm's Law establishes that current (I) is directly proportional to voltage (V) and inversely proportional to resistance (R)."
    },
    {
      id: "cm_q3",
      question: "Which electronic component is primarily used to oppose or limit the flow of electrical current in a circuit?",
      options: {
        A: "Resistor",
        B: "Capacitor",
        C: "Inductor",
        D: "Diode"
      },
      correctOption: "A",
      explanation: "A resistor introduces precise electrical resistance to drop voltage and limit current to safe operating levels."
    },
    {
      id: "cm_q4",
      question: "In a series circuit with three identical light bulbs, what happens if one bulb is removed or burns out?",
      options: {
        A: "All bulbs turn off because the single current path is interrupted",
        B: "The remaining two bulbs burn twice as bright",
        C: "The voltage across the other bulbs increases",
        D: "Only the damaged bulb turns off"
      },
      correctOption: "A",
      explanation: "In a series circuit, current must travel through each component sequentially. Breaking any component opens the entire circuit."
    },
    {
      id: "cm_q5",
      question: "What is the standard International System (SI) unit of electrical potential difference (voltage)?",
      options: {
        A: "Volt (V)",
        B: "Ampere (A)",
        C: "Ohm (Ω)",
        D: "Watt (W)"
      },
      correctOption: "A",
      explanation: "The Volt (V) is the SI unit of electrical potential difference and electromotive force."
    },
    {
      id: "cm_q6",
      question: "Which protective device automatically interrupts current flow when an unsafe overcurrent or short circuit is detected?",
      options: {
        A: "Circuit breaker or fuse",
        B: "Step-up transformer",
        C: "Electrolytic capacitor",
        D: "Potentiometer"
      },
      correctOption: "A",
      explanation: "Circuit breakers and fuses protect circuits by interrupting excessive current before wiring overheats and causes a fire."
    },
    {
      id: "cm_q7",
      question: "In a parallel electrical circuit, what electrical parameter remains identical across all connected parallel branches?",
      options: {
        A: "Voltage",
        B: "Current",
        C: "Resistance",
        D: "Power dissipation"
      },
      correctOption: "A",
      explanation: "Every parallel branch connects across the same two common nodes, guaranteeing identical voltage across each branch."
    },
    {
      id: "cm_q8",
      question: "Why is copper widely utilized as the primary electrical conductor in household and industrial wiring?",
      options: {
        A: "It has very low electrical resistivity, high conductivity, and excellent ductility",
        B: "It is an electrical insulator that blocks leakage",
        C: "It generates magnetic fields without needing current",
        D: "It has zero weight and does not corrode in air"
      },
      correctOption: "A",
      explanation: "Copper has exceptionally high electrical conductivity (second only to silver) and high ductility for easy drawing into wires."
    },
    {
      id: "cm_q9",
      question: "How must an ammeter be connected to measure the electric current flowing through a specific circuit component?",
      options: {
        A: "In series with the component",
        B: "In parallel across the component",
        C: "Directly across the battery terminals",
        D: "Connected only to the circuit ground"
      },
      correctOption: "A",
      explanation: "An ammeter has very low internal resistance and must be wired in series so the entire branch current flows directly through it."
    },
    {
      id: "cm_q10",
      question: "What critical safety practice must always be observed before touching or servicing an electrical circuit?",
      options: {
        A: "De-energize, isolate, and verify that the power supply is disconnected",
        B: "Increase the supply voltage to blow out dust",
        C: "Touch both terminal wires simultaneously with wet hands",
        D: "Bypass all safety fuses with a copper bolt"
      },
      correctOption: "A",
      explanation: "De-energizing, locking out/tagging out, and testing for zero voltage prevents accidental electrical shock and flashover."
    }
  ],

  // ------------------------------------------------------
  // LEVEL 2: SPIN ARENA (10 Multi-Disciplinary Engineering Questions)
  // ------------------------------------------------------
  spinArena: [
    {
      id: "sa_q1",
      category: "Mechanical Engineering",
      question: "Which machine converts fluid pressure or thermal energy into rotational mechanical shaft power?",
      options: {
        A: "Turbine",
        B: "Condenser",
        C: "Heat sink",
        D: "Manometer"
      },
      correctOption: "A",
      explanation: "Turbines (steam, gas, hydro, or wind) extract kinetic/thermal energy from fluids and convert it into rotational mechanical energy."
    },
    {
      id: "sa_q2",
      category: "Computer Engineering",
      question: "What fundamental logic gate produces an output of HIGH (1) only when its two input bits are unequal?",
      options: {
        A: "XOR (Exclusive-OR) gate",
        B: "AND gate",
        C: "NOR gate",
        D: "XNOR gate"
      },
      correctOption: "A",
      explanation: "An XOR gate yields 1 if exactly one input is 1 (inputs differ). When both inputs are identical, the output is 0."
    },
    {
      id: "sa_q3",
      category: "Electrical Engineering",
      question: "Which electrical machine converts electrical energy into rotational mechanical energy via magnetic fields?",
      options: {
        A: "Electric motor",
        B: "Electric generator",
        C: "Inverter",
        D: "Alternator"
      },
      correctOption: "A",
      explanation: "An electric motor uses Lorentz forces generated by currents within magnetic fields to produce continuous rotational torque."
    },
    {
      id: "sa_q4",
      category: "Civil Engineering",
      question: "What type of internal stress occurs when two opposing forces act in parallel planes across a structural section?",
      options: {
        A: "Shear stress",
        B: "Tensile stress",
        C: "Compressive stress",
        D: "Hydrostatic stress"
      },
      correctOption: "A",
      explanation: "Shear stress acts parallel or tangential to the face of a material cross-section, tending to slide adjacent layers past one another."
    },
    {
      id: "sa_q5",
      category: "Basic Science",
      question: "What is the SI unit of force, defined as the force required to accelerate a 1-kilogram mass at 1 m/s²?",
      options: {
        A: "Newton (N)",
        B: "Joule (J)",
        C: "Pascal (Pa)",
        D: "Watt (W)"
      },
      correctOption: "A",
      explanation: "The Newton (N) is defined as 1 kg·m/s², derived directly from Newton's second law of motion (F = ma)."
    },
    {
      id: "sa_q6",
      category: "Computer Engineering",
      question: "In computer memory hierarchy, which memory type provides the fastest access speeds to the CPU execution core?",
      options: {
        A: "CPU Cache (L1/L2 registers)",
        B: "Dynamic RAM (DDR4/DDR5)",
        C: "NVMe Solid State Drive (SSD)",
        D: "Hard Disk Drive (HDD)"
      },
      correctOption: "A",
      explanation: "On-chip CPU registers and Level 1 (L1) static RAM cache offer sub-nanosecond latency, vastly outperforming external DRAM."
    },
    {
      id: "sa_q7",
      category: "Mechanical Engineering",
      question: "What thermodynamic cycle defines the theoretical maximum thermal efficiency limit for any heat engine operating between two temperatures?",
      options: {
        A: "Carnot cycle",
        B: "Rankine cycle",
        C: "Otto cycle",
        D: "Brayton cycle"
      },
      correctOption: "A",
      explanation: "The Carnot cycle consists of two isothermal and two isentropic reversible processes and sets the theoretical upper efficiency limit."
    },
    {
      id: "sa_q8",
      category: "Civil Engineering",
      question: "Which optical and electronic instrument is standardly used by civil surveyors to measure both horizontal and vertical angles?",
      options: {
        A: "Theodolite / Total Station",
        B: "Hydrometer",
        C: "Barometer",
        D: "Seismograph"
      },
      correctOption: "A",
      explanation: "A Total Station integrates an electronic theodolite with an electronic distance meter (EDM) to measure angles and distances simultaneously."
    },
    {
      id: "sa_q9",
      category: "Logical Reasoning",
      question: "If four spur gears are meshed in a straight line (Gear 1 meshes with 2, 2 with 3, 3 with 4) and Gear 1 rotates clockwise, in which direction does Gear 4 rotate?",
      options: {
        A: "Counter-clockwise",
        B: "Clockwise",
        C: "It remains stationary",
        D: "It alternates direction"
      },
      correctOption: "A",
      explanation: "Adjacent meshed gears reverse direction: Gear 1 (CW) → Gear 2 (CCW) → Gear 3 (CW) → Gear 4 (CCW)."
    },
    {
      id: "sa_q10",
      category: "Basic Science",
      question: "What property describes a solid metal's ability to undergo significant plastic deformation under tensile stress before fracturing (e.g. drawn into thin wires)?",
      options: {
        A: "Ductility",
        B: "Brittleness",
        C: "Hardness",
        D: "Viscosity"
      },
      correctOption: "A",
      explanation: "Ductility is the physical property of a material associated with the ability to be hammered thin or stretched into wire without breaking."
    }
  ],

  // ------------------------------------------------------
  // LEVEL 3: BUILD ZONE (10 Structural Stability & Civil Questions)
  // ------------------------------------------------------
  buildZone: [
    {
      id: "bz_q1",
      question: "Why are triangular geometric configurations universally utilized in engineering bridge trusses?",
      options: {
        A: "A triangle is inherently rigid and cannot deform without altering the physical length of its members",
        B: "Triangles reduce wind sound resonance",
        C: "Triangles conduct electrical charges away from the roadway",
        D: "Triangles absorb less solar heat"
      },
      correctOption: "A",
      explanation: "Triangles are structurally stable polygons; unlike quadrilaterals, a triangle's angles cannot shift without physically changing the length of its sides."
    },
    {
      id: "bz_q2",
      question: "In a simply supported horizontal bridge beam with a downward traffic load applied at mid-span, what stresses develop?",
      options: {
        A: "Compressive stress on top fibers and tensile stress on bottom fibers",
        B: "Tensile stress on top fibers and compressive stress on bottom fibers",
        C: "Pure shear stress uniformly throughout all fibers",
        D: "Zero stress because the beam is stationary"
      },
      correctOption: "A",
      explanation: "Under sagging bending moments, top fibers are squeezed (compression) while bottom fibers are stretched (tension)."
    },
    {
      id: "bz_q3",
      question: "What deep structural foundation component transfers heavy superstructure loads through weak upper soil layers down to strong bearing bedrock?",
      options: {
        A: "Driven piles or drilled caissons",
        B: "Shallow trench footings",
        C: "Concrete curb stones",
        D: "Bituminous road surfacing"
      },
      correctOption: "A",
      explanation: "Deep piles or caissons transfer heavy column loads down through low-strength superficial soils into firm strata or bedrock below."
    },
    {
      id: "bz_q4",
      question: "What physical property makes structural steel and concrete ideal companion materials in Reinforced Cement Concrete (RCC)?",
      options: {
        A: "Nearly identical coefficients of thermal expansion and complementary tensile and compressive strengths",
        B: "Identical electrical resistances",
        C: "Magnetic adhesion between cement and iron",
        D: "Both dissolve identically in water"
      },
      correctOption: "A",
      explanation: "Steel resists high tensile forces while concrete handles compression. Their near-identical thermal expansion coefficients prevent cracking as temperatures fluctuate."
    },
    {
      id: "bz_q5",
      question: "Which type of bridge suspends its roadway deck using vertical steel hanger cables hung from parabolic main cables strung between high towers?",
      options: {
        A: "Suspension bridge",
        B: "Beam bridge",
        C: "Cantilever bridge",
        D: "Culvert bridge"
      },
      correctOption: "A",
      explanation: "Suspension bridges (such as the Golden Gate) transfer deck dead and live loads via vertical suspenders into tensioned parabolic main cables."
    },
    {
      id: "bz_q6",
      question: "What is the engineering term for the sudden lateral deflection and structural failure of a slender column subjected to compressive axial loading?",
      options: {
        A: "Buckling (Euler buckling)",
        B: "Torsional shearing",
        C: "Material creep",
        D: "Delamination"
      },
      correctOption: "A",
      explanation: "Buckling occurs when slender structural members under compression suddenly bow outward at a critical load lower than the ultimate yield strength."
    },
    {
      id: "bz_q7",
      question: "What engineering design ratio defines the ultimate structural load capacity of a member divided by its maximum anticipated operational service load?",
      options: {
        A: "Factor of Safety (FoS)",
        B: "Poisson's ratio",
        C: "Slenderness ratio",
        D: "Modulus of resilience"
      },
      correctOption: "A",
      explanation: "The Factor of Safety (FoS) provides a safety cushion against unexpected overloads, material variances, and structural fatigue over time."
    },
    {
      id: "bz_q8",
      question: "What dynamic aerodynamic phenomenon must bridge designers mitigate to prevent aeroelastic flutter and destructive oscillations during high winds?",
      options: {
        A: "Vortex shedding and resonant flutter",
        B: "Planetary gravitational attraction",
        C: "Static thermal refraction",
        D: "Solar radiation pressure"
      },
      correctOption: "A",
      explanation: "Alternating vortices shed by wind passing a bluff body can match the bridge's natural resonant frequency, causing catastrophic flutter if unmitigated."
    },
    {
      id: "bz_q9",
      question: "What is the primary operational function of bridge expansion joints installed across roadway deck segments?",
      options: {
        A: "To accommodate seasonal thermal expansion and contraction without damaging the structure",
        B: "To generate electrical power from vehicular vibrations",
        C: "To provide traction for skidding vehicles",
        D: "To filter stormwater pollutants"
      },
      correctOption: "A",
      explanation: "Materials expand with heat and contract with cold; expansion joints accommodate these dimensional variations safely without inducing buckling stresses."
    },
    {
      id: "bz_q10",
      question: "What type of mechanical force acts to twist or rotate a structural shaft or beam about its central longitudinal axis?",
      options: {
        A: "Torsion (twisting moment)",
        B: "Direct tension",
        C: "Uniform hydrostatic pressure",
        D: "Axial compression"
      },
      correctOption: "A",
      explanation: "Torsion is the twisting of an object due to an applied torque around its longitudinal axis, creating internal shear stresses."
    }
  ],

  // ------------------------------------------------------
  // LEVEL 4: ENGINEERING ESCAPE ROOM (10 Logic, Hardware & Computing Questions)
  // ------------------------------------------------------
  escapeRoom: [
    {
      id: "er_q1",
      question: "Logic Lock Challenge: Identify the missing number in the computational sequence: 2 → 4 → 8 → 16 → ?",
      options: {
        A: "32",
        B: "24",
        C: "28",
        D: "36"
      },
      correctOption: "A",
      explanation: "Each number in the sequence is multiplied by 2 (powers of 2: 2¹=2, 2²=4, 2³=8, 2⁴=16, 2⁵=32)."
    },
    {
      id: "er_q2",
      question: "Hardware Identification: Which stationary electromagnetic apparatus steps alternating current (AC) voltages up or down with high efficiency?",
      options: {
        A: "Transformer",
        B: "Commutator",
        C: "Rheostat",
        D: "Solenoid actuator"
      },
      correctOption: "A",
      explanation: "A transformer uses mutual electromagnetic induction between primary and secondary windings on a ferromagnetic core to alter AC voltage levels."
    },
    {
      id: "er_q3",
      question: "Digital Keypad Override: Convert the 4-bit unsigned binary byte 1010₂ into its decimal equivalent to disengage the security lock:",
      options: {
        A: "10 (8 + 0 + 2 + 0)",
        B: "12 (8 + 4 + 0 + 0)",
        C: "14 (8 + 4 + 2 + 0)",
        D: "6 (0 + 4 + 2 + 0)"
      },
      correctOption: "A",
      explanation: "1010₂ = (1 × 2³) + (0 × 2²) + (1 × 2¹) + (0 × 2⁰) = 8 + 0 + 2 + 0 = 10."
    },
    {
      id: "er_q4",
      question: "In cybersecurity and digital verification, what mathematical function produces a unique fixed-length digital fingerprint from arbitrary input data that cannot be reversed?",
      options: {
        A: "Cryptographic hash function (e.g. SHA-256)",
        B: "Symmetric decryption cipher",
        C: "Dynamic routing table",
        D: "Random number seed"
      },
      correctOption: "A",
      explanation: "Cryptographic hash functions are one-way deterministic functions that produce a unique fixed-length digest used to verify data integrity."
    },
    {
      id: "er_q5",
      question: "Security Sequence Decryption: Identify the next term in the alphanumeric pattern: A1 → C3 → E5 → G7 → ?",
      options: {
        A: "I9",
        B: "H8",
        C: "I8",
        D: "J10"
      },
      correctOption: "A",
      explanation: "Letters advance by 2 positions (A, C, E, G, I) and numbers advance by 2 (1, 3, 5, 7, 9), yielding I9."
    },
    {
      id: "er_q6",
      question: "Which semiconductor component conducts current easily in forward bias but blocks current in reverse bias, acting as an electrical check valve?",
      options: {
        A: "Diode",
        B: "Inductor",
        C: "Thermistor",
        D: "Varistor"
      },
      correctOption: "A",
      explanation: "A p-n junction diode allows electric current to flow freely in one direction while exhibiting high resistance in the reverse direction."
    },
    {
      id: "er_q7",
      question: "Boolean Security Logic: A lab security system is disarmed when (A AND B) OR (NOT C) is TRUE. If A = 0 (FALSE) and B = 1 (TRUE), what state must sensor C be in to disarm the alarm?",
      options: {
        A: "C must be 0 (FALSE)",
        B: "C must be 1 (TRUE)",
        C: "C can be any value",
        D: "The alarm cannot be disarmed"
      },
      correctOption: "A",
      explanation: "Since A=0, (A AND B) = 0. Therefore, the expression simplifies to 0 OR (NOT C). To evaluate to TRUE, NOT C must be 1, which means C must be 0."
    },
    {
      id: "er_q8",
      question: "What fundamental unit of quantum information can exist in a superposition of both 0 and 1 states simultaneously in quantum computers?",
      options: {
        A: "Qubit (quantum bit)",
        B: "Byte",
        C: "Octet",
        D: "Flip-flop"
      },
      correctOption: "A",
      explanation: "A qubit is the basic unit of quantum computing, capable of representing a 0, a 1, or any quantum superposition of both states."
    },
    {
      id: "er_q9",
      question: "Which optical sensor emits pulsed laser beams and measures reflection return times to construct precise 3D spatial maps in autonomous robotics?",
      options: {
        A: "LiDAR (Light Detection and Ranging)",
        B: "Thermocouple",
        C: "Strain gauge",
        D: "Hall effect sensor"
      },
      correctOption: "A",
      explanation: "LiDAR measures time-of-flight reflections of millions of laser pulses per second to generate high-accuracy 3D point cloud maps of the environment."
    },
    {
      id: "er_q10",
      question: "In embedded systems, what hardware mechanism allows an external electrical trigger to immediately pause main CPU execution to service a critical real-time event?",
      options: {
        A: "Hardware Interrupt (Interrupt Service Routine - ISR)",
        B: "Polling delay loop",
        C: "Buffer overflow",
        D: "Garbage collection cycle"
      },
      correctOption: "A",
      explanation: "Hardware interrupts cause the processor to temporarily save its current execution state and immediately execute an Interrupt Service Routine (ISR)."
    }
  ]
};

// ========================================================
// RANDOMIZATION, SHUFFLING & OPTION MAPPING ENGINE
// ========================================================

/**
 * Modern Fisher-Yates array shuffle (in-place clone)
 */
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Shuffles the 4 options of a question (A, B, C, D) while updating correctOption
 */
function shuffleQuestionOptions(question) {
  const letters = ['A', 'B', 'C', 'D'];
  const originalOptions = question.options;
  const originalCorrectLetter = question.correctOption;
  const correctText = originalOptions[originalCorrectLetter];

  // Extract option text values
  const optionTexts = letters.map(l => originalOptions[l]);
  const shuffledTexts = shuffleArray(optionTexts);

  const newOptions = {};
  let newCorrectOption = 'A';

  letters.forEach((letter, idx) => {
    newOptions[letter] = shuffledTexts[idx];
    if (shuffledTexts[idx] === correctText) {
      newCorrectOption = letter;
    }
  });

  return {
    id: question.id,
    originalId: question.id,
    category: question.category || null,
    question: question.question,
    options: newOptions,
    correctOption: newCorrectOption,
    explanation: question.explanation
  };
}

/**
 * Generates an assigned question set for a student on a specific level
 * Picks QUESTIONS_PER_LEVEL questions from the level's 10-question bank,
 * shuffles question order, and shuffles options for each question.
 */
function generateAssignedQuestions(levelKey, count = QUESTIONS_PER_LEVEL) {
  const bank = QUESTION_BANKS[levelKey];
  if (!bank || bank.length === 0) {
    throw new Error(`Question bank not found for level: ${levelKey}`);
  }

  // 1. Shuffle question bank
  const shuffledBank = shuffleArray(bank);

  // 2. Take the configured subset (e.g. 5)
  const subset = shuffledBank.slice(0, Math.min(count, bank.length));

  // 3. Shuffle options for each selected question
  return subset.map(q => shuffleQuestionOptions(q));
}

/**
 * Strips out correctOption and explanation before sending to client
 */
function sanitizeAssignedQuestions(questions = []) {
  return questions.map((q, idx) => ({
    id: q.id,
    questionNumber: idx + 1,
    totalQuestions: questions.length,
    category: q.category || null,
    question: q.question,
    options: q.options
  }));
}

/**
 * Returns overall sanitized arena structure with metadata and level statuses
 */
function getSanitizedArenaConfig() {
  const config = {
    level1: { id: 'circuitMaster', name: 'Circuit Master', theme: 'Blue & Cyan' },
    level2: { id: 'spinArena', name: 'Spin Arena', theme: 'Purple & Gold' },
    level3: { id: 'buildZone', name: 'Build Zone', theme: 'Green & Teal' },
    level4: { id: 'escapeRoom', name: 'Engineering Escape Room', theme: 'Futuristic Neon' }
  };
  LEVEL_ORDER.forEach(key => {
    config[key] = {
      ...LEVEL_METADATA[key],
      totalQuestionsInBank: QUESTION_BANKS[key].length,
      questionsPerAttempt: QUESTIONS_PER_LEVEL
    };
  });
  return config;
}

/**
 * Backward compatibility helpers for legacy integration tests
 */
function validateLevel1(payload = {}) {
  const wireConnected = Boolean(payload.wireConnected);
  const selectedOption = payload.selectedOption || null;
  const isCorrect = selectedOption === 'A';
  if (!wireConnected) {
    return { correct: false, score: 0, message: 'Circuit is open. Connect the missing wire.' };
  }
  const score = isCorrect ? 100 : 50;
  return { correct: isCorrect, score, message: 'Circuit Master Unlocked!' };
}

function validateLevel2(payload = {}) {
  const isBonus = payload.category === 'Bonus Points';
  if (isBonus) {
    return { correct: true, score: 100, message: 'Bonus points awarded!' };
  }
  return { correct: true, score: 100, message: 'Spin Arena Completed!' };
}

function validateLevel3(payload = {}) {
  const placed = payload.placedComponents || {};
  const isComplete = placed.foundation && placed.deck && placed.arch;
  if (!isComplete) {
    return { correct: false, score: 0, message: 'Bridge incomplete.' };
  }
  const isCorrect = payload.selectedOption === 'A';
  return { correct: isCorrect, score: isCorrect ? 100 : 50, message: 'Junior Engineer Unlocked!' };
}

function validateLevel4(payload = {}) {
  const isCorrect = payload.c1Option === 'C' && payload.c2Component === 'motor' && payload.c3Pin === '10';
  return {
    correct: isCorrect,
    score: isCorrect ? 100 : 0,
    badge: 'ENGINEERING ESCAPE MASTER',
    message: isCorrect ? 'Engineering Escape Master Unlocked!' : 'Access denied.'
  };
}

function calculateArenaTotal(arenaLevels = {}) {
  const keys = ['circuitMaster', 'spinArena', 'buildZone', 'escapeRoom'];
  let totalScore = 0;
  let completedCount = 0;

  keys.forEach(k => {
    const lvl = arenaLevels[k] || {};
    if (lvl.completed) {
      completedCount++;
      totalScore += Number(lvl.score || 0);
    }
  });

  const isChampion = completedCount === 4;
  const percentage = Math.round((totalScore / 400) * 100);

  let performanceBadge = 'ENGINEERING APPRENTICE';
  let performanceMessage = 'Good effort! Complete all challenges to achieve Mastery.';

  if (isChampion) {
    performanceBadge = '🏆 ENGINEERING ARENA CHAMPION';
    performanceMessage = 'Outstanding! You have mastered all 4 engineering challenges with distinction!';
  } else if (completedCount >= 3) {
    performanceBadge = 'SENIOR ENGINEER';
    performanceMessage = 'Impressive engineering intuition across specialized domains!';
  } else if (completedCount >= 1) {
    performanceBadge = 'JUNIOR ENGINEER';
    performanceMessage = 'Solid technical problem solving underway!';
  }

  return {
    score: totalScore,
    totalScore,
    scoreMax: 400,
    percentage,
    completedGamesCount: completedCount,
    isChampion,
    performanceBadge,
    performanceMessage,
    arenaLevels
  };
}

/**
 * Determines whether a level is unlocked based on attempt state
 */
function isLevelUnlocked(attempt, levelKey) {
  if (!attempt || !attempt.levels) return levelKey === 'circuitMaster';

  const isLvlDone = (key) => {
    const l = attempt.levels[key];
    const legacy = attempt.arenaLevels && attempt.arenaLevels[key];
    return Boolean((l && (l.completed || l.status === 'Completed')) || (legacy && legacy.completed));
  };

  switch (levelKey) {
    case 'circuitMaster':
      return true; // Always unlocked
    case 'spinArena':
      return isLvlDone('circuitMaster');
    case 'buildZone':
      return isLvlDone('spinArena');
    case 'escapeRoom':
      return isLvlDone('buildZone');
    default:
      return false;
  }
}

/**
 * Evaluates an individual question answer
 */
function evaluateQuestionAnswer(assignedQuestion, selectedOption) {
  if (!assignedQuestion) {
    return { isCorrect: false, score: 0 };
  }
  const isCorrect = (selectedOption || '').toUpperCase() === assignedQuestion.correctOption;
  const pointsPerQuestion = Math.round(100 / QUESTIONS_PER_LEVEL); // e.g. 20 points
  return {
    isCorrect,
    score: isCorrect ? pointsPerQuestion : 0,
    correctOption: assignedQuestion.correctOption,
    explanation: assignedQuestion.explanation
  };
}

/**
 * Calculates level score from assigned questions and user answers
 */
function calculateLevelScore(assignedQuestions = [], answers = {}) {
  const pointsPerQuestion = Math.round(100 / QUESTIONS_PER_LEVEL); // 20 pts
  let score = 0;
  let correctCount = 0;
  const breakdown = [];

  assignedQuestions.forEach((q, idx) => {
    const selected = answers[q.id];
    const isCorrect = (selected || '').toUpperCase() === q.correctOption;
    if (isCorrect) {
      score += pointsPerQuestion;
      correctCount++;
    }
    breakdown.push({
      questionId: q.id,
      questionNumber: idx + 1,
      question: q.question,
      selectedOption: selected || null,
      correctOption: q.correctOption,
      isCorrect,
      explanation: q.explanation
    });
  });

  // Cap at 100 max per level
  score = Math.min(100, Math.max(0, score));

  return {
    score,
    maxScore: 100,
    correctCount,
    totalQuestions: assignedQuestions.length,
    percentage: Math.round((score / 100) * 100),
    breakdown
  };
}

module.exports = {
  QUESTIONS_PER_LEVEL,
  LEVEL_ORDER,
  LEVEL_METADATA,
  QUESTION_BANKS,
  shuffleArray,
  shuffleQuestionOptions,
  generateAssignedQuestions,
  sanitizeAssignedQuestions,
  getSanitizedArenaConfig,
  isLevelUnlocked,
  evaluateQuestionAnswer,
  calculateLevelScore,
  calculateArenaTotal,
  validateLevel1,
  validateLevel2,
  validateLevel3,
  validateLevel4
};
