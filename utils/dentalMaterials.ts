/**
 * Dental Materials Preset
 * Contains common dental materials used in dental treatments
 * Organized by category for easy management
 */

export interface DentalMaterial {
  name: string;
  description: string;
  unitCost: number;
  minStockLevel: number;
}

export const DENTAL_MATERIALS: Record<string, DentalMaterial[]> = {
  // مواد الحشو - Filling Materials
  fillings: [
    { name: "Composite Resin (A1)", description: "حشو كومبوزيت لون A1", unitCost: 7500, minStockLevel: 5 },
    { name: "Composite Resin (A2)", description: "حشو كومبوزيت لون A2", unitCost: 7500, minStockLevel: 5 },
    { name: "Composite Resin (A3)", description: "حشو كومبوزيت لون A3", unitCost: 7500, minStockLevel: 5 },
    { name: "Composite Resin (A3.5)", description: "حشو كومبوزيت لون A3.5", unitCost: 7500, minStockLevel: 5 },
    { name: "Composite Resin (B1)", description: "حشو كومبوزيت لون B1", unitCost: 7500, minStockLevel: 5 },
    { name: "Composite Resin (B2)", description: "حشو كومبوزيت لون B2", unitCost: 7500, minStockLevel: 5 },
    { name: "Composite Resin (C2)", description: "حشو كومبوزيت لون C2", unitCost: 7500, minStockLevel: 5 },
    { name: "Glass Ionomer Cement", description: "سمنت زجاجي أيونومر", unitCost: 4000, minStockLevel: 3 },
    { name: "Amalgam Capsules", description: "كبسولات أمالغام", unitCost: 2500, minStockLevel: 10 },
    { name: "Flowable Composite", description: "كومبوزيت سائل", unitCost: 9000, minStockLevel: 3 },
  ],

  // مواد التخدير - Anesthetics
  anesthetics: [
    { name: "Lidocaine 2% with Epinephrine 1:100,000", description: "ليدوكائين 2% مع إبينفرين", unitCost: 1250, minStockLevel: 20 },
    { name: "Lidocaine 2% with Epinephrine 1:50,000", description: "ليدوكائين 2% مع إبينفرين قوي", unitCost: 1400, minStockLevel: 15 },
    { name: "Mepivacaine 3% Plain", description: "ميبيفاكائين 3% بدون إبينفرين", unitCost: 1500, minStockLevel: 15 },
    { name: "Articaine 4% with Epinephrine 1:100,000", description: "أرتاكائين 4% مع إبينفرين", unitCost: 1750, minStockLevel: 15 },
    { name: "Prilocaine 4% with Epinephrine", description: "بريلوكائين 4% مع إبينفرين", unitCost: 1600, minStockLevel: 10 },
  ],

  // مواد علاج العصب - Endodontics
  endodontics: [
    { name: "Gutta Percha Points (ISO 15-40)", description: "نقاط جوتا بيركا", unitCost: 5000, minStockLevel: 20 },
    { name: "Root Canal Sealer (Epoxy)", description: "سمنت علاج العصب إيبوكسي", unitCost: 10000, minStockLevel: 5 },
    { name: "Root Canal Sealer (Bioceramic)", description: "سمنت علاج العصب بيوسيراميك", unitCost: 12500, minStockLevel: 3 },
    { name: "Calcium Hydroxide Paste", description: "معجون كالسيوم هيدروكسيد", unitCost: 7500, minStockLevel: 5 },
    { name: "MTA (Mineral Trioxide Aggregate)", description: "MTA لعلاج العصب", unitCost: 20000, minStockLevel: 2 },
    { name: "Files (Hand) K-Files", description: "ملفات يدوية K-Files", unitCost: 15000, minStockLevel: 10 },
    { name: "Files (Hand) H-Files", description: "ملفات يدوية H-Files", unitCost: 15000, minStockLevel: 10 },
    { name: "Rotary Files (ProTaper)", description: "ملفات دوارة ProTaper", unitCost: 25000, minStockLevel: 5 },
    { name: "Rotary Files (WaveOne)", description: "ملفات دوارة WaveOne", unitCost: 25000, minStockLevel: 5 },
    { name: "Paper Points", description: "نقاط ورقية للتجفيف", unitCost: 2500, minStockLevel: 30 },
  ],

  // مواد التركيبات - Prosthetics
  prosthetics: [
    { name: "Impression Material (Alginate)", description: "مادة القالب الطبيعي", unitCost: 4000, minStockLevel: 10 },
    { name: "Impression Material (Addition Silicone)", description: "مادة القالب سيليكون إضافي", unitCost: 15000, minStockLevel: 5 },
    { name: "Impression Material (Condensation Silicone)", description: "مادة القالب سيليكون تكثيف", unitCost: 12500, minStockLevel: 5 },
    { name: "Impression Material (Polyether)", description: "مادة القالب بولي إيثر", unitCost: 17500, minStockLevel: 3 },
    { name: "Acrylic Resin (Heat Cure)", description: "رزين أكريليك حراري", unitCost: 10000, minStockLevel: 3 },
    { name: "Acrylic Resin (Cold Cure)", description: "رزين أكريليك بارد", unitCost: 9000, minStockLevel: 3 },
    { name: "PMMA Powder", description: "بودرة PMMA", unitCost: 7500, minStockLevel: 5 },
    { name: "PMMA Liquid", description: "سائل PMMA", unitCost: 6000, minStockLevel: 5 },
    { name: "Dental Stone (Type IV)", description: "حجر سنوي نوع 4", unitCost: 5000, minStockLevel: 5 },
    { name: "Dental Plaster", description: "جبس سنوي", unitCost: 2500, minStockLevel: 10 },
  ],

  // مواد الوقاية - Preventive
  preventive: [
    { name: "Fluoride Varnish (5% NaF)", description: "ورنيش الفلورايد 5%", unitCost: 5000, minStockLevel: 5 },
    { name: "Pit and Fissure Sealant", description: "سيلانت الشقوق والثقوب", unitCost: 7500, minStockLevel: 5 },
    { name: "Prophy Paste (Fine)", description: "معجون التنظيف ناعم", unitCost: 2500, minStockLevel: 10 },
    { name: "Prophy Paste (Medium)", description: "معجون التنظيف متوسط", unitCost: 2500, minStockLevel: 10 },
    { name: "Disclosing Tablets", description: "أقراص كشف البلاك", unitCost: 1500, minStockLevel: 10 },
  ],

  // أدوات ومواد أخرى - Miscellaneous
  miscellaneous: [
    { name: "Cotton Rolls (Small)", description: "لفائف قطن صغيرة", unitCost: 1000, minStockLevel: 50 },
    { name: "Cotton Rolls (Large)", description: "لفائف قطن كبيرة", unitCost: 1250, minStockLevel: 50 },
    { name: "Gauze Pads (2x2)", description: "شاش معقم 2x2", unitCost: 750, minStockLevel: 30 },
    { name: "Gauze Pads (4x4)", description: "شاش معقم 4x4", unitCost: 1000, minStockLevel: 30 },
    { name: "Gloves (Latex) - Size S", description: "قفازات لاتكس مقاس S", unitCost: 1500, minStockLevel: 100 },
    { name: "Gloves (Latex) - Size M", description: "قفازات لاتكس مقاس M", unitCost: 1500, minStockLevel: 100 },
    { name: "Gloves (Latex) - Size L", description: "قفازات لاتكس مقاس L", unitCost: 1500, minStockLevel: 100 },
    { name: "Gloves (Nitrile) - Size S", description: "قفازات نايتيل مقاس S", unitCost: 2000, minStockLevel: 100 },
    { name: "Gloves (Nitrile) - Size M", description: "قفازات نايتيل مقاس M", unitCost: 2000, minStockLevel: 100 },
    { name: "Face Masks (Type IIR)", description: "كمامات طبية", unitCost: 500, minStockLevel: 50 },
  ],
};

/**
 * Get all materials as a flat array
 */
export function getAllMaterials(): DentalMaterial[] {
  return Object.values(DENTAL_MATERIALS).flat();
}

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: string): DentalMaterial[] {
  return DENTAL_MATERIALS[category] || [];
}

/**
 * Get all category names
 */
export function getMaterialCategories(): string[] {
  return Object.keys(DENTAL_MATERIALS);
}

/**
 * Get total count of all materials
 */
export function getTotalMaterialCount(): number {
  return getAllMaterials().length;
}
