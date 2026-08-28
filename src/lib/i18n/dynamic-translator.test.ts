import { describe, it, expect } from 'vitest';
import { getLocalizedDynamicText } from '@/lib/i18n/dynamic-translator';

describe('Dynamic Translator & Member Transliteration (Karaoke)', () => {
  it('should transliterate authentic Thai member names and roles into English in EN mode', () => {
    expect(getLocalizedDynamicText('X มีดีที่จำกัด (ที่ปรึกษาและAdmin)', null, 'en')).toBe('X Meedee Teejumkad (Advisor & Admin)');
    expect(getLocalizedDynamicText('พี่อู๊ด Director', null, 'en')).toBe("P'Ood Director");
    expect(getLocalizedDynamicText('พี่หมู หัวหน้าสถาปนิก (Senior Architect / Design Lead)', null, 'en')).toBe("P'Moo Lead Architect (Senior Architect / Design Lead)");
    expect(getLocalizedDynamicText('น้องเอิน สถาปนิกโครงการ', null, 'en')).toBe('Nong Ern Project Architect');
    expect(getLocalizedDynamicText('พี่ต้น สถาปนิกโครงการ', null, 'en')).toBe("P'Ton Project Architect");
    expect(getLocalizedDynamicText('พี่วิช วิศวกรงานระบบPARAGON (MEP Engineer)', null, 'en')).toBe("P'Wich MEP Engineer PARAGON (MEP Engineer)");
    expect(getLocalizedDynamicText('พี่เอก วิศวกรงานระบบ BOPHUD(MEP Engineer)', null, 'en')).toBe("P'Aek MEP Engineer BOPHUD (MEP Engineer)");
    expect(getLocalizedDynamicText("P'Game ประมาณราคา (QS / Cost Controller)", null, 'en')).toBe("P'Game Cost Estimator (QS / Cost Controller)");
    expect(getLocalizedDynamicText('พี่บัง วิศวกรงานระบบPARAGON (MEP Engineer)', null, 'en')).toBe("P'Bang MEP Engineer PARAGON (MEP Engineer)");
    expect(getLocalizedDynamicText('พี่อ๊อด ผู้ควบคุมงาน', null, 'en')).toBe("P'Aod Site Supervisor");
    expect(getLocalizedDynamicText('พี่โจ ช่างคุมงาน (Site Engineer / Supervisor)', null, 'en')).toBe("P'Joe Site Engineer (Site Engineer / Supervisor)");
    expect(getLocalizedDynamicText('พี่อ๊อด ตรวจรับมอบบ้าน (QA/QC Inspector)', null, 'en')).toBe("P'Aod QA/QC Inspector");
    expect(getLocalizedDynamicText("P'PITA หัวหน้าการตลาด (Marketing & Sales Executive)", null, 'en')).toBe("P'PITA Marketing Lead (Marketing & Sales Executive)");
    expect(getLocalizedDynamicText("P'TAWAN การตลาด (Marketing & Sales Executive)", null, 'en')).toBe("P'TAWAN Marketing Executive (Marketing & Sales Executive)");
    expect(getLocalizedDynamicText('พี่ทับทิม บัญชี', null, 'en')).toBe("P'Tubtim Accounting");
    expect(getLocalizedDynamicText('พี่หนุ่มพี่ออย จัดซื้อ', null, 'en')).toBe("P'Num & P'Oil Procurement");
    expect(getLocalizedDynamicText('หัวหน้าสโตร์', null, 'en')).toBe('Head of Inventory Store');
    expect(getLocalizedDynamicText('พี่ป้อ ดูแลหลังการขาย', null, 'en')).toBe("P'Phor Aftersales Care");
  });

  it('should preserve original Thai text when lang === "th"', () => {
    expect(getLocalizedDynamicText('X มีดีที่จำกัด (ที่ปรึกษาและAdmin)', null, 'th')).toBe('X มีดีที่จำกัด (ที่ปรึกษาและAdmin)');
    expect(getLocalizedDynamicText('พี่อู๊ด Director', null, 'th')).toBe('พี่อู๊ด Director');
  });

  it('should correctly translate blocker and status terms', () => {
    expect(getLocalizedDynamicText('✓ ปกติ', null, 'en')).toBe('✓ Normal');
    expect(getLocalizedDynamicText('มีปัญหาติดขัดใหม่', null, 'en')).toBe('New Blocker / Issue Logged');
  });
});
