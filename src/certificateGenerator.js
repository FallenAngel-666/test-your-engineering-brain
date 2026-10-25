/**
 * High-Quality Landscape PDF Certificate Generator
 * Uses pdf-lib with official institutional branding and vector typography.
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

// Candidate template paths for local & serverless cloud (Vercel)
const CANDIDATE_TEMPLATE_PATHS = [
  path.join(__dirname, '..', 'assets', 'certificate-clean-template.jpg'),
  path.join(process.cwd(), 'assets', 'certificate-clean-template.jpg'),
  path.join(__dirname, '..', 'public', 'assets', 'logos', 'certificate-clean-template.jpg'),
  path.join(process.cwd(), 'public', 'assets', 'logos', 'certificate-clean-template.jpg'),
  path.join(__dirname, '..', 'assets', 'certificate-template.jpg'),
  path.join(process.cwd(), 'assets', 'certificate-template.jpg')
];

function getTemplateBytes() {
  for (const p of CANDIDATE_TEMPLATE_PATHS) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p);
    }
  }
  throw new Error('Certificate template background image could not be located.');
}

const OUTPUT_DIR = process.env.VERCEL
  ? path.join('/tmp', 'generated_certificates')
  : path.join(__dirname, '..', 'generated_certificates');

try {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
} catch (e) {}

/**
 * Format a Date object into readable formal string (e.g. October 26, 2026)
 */
function formatDate(dateInput) {
  const date = dateInput ? new Date(dateInput) : new Date();
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Generates a landscape PDF certificate
 * @param {Object} options
 * @param {string} options.certificateId
 * @param {string} options.fullName
 * @param {string} options.branch
 * @param {number} options.score
 * @param {number} options.percentage
 * @param {string|Date} options.completionDate
 * @returns {Promise<{ filePath: string, pdfBuffer: Buffer, fileName: string }>}
 */
async function generateCertificatePdf({
  certificateId,
  fullName,
  branch,
  score,
  percentage,
  completionDate
}) {
  const pdfDoc = await PDFDocument.create();

  // Landscape A4: 841.89 x 595.28 points
  const pageWidth = 842;
  const pageHeight = 595;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);

  // Load and embed template background image
  const templateBytes = getTemplateBytes();
  const templateImage = await pdfDoc.embedJpg(templateBytes);
  page.drawImage(templateImage, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight
  });

  // Embed standard clean fonts
  const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Palette definitions matching institutional scheme
  const navyColor = rgb(0.06, 0.13, 0.24);    // Deep Navy #10223D
  const tealColor = rgb(0.14, 0.36, 0.38);    // Rich Teal #245C61
  const goldColor = rgb(0.72, 0.52, 0.12);    // Royal Gold #B8851F
  const darkSlate = rgb(0.20, 0.25, 0.30);    // Charcoal Slate #33404D
  const mutedText = rgb(0.42, 0.48, 0.54);    // Muted grey #6B7B8A

  // 1. RECIPIENT NAME
  // Centered above the line at y = 206 pt. The baseline is around y = 216 pt.
  // Center is between x = 65 and x = 620 -> center anchor = 342.
  const nameText = (fullName || 'Participant').toUpperCase();
  const maxNameWidth = 460;
  let nameSize = 25;

  let calculatedWidth = fontTimesBold.widthOfTextAtSize(nameText, nameSize);
  while (calculatedWidth > maxNameWidth && nameSize > 14) {
    nameSize -= 1;
    calculatedWidth = fontTimesBold.widthOfTextAtSize(nameText, nameSize);
  }

  const nameX = 342 - (calculatedWidth / 2);
  const nameY = 215;

  page.drawText(nameText, {
    x: Math.max(65, nameX),
    y: nameY,
    size: nameSize,
    font: fontTimesBold,
    color: navyColor
  });

  // 2. CERTIFICATE DESCRIPTION (exact requested text)
  const descLine1 = "Thank you for participating in the Test Your Engineering Brain quiz";
  const descLine2 = "and testing your engineering knowledge.";
  const d1Width = fontTimesItalic.widthOfTextAtSize(descLine1, 13.5);
  const d2Width = fontTimesItalic.widthOfTextAtSize(descLine2, 13.5);

  page.drawText(descLine1, {
    x: 342 - (d1Width / 2),
    y: 172,
    size: 13.5,
    font: fontTimesItalic,
    color: tealColor
  });

  page.drawText(descLine2, {
    x: 342 - (d2Width / 2),
    y: 154,
    size: 13.5,
    font: fontTimesItalic,
    color: tealColor
  });

  // 3. METADATA CARDS / BADGES
  // Bottom info area (Branch, Score, Date, Certificate ID)
  // Clean decorative divider line above metadata
  page.drawLine({
    start: { x: 65, y: 136 },
    end: { x: 615, y: 136 },
    thickness: 0.75,
    color: rgb(0.85, 0.88, 0.90)
  });

  // Engineering Branch
  const branchLabel = `Branch: ${branch}`;
  let branchSize = 10;
  let branchWidth = fontHelveticaBold.widthOfTextAtSize(branchLabel, branchSize);
  if (branchWidth > 260) {
    branchSize = 9;
  }

  page.drawText(branchLabel, {
    x: 65,
    y: 116,
    size: branchSize,
    font: fontHelveticaBold,
    color: darkSlate
  });

  // Score Badge
  const scoreText = `Score: ${score} / 10 (${percentage}%)`;
  page.drawText(scoreText, {
    x: 410,
    y: 116,
    size: 10.5,
    font: fontHelveticaBold,
    color: score >= 7 ? rgb(0.10, 0.52, 0.42) : rgb(0.18, 0.35, 0.55)
  });

  // Completion Date
  const dateStr = `Date: ${formatDate(completionDate)}`;
  page.drawText(dateStr, {
    x: 65,
    y: 96,
    size: 9.5,
    font: fontHelvetica,
    color: mutedText
  });

  // Certificate ID
  const certIdText = `Certificate ID: ${certificateId}`;
  page.drawText(certIdText, {
    x: 410,
    y: 96,
    size: 9.5,
    font: fontHelveticaBold,
    color: darkSlate
  });

  // Authentication & Verification footer
  page.drawText("Official E-Certificate • MGR IEI Students Chapter • Dr. M.G.R. Educational and Research Institute", {
    x: 65,
    y: 74,
    size: 7.5,
    font: fontHelvetica,
    color: mutedText
  });

  // Small subtle digital seal mark
  page.drawRectangle({
    x: 535,
    y: 88,
    width: 80,
    height: 38,
    borderWidth: 1,
    borderColor: rgb(0.72, 0.52, 0.12),
    color: rgb(1, 0.98, 0.94)
  });

  page.drawText("MGR IEI", {
    x: 554,
    y: 110,
    size: 8,
    font: fontHelveticaBold,
    color: goldColor
  });

  page.drawText("VERIFIED", {
    x: 550,
    y: 96,
    size: 7.5,
    font: fontHelveticaBold,
    color: tealColor
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  const fileName = `Your_Engineering_Brain_Certificate_${certificateId}.pdf`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  try {
    fs.writeFileSync(filePath, pdfBuffer);
  } catch (err) {
    console.warn('[Certificate] File write to disk skipped or unavailable:', err.message);
  }

  return {
    filePath,
    pdfBuffer,
    fileName
  };
}

module.exports = {
  generateCertificatePdf,
  formatDate
};
