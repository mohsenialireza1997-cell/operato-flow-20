## هدف
تبدیل Operato Flow از یک پنل ساده ثبت بار به یک پلتفرم دوطرفه لجستیک با تجربه ورود و داشبورد جداگانه برای «صاحب کالا» و «راننده»، به‌همراه فرم اعلام بار حرفه‌ای، پروفایل کامل راننده، رهگیری محموله و مدیریت اسناد.

## دامنه این مرحله (قابل اجرا در یک پاس)
تمرکز روی UX/UI + مدل داده + امنیت RLS. ماژول مالی پیشرفته، Matching هوشمند و اپ موبایل خارج از این مرحله‌اند (در انتها فهرست می‌شوند).

---

## ۱) صفحه ورود/ثبت‌نام با انتخاب نقش
- بازطراحی `src/routes/auth.tsx` با تب یا سوییچ: **صاحب کالا / راننده**
- فیلدهای اضافی در ثبت‌نام بسته به نقش:
  - Shipper: نام شرکت، صنعت، شهر، شخص رابط
  - Driver: کد ملی، نوع ماشین، پلاک، ظرفیت
- هنگام ثبت‌نام، علاوه بر ساخت `profiles`، رکورد در `shippers` یا `drivers` هم ساخته می‌شود و نقش مربوطه در `user_roles` درج می‌گردد (از طریق یک server function امن به‌جای trigger، تا بتوان فیلدها را اعتبارسنجی کرد).
- Google OAuth باقی می‌ماند ولی پس از اولین ورود، یک صفحه «تکمیل پروفایل» نقش را می‌پرسد.

## ۲) توسعه مدل داده (Migration جدید)
جداول جدید/توسعه‌یافته:

**`shippers`** (پروفایل صاحب کالا)
- `id` FK به `auth.users`
- `company_name`, `industry`, `contact_person`, `city`, `address`

**`drivers`** توسعه (ستون‌های جدید)
- `user_id` FK به `auth.users` (اتصال به حساب کاربری راننده — الان `drivers` مستقل از user است)
- `national_id`, `vehicle_model`, `vehicle_year`, `capacity_ton`, `ownership` (owner/rental)
- `preferred_origin_cities` text[]
- `preferred_destination_cities` text[]
- `preferred_cargo_types` text[]
- `insurance_expiry`, `technical_inspection_expiry`
- `rating_avg` numeric, `completed_trips` int

**`shipments`** توسعه
- `cargo_value_toman` bigint
- `cargo_category` (industrial/food/construction/…)
- `pieces_count` int
- `handling_requirements` text (یخچالی، شکستنی، …)
- `suggested_price_toman` bigint (پیشنهاد کرایه از سمت مشتری)
- `payment_terms` (cash/credit/on_delivery)

**`shipment_documents`** (جدید)
- `id`, `shipment_id`, `uploaded_by`, `doc_type` (cargo_photo/waybill/loading_receipt/delivery_receipt/invoice/other), `storage_path`, `caption`, `created_at`

**`shipment_tracking_events`** (جدید — رهگیری زنده)
- `id`, `shipment_id`, `event_type`, `note`, `lat`, `lng`, `photo_path`, `created_by`, `created_at`
- کنار `shipment_status_history` موجود می‌ماند (history وضعیت‌های رسمی، این یکی ایونت‌های میدانی راننده)

**Storage buckets**
- `shipment-docs` (خصوصی) — عکس بار، بارنامه، رسیدها
- `driver-docs` (خصوصی) — مدارک راننده، بیمه، پلاک
- سیاست RLS: فقط مالک محموله + راننده تخصیص‌داده‌شده + staff

## ۳) RLS و امنیت
- `shippers`: هرکس فقط ردیف خودش را می‌بیند/ویرایش می‌کند؛ staff همه را.
- `drivers`: راننده فقط پروفایل خودش را ویرایش می‌کند؛ صاحب کالای مرتبط با محموله فقط فیلدهای عمومی (نام، پلاک، امتیاز) را می‌بیند از طریق ویو `drivers_public`.
- `shipment_documents`: مالک محموله + راننده تخصیص‌یافته + staff.
- `shipment_tracking_events`: خواندن برای مالک/راننده/staff؛ نوشتن فقط راننده تخصیص‌یافته یا staff.
- Storage: policy‌ها بر اساس `shipment_id` در path (`{shipment_id}/{filename}`) با join به `shipments`.

## ۴) داشبورد نقش‌محور
`src/routes/_authenticated/app.index.tsx` بر اساس `primaryRole` سه ویو کاملاً متفاوت رندر می‌کند:

**Shipper Dashboard**
- کارت‌های KPI: بارهای فعال، در حال حمل، تحویل‌شده، هزینه کل ماه
- تایم‌لاین رهگیری آخرین محموله
- دکمه بزرگ «اعلام بار جدید»
- جدول بارهای اخیر با وضعیت رنگی

**Driver Dashboard**
- بارهای پیشنهادی (بر اساس `preferred_routes` و `vehicle_type` — کوئری ساده، نه ML)
- بارهای فعال من (در حال حمل)
- KPI: تعداد سفر ماه، درآمد تخمینی، امتیاز
- هشدار انقضای بیمه/معاینه فنی

**Admin/Operator/Manager**: همان داشبورد فعلی حفظ می‌شود.

## ۵) فرم حرفه‌ای اعلام بار
بازنویسی `app.shipments.new.tsx` به‌صورت **Wizard چند مرحله‌ای**:
1. مسیر (مبدا/مقصد/تاریخ)
2. بار (نوع، دسته، وزن، حجم، تعداد، ارزش، شرایط نگهداری)
3. خودرو (نوع، تناژ، تجهیزات)
4. مالی (پیشنهاد کرایه، شرایط پرداخت)
5. اسناد و توضیحات (آپلود عکس بار به `shipment-docs`)
6. مرور و ثبت

اعتبارسنجی با Zod + react-hook-form.

## ۶) صفحه رهگیری محموله (Shipper)
`app.shipments.$id.tsx` توسعه می‌یابد:
- تایم‌لاین عمودی از `shipment_tracking_events` + `shipment_status_history`
- گالری عکس‌ها و اسناد
- دانلود بارنامه/رسید
- کارت اطلاعات راننده تخصیص‌یافته (از ویو public)

## ۷) پروفایل راننده (Onboarding + Edit)
`src/routes/_authenticated/app.driver-profile.tsx` جدید:
- اطلاعات فردی، خودرو، مدارک (با آپلود به `driver-docs`)
- انتخاب چند‌گزینه‌ای مسیرهای پرتردد (chip input)
- انتخاب نوع بارهای قابل حمل
- هشدار «پروفایل ناقص است» تا زمانی که مدارک ضروری آپلود نشوند

## ۸) صفحه «بارهای موجود» برای راننده
`app.available-loads.tsx` جدید:
- لیست شیپمنت‌های `price_approved` که هنوز راننده ندارند
- فیلتر بر اساس مبدا/مقصد/نوع بار/تناژ
- دکمه «درخواست این بار» → درج در جدول جدید `shipment_requests` (راننده متقاضی → operator تایید می‌کند)

## ۹) بازآرایی معماری کد (سبک، بدون over-engineering)
```
src/features/
  shippers/      (کامپوننت‌ها + هوک‌های اختصاصی)
  drivers/
  shipments/
    components/  (CargoWizard, TrackingTimeline, DocumentUploader)
    hooks/
    validators/  (Zod schemas)
src/services/
  shipments.ts   (توابع CRUD متمرکز — به‌جای supabase.from داخل کامپوننت)
  drivers.ts
  shippers.ts
```

## ۱۰) به‌روزرسانی ناوبری
Sidebar بر اساس نقش:
- Shipper: داشبورد، بارهای من، اعلام بار جدید، فاکتورها، پروفایل شرکت
- Driver: داشبورد، بارهای موجود، سفرهای من، پروفایل راننده، درآمد
- Staff: نمای فعلی

---

## خارج از دامنه این مرحله (پیشنهاد برای بعد)
- الگوریتم Matching هوشمند (نیازمند داده تاریخی کافی)
- ماژول مالی کامل با تسویه راننده و کمیسیون
- GPS Tracking زنده (نیازمند اپ موبایل راننده)
- پیامک/واتساپ خودکار
- CRM صنعتی

---

## جزئیات فنی
- Zod + react-hook-form برای فرم‌ها (react-hook-form احتمالاً هست، Zod باید نصب شود)
- دو Storage bucket خصوصی با RLS بر اساس path
- Server functions جدید: `completeShipperOnboarding`, `completeDriverOnboarding`, `requestShipment`, `assignDriverToShipment`
- ویو `drivers_public` برای نمایش امن اطلاعات راننده به صاحب کالا
- همه migration در یک فایل تمیز جدید

پس از تایید، پیاده‌سازی را شروع می‌کنم. با توجه به حجم زیاد، پیشنهاد می‌کنم در دو پاس انجام شود: **پاس ۱** (بندهای ۱–۵: auth نقش‌محور + دیتابیس + Storage + داشبورد نقش‌محور + فرم اعلام بار). **پاس ۲** (بندهای ۶–۱۰: رهگیری، پروفایل راننده، بارهای موجود، بازآرایی، ناوبری).

آیا با این پلن و تقسیم دو‌پاسه موافقی، یا ترجیح می‌دهی همه در یک پاس انجام شود؟