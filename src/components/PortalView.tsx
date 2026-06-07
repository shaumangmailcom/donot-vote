import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Heart, 
  CheckCircle, 
  Flame, 
  Sparkles, 
  ArrowLeft, 
  Share2, 
  Search, 
  MapPin, 
  ShieldAlert, 
  BookmarkCheck,
  Award,
  Video,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import IsraeliFlag from './IsraeliFlag';

interface PortalViewProps {
  onStartCreation: () => void;
  onSelectOption: (option: 'share' | 'create') => void;
}

interface PledgeStory {
  id: string;
  name: string;
  role: 'bereaved' | 'evacuated' | 'soldier' | 'citizen';
  roleLabel: string;
  location: string;
  avatarBg: string;
  storyText: string;
  quote: string;
}

const STATIC_PLEDGES: PledgeStory[] = [
  {
    id: '1',
    name: 'רונן אשכנזי',
    role: 'bereaved',
    roleLabel: 'הורה שכול',
    location: 'קיבוץ בארי / תל אביב',
    avatarBg: 'bg-red-50 text-red-650 border-red-200',
    storyText: 'איבד את בנו דניאל ז״ל, שננעל במימ״ד ונרצח בעוד הקיבוץ מופקר במשך שעות רבות ללא סיוע צבאי או פינוי.',
    quote: '״השכול והאובדן מלווים אותנו בכל נשימה וכל צעד. משהו בנו מת יחד עם דניאל. שמענו את זעקותיו לעזרה ולא היה שם אף אחד שיגונן עליו. אני מתחייב: לא נצביע לעולם לקואליציה שהפקירה את ילדינו. משפחה וחברים לפני הקול!״'
  },
  {
    id: '2',
    name: 'עדי קליין',
    role: 'soldier',
    roleLabel: 'לוחמת מילואים',
    location: 'קריית שמונה / רמת גן',
    avatarBg: 'bg-green-50 text-green-700 border-green-200',
    storyText: 'שירתה 190 ימי מילואים רצופים בגבול הצפון ונאבקת כיום בהשלכות הפוסט-טראומה ובחזרה לשוק העבודה ללא כל תמיכה.',
    quote: '״נשכבנו על הגדר בשביל לשמור על האזרחים ועל גבול המדינה. אבל כשחזרנו הביתה, גילינו שחברי הממשלה עסוקים רק בכיסאות שלהם והפקירו אותנו להתמודד לבד. הבטחנו שלא נפקיר אף לוחם, ואני מתחייבת לעשות הכל כדי להחליף אותם.״'
  },
  {
    id: '3',
    name: 'יפעת ברגמן',
    role: 'evacuated',
    roleLabel: 'מפונה מהצפון',
    location: 'שלומי / מפונה למלון בירושלים',
    avatarBg: 'bg-amber-50 text-amber-700 border-amber-200',
    storyText: 'פונתה עם שלושת ילדיה כבר באוקטובר, הבית נפגע פגיעה ישירה מרקטה, והעסק המשפחתי שלהם קרס לחלוטין.',
    quote: '״הילדים שלי מתעוררים מסיוטים בלילות, ואנחנו חיים מחוץ לבית כבר חודשים ארוכים כמו תלושים באוויר. הממשלה הזו התעלמה מהצפון והפקירה אותנו לקרוס כלכלית ונפשית. הגיע הזמן לקחת אחריות - לא מצביעים למי שהיה שם!״'
  },
  {
    id: '4',
    name: 'אלון גרנות',
    role: 'citizen',
    roleLabel: 'אזרח מודאג',
    location: 'באר שבע',
    avatarBg: 'bg-blue-50 text-isr-blue border-blue-200',
    storyText: 'חבר כיתת כוננות בדרום שנלחם עצמאית כדי להגן על השכונה שלו בזמן שכל כוחות הביטחון התעכבו.',
    quote: '״ביום ההוא גילינו שאין ממשלה ואין הגנה. רק האזרחים נרתמו לחלץ ולשמור אחד על השני. האמון שלי נסדק ביום ההוא לנצח. כסבא לילדים שמשרתים עכשיו, אני נשבע: ערך החיים קודם לפוליטיקה - משפחה וחברים לפני הקול!״'
  },
  {
    id: '5',
    name: 'דליה רז',
    role: 'bereaved',
    roleLabel: 'משפחה שכולה',
    location: 'אופקים / חיפה',
    avatarBg: 'bg-red-50 text-red-650 border-red-200',
    storyText: 'איבדה את אחותה הצעירה שנורתה על ידי מחבלים באופקים בעת שהגנה בגופה על ילדיה הקטנים.',
    quote: '״אין יום שבו הלב לא נשבר מחדש. בשעות שבהן האזרחים דיממו ברחובות הממשלה ישנה. לא נסלח להפקרה המוחלטת, ולא נשקוט עד שהמדינה שלנו תתנהל באחריות וביראת קודש לחיי אדם.״'
  },
  {
    id: '6',
    name: 'סמל (מיל׳) איתי שגב',
    role: 'soldier',
    roleLabel: 'לוחם מילואים',
    location: 'עוטף עזה / כפר סבא',
    avatarBg: 'bg-green-50 text-green-700 border-green-200',
    storyText: 'חובש קרבי שנכנס בגל הראשון לעוטף לחלץ פצועים ומתמודד עם חוויות קשות ומחסור במענה נפשי.',
    quote: '״חברים שלי נהרגו בזרועותיי. הבטחנו לעצמנו שלפחות מי שהפקיר את הגבולות ייקח אחריות וילך הביתה, אבל כלום לא קרה. ההתחייבות שלי היא המינימום שאני חב לחבריי שנפלו: משפחה וחברים לפני הקול.״'
  }
];

const SIGNATURES_FEED = [
  'יוסי כ. מתל אביב התחייב כעת ✍️',
  'מירי א. מקריית שמונה התחייבה כעת ✍️',
  'דניאל ו. מבארי התחייב כעת ✍️',
  'אורן ל. מבאר שבע התחייב כעת ✍️',
  'שירה פ. מחיפה התחייבה כעת ✍️',
  'טל מ. מאופקים התחייב כעת ✍️',
  'נעמה ק. מאשקלון התחייבה כעת ✍️',
  'סגן אילן ד. מירושלים התחייב כעת ✍️'
];

export default function PortalView({ onStartCreation, onSelectOption }: PortalViewProps) {
  const [pledgeCount, setPledgeCount] = useState(142503);
  const [activeFilter, setActiveFilter] = useState<'all' | 'bereaved' | 'evacuated' | 'soldier' | 'citizen'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sigIndex, setSigIndex] = useState(0);

  // Animate dynamic citizen pledge counter
  useEffect(() => {
    const interval = setInterval(() => {
      setPledgeCount(prev => prev + Math.floor(Math.random() * 2) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Cycle the live signatures ribbon at the top
  useEffect(() => {
    const interval = setInterval(() => {
      setSigIndex(prev => (prev + 1) % SIGNATURES_FEED.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Filter and search logic
  const filteredPledges = STATIC_PLEDGES.filter(pledge => {
    const matchesFilter = activeFilter === 'all' || pledge.role === activeFilter;
    const matchesSearch = 
      pledge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pledge.quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pledge.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pledge.roleLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full text-right" dir="rtl">
      
      {/* 1. Live Signatures Ribbon */}
      <div className="w-full bg-slate-900 text-slate-100 py-2.5 px-4 mb-8 rounded-2xl flex items-center justify-between border border-slate-800 shadow-sm overflow-hidden text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
          <span className="text-slate-400">חתימות מתחדשות בזמן אמת:</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={sigIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="text-amber-300 font-bold"
          >
            {SIGNATURES_FEED[sigIndex]}
          </motion.div>
        </AnimatePresence>
        <span className="text-slate-500 font-bold hidden sm:inline">יוזמה אזרחית דמוקרטית</span>
      </div>

      {/* 2. Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50/70 via-white to-white border border-blue-100 rounded-3xl p-6 sm:p-12 shadow-md mb-10 overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100/30 rounded-full mix-blend-multiply filter blur-3xl -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-50/50 rounded-full mix-blend-multiply filter blur-3xl -z-10"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Hero text (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-block px-3 py-1 bg-red-50 text-red-650 rounded-full font-black text-[11px] tracking-wider uppercase border border-red-100 animate-pulse">
                שמים חומת מגן מול ההפקרה 🛡️
              </span>
              <span className="inline-block px-3 py-1 bg-blue-100 text-isr-blue rounded-full font-black text-[11px] tracking-wider border border-blue-200">
                אמנת האזרחים לאחריות לאומית
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight mb-4 tracking-tight">
              הפורטל הארצי: <span className="text-isr-blue">משפחה וחברים לפני הקול</span>
            </h1>
            
            <p className="text-gray-650 text-sm sm:text-base leading-relaxed mb-6 font-semibold">
              בימים אלו, יותר מתמיד, חובה לסמן קו אדום מוסרי. אזרחי ישראל, משפחות שכולות, מפונים ולוחמי מילואים מתאחדים בהתחייבות ברורה: <strong className="text-slate-900 font-extrabold">לא נצביע לעולם לאף שר או חבר כנסת שהיה חלק ממשלת ה-7 באוקטובר 2023.</strong> לא מפקירים אזרחים, ובטח שלא מפקירים אחריות.
            </p>

            <div className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/create';
                  onStartCreation();
                  onSelectOption('create');
                }}
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-101 cursor-pointer flex items-center justify-center gap-2.5 active:scale-98 border border-red-700"
              >
                <Video className="w-5 h-5 ml-1 animate-pulse" />
                צור סרטון התחייבות אישי בטלפרומפטר 🎥
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = '#/create';
                  onStartCreation();
                  onSelectOption('share'); // written text options
                }}
                className="px-6 py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <FileText className="w-4 h-4 ml-1" />
                יצירת פוסט כתוב לפייסבוק 📝
              </button>
            </div>
          </div>

          {/* Hero Counter Widget (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-gray-150 rounded-3xl p-6 sm:p-8 shadow-xl text-center flex flex-col justify-between relative">
            <div className="absolute top-2.5 right-3">
              <IsraeliFlag className="w-8 h-5 shadow-xs opacity-75" />
            </div>
            
            <div>
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block mb-1">מדד ההתחייבות האזרחית הארצי</span>
              
              <div className="bg-slate-50 py-5 px-4 rounded-2xl border border-slate-100 my-4 shadow-inner flex items-center justify-center gap-1.5 font-mono">
                <Users className="w-8 h-8 text-isr-blue shrink-0 animate-pulse" />
                <motion.span 
                  key={pledgeCount}
                  initial={{ scale: 1.05, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight"
                >
                  {pledgeCount.toLocaleString()}
                </motion.span>
              </div>

              <p className="text-xs font-black text-slate-500 leading-relaxed max-w-xs mx-auto">
                אזרחי ישראל שהתחייבו באופן דיגיטלי להצבת משפחה, חברים וביטחון לפני אינטרס פוליטי.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-2 text-right">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">חיילי מילואים שחתמו:</span>
                <span className="text-sm font-black text-green-700">62,914 ⚔️</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block">תושבי עוטף ומפונים:</span>
                <span className="text-sm font-black text-amber-700">38,105 🏠</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. The Citizen Manifesto (אמנת המחויבות המצפונית) */}
      <div className="w-full bg-slate-900 text-white rounded-3xl p-6 sm:p-10 mb-10 shadow-xl border border-slate-800 text-right">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="p-3 bg-slate-800/80 rounded-2xl inline-flex items-center justify-center border border-slate-700 mb-3">
              <Award className="w-8 h-8 text-yellow-500" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">אמנת המחויבות של החברה הישראלית</h2>
            <p className="text-xs text-slate-400 font-bold mt-1.5">עקרונות היסוד עליהם אנו נאבקים ובגינם אנו מסמנים את הקו האדום:</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/60 text-right">
              <div className="flex items-center gap-3 mb-3 justify-start" dir="rtl">
                <span className="text-xl">🛡️</span>
                <h4 className="text-base font-black text-white">1. אין זכאות ללא אחריות</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                שרים, חברי כנסת והנהגה פוליטית שהיו מופקדים על שלטון המדינה ב-7 באוקטובר 2023 נושאים באחריות היסטורית ישירה. התיקון מתחיל בהסרתם מכל צומת השפעה.
              </p>
            </div>

            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/60 text-right">
              <div className="flex items-center gap-3 mb-3 justify-start" dir="rtl">
                <span className="text-xl">💖</span>
                <h4 className="text-base font-black text-white">2. משפחה וחברים תחילה</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                חיי אדם, החזרת החטופים, שיקום המפונים ורווחת הלוחמים קודמים לכל קומבינציה שלטונית. לא נפקיר פיזית, ולא נפקיר פוליטית את מי שנפגעו באסון.
              </p>
            </div>

            <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/60 text-right">
              <div className="flex items-center gap-3 mb-3 justify-start" dir="rtl">
                <span className="text-xl">🤝</span>
                <h4 className="text-base font-black text-white">3. ברית אחים אזרחית</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                הכוח שלנו נובע מאיתנו – האזרחים שחילצו זה את זה, פתחו את הלב והקימו את המדינה הנטושה מחדש. אנו מסרבים לתמוך במי שפועלים לפילוג אזרחי העם.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filterable Pledge Wall */}
      <div className="w-full mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 pb-4 border-b border-gray-200">
          <div>
            <span className="px-3 py-1 bg-blue-50 text-isr-blue rounded-lg font-black text-[10px] uppercase">קולות המאבק 📢</span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mt-1">קיר המחויבויות והאובדן</h2>
            <p className="text-xs text-gray-500 font-bold mt-1">מגוון דעות של אזרחים וקבוצות שונות שבחרו להגיד בקול רם: עד כאן!</p>
          </div>

          {/* Search bar inside portal */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="absolute right-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, יישוב, קטע..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs text-right bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-150 transition-all font-semibold"
            />
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2.5 mb-8 justify-start" dir="rtl">
          {[
            { id: 'all', label: 'כל הסיפורים 👥' },
            { id: 'bereaved', label: 'משפחות שכולות 🕯️' },
            { id: 'soldier', label: 'חיילי מילואים ⚔️' },
            { id: 'evacuated', label: 'מפונים מהבתים 🏠' },
            { id: 'citizen', label: 'אזרחים מודאגים 🇮🇱' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                activeFilter === item.id 
                  ? 'bg-isr-blue text-white border-isr-blue shadow-md scale-102 font-black' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Stories Bento Grid */}
        <AnimatePresence mode="popLayout">
          {filteredPledges.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white border border-dashed border-gray-300 rounded-3xl p-12 text-center text-gray-400"
            >
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-2.5 animate-pulse" />
              <p className="text-sm font-semibold">לא נמצאו סיפורים העונים על הסינון שבחרתם.</p>
              <button 
                onClick={() => { setSearchQuery(''); setActiveFilter('all'); }} 
                className="mt-3 text-xs text-isr-blue font-black underline hover:text-blue-800"
              >
                אפס הגדרות חיפוש
              </button>
            </motion.div>
          ) : (
            <motion.div 
              layout 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPledges.map((pledge) => (
                <motion.div
                  layout
                  key={pledge.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header line */}
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase ${pledge.avatarBg}`}>
                        {pledge.roleLabel}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400 inline" />
                        {pledge.location}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-gray-900 mb-1">{pledge.name}</h4>
                    <p className="text-gray-500 text-xs font-semibold leading-relaxed mb-4">{pledge.storyText}</p>
                    
                    <div className="p-4 bg-slate-50/70 border border-slate-100 rounded-2xl relative">
                      <span className="absolute -top-3.5 right-4 text-3xl text-blue-200/50 select-none">״</span>
                      <p className="text-xs font-extrabold text-gray-800 leading-relaxed font-serif italic text-right">
                        {pledge.quote}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-100 flex justify-between items-center text-[10px]">
                    <span className="text-green-650 font-black flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                      <CheckCircle className="w-3 h-3" />
                      חתימה מאומתת
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText(`${pledge.name}: ${pledge.quote}\n\n#משפחה_וחברים_לפני_הקול`);
                          alert('טקסט המחויבות הועתק בהצלחה!');
                        }
                      }}
                      className="text-xs text-isr-blue font-black flex items-center gap-1 cursor-pointer hover:underline"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      שיתוף אמירה
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 5. Footer Bottom CTA */}
      <div className="w-full max-w-4xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-12 text-center shadow-lg border border-blue-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full mix-blend-overlay filter blur-xl animate-pulse"></div>
        <h3 className="text-2xl sm:text-4xl font-black text-white mb-3">ומה הסיפור שלכם בכל זה?</h3>
        <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto mb-6 leading-relaxed font-semibold">
          כל שיתוף שלכם תורם מוליכות למאבק הציבורי. הקדישו דקה וחצי להשמעת קולכם האישי: הממשק ינחה אתכם, ייצר לכם נוסח מוכן ודמוקרטי, וייתן לכם לקרוא את המילים בנוחות מול המצלמה שלכם בקצב המדויק שבחרתם!
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.hash = '#/create';
            onStartCreation();
            onSelectOption('create');
          }}
          className="px-10 py-5 bg-white hover:bg-slate-50 text-isr-blue font-black text-base rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-101 active:scale-98 cursor-pointer inline-flex items-center gap-3.5"
        >
          <Sparkles className="w-5 h-5 text-isr-blue animate-spin" style={{ animationDuration: '6s' }} />
          בואו נבנה ביחד את הסיפור האישי שלכם ✨
        </button>
      </div>

      {/* Footnote */}
      <div className="text-center text-gray-400 text-[11px] mt-8 leading-relaxed">
        <p>© 2026 יוזמה אזרחית לאומית ודמוקרטית בלתי-מפלגתית • משפחה וחברים לפני הקול.</p>
        <p className="mt-0.5">המערכת מעבדת את המידע בצד לקוח בלבד ומכבדת באופן מוחלט את פרטיותכם.</p>
      </div>

    </div>
  );
}
