import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "fa" | "en";

type Dict = Record<string, { fa: string; en: string }>;

export const dict = {
  brand: { fa: "بارآپ", en: "BarUp" },
  tagline: { fa: "سیستم عامل لجستیک برای شرکت‌های حرفه‌ای", en: "Logistics OS for professional freight" },

  nav_features: { fa: "امکانات", en: "Features" },
  nav_industries: { fa: "صنایع", en: "Industries" },
  nav_pricing: { fa: "قیمت‌گذاری", en: "Pricing" },
  nav_contact: { fa: "تماس", en: "Contact" },
  nav_signin: { fa: "ورود", en: "Sign in" },
  nav_start: { fa: "شروع رایگان", en: "Get started" },

  hero_eyebrow: { fa: "پلتفرم B2B حمل و نقل جاده‌ای", en: "B2B road freight platform" },
  hero_title_1: { fa: "عملیات باری خود را", en: "Run your freight operations" },
  hero_title_2: { fa: "دیجیتال، شفاف و سریع بسازید.", en: "digital, transparent and fast." },
  hero_desc: {
    fa: "ثبت بار، تخصیص کامیون، پیگیری وضعیت، فاکتور و گزارش‌های مالی — همه در یک داشبورد سازمانی مدرن. طراحی شده برای شرکت‌های تولیدی، پیمانکاری و بازرگانی ایران.",
    en: "Book loads, assign trucks, track status, invoice and report — in one modern enterprise dashboard designed for Iranian manufacturers, contractors and traders.",
  },
  hero_cta_primary: { fa: "درخواست بار ثبت کنید", en: "Create a shipment" },
  hero_cta_secondary: { fa: "دموی محصول", en: "Watch demo" },

  stat_shipments: { fa: "محموله فعال", en: "Active shipments" },
  stat_partners: { fa: "شرکت مشتری", en: "Customer companies" },
  stat_carriers: { fa: "ناوگان همکار", en: "Partner fleet" },
  stat_ontime: { fa: "تحویل به‌موقع", en: "On-time delivery" },

  feat_title: { fa: "همه‌ی عملیات باری در یک جا", en: "One place for the whole freight operation" },
  feat_sub: { fa: "از ثبت درخواست تا تسویه، بدون تماس تلفنی اضافه.", en: "From request to settlement, without extra phone calls." },

  f1_t: { fa: "ثبت سریع بار", en: "Fast shipment booking" },
  f1_d: { fa: "فرم هوشمند: مبدا، مقصد، نوع بار، وزن، تاریخ بارگیری و نوع کامیون در کمتر از یک دقیقه.", en: "Smart form: origin, destination, cargo, weight, date, truck — in under a minute." },
  f2_t: { fa: "رهگیری زنده", en: "Live tracking" },
  f2_d: { fa: "وضعیت لحظه‌ای هر محموله با جدول زمانی کامل و اعلان خودکار.", en: "Real-time status of every load with a full timeline and auto notifications." },
  f3_t: { fa: "مدیریت مالی و فاکتور", en: "Finance & invoicing" },
  f3_d: { fa: "صورت‌حساب مشتریان، فاکتور PDF، مانده‌حساب و گزارش‌های اکسل.", en: "Customer statements, PDF invoices, balances and Excel reports." },
  f4_t: { fa: "داشبورد مدیریتی", en: "Executive dashboard" },
  f4_d: { fa: "درآمد، سود، مسیرهای پرتردد، مشتریان برتر و عملکرد اپراتورها.", en: "Revenue, profit, top routes, top customers and operator performance." },
  f5_t: { fa: "نقش‌محور و ایمن", en: "Role-based & secure" },
  f5_d: { fa: "دسترسی جداگانه برای مشتری، اپراتور، مدیر و راننده با RLS پایگاه داده.", en: "Separate access for customer, operator, manager and driver with DB-level RLS." },
  f6_t: { fa: "آماده رشد", en: "Ready to scale" },
  f6_d: { fa: "معماری قابل توسعه برای مارکت‌پلیس، GPS، اپلیکیشن راننده و پرداخت آنلاین.", en: "Extensible architecture for marketplace, GPS, driver app and online payments." },

  ind_title: { fa: "برای صنایعی که به حمل قابل اتکا نیاز دارند", en: "Built for industries that need reliable freight" },
  ind_1: { fa: "ساختمانی و مصالح", en: "Construction & materials" },
  ind_2: { fa: "تولیدی و صنعتی", en: "Manufacturing & industrial" },
  ind_3: { fa: "بازرگانی", en: "Trading" },
  ind_4: { fa: "پیمانکاری", en: "Contractors" },
  ind_5: { fa: "دولتی و سازمانی", en: "Government & enterprise" },
  ind_6: { fa: "کشاورزی", en: "Agriculture" },

  cta_title: { fa: "آماده‌اید عملیات باری‌تان را دیجیتال کنید؟", en: "Ready to digitize your freight operation?" },
  cta_desc: { fa: "در چند دقیقه ثبت‌نام کنید و اولین بار خود را ثبت کنید.", en: "Sign up in minutes and book your first load." },

  footer_rights: { fa: "تمامی حقوق محفوظ است.", en: "All rights reserved." },

  // Auth
  auth_signin: { fa: "ورود به حساب", en: "Sign in" },
  auth_signup: { fa: "ایجاد حساب کاربری", en: "Create account" },
  auth_email: { fa: "ایمیل کاری", en: "Work email" },
  auth_password: { fa: "رمز عبور", en: "Password" },
  auth_full_name: { fa: "نام و نام خانوادگی", en: "Full name" },
  auth_phone: { fa: "شماره موبایل", en: "Mobile number" },
  auth_company: { fa: "نام شرکت", en: "Company name" },
  auth_job: { fa: "سمت شغلی", en: "Job title" },
  auth_google: { fa: "ورود با گوگل", en: "Continue with Google" },
  auth_have_account: { fa: "قبلاً حساب دارید؟", en: "Already have an account?" },
  auth_no_account: { fa: "حساب ندارید؟", en: "Don't have an account?" },
  auth_submit_signin: { fa: "ورود", en: "Sign in" },
  auth_submit_signup: { fa: "ثبت‌نام و شروع", en: "Create account" },
  auth_or: { fa: "یا", en: "or" },
  auth_terms: { fa: "با ثبت‌نام، شرایط استفاده را می‌پذیرید.", en: "By signing up you accept our terms." },

  // Sidebar
  nav_dashboard: { fa: "داشبورد", en: "Dashboard" },
  nav_shipments: { fa: "محموله‌ها", en: "Shipments" },
  nav_new_shipment: { fa: "ثبت محموله جدید", en: "New shipment" },
  nav_invoices: { fa: "فاکتورها", en: "Invoices" },
  nav_customers: { fa: "مشتریان", en: "Customers" },
  nav_drivers: { fa: "رانندگان", en: "Drivers" },
  nav_reports: { fa: "گزارش‌ها", en: "Reports" },
  nav_notifications: { fa: "اعلان‌ها", en: "Notifications" },
  nav_profile: { fa: "پروفایل", en: "Profile" },
  nav_signout: { fa: "خروج", en: "Sign out" },
  nav_available_loads: { fa: "بارهای موجود", en: "Available loads" },
  nav_driver_profile: { fa: "پروفایل راننده", en: "Driver profile" },
  nav_onboarding: { fa: "تکمیل پروفایل", en: "Complete profile" },

  // Shipments
  ship_code: { fa: "کد", en: "Code" },
  ship_origin: { fa: "مبدا", en: "Origin" },
  ship_destination: { fa: "مقصد", en: "Destination" },
  ship_city: { fa: "شهر", en: "City" },
  ship_province: { fa: "استان", en: "Province" },
  ship_cargo: { fa: "نوع بار", en: "Cargo type" },
  ship_weight: { fa: "وزن (کیلوگرم)", en: "Weight (kg)" },
  ship_volume: { fa: "حجم (متر مکعب)", en: "Volume (m³)" },
  ship_truck: { fa: "نوع کامیون", en: "Truck type" },
  ship_date: { fa: "تاریخ بارگیری", en: "Loading date" },
  ship_notes: { fa: "دستورالعمل ویژه", en: "Special instructions" },
  ship_status: { fa: "وضعیت", en: "Status" },
  ship_price: { fa: "قیمت (تومان)", en: "Price (Toman)" },
  ship_customer: { fa: "مشتری", en: "Customer" },
  ship_operator: { fa: "اپراتور", en: "Operator" },
  ship_driver: { fa: "راننده", en: "Driver" },
  ship_create: { fa: "ثبت محموله", en: "Create shipment" },
  ship_create_sub: { fa: "اطلاعات را تکمیل کنید تا اپراتور بلافاصله بررسی کند.", en: "Fill in the details so an operator can review immediately." },
  ship_none: { fa: "هنوز محموله‌ای ندارید. اولین بار خود را ثبت کنید.", en: "No shipments yet. Create your first one." },
  ship_search: { fa: "جستجو در محموله‌ها…", en: "Search shipments…" },
  ship_all_status: { fa: "همه وضعیت‌ها", en: "All statuses" },
  ship_timeline: { fa: "خط زمانی وضعیت", en: "Status timeline" },
  ship_update_status: { fa: "به‌روزرسانی وضعیت", en: "Update status" },
  ship_set_price: { fa: "ثبت قیمت", en: "Set price" },
  ship_assign_driver: { fa: "تخصیص راننده", en: "Assign driver" },

  // Statuses
  st_draft: { fa: "پیش‌نویس", en: "Draft" },
  st_submitted: { fa: "ارسال‌شده", en: "Submitted" },
  st_under_review: { fa: "در حال بررسی", en: "Under review" },
  st_price_approved: { fa: "قیمت تأیید شد", en: "Price approved" },
  st_truck_assigned: { fa: "کامیون تخصیص یافت", en: "Truck assigned" },
  st_loading: { fa: "در حال بارگیری", en: "Loading" },
  st_in_transit: { fa: "در مسیر", en: "In transit" },
  st_delivered: { fa: "تحویل شد", en: "Delivered" },
  st_completed: { fa: "تکمیل شد", en: "Completed" },
  st_archived: { fa: "بایگانی", en: "Archived" },

  // Dashboard
  dash_hello: { fa: "خوش آمدید", en: "Welcome" },
  dash_active: { fa: "محموله‌های فعال", en: "Active shipments" },
  dash_pending: { fa: "در انتظار قیمت", en: "Awaiting price" },
  dash_completed: { fa: "تکمیل‌شده این ماه", en: "Completed this month" },
  dash_revenue: { fa: "درآمد ماه", en: "Monthly revenue" },
  dash_recent: { fa: "محموله‌های اخیر", en: "Recent shipments" },
  dash_view_all: { fa: "مشاهده همه", en: "View all" },

  // Manager
  mgr_revenue_chart: { fa: "درآمد ۶ ماه اخیر", en: "Revenue — last 6 months" },
  mgr_top_customers: { fa: "مشتریان برتر", en: "Top customers" },
  mgr_top_routes: { fa: "مسیرهای پرتردد", en: "Top routes" },

  // Common
  save: { fa: "ذخیره", en: "Save" },
  cancel: { fa: "انصراف", en: "Cancel" },
  submit: { fa: "ثبت", en: "Submit" },
  loading: { fa: "در حال بارگذاری…", en: "Loading…" },
  empty: { fa: "موردی یافت نشد", en: "No results" },
  role_switcher: { fa: "نقش نمایشی (دمو)", en: "Demo role" },
  role_customer: { fa: "مشتری", en: "Customer" },
  role_operator: { fa: "اپراتور", en: "Operator" },
  role_manager: { fa: "مدیر", en: "Manager" },
  role_driver: { fa: "راننده", en: "Driver" },
  toman: { fa: "تومان", en: "Toman" },
  demo_note: {
    fa: "این پنل دمو است — در نسخه واقعی فقط مدیر می‌تواند نقش‌ها را تعیین کند.",
    en: "Demo panel — in production only admins assign roles.",
  },
} as const satisfies Dict;

export type DictKey = keyof typeof dict;

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (k: DictKey) => string;
  setLang: (l: Lang) => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("lang") as Lang | null)) || "fa";
    setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  const t = useCallback((k: DictKey) => dict[k][lang], [lang]);
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const value = useMemo<Ctx>(() => ({ lang, dir: lang === "fa" ? "rtl" : "ltr", t, setLang }), [lang, t, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const c = useContext(I18nContext);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
