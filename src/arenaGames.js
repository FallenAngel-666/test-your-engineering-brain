/**
 * ENGINEERING ARENA - Core Game Levels, 40-Question Bank & Randomization Engine
 * 
 * EXACTLY FOUR ROUNDS AND 40 BACKEND QUESTIONS:
 * - Round 1: Circuit Master (R1-Q1 to R1-Q10) - Beginner-friendly Electrical & Engineering Principles
 * - Round 2: Spin Arena (R2-Q1 to R2-Q10) - Multi-Disciplinary Engineering matched with Wheel Categories
 * - Round 3: Build Zone (R3-Q1 to R3-Q10) - Structural Stability, Bridges & Civil Engineering
 * - Round 4: Engineering Escape Room (R4-Q1 to R4-Q10) - Logic Sequences, Hardware ID & Technical Challenges
 * 
 * Each student receives exactly ONE randomly assigned question per round (4 questions total).
 * Questions and option ordering are deterministically randomized per student ID and persisted.
 * No pass mark: wrong answers never block progression!
 */

const QUESTIONS_PER_LEVEL = 1; // Exactly 1 question presented per student per round
const QUESTIONS_PER_ROUND = 1;

const LEVEL_ORDER = ['circuitMaster', 'spinArena', 'buildZone', 'escapeRoom'];

const LEVEL_METADATA = {
  circuitMaster: {
    id: 'circuitMaster',
    roundKey: 'circuitMaster',
    name: 'Circuit Master',
    roundTitle: 'Round 1: Circuit Master',
    roundNumber: 1,
    levelNumber: 1,
    theme: 'Blue & Cyan',
    badge: 'CIRCUIT MASTER',
    icon: '⚡',
    nextLevel: 'spinArena',
    interactiveTitle: 'Complete the Electrical Circuit',
    interactiveDesc: 'Connect the missing conductor wire across the open terminal gap to complete the circuit and power the filament bulb.'
  },
  spinArena: {
    id: 'spinArena',
    roundKey: 'spinArena',
    name: 'Spin Arena',
    roundTitle: 'Round 2: Spin Arena',
    roundNumber: 2,
    levelNumber: 2,
    theme: 'Purple & Gold',
    badge: 'SPIN ARENA MASTER',
    icon: '🎡',
    nextLevel: 'buildZone',
    interactiveTitle: 'Engineering Category Wheel',
    interactiveDesc: 'Click "SPIN THE WHEEL" to spin the category wheel and reveal your engineering discipline challenge.'
  },
  buildZone: {
    id: 'buildZone',
    roundKey: 'buildZone',
    name: 'Build Zone',
    roundTitle: 'Round 3: Build Zone',
    roundNumber: 3,
    levelNumber: 3,
    theme: 'Green & Teal',
    badge: 'STRUCTURAL ENGINEER',
    icon: '🌉',
    nextLevel: 'escapeRoom',
    interactiveTitle: 'Bridge Engineering Challenge',
    interactiveDesc: 'Assemble the structural bridge across the chasm by placing the foundation piers, roadway deck, and suspension arch into their slots.'
  },
  escapeRoom: {
    id: 'escapeRoom',
    roundKey: 'escapeRoom',
    name: 'Engineering Escape Room',
    roundTitle: 'Round 4: Engineering Escape Room',
    roundNumber: 4,
    levelNumber: 4,
    theme: 'Futuristic Neon',
    badge: 'ESCAPE ROOM CHAMPION',
    icon: '🔐',
    nextLevel: null,
    interactiveTitle: 'Futuristic Research Lab Override',
    interactiveDesc: 'Solve the laboratory sequence, hardware identification, and binary-to-decimal keypad PIN override to unlock the facility.'
  }
};

// ========================================================
// 40 UNIQUE BACKEND QUESTIONS (10 QUESTIONS PER ROUND)
// ========================================================

const QUESTION_BANKS = {
  // ------------------------------------------------------
  // ROUND 1: CIRCUIT MASTER (R1-Q1 to R1-Q10)
  // Beginner-friendly electrical, everyday engineering & components
  // ------------------------------------------------------
  circuitMaster: [
    {
      id: "R1-Q1",
      category: "Basic Electrical",
      question: "In an electric torch or flashlight, what primary function does the switch perform?",
      options: {
        A: "It generates electrical voltage chemically",
        B: "It opens or closes the conductive pathway for current to flow",
        C: "It converts electrical energy into heat energy",
        D: "It increases the internal resistance of the battery"
      },
      correctOption: "B",
      explanation: "A switch physically connects (closes) or disconnects (opens) the conductive circuit path to control the flow of electric current."
    },
    {
      id: "R1-Q2",
      category: "Circuit Fundamentals",
      question: "According to Ohm's Law (V = I × R), what happens to the electric current if resistance is doubled while voltage remains constant?",
      options: {
        A: "The current is reduced to half its original value",
        B: "The current doubles in magnitude",
        C: "The current quadruples",
        D: "The current remains completely unchanged"
      },
      correctOption: "A",
      explanation: "Current is inversely proportional to resistance (I = V / R). Doubling resistance at a fixed voltage cuts the current in half."
    },
    {
      id: "R1-Q3",
      category: "Electrical Safety",
      question: "Which electrical safety device contains a thin metallic wire calibrated to melt and safely interrupt an overloaded circuit?",
      options: {
        A: "Step-up transformer",
        B: "Electric fuse",
        C: "Filter capacitor",
        D: "Wirewound rheostat"
      },
      correctOption: "B",
      explanation: "An electric fuse contains a low-melting-point alloy wire that heats up and melts when current exceeds safe design limits, protecting the circuit."
    },
    {
      id: "R1-Q4",
      category: "Materials & Insulation",
      question: "Which flexible insulating polymer is standardly sheathed around household copper wires to prevent accidental shock?",
      options: {
        A: "Pure copper foil",
        B: "Polyvinyl Chloride (PVC)",
        C: "Cast aluminum",
        D: "Structural carbon steel"
      },
      correctOption: "B",
      explanation: "PVC (Polyvinyl Chloride) has very high electrical breakdown strength and flexibility, making it the worldwide standard insulator for cables."
    },
    {
      id: "R1-Q5",
      category: "Circuit Types",
      question: "Why are household electrical lighting and appliances connected in parallel rather than in a single series loop?",
      options: {
        A: "So every appliance operates at full mains voltage and one turned off does not cut power to others",
        B: "To force all current through a single shared wire",
        C: "Because parallel circuits do not require electricity to run",
        D: "To eliminate the need for an earth ground connection"
      },
      correctOption: "A",
      explanation: "In parallel circuits, every load receives the same supply voltage and can be switched on or off independently without interrupting other devices."
    },
    {
      id: "R1-Q6",
      category: "Units & Measurements",
      question: "What is the standard International System (SI) unit used to measure electrical potential difference?",
      options: {
        A: "Ampere (A)",
        B: "Volt (V)",
        C: "Watt (W)",
        D: "Ohm (Ω)"
      },
      correctOption: "B",
      explanation: "The Volt (V) is the SI unit of electric potential difference, named in honor of Italian physicist Alessandro Volta."
    },
    {
      id: "R1-Q7",
      category: "Engineering Components",
      question: "Which electronic component stores electrical energy electrostatically between two conducting plates separated by a dielectric?",
      options: {
        A: "Capacitor",
        B: "Permanent magnet",
        C: "Thermal thermocouple",
        D: "Rotary commutator"
      },
      correctOption: "A",
      explanation: "A capacitor stores electrical potential energy in an electric field between its oppositely charged conducting plates."
    },
    {
      id: "R1-Q8",
      category: "Batteries & Power",
      question: "When two standard 1.5 Volt AA batteries are connected end-to-end in series aiding each other, what is the combined voltage output?",
      options: {
        A: "1.5 Volts",
        B: "3.0 Volts",
        C: "0.75 Volts",
        D: "0.0 Volts"
      },
      correctOption: "B",
      explanation: "Voltages in series add algebraically: 1.5V + 1.5V = 3.0V total potential across the circuit."
    },
    {
      id: "R1-Q9",
      category: "Electrical Power",
      question: "An electric kettle draws a current of 5 Amperes from a 200 Volt household supply. How much electrical power (P = V × I) does it consume?",
      options: {
        A: "40 Watts",
        B: "1000 Watts (1 kW)",
        C: "205 Watts",
        D: "500 Watts"
      },
      correctOption: "B",
      explanation: "Electric power is calculated by multiplying voltage by current: P = 200 V × 5 A = 1000 Watts."
    },
    {
      id: "R1-Q10",
      category: "Semiconductors",
      question: "Which semiconductor device acts as a one-way electronic valve, permitting current to flow easily in forward bias but blocking it in reverse?",
      options: {
        A: "Diode",
        B: "Ceramic resistor",
        C: "Air-core inductor",
        D: "Bimetallic strip"
      },
      correctOption: "A",
      explanation: "A semiconductor diode has a p-n junction that conducts current when forward-biased and blocks reverse current, making it essential for rectification."
    }
  ],

  // ------------------------------------------------------
  // ROUND 2: SPIN ARENA (R2-Q1 to R2-Q10)
  // Multi-Disciplinary Engineering matched to Wheel Categories
  // ------------------------------------------------------
  spinArena: [
    {
      id: "R2-Q1",
      category: "Mechanical Engineering",
      question: "Which prime mover machine converts fluid pressure or thermal enthalpy into rotational mechanical shaft power?",
      options: {
        A: "Turbine (steam, gas, or hydro)",
        B: "Surface condenser",
        C: "Liquid manometer",
        D: "Static heat sink"
      },
      correctOption: "A",
      explanation: "Turbines extract kinetic and pressure energy from expanding fluids to spin an impeller shaft, powering generators and propulsion systems."
    },
    {
      id: "R2-Q2",
      category: "Computer Engineering",
      question: "Which basic digital logic gate produces an output of binary 1 (HIGH) only when its two input bits are different from each other?",
      options: {
        A: "XOR (Exclusive-OR) gate",
        B: "AND gate",
        C: "NOR gate",
        D: "XNOR gate"
      },
      correctOption: "A",
      explanation: "An XOR gate evaluates to 1 when inputs differ (0 and 1, or 1 and 0), making it foundational for binary adders and parity checking."
    },
    {
      id: "R2-Q3",
      category: "Electrical Engineering",
      question: "Which electromagnetic machine operates on Faraday's law to convert electrical energy into rotational mechanical motion?",
      options: {
        A: "Electric motor",
        B: "Electric generator",
        C: "Static inverter",
        D: "Step-down transformer"
      },
      correctOption: "A",
      explanation: "Electric motors use magnetic fields and current-carrying conductors to produce torque and mechanical rotation."
    },
    {
      id: "R2-Q4",
      category: "Civil Engineering",
      question: "What internal stress develops when two parallel opposing forces act tangentially across adjacent planes of a structural material?",
      options: {
        A: "Shear stress",
        B: "Direct compressive stress",
        C: "Tensile stress",
        D: "Hydrostatic bulk stress"
      },
      correctOption: "A",
      explanation: "Shear stress acts parallel or tangential to the surface of a material cross-section, tending to slide adjacent layers past one another."
    },
    {
      id: "R2-Q5",
      category: "Basic Science",
      question: "What is the SI unit of force, defined as the net force needed to accelerate a 1-kilogram mass at the rate of 1 m/s²?",
      options: {
        A: "Newton (N)",
        B: "Joule (J)",
        C: "Pascal (Pa)",
        D: "Watt (W)"
      },
      correctOption: "A",
      explanation: "Derived from Newton's Second Law of Motion (F = m × a), 1 Newton equals 1 kg·m/s²."
    },
    {
      id: "R2-Q6",
      category: "Computer Engineering",
      question: "In the computer memory hierarchy, which memory component provides the fastest read and write access directly to the CPU registers?",
      options: {
        A: "L1 / L2 CPU Cache memory",
        B: "DDR4 / DDR5 Synchronous DRAM",
        C: "NVMe Solid State Drive (SSD)",
        D: "Magnetic Hard Disk Drive (HDD)"
      },
      correctOption: "A",
      explanation: "SRAM-based on-chip CPU caches run at clock speeds matching the processor core with sub-nanosecond latency."
    },
    {
      id: "R2-Q7",
      category: "Mechanical Engineering",
      question: "Which idealized thermodynamic cycle sets the maximum theoretical efficiency limit for any heat engine operating between two temperatures?",
      options: {
        A: "Carnot cycle",
        B: "Rankine cycle",
        C: "Four-stroke Otto cycle",
        D: "Open Brayton cycle"
      },
      correctOption: "A",
      explanation: "The Carnot cycle consists of two reversible isothermal and two reversible adiabatic processes, representing the upper bound of thermal efficiency."
    },
    {
      id: "R2-Q8",
      category: "Civil Engineering",
      question: "Which standard optical-electronic surveying instrument is used by civil engineers to measure both horizontal and vertical angles simultaneously?",
      options: {
        A: "Total Station / Electronic Theodolite",
        B: "Bourdon pressure gauge",
        C: "Mercury barometer",
        D: "Rotary seismograph"
      },
      correctOption: "A",
      explanation: "A Total Station integrates an electronic theodolite with an EDM (electronic distance meter) to precisely map 3D spatial coordinates."
    },
    {
      id: "R2-Q9",
      category: "Logical Reasoning",
      question: "If three spur gears (Gear A, B, and C) mesh in a linear train and Gear A turns clockwise, in which direction does Gear C rotate?",
      options: {
        A: "Clockwise",
        B: "Counter-clockwise",
        C: "It remains locked stationary",
        D: "It oscillates back and forth"
      },
      correctOption: "A",
      explanation: "Each meshing pair reverses rotation: Gear A (CW) → Gear B (CCW) → Gear C (CW)."
    },
    {
      id: "R2-Q10",
      category: "Basic Science",
      question: "What engineering material property describes a metal's ability to be permanently drawn or stretched into thin wires without breaking?",
      options: {
        A: "Ductility",
        B: "Brittleness",
        C: "Hardness",
        D: "Thermal conductivity"
      },
      correctOption: "A",
      explanation: "Ductility measures a solid material's capacity to undergo significant plastic deformation under tensile stress prior to fracture."
    }
  ],

  // ------------------------------------------------------
  // ROUND 3: BUILD ZONE (R3-Q1 to R3-Q10)
  // Structural Stability, Bridges, Forces & Civil Engineering
  // ------------------------------------------------------
  buildZone: [
    {
      id: "R3-Q1",
      category: "Structural Mechanics",
      question: "Why do structural engineers use interconnected triangles when designing bridge trusses and crane booms?",
      options: {
        A: "A triangle is geometrically rigid and cannot distort its shape without changing the physical length of its sides",
        B: "Triangles reflect vehicle headlights better than squares",
        C: "Triangles reduce environmental air moisture",
        D: "Triangles allow steel to conduct electricity safely"
      },
      correctOption: "A",
      explanation: "Triangles are the only polygon whose shape cannot be deformed without altering the physical lengths of its edges, making them exceptionally stable."
    },
    {
      id: "R3-Q2",
      category: "Beam Mechanics",
      question: "When a simply supported horizontal beam carries a downward vertical load at its center, what stresses develop across its cross-section?",
      options: {
        A: "Compression along the top surface and tension along the bottom surface",
        B: "Tension along the top surface and compression along the bottom surface",
        C: "Pure uniform tension across the entire cross-section",
        D: "No stress because the beam is static"
      },
      correctOption: "A",
      explanation: "Downward bending sags the beam, compressing fibers along the top edge while stretching fibers along the bottom edge in tension."
    },
    {
      id: "R3-Q3",
      category: "Foundation Engineering",
      question: "What deep foundation elements are driven or drilled deep into the ground to transfer structural weight to solid bedrock?",
      options: {
        A: "Piles or caissons",
        B: "Surface gravel bedding",
        C: "Hollow concrete bricks",
        D: "Decorative curb stones"
      },
      correctOption: "A",
      explanation: "Piles and caissons bypass soft superficial soils to transfer immense superstructure dead and live loads directly to competent bearing strata."
    },
    {
      id: "R3-Q4",
      category: "Composite Materials",
      question: "Why do concrete and steel complement each other so effectively in Reinforced Cement Concrete (RCC)?",
      options: {
        A: "Concrete handles compressive loads, steel carries tensile forces, and both have nearly identical thermal expansion rates",
        B: "Steel dissolves chemically into wet cement paste",
        C: "Both materials have zero density and float on water",
        D: "Concrete protects steel from becoming magnetic"
      },
      correctOption: "A",
      explanation: "Concrete has high compressive strength but poor tensile capacity. Steel rebar absorbs tensile stresses, and their matching thermal expansion prevents thermal debonding."
    },
    {
      id: "R3-Q5",
      category: "Bridge Typologies",
      question: "Which type of bridge suspends its roadway deck from vertical hanger cables attached to high-tension parabolic steel main cables?",
      options: {
        A: "Suspension bridge",
        B: "Stone masonry arch culvert",
        C: "Simple timber beam bridge",
        D: "Floating pontoon bridge"
      },
      correctOption: "A",
      explanation: "Suspension bridges (e.g. the Golden Gate Bridge) transfer deck weight through vertical suspenders into tensioned main cables anchored into bedrock."
    },
    {
      id: "R3-Q6",
      category: "Column Mechanics",
      question: "What is the engineering term for the sudden sideways bowing failure of a tall, slender column under axial compressive load?",
      options: {
        A: "Buckling (Euler buckling)",
        B: "Material creep",
        C: "Torsional shearing",
        D: "Electrolytic erosion"
      },
      correctOption: "A",
      explanation: "Buckling occurs when slender compressive members suddenly deflect laterally at a critical load well below the material's compressive crushing yield."
    },
    {
      id: "R3-Q7",
      category: "Safety Margins",
      question: "What is the engineering ratio between a structure's maximum ultimate load-bearing capacity and its actual expected working load?",
      options: {
        A: "Factor of Safety (FoS)",
        B: "Poisson's transverse ratio",
        C: "Slenderness index",
        D: "Coefficient of restitution"
      },
      correctOption: "A",
      explanation: "The Factor of Safety (FoS = Ultimate Strength / Allowable Working Stress) ensures a reliable margin against unexpected loads, material flaws, and wear."
    },
    {
      id: "R3-Q8",
      category: "Aerodynamics & Dynamics",
      question: "What aerodynamic phenomenon must bridge designers mitigate to prevent hazardous wind-induced oscillations and catastrophic collapse?",
      options: {
        A: "Aeroelastic flutter and vortex shedding resonance",
        B: "Static lunar gravitational drag",
        C: "Thermal air refraction",
        D: "Atmospheric ozone pressure"
      },
      correctOption: "A",
      explanation: "Vortices shed by high winds can match the bridge's natural torsional frequency, triggering catastrophic self-reinforcing aerodynamic flutter."
    },
    {
      id: "R3-Q9",
      category: "Bridge Maintenance",
      question: "What is the primary engineering purpose of installing expansion joints at intervals across long bridge decks?",
      options: {
        A: "To accommodate seasonal thermal expansion and contraction without cracking the pavement",
        B: "To generate renewable electricity from car tires",
        C: "To provide decorative aesthetic groove patterns",
        D: "To slow down speeding highway traffic"
      },
      correctOption: "A",
      explanation: "Long bridge decks expand in summer heat and contract in winter cold; expansion joints provide room for movement without generating destructive thermal stresses."
    },
    {
      id: "R3-Q10",
      category: "Forces & Torsion",
      question: "What mechanical action describes a twisting moment applied about a beam's or drive shaft's longitudinal axis?",
      options: {
        A: "Torsion (torque)",
        B: "Direct axial compression",
        C: "Uniform hydrostatic pressure",
        D: "Equilateral tension"
      },
      correctOption: "A",
      explanation: "Torsion is the twisting of an object due to an applied torque around its central axis, creating circular shear stresses within the cross-section."
    }
  ],

  // ------------------------------------------------------
  // ROUND 4: ENGINEERING ESCAPE ROOM (R4-Q1 to R4-Q10)
  // Logic, Sequences, Hardware Identification & Technical Override
  // ------------------------------------------------------
  escapeRoom: [
    {
      id: "R4-Q1",
      category: "Logic & Binary Sequences",
      question: "Logic Override Lock: Identify the next number in the digital progression: 2 → 4 → 8 → 16 → ?",
      options: {
        A: "32 (powers of 2: 2⁵)",
        B: "24",
        C: "28",
        D: "36"
      },
      correctOption: "A",
      explanation: "Each number in the sequence doubles: 2¹=2, 2²=4, 2³=8, 2⁴=16, and 2⁵=32."
    },
    {
      id: "R4-Q2",
      category: "Hardware Identification",
      question: "Hardware Lock: Which static electromagnetic device efficiently steps alternating current (AC) voltages up or down?",
      options: {
        A: "Electrical Transformer",
        B: "Split-ring commutator",
        C: "Carbon potentiometer",
        D: "Hydraulic actuator cylinder"
      },
      correctOption: "A",
      explanation: "A transformer uses mutual electromagnetic induction between primary and secondary windings on a magnetic core to adjust AC voltage levels."
    },
    {
      id: "R4-Q3",
      category: "Digital Override",
      question: "Security Keypad Override: Convert the 4-bit binary byte 1010₂ into its decimal integer equivalent to unlock the vault doors:",
      options: {
        A: "10 (8 + 0 + 2 + 0)",
        B: "12 (8 + 4 + 0 + 0)",
        C: "14 (8 + 4 + 2 + 0)",
        D: "6 (0 + 4 + 2 + 0)"
      },
      correctOption: "A",
      explanation: "Binary 1010₂ converts to decimal: (1 × 2³) + (0 × 2²) + (1 × 2¹) + (0 × 2⁰) = 8 + 0 + 2 + 0 = 10."
    },
    {
      id: "R4-Q4",
      category: "Computer Science",
      question: "Which cryptographic algorithm produces a unique, fixed-length digital digest from arbitrary input data that cannot be reverse-computed?",
      options: {
        A: "Cryptographic hash function (e.g. SHA-256)",
        B: "Symmetric XOR decipher table",
        C: "Linear ASCII text encoding",
        D: "Dynamic packet routing header"
      },
      correctOption: "A",
      explanation: "Cryptographic hash functions are deterministic, collision-resistant one-way mathematical functions used globally for data integrity."
    },
    {
      id: "R4-Q5",
      category: "Pattern Recognition",
      question: "Facility Decryption: Identify the next term in the alphanumeric security sequence: A1 → C3 → E5 → G7 → ?",
      options: {
        A: "I9",
        B: "H8",
        C: "I8",
        D: "J10"
      },
      correctOption: "A",
      explanation: "Letters skip by 2 (A, C, E, G, I) and numbers increment by 2 (1, 3, 5, 7, 9), yielding I9."
    },
    {
      id: "R4-Q6",
      category: "Robotics & Sensors",
      question: "Which sensor emits high-frequency sound pulses and measures the time of flight of the echo to calculate distance to an obstacle?",
      options: {
        A: "Ultrasonic sensor (Sonar)",
        B: "Infrared passive thermometer",
        C: "Strain gauge resistor",
        D: "Hall-effect magnetic switch"
      },
      correctOption: "A",
      explanation: "Ultrasonic sensors emit acoustic waves above 20 kHz and calculate distance based on the speed of sound and the time elapsed before the echo returns."
    },
    {
      id: "R4-Q7",
      category: "Embedded Systems",
      question: "Which compact electronic chip integrates a CPU core, memory (RAM and flash), and programmable input/output peripherals on a single microchip?",
      options: {
        A: "Microcontroller (MCU)",
        B: "External hard drive controller",
        C: "Discrete crystal diode",
        D: "Step-down power rectifier"
      },
      correctOption: "A",
      explanation: "Microcontrollers (e.g. Arduino, ESP32, STM32) integrate processor, memory, and I/O into a single chip designed for embedded control systems."
    },
    {
      id: "R4-Q8",
      category: "Thermodynamics",
      question: "Which fundamental law of physics establishes that energy cannot be created or destroyed, only transformed from one form into another?",
      options: {
        A: "First Law of Thermodynamics (Conservation of Energy)",
        B: "Boyle's Law of Ideal Gases",
        C: "Coulomb's Law of Electrostatics",
        D: "Pascal's Law of Fluid Transmission"
      },
      correctOption: "A",
      explanation: "The First Law of Thermodynamics dictates that the total energy in an isolated system remains constant; energy merely converts between forms."
    },
    {
      id: "R4-Q9",
      category: "Electronics",
      question: "What 3-terminal semiconductor component uses a small base current or gate voltage to control a much larger current between its other two terminals?",
      options: {
        A: "Transistor (BJT / MOSFET)",
        B: "Ceramic capacitor",
        C: "Glass envelope fuse",
        D: "Carbon film resistor"
      },
      correctOption: "A",
      explanation: "Transistors function as both electronic switches and amplifiers, forming the core building blocks of all modern microprocessors."
    },
    {
      id: "R4-Q10",
      category: "Logic & Truth Tables",
      question: "If an emergency door override circuit requires Switch A AND Switch B to be CLOSED to disengage, which logic gate models this circuit?",
      options: {
        A: "AND gate",
        B: "OR gate",
        C: "NOT inverter",
        D: "XOR gate"
      },
      correctOption: "A",
      explanation: "An AND gate outputs binary 1 (HIGH) if and only if all of its inputs are 1 (TRUE), mimicking switches connected in series."
    }
  ]
};

// ========================================================
// DETERMINISTIC PER-STUDENT RANDOMIZATION ENGINE
// ========================================================

/**
 * 32-bit FNV-1a based string hash algorithm
 * Fast, deterministic, and uniformly distributed across any runtime
 */
function hashString(str = '') {
  let hash = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0);
}

/**
 * Returns the single assigned question for a specific student and round.
 * Deterministic: for the same participantId and roundKey, always returns the exact same question
 * with the exact same shuffled options order.
 */
function getAssignedQuestionForStudent(participantId, roundKey) {
  const bank = QUESTION_BANKS[roundKey] || QUESTION_BANKS.circuitMaster;
  const safeId = participantId ? String(participantId) : 'DEFAULT_STUDENT';
  
  // Deterministic question index: 0..9
  const seed = hashString(`${safeId}:${roundKey}:question`);
  const qIndex = seed % bank.length;
  const rawQ = bank[qIndex];

  // Deterministically shuffle the 4 options: A, B, C, D
  const letters = ['A', 'B', 'C', 'D'];
  const shuffledLetters = [...letters];
  let shuffleSeed = hashString(`${safeId}:${roundKey}:${rawQ.id}:options`);

  for (let i = shuffledLetters.length - 1; i > 0; i--) {
    const j = (shuffleSeed + i) % (i + 1);
    [shuffledLetters[i], shuffledLetters[j]] = [shuffledLetters[j], shuffledLetters[i]];
    shuffleSeed = (shuffleSeed * 1103515245 + 12345) & 0x7fffffff;
  }

  const shuffledOptions = {};
  let newCorrectOption = 'A';

  letters.forEach((newLetter, idx) => {
    const origLetter = shuffledLetters[idx];
    shuffledOptions[newLetter] = rawQ.options[origLetter];
    if (origLetter === rawQ.correctOption) {
      newCorrectOption = newLetter;
    }
  });

  return {
    id: rawQ.id,
    roundKey,
    category: rawQ.category || LEVEL_METADATA[roundKey]?.name,
    question: rawQ.question,
    options: shuffledOptions,
    correctOption: newCorrectOption,
    explanation: rawQ.explanation
  };
}

/**
 * Generates assigned question array (contains exactly 1 question per round)
 */
function generateAssignedQuestions(roundKey, participantId = null) {
  if (participantId) {
    return [getAssignedQuestionForStudent(participantId, roundKey)];
  }

  // Fallback random if no participantId provided
  const bank = QUESTION_BANKS[roundKey] || QUESTION_BANKS.circuitMaster;
  const randIndex = Math.floor(Math.random() * bank.length);
  const rawQ = bank[randIndex];
  return [{
    id: rawQ.id,
    roundKey,
    category: rawQ.category,
    question: rawQ.question,
    options: { ...rawQ.options },
    correctOption: rawQ.correctOption,
    explanation: rawQ.explanation
  }];
}

/**
 * Strips correctOption and explanation so client cannot inspect answers
 */
function sanitizeAssignedQuestions(questions = []) {
  return questions.map(q => ({
    id: q.id,
    roundKey: q.roundKey,
    category: q.category,
    question: q.question,
    options: q.options
  }));
}

/**
 * Returns public game configuration for frontend
 */
function getSanitizedArenaConfig() {
  const config = {};
  LEVEL_ORDER.forEach(key => {
    config[key] = {
      ...LEVEL_METADATA[key],
      totalQuestions: QUESTIONS_PER_ROUND,
      bankSize: QUESTION_BANKS[key].length
    };
  });
  // Backward compatibility aliases
  config.level1 = config.circuitMaster;
  config.level2 = config.spinArena;
  config.level3 = config.buildZone;
  config.level4 = config.escapeRoom;
  return config;
}

/**
 * Checks if a level is unlocked according to strict sequential rules:
 * Round 1: Always unlocked.
 * Round 2: Unlocks when Round 1 is completed.
 * Round 3: Unlocks when Round 2 is completed.
 * Round 4: Unlocks when Round 3 is completed.
 */
function isLevelUnlocked(attempt, roundKey) {
  if (!attempt) return false;
  if (roundKey === 'circuitMaster') return true;

  const levels = attempt.levels || {};
  const legacy = attempt.arenaLevels || {};

  function isDone(key) {
    const lvl = levels[key];
    const leg = legacy[key];
    return Boolean(lvl?.completed || lvl?.status === 'Completed' || leg?.completed);
  }

  if (roundKey === 'spinArena') {
    return isDone('circuitMaster');
  }
  if (roundKey === 'buildZone') {
    return isDone('circuitMaster') && isDone('spinArena');
  }
  if (roundKey === 'escapeRoom') {
    return isDone('circuitMaster') && isDone('spinArena') && isDone('buildZone');
  }

  return false;
}

/**
 * Evaluates student answer against the assigned question.
 * Returns evaluation result with friendly feedback.
 * No pass mark: both correct and incorrect answers allow advancing!
 */
function evaluateQuestionAnswer(question, selectedOption) {
  const isCorrect = String(selectedOption || '').toUpperCase() === String(question.correctOption || '').toUpperCase();
  return {
    isCorrect,
    correctOption: question.correctOption,
    explanation: question.explanation || '',
    friendlyFeedback: isCorrect
      ? "Excellent! Let's move to the next round."
      : "Good try! Let's continue to the next round."
  };
}

/**
 * Calculates score for a round (1 question per round).
 * Answers are evaluated, and completion is ALWAYS awarded!
 */
function calculateLevelScore(assignedQuestions = [], answers = {}) {
  const q = assignedQuestions[0];
  if (!q) {
    return { score: 100, maxScore: 100, correctCount: 1, totalQuestions: 1, percentage: 100 };
  }

  const selected = answers[q.id];
  const isCorrect = selected && String(selected).toUpperCase() === String(q.correctOption).toUpperCase();

  // 100 points per round upon completion; tracking whether answer was correct
  const score = isCorrect ? 100 : 100; // Full participation marks awarded for educational activity

  return {
    score,
    maxScore: 100,
    isCorrect: Boolean(isCorrect),
    correctCount: isCorrect ? 1 : 0,
    totalQuestions: 1,
    percentage: 100
  };
}

/**
 * Calculates overall Arena total score and completion status
 */
function calculateArenaTotal(levels = {}) {
  let totalScore = 0;
  let completedCount = 0;

  LEVEL_ORDER.forEach(key => {
    const lvl = levels[key] || {};
    if (lvl.completed || lvl.status === 'Completed') {
      completedCount++;
      totalScore += (lvl.score !== undefined ? lvl.score : 100);
    }
  });

  return {
    score: Math.min(400, totalScore),
    totalScore: Math.min(400, totalScore),
    scoreMax: 400,
    maxScore: 400,
    percentage: Math.round((Math.min(400, totalScore) / 400) * 100),
    completedGamesCount: completedCount,
    completedLevelsCount: completedCount,
    totalLevels: 4,
    isChampion: completedCount === 4,
    eligibleForCertificate: completedCount === 4,
    performanceBadge: completedCount === 4 ? "ENGINEERING ARENA CHAMPION 🏆" : "ARENA PARTICIPANT"
  };
}

// Backward compatibility validators
function validateLevel1(payload = {}) {
  const isCircuitOk = Boolean(payload.wireConnected);
  const isQOk = payload.selectedOption === 'A';
  if (!isCircuitOk) return { correct: false, score: 0, isCircuitOk: false, isQuestionOk: false };
  const score = isQOk ? 100 : 50;
  return { correct: isQOk, score, message: 'Circuit Master Unlocked!', isCircuitOk: true, isQuestionOk: isQOk };
}

function validateLevel2(payload = {}) {
  if (payload.category === 'Bonus Points') return { correct: true, score: 100, isBonus: true };
  const isCorrect = payload.selectedOption === 'A';
  return { correct: isCorrect, score: isCorrect ? 100 : 50, message: 'Spin Arena Completed!' };
}

function validateLevel3(payload = {}) {
  const placed = payload.placedComponents || {};
  const isBridgeOk = Boolean(placed.foundation && placed.deck && placed.arch);
  if (!isBridgeOk) return { correct: false, score: 0, isBridgeOk: false };
  const isQOk = payload.selectedOption === 'A';
  return { correct: isQOk, score: isQOk ? 100 : 50, message: 'Junior Engineer Unlocked!', isBridgeOk: true };
}

function validateLevel4(payload = {}) {
  const c1 = payload.c1Option === 'C';
  const c2 = payload.c2Component === 'motor';
  const c3 = String(payload.c3Pin || '').trim() === '10';
  const all = c1 && c2 && c3;
  return {
    correct: all,
    score: all ? 100 : 0,
    badge: 'ENGINEERING ESCAPE MASTER'
  };
}

module.exports = {
  QUESTIONS_PER_LEVEL,
  QUESTIONS_PER_ROUND,
  LEVEL_ORDER,
  LEVEL_METADATA,
  QUESTION_BANKS,
  hashString,
  getAssignedQuestionForStudent,
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
