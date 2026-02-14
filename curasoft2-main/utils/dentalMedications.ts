/**
 * Dental Medications Database - Egyptian Commercial Names
 * Contains common medications used in dental practice with Egyptian commercial names
 * Medication names are in English only, other data in Arabic
 */

export interface DentalMedication {
    id: string;
    nameAr: string;
    nameEn: string;
    category: MedicationCategory;
    defaultDosage: string;
    defaultQuantity: number;
    defaultInstructionsAr: string;
    concentration?: string;
    form: MedicationForm;
}

export type MedicationCategory = 
    | 'antibiotics'
    | 'analgesics'
    | 'antiinflammatories'
    | 'antiseptics'
    | 'antifungals'
    | 'antivirals'
    | 'muscleRelaxants'
    | 'vitamins'
    | 'other';

export type MedicationForm =
    | 'tablet'
    | 'capsule'
    | 'suspension'
    | 'gel'
    | 'mouthwash'
    | 'mouthspray'
    | 'rinse'
    | 'injection'
    | 'ointment'
    | 'cream'
    | 'drops';

export const MEDICATION_CATEGORIES: Record<MedicationCategory, { labelAr: string; labelEn: string }> = {
    antibiotics: { labelAr: 'مضادات الحيوية', labelEn: 'Antibiotics' },
    analgesics: { labelAr: 'مسكنات الألم', labelEn: 'Analgesics' },
    antiinflammatories: { labelAr: 'مضادات الالتهاب', labelEn: 'Anti-inflammatories' },
    antiseptics: { labelAr: 'المطهرات', labelEn: 'Antiseptics' },
    antifungals: { labelAr: 'مضادات الفطريات', labelEn: 'Antifungals' },
    antivirals: { labelAr: 'مضادات الفيروسات', labelEn: 'Antivirals' },
    muscleRelaxants: { labelAr: 'مرخيات العضلات', labelEn: 'Muscle Relaxants' },
    vitamins: { labelAr: 'الفيتامينات', labelEn: 'Vitamins' },
    other: { labelAr: 'أخرى', labelEn: 'Other' }
};

export const DENTAL_MEDICATIONS: DentalMedication[] = [
    // Antibiotics - مضادات الحيوية
    {
        id: 'augmentin-1g',
        nameAr: 'أوجمنتين',
        nameEn: 'Augmentin 1g',
        category: 'antibiotics',
        defaultDosage: '1g',
        defaultQuantity: 14,
        defaultInstructionsAr: 'قرص كل 12 ساعة بعد الطعام لمدة 7 أيام',
        form: 'tablet'
    },
    {
        id: 'augmentin-625',
        nameAr: 'أوجمنتين',
        nameEn: 'Augmentin 625mg',
        category: 'antibiotics',
        defaultDosage: '625mg',
        defaultQuantity: 14,
        defaultInstructionsAr: 'قرص كل 8 ساعات بعد الطعام لمدة 7 أيام',
        form: 'tablet'
    },
    {
        id: 'amoxil-500',
        nameAr: 'أموكسيل',
        nameEn: 'Amoxil 500mg',
        category: 'antibiotics',
        defaultDosage: '500mg',
        defaultQuantity: 21,
        defaultInstructionsAr: 'قرص كل 8 ساعات بعد الطعام لمدة 7 أيام',
        form: 'capsule'
    },
    {
        id: 'hiconcil-500',
        nameAr: 'هايكونسيل',
        nameEn: 'Hiconcil 500mg',
        category: 'antibiotics',
        defaultDosage: '500mg',
        defaultQuantity: 21,
        defaultInstructionsAr: 'قرص كل 8 ساعات بعد الطعام لمدة 7 أيام',
        form: 'capsule'
    },
    {
        id: 'zithromax-500',
        nameAr: 'زيثرماكس',
        nameEn: 'Zithromax 500mg',
        category: 'antibiotics',
        defaultDosage: '500mg',
        defaultQuantity: 3,
        defaultInstructionsAr: 'قرص واحد يومياً على معدة فارغة (قبل الأكل بساعة أو بعد الأكل بساعتين)',
        form: 'tablet'
    },
    {
        id: 'azithro-500',
        nameAr: 'أزيثرو',
        nameEn: 'Azithro 500mg',
        category: 'antibiotics',
        defaultDosage: '500mg',
        defaultQuantity: 3,
        defaultInstructionsAr: 'قرص واحد يومياً على معدة فارغة (قبل الأكل بساعة أو بعد الأكل بساعتين)',
        form: 'tablet'
    },
    {
        id: 'cleocin-300',
        nameAr: 'كليوسين',
        nameEn: 'Cleocin 300mg',
        category: 'antibiotics',
        defaultDosage: '300mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص كل 6 ساعات بعد الطعام',
        form: 'capsule'
    },
    {
        id: 'dalacin-300',
        nameAr: 'دالاسين',
        nameEn: 'Dalacin 300mg',
        category: 'antibiotics',
        defaultDosage: '300mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص كل 6 ساعات بعد الطعام',
        form: 'capsule'
    },
    {
        id: 'flagyl-500',
        nameAr: 'فلاجيل',
        nameEn: 'Flagyl 500mg',
        category: 'antibiotics',
        defaultDosage: '500mg',
        defaultQuantity: 15,
        defaultInstructionsAr: 'قرص كل 8 ساعات بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'metrogyl-400',
        nameAr: 'ميتروجيل',
        nameEn: 'Metrogyl 400mg',
        category: 'antibiotics',
        defaultDosage: '400mg',
        defaultQuantity: 15,
        defaultInstructionsAr: 'قرص كل 8 ساعات بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'zinnat-500',
        nameAr: 'زينات',
        nameEn: 'Zinnat 500mg',
        category: 'antibiotics',
        defaultDosage: '500mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص كل 12 ساعة بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'pen-vee-k',
        nameAr: 'بن في كي',
        nameEn: 'Pen-Vee K 500mg',
        category: 'antibiotics',
        defaultDosage: '500mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص كل 6 ساعات',
        form: 'tablet'
    },
    {
        id: 'vibramycin-100',
        nameAr: 'فيبراميسين',
        nameEn: 'Vibramycin 100mg',
        category: 'antibiotics',
        defaultDosage: '100mg',
        defaultQuantity: 14,
        defaultInstructionsAr: 'قرص كل 12 ساعة بعد الطعام مع كمية كافية من الماء',
        form: 'capsule'
    },
    {
        id: 'doxy-100',
        nameAr: 'دوكسي',
        nameEn: 'Doxy 100mg',
        category: 'antibiotics',
        defaultDosage: '100mg',
        defaultQuantity: 14,
        defaultInstructionsAr: 'قرص كل 12 ساعة بعد الطعام مع كمية كافية من الماء',
        form: 'capsule'
    },
    {
        id: 'sumamed-500',
        nameAr: 'سومامد',
        nameEn: 'Sumamed 500mg',
        category: 'antibiotics',
        defaultDosage: '500mg',
        defaultQuantity: 3,
        defaultInstructionsAr: 'قرص واحد يومياً على معدة فارغة (قبل الأكل بساعة أو بعد الأكل بساعتين)',
        form: 'tablet'
    },
    {
        id: 'amoclan-625',
        nameAr: 'أموكلان',
        nameEn: 'Amoclan 625mg',
        category: 'antibiotics',
        defaultDosage: '625mg',
        defaultQuantity: 14,
        defaultInstructionsAr: 'قرص كل 8 ساعات بعد الطعام لمدة 7 أيام',
        form: 'tablet'
    },

    // Analgesics - مسكنات الألم
    {
        id: 'brufen-400',
        nameAr: 'بروفين',
        nameEn: 'Brufen 400mg',
        category: 'analgesics',
        defaultDosage: '400mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص كل 6 ساعات عند الحاجة للألم بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'brufen-600',
        nameAr: 'بروفين',
        nameEn: 'Brufen 600mg',
        category: 'analgesics',
        defaultDosage: '600mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص كل 8 ساعات عند الحاجة للألم بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'advil-400',
        nameAr: 'أدفيل',
        nameEn: 'Advil 400mg',
        category: 'analgesics',
        defaultDosage: '400mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص كل 6 ساعات عند الحاجة للألم بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'panadol-500',
        nameAr: 'بانادول',
        nameEn: 'Panadol 500mg',
        category: 'analgesics',
        defaultDosage: '500mg',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص كل 6 ساعات عند الحاجة للألم (الحد الأقصى 4 أقراص يومياً)',
        form: 'tablet'
    },
    {
        id: 'panadol-extra',
        nameAr: 'بانادول إكسترا',
        nameEn: 'Panadol Extra',
        category: 'analgesics',
        defaultDosage: '500mg',
        defaultQuantity: 24,
        defaultInstructionsAr: 'قرص كل 6 ساعات عند الحاجة للألم (الحد الأقصى 4 أقراص يومياً)',
        form: 'tablet'
    },
    {
        id: 'adol-500',
        nameAr: 'أدول',
        nameEn: 'Adol 500mg',
        category: 'analgesics',
        defaultDosage: '500mg',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص كل 6 ساعات عند الحاجة للألم (الحد الأقصى 4 أقراص يومياً)',
        form: 'tablet'
    },
    {
        id: 'fevadol-500',
        nameAr: 'فيفادول',
        nameEn: 'Fevadol 500mg',
        category: 'analgesics',
        defaultDosage: '500mg',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص كل 6 ساعات عند الحاجة للألم (الحد الأقصى 4 أقراص يومياً)',
        form: 'tablet'
    },
    {
        id: 'naprosyn-500',
        nameAr: 'نابروسين',
        nameEn: 'Naprosyn 500mg',
        category: 'analgesics',
        defaultDosage: '500mg',
        defaultQuantity: 15,
        defaultInstructionsAr: 'قرص كل 12 ساعة بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'aleve-220',
        nameAr: 'أليف',
        nameEn: 'Aleve 220mg',
        category: 'analgesics',
        defaultDosage: '220mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص كل 8 ساعات عند الحاجة للألم بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'voltaren-50',
        nameAr: 'فولتارين',
        nameEn: 'Voltaren 50mg',
        category: 'analgesics',
        defaultDosage: '50mg',
        defaultQuantity: 15,
        defaultInstructionsAr: 'قرص كل 8 ساعات بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'cataflam-50',
        nameAr: 'كاتافلام',
        nameEn: 'Cataflam 50mg',
        category: 'analgesics',
        defaultDosage: '50mg',
        defaultQuantity: 15,
        defaultInstructionsAr: 'قرص كل 8 ساعات بعد الطعام',
        form: 'tablet'
    },
    {
        id: 'tramal-50',
        nameAr: 'ترامال',
        nameEn: 'Tramal 50mg',
        category: 'analgesics',
        defaultDosage: '50mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص كل 6 ساعات عند الحاجة للألم الحاد',
        form: 'tablet'
    },
    {
        id: 'tramadex-50',
        nameAr: 'ترامادكس',
        nameEn: 'Tramadex 50mg',
        category: 'analgesics',
        defaultDosage: '50mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص كل 6 ساعات عند الحاجة للألم الحاد',
        form: 'tablet'
    },
    {
        id: 'ponstan-500',
        nameAr: 'بونستان',
        nameEn: 'Ponstan 500mg',
        category: 'analgesics',
        defaultDosage: '500mg',
        defaultQuantity: 15,
        defaultInstructionsAr: 'قرص كل 8 ساعات عند الحاجة للألم بعد الطعام',
        form: 'tablet'
    },

    // Anti-inflammatories - مضادات الالتهاب
    {
        id: 'medrol-4',
        nameAr: 'ميدرول',
        nameEn: 'Medrol 4mg',
        category: 'antiinflammatories',
        defaultDosage: '4mg',
        defaultQuantity: 21,
        defaultInstructionsAr: 'قرص واحد يومياً في الصباح',
        form: 'tablet'
    },
    {
        id: 'deltacortril-5',
        nameAr: 'ديلتاكورتريل',
        nameEn: 'Deltacortril 5mg',
        category: 'antiinflammatories',
        defaultDosage: '5mg',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص واحد يومياً في الصباح',
        form: 'tablet'
    },
    {
        id: 'prednesol-5',
        nameAr: 'بريدنيزول',
        nameEn: 'Prednesol 5mg',
        category: 'antiinflammatories',
        defaultDosage: '5mg',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص واحد يومياً في الصباح',
        form: 'tablet'
    },
    {
        id: 'decadron-0.5',
        nameAr: 'ديكادرون',
        nameEn: 'Decadron 0.5mg',
        category: 'antiinflammatories',
        defaultDosage: '0.5mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص كل 6 ساعات',
        form: 'tablet'
    },
    {
        id: 'dexona-0.5',
        nameAr: 'ديكسونا',
        nameEn: 'Dexona 0.5mg',
        category: 'antiinflammatories',
        defaultDosage: '0.5mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص كل 6 ساعات',
        form: 'tablet'
    },

    // Antiseptics - المطهرات
    {
        id: 'corsodyl-mouthwash',
        nameAr: 'كورسوديل غسول',
        nameEn: 'Corsodyl Mouthwash',
        category: 'antiseptics',
        defaultDosage: '0.12%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'مضمضة 10 مللتر لمدة 30 ثانية مرتين يومياً',
        form: 'mouthwash'
    },
    {
        id: 'corsodyl-gel',
        nameAr: 'كورسوديل جل',
        nameEn: 'Corsodyl Gel',
        category: 'antiseptics',
        defaultDosage: '1%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'ضع كمية صغيرة على اللثة مرتين يومياً',
        form: 'gel'
    },
    {
        id: 'betadine-mouthwash',
        nameAr: 'بيتادين غسول',
        nameEn: 'Betadine Mouthwash',
        category: 'antiseptics',
        defaultDosage: '10%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'مضمضة 10 مللتر لمدة 30 ثانية',
        form: 'mouthwash'
    },
    {
        id: 'betadine-gargle',
        nameAr: 'بيتادين غرغرة',
        nameEn: 'Betadine Gargle',
        category: 'antiseptics',
        defaultDosage: '1%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'غرغرة 10 مللتر لمدة 30 ثانية',
        form: 'mouthwash'
    },
    {
        id: 'listerine-mouthwash',
        nameAr: 'ليسترين غسول',
        nameEn: 'Listerine Mouthwash',
        category: 'antiseptics',
        defaultDosage: '0.12%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'مضمضة 20 مللتر لمدة 30 ثانية مرتين يومياً',
        form: 'mouthwash'
    },
    {
        id: 'hexidine-mouthwash',
        nameAr: 'هيكسيدين غسول',
        nameEn: 'Hexidine Mouthwash',
        category: 'antiseptics',
        defaultDosage: '0.12%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'مضمضة 10 مللتر لمدة 30 ثانية مرتين يومياً',
        form: 'mouthwash'
    },

    // Antifungals - مضادات الفطريات
    {
        id: 'diflucan-150',
        nameAr: 'ديفلوكان',
        nameEn: 'Diflucan 150mg',
        category: 'antifungals',
        defaultDosage: '150mg',
        defaultQuantity: 1,
        defaultInstructionsAr: 'خذ كبسولة واحدة',
        form: 'capsule'
    },
    {
        id: 'fluzol-150',
        nameAr: 'فلوزول',
        nameEn: 'Fluzol 150mg',
        category: 'antifungals',
        defaultDosage: '150mg',
        defaultQuantity: 1,
        defaultInstructionsAr: 'خذ كبسولة واحدة',
        form: 'capsule'
    },
    {
        id: 'mycostatin-suspension',
        nameAr: 'مايكوستاتين مضمضة',
        nameEn: 'Mycostatin Suspension',
        category: 'antifungals',
        defaultDosage: '100,000 IU/ml',
        defaultQuantity: 1,
        defaultInstructionsAr: '4 مللتر مضمضة ثم بلع 4 مرات يومياً',
        form: 'rinse'
    },
    {
        id: 'daktarin-gel',
        nameAr: 'داكتارين جل',
        nameEn: 'Daktarin Gel',
        category: 'antifungals',
        defaultDosage: '2%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'ضع طبقة رقيقة على المنطقة المتأثرة 4 مرات يومياً',
        form: 'gel'
    },
    {
        id: 'nizoral-cream',
        nameAr: 'نيزورال كريم',
        nameEn: 'Nizoral Cream',
        category: 'antifungals',
        defaultDosage: '2%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'ضع طبقة رقيقة على المنطقة المتأثرة مرتين يومياً',
        form: 'ointment'
    },

    // Muscle Relaxants - مرخيات العضلات
    {
        id: 'flexeril-10',
        nameAr: 'فليكسيريل',
        nameEn: 'Flexeril 10mg',
        category: 'muscleRelaxants',
        defaultDosage: '10mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص ثلاث مرات يومياً',
        form: 'tablet'
    },
    {
        id: 'valium-5',
        nameAr: 'فاليوم',
        nameEn: 'Valium 5mg',
        category: 'muscleRelaxants',
        defaultDosage: '5mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص عند الحاجة (للتهدئة وتقلصات العضلات)',
        form: 'tablet'
    },
    {
        id: 'sirdalud-4',
        nameAr: 'سيردالود',
        nameEn: 'Sirdalud 4mg',
        category: 'muscleRelaxants',
        defaultDosage: '4mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص ثلاث مرات يومياً',
        form: 'tablet'
    },
    {
        id: 'mydocalm-50',
        nameAr: 'ميدوكالم',
        nameEn: 'Mydocalm 50mg',
        category: 'muscleRelaxants',
        defaultDosage: '50mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص ثلاث مرات يومياً',
        form: 'tablet'
    },

    // Vitamins - الفيتامينات
    {
        id: 'cebion-1000',
        nameAr: 'سيبيون',
        nameEn: 'Cebion 1000mg',
        category: 'vitamins',
        defaultDosage: '1000mg',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص واحد يومياً',
        form: 'tablet'
    },
    {
        id: 'redoxon-1000',
        nameAr: 'ريدوكسون',
        nameEn: 'Redoxon 1000mg',
        category: 'vitamins',
        defaultDosage: '1000mg',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص واحد يومياً',
        form: 'tablet'
    },
    {
        id: 'caltrate-600',
        nameAr: 'كالترات',
        nameEn: 'Caltrate 600mg',
        category: 'vitamins',
        defaultDosage: '600mg',
        defaultQuantity: 60,
        defaultInstructionsAr: 'قرص واحد مرتين يومياً',
        form: 'tablet'
    },
    {
        id: 'os-cal-500',
        nameAr: 'أوس كال',
        nameEn: 'Os-Cal 500mg',
        category: 'vitamins',
        defaultDosage: '500mg',
        defaultQuantity: 60,
        defaultInstructionsAr: 'قرص واحد مرتين يومياً',
        form: 'tablet'
    },
    {
        id: 'vigantol-1000',
        nameAr: 'فيجانتول',
        nameEn: 'Vigantol 1000 IU',
        category: 'vitamins',
        defaultDosage: '1000 IU',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص واحد يومياً',
        form: 'tablet'
    },
    {
        id: 'd3-1000',
        nameAr: 'فيتامين د3',
        nameEn: 'Vitamin D3 1000 IU',
        category: 'vitamins',
        defaultDosage: '1000 IU',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص واحد يومياً',
        form: 'tablet'
    },
    {
        id: 'centrum',
        nameAr: 'سنترم',
        nameEn: 'Centrum',
        category: 'vitamins',
        defaultDosage: '1 tablet',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص واحد يومياً',
        form: 'tablet'
    },
    {
        id: 'multivitamin',
        nameAr: 'فيتامينات متعددة',
        nameEn: 'Multivitamin',
        category: 'vitamins',
        defaultDosage: '1 tablet',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص واحد يومياً',
        form: 'tablet'
    },

    // Other - أخرى
    {
        id: 'zantac-150',
        nameAr: 'زانتاك',
        nameEn: 'Zantac 150mg',
        category: 'other',
        defaultDosage: '150mg',
        defaultQuantity: 30,
        defaultInstructionsAr: 'قرص مرتين يومياً قبل الطعام',
        form: 'tablet'
    },
    {
        id: 'losec-20',
        nameAr: 'لوسيك',
        nameEn: 'Losec 20mg',
        category: 'other',
        defaultDosage: '20mg',
        defaultQuantity: 14,
        defaultInstructionsAr: 'قرص على الريق صباحاً',
        form: 'capsule'
    },
    {
        id: 'prilosec-20',
        nameAr: 'بريلوسيك',
        nameEn: 'Prilosec 20mg',
        category: 'other',
        defaultDosage: '20mg',
        defaultQuantity: 14,
        defaultInstructionsAr: 'قرص على الريق صباحاً',
        form: 'capsule'
    },
    {
        id: 'clarityn-10',
        nameAr: 'كلاريتين',
        nameEn: 'Clarityn 10mg',
        category: 'other',
        defaultDosage: '10mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص واحد يومياً',
        form: 'tablet'
    },
    {
        id: 'claritin-10',
        nameAr: 'كلاريتين',
        nameEn: 'Claritin 10mg',
        category: 'other',
        defaultDosage: '10mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص واحد يومياً',
        form: 'tablet'
    },
    {
        id: 'gaviscon',
        nameAr: 'جافيسكون',
        nameEn: 'Gaviscon',
        category: 'other',
        defaultDosage: '10ml',
        defaultQuantity: 1,
        defaultInstructionsAr: 'خذ بعد الطعام وقبل النوم',
        form: 'rinse'
    },
    {
        id: 'motilium-10',
        nameAr: 'موتيليوم',
        nameEn: 'Motilium 10mg',
        category: 'other',
        defaultDosage: '10mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص قبل الطعام بـ 15-30 دقيقة',
        form: 'tablet'
    },
    {
        id: 'imodium-2',
        nameAr: 'إيموديوم',
        nameEn: 'Imodium 2mg',
        category: 'other',
        defaultDosage: '2mg',
        defaultQuantity: 10,
        defaultInstructionsAr: 'قرص عند الحاجة للإسهال',
        form: 'capsule'
    },
    {
        id: 'buscopan-10',
        nameAr: 'بوسكوبان',
        nameEn: 'Buscopan 10mg',
        category: 'other',
        defaultDosage: '10mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص ثلاث مرات يومياً عند الحاجة',
        form: 'tablet'
    },
    {
        id: 'spasfon-80',
        nameAr: 'سباسفون',
        nameEn: 'Spasfon 80mg',
        category: 'other',
        defaultDosage: '80mg',
        defaultQuantity: 20,
        defaultInstructionsAr: 'قرص ثلاث مرات يومياً عند الحاجة',
        form: 'tablet'
    },

    // Additional Mouthwashes - غسولات فموية إضافية
    {
        id: 'peridex-mouthwash',
        nameAr: 'بيريديكس غسول',
        nameEn: 'Peridex Mouthwash',
        category: 'antiseptics',
        defaultDosage: '0.12%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'مضمضة 15 مللتر لمدة 30 ثانية مرتين يومياً',
        form: 'mouthwash'
    },
    {
        id: 'savacol-mouthwash',
        nameAr: 'سافاكول غسول',
        nameEn: 'Savacol Mouthwash',
        category: 'antiseptics',
        defaultDosage: '0.12%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'مضمضة 10 مللتر لمدة 30 ثانية مرتين يومياً',
        form: 'mouthwash'
    },

    // Mouthsprays - رذاذات فموية
    {
        id: 'chlorhexidine-mouthspray',
        nameAr: 'كلورهيكسيدين رذاذ فموي',
        nameEn: 'Chlorhexidine Mouthspray',
        category: 'antiseptics',
        defaultDosage: '0.12%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'رش 2-3 مرات على المنطقة المصابة مرتين يومياً',
        form: 'mouthspray'
    },

    // Ointments - مراهم
    {
        id: 'triamcinolone-ointment',
        nameAr: 'تريامسينولون مرهم',
        nameEn: 'Triamcinolone Ointment',
        category: 'antiinflammatories',
        defaultDosage: '0.1%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'ضع طبقة رقيقة على المنطقة المصابة مرتين يومياً',
        form: 'ointment'
    },
    {
        id: 'mupirocin-ointment',
        nameAr: 'موبيروسين مرهم',
        nameEn: 'Mupirocin Ointment',
        category: 'antibiotics',
        defaultDosage: '2%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'ضع على المنطقة المصابة ثلاث مرات يومياً',
        form: 'ointment'
    },

    // Creams - كريمات
    {
        id: 'hydrocortisone-cream',
        nameAr: 'هيدروكورتيزون كريم',
        nameEn: 'Hydrocortisone Cream',
        category: 'antiinflammatories',
        defaultDosage: '1%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'ضع طبقة رقيقة على المنطقة المصابة مرتين يومياً',
        form: 'cream'
    },
    {
        id: 'clotrimazole-cream',
        nameAr: 'كلوتريمازول كريم',
        nameEn: 'Clotrimazole Cream',
        category: 'antifungals',
        defaultDosage: '1%',
        defaultQuantity: 1,
        defaultInstructionsAr: 'ضع على المنطقة المصابة مرتين يومياً',
        form: 'cream'
    }
];

// Helper functions
export function getMedicationsByCategory(category: MedicationCategory): DentalMedication[] {
    return DENTAL_MEDICATIONS.filter(med => med.category === category);
}

export function searchMedications(query: string, locale: 'ar' | 'en' = 'en'): DentalMedication[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return DENTAL_MEDICATIONS;
    
    return DENTAL_MEDICATIONS.filter(med => {
        const name = locale === 'ar' ? med.nameAr : med.nameEn;
        return name.toLowerCase().includes(normalizedQuery);
    });
}

export function getMedicationById(id: string): DentalMedication | undefined {
    return DENTAL_MEDICATIONS.find(med => med.id === id);
}

export function getAllMedications(): DentalMedication[] {
    return DENTAL_MEDICATIONS;
}

export function getCategories(): { value: MedicationCategory; label: string }[] {
    return Object.entries(MEDICATION_CATEGORIES).map(([value, { labelAr }]) => ({
        value: value as MedicationCategory,
        label: labelAr
    }));
}

export function getMedicationForms(): { value: MedicationForm; labelAr: string; labelEn: string }[] {
    return [
        { value: 'tablet', labelAr: 'أقراص', labelEn: 'Tablet' },
        { value: 'capsule', labelAr: 'كبسولات', labelEn: 'Capsule' },
        { value: 'suspension', labelAr: 'معلق', labelEn: 'Suspension' },
        { value: 'gel', labelAr: 'جل', labelEn: 'Gel' },
        { value: 'mouthwash', labelAr: 'غسول فموي', labelEn: 'Mouthwash' },
        { value: 'mouthspray', labelAr: 'رذاذ فموي', labelEn: 'Mouthspray' },
        { value: 'rinse', labelAr: 'مضمضة', labelEn: 'Rinse' },
        { value: 'injection', labelAr: 'حقن', labelEn: 'Injection' },
        { value: 'ointment', labelAr: 'مرهم', labelEn: 'Ointment' },
        { value: 'cream', labelAr: 'كريم', labelEn: 'Cream' },
        { value: 'drops', labelAr: 'قطرات', labelEn: 'Drops' }
    ];
}
