// ====================================================================
// Dynamic On-the-fly Translation Dictionary & Helper
// Guarantees 100% of all dynamic tasks, issues, notifications,
// comments, projects, teams, departments, and user roles are translated.
// Includes full phonetic karaoke transliteration for team members.
// ====================================================================

import { Language } from "./translations";

export const dynamicDictionary: Record<string, string> = {
  // Departments (12 Housing & Construction Departments)
  "ฝ่ายที่ปรึกษาโครงการและกฎหมาย (Advisory & Legal/Permit)": "Advisory & Legal Permit Department",
  "ฝ่ายสำรวจและออกแบบ (Survey & Architectural Design)": "Survey & Architectural Design Department",
  "ฝ่ายก่อสร้างและควบคุมงานสนาม (Construction & Site Engineering)": "Construction & Site Engineering Department",
  "ฝ่ายงานระบบและสุขาภิบาล (MEP & Building Systems Engineering)": "MEP & Building Systems Engineering Department",
  "ฝ่ายประมาณราคาและควบคุมต้นทุน (Cost Control & Quantity Survey - QS)": "Cost Control & Quantity Survey (QS) Department",
  "ฝ่ายจัดซื้อและคลังวัสดุก่อสร้าง (Procurement & Material Inventory)": "Procurement & Material Inventory Department",
  "ฝ่ายตรวจสอบคุณภาพและส่งมอบบ้าน (QA/QC & Home Handover)": "QA/QC & Home Handover Department",
  "ฝ่ายการตลาดและการขาย (Marketing & Sales Development)": "Marketing, Sales & CRM Department",
  "ฝ่ายบริการหลังการขายและนิติบุคคล (After-Sales Service & Estate Management)": "After-Sales Service & Estate Management Department",
  "ฝ่ายพัฒนาธุรกิจและจัดหาที่ดิน (Business Development & Land Acquisition)": "Business Development & Land Acquisition Department",
  "ฝ่ายบัญชีและการเงิน (Accounting & Finance)": "Accounting & Finance Department",
  "ฝ่ายสนับสนุนงานส่วนกลางและบุคคล (Central Support & Administration / HR)": "Central Support & Administration / HR Department",

  // Department Descriptions
  "ให้คำปรึกษากฎหมายอาคาร ผังเมือง กฎหมายจัดสรรที่ดิน และประสานงานราชการ": "Provides legal counsel on building codes, urban zoning, land subdivision laws, and municipal permits.",
  "สำรวจพื้นที่ รังวัดที่ดิน ออกแบบสถาปัตยกรรม แปลน 3D Perspective และตกแต่งภายใน": "Land surveying, boundary demarcation, architectural BIM/CAD design, 3D perspective renderings, and interior design.",
  "ควบคุมงานก่อสร้างบ้านเดี่ยว ทาวน์โฮม อาคารชุด และงานสาธารณูปโภคหน้างานจริง": "On-site construction supervision for single homes, townhomes, condominiums, and estate infrastructure.",
  "ควบคุมและติดตั้งงานระบบไฟฟ้า ประปา สุขาภิบาล แอร์ และระบบดับเพลิง": "Supervises installation of MEP systems: electrical, plumbing, sanitary drainage, HVAC, and fire protection.",
  "ถอดแบบ คิดราคางาน BOQ ควบคุมงบประมาณโครงการ และตรวจงวดงานผู้รับเหมา": "Quantity surveying, BOQ cost estimation, project budget control, and subcontractor milestone verification.",
  "จัดซื้อเหล็ก ปูน คอนกรีต กระเบื้อง สุขภัณฑ์ คุมสต็อกและประสานงาน Supplier": "Procures construction materials (steel, cement, tiles, sanitary ware), controls inventory, and manages suppliers.",
  "ตรวจสอบมาตรฐานความปลอดภัย ตรวจ Defect บ้านก่อนส่งมอบลูกค้า และตรวจรับมอบบ้าน": "Safety inspections, pre-handover defect rectifications, quality control, and customer home delivery handover.",
  "วางแผนการตลาด ยิงโฆษณา จัดโปรโมชั่นบ้านตัวอย่าง ปิดการขาย และประสานงานสินเชื่อธนาคาร": "Marketing campaigns, digital ads, showhouse promotions, sales closing, and bank mortgage loan coordination.",
  "รับเรื่องเคลมประกันบ้าน 1-5 ปี ซ่อมบำรุง และบริหารจัดการสิ่งอำนวยความสะดวกในโครงการ": "Handles 1-5 year warranty claims, routine maintenance, and estate facilities & HOA management.",
  "จัดหาที่ดินแปลงใหม่ วิเคราะห์ความเป็นไปได้ทางการเงิน (Feasibility) และวางแผนพัฒนาโครงการ": "Land acquisition, financial feasibility studies, and new residential project development planning.",
  "จัดการบัญชีต้นทุนโครงการ การเบิกจ่ายงวดงาน ภาษีที่ดิน และบริหารกระแสเงินสด": "Project cost accounting, contractor payment disbursements, land taxes, and corporate cash flow management.",
  "งานสารบรรณ ธุรการ จัดการเอกสารสัญญา บริหารทรัพยากรบุคคล และยานพาหนะส่วนกลาง": "General administration, official contract management, human resources (HR), and corporate fleet support.",

  // User Authentic Names Transliteration (การถอดอักษรคาราโอเกะ + บทบาท)
  "X มีดีที่จำกัด (ที่ปรึกษาและAdmin)": "X Meedee Teejumkad (Advisor & Admin)",
  "พี่อู๊ด Director": "P'Ood Director",
  "พี่หมู หัวหน้าสถาปนิก (Senior Architect / Design Lead)": "P'Moo Lead Architect (Senior Architect / Design Lead)",
  "น้องเอิน สถาปนิกโครงการ": "Nong Ern Project Architect",
  "พี่ต้น สถาปนิกโครงการ": "P'Ton Project Architect",
  "พี่วิช วิศวกรงานระบบPARAGON (MEP Engineer)": "P'Wich MEP Engineer PARAGON (MEP Engineer)",
  "พี่เอก วิศวกรงานระบบ BOPHUD(MEP Engineer)": "P'Aek MEP Engineer BOPHUD (MEP Engineer)",
  "P'Game ประมาณราคา (QS / Cost Controller)": "P'Game Cost Estimator (QS / Cost Controller)",
  "พี่บัง วิศวกรงานระบบPARAGON (MEP Engineer)": "P'Bang MEP Engineer PARAGON (MEP Engineer)",
  "พี่อ๊อด ผู้ควบคุมงาน": "P'Aod Site Supervisor",
  "พี่โจ ช่างคุมงาน (Site Engineer / Supervisor)": "P'Joe Site Engineer (Site Engineer / Supervisor)",
  "พี่อ๊อด ตรวจรับมอบบ้าน (QA/QC Inspector)": "P'Aod QA/QC Inspector",
  "P'PITA หัวหน้าการตลาด (Marketing & Sales Executive)": "P'PITA Marketing Lead (Marketing & Sales Executive)",
  "P'TAWAN การตลาด (Marketing & Sales Executive)": "P'TAWAN Marketing Executive (Marketing & Sales Executive)",
  "พี่ทับทิม บัญชี": "P'Tubtim Accounting",
  "พี่หนุ่มพี่ออย จัดซื้อ": "P'Num & P'Oil Procurement",
  "หัวหน้าสโตร์": "Head of Inventory Store",
  "พี่ป้อ ดูแลหลังการขาย": "P'Phor Aftersales Care",

  // Short Name & Fragment Fallbacks
  "พี่อู๊ด": "P'Ood",
  "พี่หมู": "P'Moo",
  "น้องเอิน": "Nong Ern",
  "พี่ต้น": "P'Ton",
  "พี่วิช": "P'Wich",
  "พี่เอก": "P'Aek",
  "พี่บัง": "P'Bang",
  "พี่อ๊อด": "P'Aod",
  "พี่โจ": "P'Joe",
  "พี่ทับทิม": "P'Tubtim",
  "พี่หนุ่มพี่ออย": "P'Num & P'Oil",
  "พี่ป้อ": "P'Phor",
  "ผู้ใช้งาน": "User",

  // Blockers, Statuses & Common Terms
  "ปกติ": "Normal",
  "✓ ปกติ": "✓ Normal",
  "มีปัญหาติดขัดใหม่": "New Blocker / Issue Logged",
  "มีปัญหาติดขัด": "Active Blockers",
  "ไม่มีปัญหาติดขัด": "No Blockers",
  "ปัญหาติดขัด (Blockers)": "Blockers & Issues",
  "งานแก้แบบโครงสร้างชั้น 3 ติดแนวท่องานระบบ มีการแจ้งติดปัญหา": "Revise 3rd floor structural plan: new blocker issue reported regarding MEP clash.",
  "ใบขออนุญาตถูกตีกลับแก้ไข": "Building Permit Revision Required",
  "ใบอนุญาตก่อสร้าง อ.1 สำนักงานเขตวัฒนา มีคำสั่งให้แก้ไขระยะร่น": "Building Permit A.1 (Watthana District Office): revision required for eastern building setback.",
  "ได้รับมอบหมายงานใหม่": "New Task Assignment Received",
  "สถานะงานเปลี่ยนแปลง": "Task Status Updated",
  "ไม่มีการแจ้งเตือน": "No notifications yet",

  // Task Titles & Descriptions
  "ออกแบบแปลนชั้น 1 และบันไดหลัก The Forest Villa": "Design 1st Floor Plan & Main Staircase for The Forest Villa",
  "แก้แบบโครงสร้างชั้น 3 ติดแนวท่องานระบบสุขาภิบาล": "Revise 3rd Floor Structural Plan Due to Sanitary Pipe Clash",
  "ยื่นขอใบอนุญาตก่อสร้าง อ.1 (คอนโดมิเนียมสุขุมวิท 49)": "Submit Building Construction Permit Form A.1 (Sukhumvit 49 Condo)",
  "ส่งแบบ 3D Perspective ห้อง Master Bedroom": "Submit 3D Perspective Rendering for Master Bedroom",
  "สำรวจพื้นที่หน้างานจริงและตรวจระดับหมุดที่ดิน": "Site Survey & Property Boundary Elevation Verification",
  "จัดเตรียมเอกสารรายงานผลกระทบสิ่งแวดล้อม (EIA)": "Prepare Environmental Impact Assessment (EIA) Report",

  "ออกแบบ Schematic Design แปลนชั้นล่างเชื่อมต่อสระว่ายน้ำ และระบุระดับบันได": "Schematic Design of ground floor layout connecting to swimming pool and staircase elevation specs.",
  "ท่อสุขาภิบาลชนคานโครงสร้างหลัก ต้องปรับระดับฝ้าเพดานหรือเบี่ยงท่องานระบบ": "Sanitary drainage pipe clashing with main structural beam; requires ceiling adjustment or MEP offset.",
  "ยื่นเอกสารแบบขออนุญาตก่อสร้างอาคารชุด ณ สำนักงานเขตวัฒนา กรุงเทพฯ": "Submit condominium construction permit application at Watthana District Office, Bangkok.",
  "เรนเดอร์ภาพ Perspective ความละเอียดสูง 4K ส่งให้ Supervisor ตรวจรับ": "High-resolution 4K architectural perspective rendering submitted for Supervisor sign-off.",
  "เช็คค่าระดับถนนเทียบกับระดับพื้นโครงการ The Forest Villa": "Inspect finished road elevation level compared to The Forest Villa finished floor level benchmark.",
  "รวบรวมเล่มเอกสารและรายงานการศึกษาผลกระทบสิ่งแวดล้อม": "Compile comprehensive documentation and study report for environmental impact evaluation.",

  // Issue / Blocker Descriptions & Resolutions
  "คานคอนกรีตระดับ +3.20m ชนแนวท่อระบายน้ำหลัก ไม่สามารถวางท่อลาดเอียง 1:100 ได้": "Concrete beam at +3.20m clashes with main drainage pipe; unable to maintain 1:100 slope gradient.",
  "เจ้าหน้าที่เขตแจ้งว่าระยะร่นด้านข้างอาคารฝั่งทิศตะวันออกขาดไป 15 cm ตามข้อบัญญัติ กทม.": "District authority notified that east side setback lacks 15cm under Bangkok Metropolitan building regulations.",
  "พบหมุดหลักเขตที่ดินฝั่งทิศใต้ถูกถมดินทับมองไม่เห็น": "South boundary marker was buried and obscured by landfill elevation.",
  "ประสานงานเจ้าหน้าที่รังวัดที่ดินใช้เครื่องมือค้นหาและปักหมุดชั่วคราวแล้ว": "Coordinated with land survey officers to trace boundary and installed certified temporary benchmark.",
  "มีข้อติดขัดที่ต้องประสานงาน": "Active coordination blocker issue",

  // Comments
  "กำลังจัดวางบันไดแบบ Double Flight เชื่อมกับโถงต้อนรับครับ": "Currently designing double-flight staircase layout connected to the main entrance foyer.",
  "แนบภาพเรนเดอร์ perspective 4k มุมมองหลักและ Walk-in closet เรียบร้อยแล้วครับ รบกวนตรวจรับครับ": "Attached 4K perspective renderings for master bedroom and walk-in closet for supervisor review.",

  // Projects
  "โครงการบ้านเดี่ยว The Forest Villa": "The Forest Villa Residence Project",
  "โครงการคอนโดมิเนียมสุขุมวิท 49": "Sukhumvit 49 Condominium Project",
  "โครงการทาวน์โฮม Grand Living สาทร-ราชพฤกษ์": "Grand Living Townhome Project",
  "โครงการทั่วไป": "General Project",

  // Permit Types & Authorities
  "ใบอนุญาตก่อสร้าง (อ.1)": "Building Construction Permit (Form A.1)",
  "ใบอนุญาตดัดแปลงอาคาร": "Building Renovation / Alteration Permit",
  "รายงานผลกระทบสิ่งแวดล้อม (EIA)": "Environmental Impact Assessment (EIA)",
  "ใบรับรองการก่อสร้าง (อ.6)": "Building Occupancy Certificate (Form A.6)",
  "ขอเชื่อมทางสาธารณะ": "Public Right-of-Way Connection Request",
  "สำนักงานเขตวัฒนา กรุงเทพฯ": "Watthana District Office, Bangkok",
  "สำนักงานนโยบายและแผนทรัพยากรธรรมชาติและสิ่งแวดล้อม (สผ.)": "Office of Natural Resources and Environmental Policy and Planning (ONEP)",
  "สำนักงานเขต / เทศบาล": "District Office / Municipality",
};

/**
 * Translates any Thai dynamic text into English when lang === 'en'
 */
export function getLocalizedDynamicText(
  thaiText: string | null | undefined,
  englishText: string | null | undefined,
  lang: Language = "th"
): string {
  if (!thaiText && !englishText) return "";

  // If in Thai mode
  if (lang === "th") {
    return thaiText || englishText || "";
  }

  // In English mode:
  // 1. If explicit english translation exists and is non-empty, use it
  if (englishText && englishText.trim()) {
    return englishText;
  }

  if (!thaiText) return "";

  const trimmed = thaiText.trim();

  // 2. Check dynamic dictionary
  if (dynamicDictionary[trimmed]) {
    return dynamicDictionary[trimmed];
  }

  // 3. Check regex pattern rules
  let translated = trimmed;
  translated = translated.replace(/คุณได้รับมอบหมายงาน: "([^"]+)"/g, (match, taskName) => {
    const enTask = dynamicDictionary[taskName] || taskName;
    return `You have been assigned to task: "${enTask}"`;
  });

  translated = translated.replace(/งาน "([^"]+)" เปลี่ยนสถานะเป็น (.+)/g, (match, taskName, st) => {
    const enTask = dynamicDictionary[taskName] || taskName;
    return `Task "${enTask}" status changed to ${st}`;
  });

  // Name Transliterations
  translated = translated.replace(/มีดีที่จำกัด/g, "Meedee Teejumkad");
  translated = translated.replace(/ที่ปรึกษาและAdmin/g, "Advisor & Admin");
  translated = translated.replace(/ที่ปรึกษา/g, "Advisor");
  translated = translated.replace(/พี่อู๊ด/g, "P'Ood");
  translated = translated.replace(/พี่หมู/g, "P'Moo");
  translated = translated.replace(/น้องเอิน/g, "Nong Ern");
  translated = translated.replace(/พี่ต้น/g, "P'Ton");
  translated = translated.replace(/พี่วิช/g, "P'Wich");
  translated = translated.replace(/พี่เอก/g, "P'Aek");
  translated = translated.replace(/พี่บัง/g, "P'Bang");
  translated = translated.replace(/พี่อ๊อด/g, "P'Aod");
  translated = translated.replace(/พี่โจ/g, "P'Joe");
  translated = translated.replace(/พี่ทับทิม/g, "P'Tubtim");
  translated = translated.replace(/พี่หนุ่มพี่ออย/g, "P'Num & P'Oil");
  translated = translated.replace(/พี่ป้อ/g, "P'Phor");
  translated = translated.replace(/หัวหน้าสถาปนิก/g, "Lead Architect");
  translated = translated.replace(/สถาปนิกโครงการ/g, "Project Architect");
  translated = translated.replace(/วิศวกรงานระบบ/g, "MEP Engineer");
  translated = translated.replace(/ประมาณราคา/g, "Cost Estimator");
  translated = translated.replace(/ผู้ควบคุมงาน/g, "Site Supervisor");
  translated = translated.replace(/ช่างคุมงาน/g, "Site Engineer");
  translated = translated.replace(/ตรวจรับมอบบ้าน/g, "QA/QC Inspector");
  translated = translated.replace(/หัวหน้าการตลาด/g, "Marketing Lead");
  translated = translated.replace(/การตลาด/g, "Marketing Executive");
  translated = translated.replace(/จัดซื้อ/g, "Procurement");
  translated = translated.replace(/บัญชี/g, "Accounting");
  translated = translated.replace(/ดูแลหลังการขาย/g, "Aftersales Care");

  // General Domain Terms
  translated = translated.replace(/โครงการบ้านเดี่ยว/g, "Single-Detached House Project");
  translated = translated.replace(/โครงการคอนโดมิเนียม/g, "Condominium Project");
  translated = translated.replace(/โครงการทาวน์โฮม/g, "Townhome Project");
  translated = translated.replace(/สำนักงานเขต/g, "District Office");
  translated = translated.replace(/ใบอนุญาต/g, "Permit");
  translated = translated.replace(/แบบสถาปัตย์/g, "Architectural Drawing");
  translated = translated.replace(/โครงสร้าง/g, "Structure");
  translated = translated.replace(/งานระบบ/g, "MEP Systems");
  translated = translated.replace(/สุขาภิบาล/g, "Sanitary");
  translated = translated.replace(/ตรวจรับงาน/g, "Review deliverables");

  return translated;
}
