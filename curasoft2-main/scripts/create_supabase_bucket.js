#!/usr/bin/env node
/*
  Usage:
    SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create_supabase_bucket.js my_bucket_name [public]

  Note: this script requires the service_role key. Keep it secret.
*/
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.argv[2] || process.env.BUCKET_NAME;
const makePublic = (process.argv[3] || process.env.BUCKET_PUBLIC || '').toLowerCase() === 'public';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('يرجى ضبط SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في المتغيرات البيئية قبل التشغيل.');
  process.exit(1);
}
if (!bucket) {
  console.error('اسم الباكت مطلوب كوسيط أو في BUCKET_NAME. مثال: node scripts/create_supabase_bucket.js attachments public');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

(async () => {
  try {
    console.log(`إنشاء الباكت "${bucket}" (public=${makePublic}) ...`);
    const { data, error } = await supabase.storage.createBucket(bucket, { public: makePublic });
    if (error) {
      // If bucket exists, Supabase returns 409; forward message
      console.error('فشل الإنشاء:', error.message || error);
      process.exit(1);
    }
    console.log('تم الإنشاء بنجاح:', data);
    console.log('\nملاحظة: لا تضع مفتاح service_role في مستودع عام. احفظه في مكان آمن.');
  } catch (err) {
    console.error('خطأ غير متوقع:', err);
    process.exit(1);
  }
})();
