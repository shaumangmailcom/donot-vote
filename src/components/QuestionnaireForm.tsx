import React, { useState } from 'react';
import { Questionnaire } from '../types';
import { Sparkles, Users, Heart, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import IsraeliFlag from './IsraeliFlag';

interface QuestionnaireFormProps {
  onSubmit: (data: Questionnaire) => void;
  initialData?: Questionnaire;
}

export default function QuestionnaireForm({ onSubmit, initialData }: QuestionnaireFormProps) {
  // Setup local states matching user's exact structure
  const [speakerName, setSpeakerName] = useState(initialData?.speakerName || '');
  const [speakerGender, setSpeakerGender] = useState<'male' | 'female'>(initialData?.speakerGender || 'male');
  
  // Who is the story about
  // Options: 'child' (בן או בת), 'family' (קרוב משפחה), 'friend' (חברים), 'self' (עצמי ועל משפחתי), 'other' (אחר בהתאמה אישית)
  const [storyWho, setStoryWho] = useState<'child' | 'family' | 'friend' | 'self' | 'other'>(
    (initialData?.relationshipType as any) || 'child'
  );

  // What happened
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [customEventText, setCustomEventText] = useState<string>('');

  // Affected person's details (displayed if storyWho !== 'self')
  const [lostPersonName, setLostPersonName] = useState(initialData?.lostPersonName || '');
  const [lostPersonGender, setLostPersonGender] = useState<'male' | 'female'>(initialData?.lostPersonGender || 'male');

  // Pain and emotional impact
  const [selectedPain, setSelectedPain] = useState<string>('');
  const [customPainText, setCustomPainText] = useState<string>('');

  // Step state
  // 0: Personal Details (name, gender)
  // 1: Who is the story about
  // 2: What happened
  // 3: Affected person details (skipped if storyWho === 'self')
  // 4: Pain and toll
  const [activeStep, setActiveStep] = useState(0);

  // Define steps list dynamically
  const formSteps = [
    { id: 'speaker', title: 'פרטים אישיים', shortTitle: 'מי אני' },
    { id: 'who', title: 'על מי הסיפור?', shortTitle: 'על מי הסיפור' },
    { id: 'what', title: 'מה קרה באותה שבת?', shortTitle: 'מה קרה' },
    ...(storyWho !== 'self' ? [{ id: 'person', title: 'פרטי האדם היקר', shortTitle: 'שם ומגדר' }] : []),
    { id: 'pain', title: 'הכאב והמחיר מאז', shortTitle: 'הכאב והמחיר' },
  ];

  // Map activeStep to correct index in formSteps taking conditional step into account
  const totalStepsCount = formSteps.length;

  // Presets mapping based on Step 2 (Who is the story about)
  const getEventPresets = () => {
    switch (storyWho) {
      case 'child':
        return [
          'הבן שלי נהרג / נרצח באותה שבת נוראה',
          'הבת שלי נהרגה / נרצחה באותה שבת נוראה',
          'הילד/ה שלי סובל.ת מטראומה קשה מאז',
          'הילדים שלי נפצעו בפיגוע / במתקפה',
          'הבן או הבת שלי שירתו ושירתו במילואים לאורך חודשים ארוכים',
          'אחר / אסון אחר, בהתאמה אישית'
        ];
      case 'family':
        return [
          'בן או בת משפחה שלי נהרגו / נרצחו',
          'בן משפחה שלי נפצע או נפגע קשה',
          'בית המשפחה נהרס או נפגע קשות',
          'המשפחה שלי פונתה מביתה לחודשים ארוכים וללא מענה',
          'בן משפחה שירת בגבורה במילואים ונפגע',
          'אחר / אסון אחר, בהתאמה אישית'
        ];
      case 'friend':
        return [
          'החבר או החברה הכי טובים שלי נרצחו או נפלו',
          'חבר שלי נפצע קשה ומנסה להשתקם מאז',
          'מישהו קרוב אלי מאוד נפגע נפשית ונמצא בפוסט טראומה',
          'חבר קרוב שירת חודשים ארוכים ללא הפסקה ומצא עצמו מופקר',
          'מכר שלי נהרג או נעלם באסון האיום',
          'אחר / אסון אחר, בהתאמה אישית'
        ];
      case 'self':
        return [
          'שרדנו את הטבח האיום בממ"ד ברגעים של פחד מוות',
          'פונינו למשך חודשים ארוכים מביתנו ללא שום מענה',
          'לחמתי או שירתתי כמילואימניק בחזית נטושה',
          'העסק שלי או החווה נגררו לקשיים קשים ולא שרדו במחדל',
          'אני סובל מטראומה קשה וחרדות יומיומיות מאז השבת השחורה',
          'אחר / אסון אחר, בהתאמה אישית'
        ];
      case 'other':
      default:
        return [
          'חוויתי פגיעה קשה ברכוש או בפרנסה כתוצאה מהמחדל',
          'הייתי עד לאירועי השבת השחורה בדרכים או במסיבה',
          'התחושה של ההפקרה של התושבים פגעה בי אישית ובאמוני',
          'שירתי בכוחות הביטחון וההצלה בשעות הקשות והמדממות',
          'איבדתי את תחושת הביטחון האישי בבית שלי בארצי',
          'אחר / אסון אחר, בהתאמה אישית'
        ];
    }
  };

  // Presets for Step 4 (Pain & Toll) tailored dynamically
  const getPainPresets = () => {
    const isLossEvent = selectedEvent
      ? (selectedEvent.includes('נהרג') || selectedEvent.includes('נרצח') || selectedEvent.includes('נפלו') || selectedEvent.includes('נעלם') || selectedEvent.includes('איבד'))
      : true; // Default to true if not selected yet

    switch (storyWho) {
      case 'child':
        if (isLossEvent) {
          return [
            'החיים שלנו ריקים בלעדיו/ה, אין יום ואין לילה בלי תמונה שלו/ה והלב קרוע לחתיכות.',
            'החדר נשאר סגור כמו ביום ההוא, והשתיקות מסביב לשולחן האוכל קשות מנשוא.',
            'החלל והגעגוע לא מרפים מאיתנו בכל נשימה ובכל רגע ביום.',
            'אחר / תיאור כאב אישי...'
          ];
        } else {
          return [
            'ההתמודדות היומיומית עם הטראומה והקשיים היא מאבק ממושך, ואנו מרגישים מופקרים לגמרי להתמודד לבד עם הקושי.',
            'שירתנו ונלחמנו בגבורה מדהימה, אך אנו נאלצים להתמודד לבד כיום עם השלכות המחדל וההפקרה.',
            'אף אחד מהאחראים לא דואג לתמיכה ולעזרה הראויה, והנטל הנפשי על הילדים ושותפינו כבד מנשוא.',
            'אחר / תיאור כאב אישי...'
          ];
        }
      case 'family':
        if (isLossEvent) {
          return [
            'השכול והאובדן מלווים אותנו בכל נשימה וכל צעד. משהו בנו מת יחד איתו/ה.',
            'החגים הפכו לימי אבל משפחתיים, והכעס על מי שאחראי למציאות הזו רק נפער בתוכנו.',
            'האמון הציבורי והאישי נשבר לחלוטין, ותחושת ההפקרה לא מרפה מאיתנו.',
            'אחר / תיאור כאב אישי...'
          ];
        } else {
          return [
            'הפקרה שנמשכת חודשים ארוכים ללא שום מענה ראוי למפונים ולקושי הכלכלי והמשפחתי של הקרובים.',
            'תחושת האכזבה והזעם על כך שאף אחד לא לוקח אחריות על הילדים והמשפחה שלנו שבזבזה חודשים במילואים.',
            'המאמץ להתאושש מהפגיעה ומההפקרה דורש כוחות שאין לנו, כשהמדינה והשלטון מעלימים עין.',
            'אחר / תיאור כאב אישי...'
          ];
        }
      case 'friend':
        if (isLossEvent) {
          return [
            'השכול והאובדן מלווים אותנו בכל נשימה וכל צעד. משהו בנו מת יחד איתו/ה.',
            'החיים והחג כבר לא שלמים בלעדיו. הגעגוע והחלל רק הולכים ומעמיקים יומיומיים.',
            'האמון הציבורי והאישי נשבר לחלוטין, ותחושת ההפקרה לא מרפה מאיתנו.',
            'אחר / תיאור כאב אישי...'
          ];
        } else {
          return [
            'הלב נשבר לראות את החברים שלנו נאלצים להתמודד לבד עם סיבוכים רפואיים, נפשיים וכלכליים.',
            'האמון הציבורי והאישי במדינה נשבר לחלוטין כשאנו רואים את ההפקרה המתמשכת של הלוחמים בשטח.',
            'חברינו שהגנו בגופם על הארץ מוצאים את עצמם נאבקים על חייהם ועל נפשם ללא כל סיוע הולם מצד הממשלה.',
            'אחר / תיאור כאב אישי...'
          ];
        }
      case 'self':
        return [
          'הטראומה לא עוזבת אותנו, הילדים סובלים מסיוטים קשים והלב מסרב להאמין.',
          'אנחנו חיים כמפונים בארצנו בלי בית פיזי, בלי שקט ובלי שום פתרון אמיתי באופק.',
          'העסק שלי בקשיים אדירים, ואנו מרגישים שנשארנו לגמרי לבד להתמודד עם השלכות המחדל.',
          'שירתנו ונלחמנו בגבורה אבל אף אחד מהאחראים לא לוקח אחריות.',
          'אחר / תיאור כאב אישי...'
        ];
      case 'other':
      default:
        return [
          'החיים שלנו התהפכו לחלוטין ויש חלל עצום ורק געגוע שאי אפשר להסביר במילים.',
          'התחושה של ההפקרה מלווה אותנו בכל רגע, והאמון בשלטון נשבר לחלוטין.',
          'סובלים מקשיים נפשיים וטראומה קשה שלא נותנת לנו לחזור למסלול באמת.',
          'אחר / תיאור כאב אישי...'
        ];
    }
  };

  // Move back
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  // Handle step completion
  const handleNext = () => {
    if (activeStep < totalStepsCount - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      // Build final object and trigger submission
      const finalEventText = selectedEvent === 'אחר / אסון אחר, בהתאמה אישית' 
        ? customEventText 
        : selectedEvent;

      const finalPainText = selectedPain === 'אחר / תיאור כאב אישי...' 
        ? customPainText 
        : selectedPain;

      // Construct a coherent narrative based on actual inputs (or beautiful defaults if empty)
      const outSpeakerName = speakerName.trim() || 'אזרח מודאג';
      const outSpeakerGender = speakerGender;
      const outLostPersonName = storyWho !== 'self' ? (lostPersonName.trim() || 'יקירי') : '';
      const outLostPersonGender = lostPersonGender;
      
      let personalConnection = '';
      let storyContext = '';
      let emotionalImpact = '';
      let callToAction = '';

      // Part 1: personal introduction
      const isLossEvent = finalEventText
        ? (finalEventText.includes('נהרג') || finalEventText.includes('נרצח') || finalEventText.includes('נפלו') || finalEventText.includes('נעלם') || finalEventText.includes('איבד'))
        : true;

      if (storyWho === 'self') {
        personalConnection = `שמי ${outSpeakerName}, ואני פונה אליכם כדי לשתף את מה שקרה לי ולמשפחתי באסון הנורא של השבת השחורה.`;
      } else if (storyWho === 'child') {
        const parentLabel = outSpeakerGender === 'female' ? 'אימא' : 'אבא';
        if (isLossEvent) {
          const genderVerb = outLostPersonGender === 'female' ? 'שנרצחה באסון' : 'שנרצח באסון';
          personalConnection = `שמי ${outSpeakerName}, ואני ה${parentLabel} של ${outLostPersonName} הגיבור ${genderVerb} ב-7 באוקטובר.`;
        } else {
          if (finalEventText?.includes('מילואים')) {
            const genderVerb = outLostPersonGender === 'female' ? 'ששירתה בגאווה' : 'ששירת בגאווה';
            personalConnection = `שמי ${outSpeakerName}, ואני ה${parentLabel} של ${outLostPersonName} הגיבור ${genderVerb} במילואים חודשים ארוכים.`;
          } else if (finalEventText?.includes('טראומה')) {
            const genderVerb = outLostPersonGender === 'female' ? 'שמתמודדת עם טראומה' : 'שמתמודד עם טראומה';
            personalConnection = `שמי ${outSpeakerName}, ואני ה${parentLabel} של ${outLostPersonName} ${genderVerb} קשה מאז ה-7 באוקטובר.`;
          } else {
            const genderVerb = outLostPersonGender === 'female' ? 'שנפגעה באסון' : 'שנפגע באסון';
            personalConnection = `שמי ${outSpeakerName}, ואני ה${parentLabel} של ${outLostPersonName} ${genderVerb} ה-7 באוקטובר ומנסה להשתקם.`;
          }
        }
      } else if (storyWho === 'family') {
        if (isLossEvent) {
          personalConnection = `שמי ${outSpeakerName}, ובשבת השחורה של ה-7 באוקטובר המשפחה שלנו ספגה אבדה קשה מנשוא כשאיבדנו את ${outLostPersonName}.`;
        } else {
          if (finalEventText?.includes('מילואים')) {
            personalConnection = `שמי ${outSpeakerName}, ואני פונה אליכם כדי לספר על בן משפחתי ${outLostPersonName} ששירת בגבורה במילואים.`;
          } else if (finalEventText?.includes('פונתה')) {
            personalConnection = `שמי ${outSpeakerName}, ואני פונה אליכם כחלק ממשפחתנו שפונתה מביתה לחודשים ארוכים מאז אותה שבת.`;
          } else {
            personalConnection = `שמי ${outSpeakerName}, ובשבת השחורה המשפחה של ${outLostPersonName} נפגעה קשות ומאז אנו מתמודדים לבד.`;
          }
        }
      } else if (storyWho === 'friend') {
        if (isLossEvent) {
          personalConnection = `שמי ${outSpeakerName}, ואני רוצה לספר לכם על חברי הטוב ${outLostPersonName} שנרצח באסון ה-7 באוקטובר.`;
        } else {
          if (finalEventText?.includes('מילואים')) {
            personalConnection = `שמי ${outSpeakerName}, ואני פונה אליכם כדי לספר על חברי ${outLostPersonName} ששירת במילואים חודשים רבים.`;
          } else {
            personalConnection = `שמי ${outSpeakerName}, ואני רוצה לספר לכם על חברי ${outLostPersonName} שנפגע באותה שבת שחורה.`;
          }
        }
      } else {
        personalConnection = `שמי ${outSpeakerName}, ואור ל-7 באוקטובר עברתי אסון קשה ששינה את חיי לעד.`;
      }

      // Part 2: What happened
      if (finalEventText) {
        if (isLossEvent) {
          storyContext = `באותה שבת נוראה של הפקרה ומחדל קשה, ${finalEventText}. לא היה שם אף אחד שיגן או שיחלץ בזמנים הנוראים בהם שווענו לעזרה.`;
        } else {
          storyContext = `באותה שבת נוראה של הפקרה ומחדל קשה, ${finalEventText}. הכתובת הייתה על הקיר, אך המפקירים נרדמו בשמירה.`;
        }
      } else {
        storyContext = `בזמן שההנהגה ישנה והפקירה אותנו, מצאנו את עצמנו בחזית נטושה ובשעות ארוכות ומדממות ללא שום הגנה.`;
      }

      // Part 3: Emotional impact / pain
      if (finalPainText) {
        emotionalImpact = `${finalPainText} הכאב הזה מלווה את הבית והמשפחה בכל יום, בלי שובעה ובלי מרגוע, והמחשבה על ההפקרות פוצעת את הלב.`;
      } else {
        emotionalImpact = `מאז אותה שבת החיים שלנו נשברו לחלוטין. הבית פצוע, הגעגוע קשה להכלה, והתחושה שהפקירו אותנו מלווה את הילדים ואת כולנו בכל נשימה.`;
      }

      // Part 4: Call to action / elections commitment
      const userVerb = outSpeakerGender === 'female' ? 'פונה ומבקשת' : 'פונה ומבקש';
      callToAction = `מעומק הלב הפצוע שלי, אני ${userVerb} מכם, המשפחה והחברים האהובים שלי: ביום הבחירות, הבטיחו לי שלא תתנו את הקול שלכם לאף אחד שהיה חבר בממשלה שהפקירה אותנו ב-7 באוקטובר.`;

      const submissionData: Questionnaire = {
        speakerName: outSpeakerName,
        speakerGender: outSpeakerGender,
        relationshipType: storyWho,
        lostPersonName: outLostPersonName,
        lostPersonGender: outLostPersonGender,
        customRelationshipText: finalEventText,
        personalConnection,
        storyContext,
        emotionalImpact,
        callToAction
      };

      onSubmit(submissionData);
    }
  };

  const activeStepInfo = formSteps[activeStep];

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden" id="questionnaire-card">
      
      {/* Header and Progress Bar */}
      <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-blue-50/50 to-white border-b border-gray-100 text-right">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-start" dir="rtl">
            <span className="p-3 bg-white rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-isr-blue animate-pulse" />
            </span>
            <div>
              <span className="text-xs font-black tracking-wider text-isr-blue uppercase block">
                שלב {activeStep + 1} מתוך {totalStepsCount}
              </span>
              <h1 className="text-xl font-black text-gray-900 leading-tight">בואו נבנה ביחד את הסיפור האישי שלכם 💖</h1>
              <p className="text-gray-500 text-xs font-bold mt-1">נשמח שתבחרו את המשפטים המתאימים לכם או שתכתבו חופשי.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-isr-blue rounded-xl font-black text-xs border border-blue-100 shadow-xs mr-auto ml-0">
            <IsraeliFlag className="w-7 h-5" />
            <span>יוזמה אזרחית לאומית</span>
          </div>
        </div>

        {/* Israeli blue progress bars */}
        <div className="flex gap-2 items-center" dir="rtl">
          {formSteps.map((stepItem, index) => {
            const isCompleted = index < activeStep;
            const isActive = index === activeStep;
            return (
              <div key={index} className="flex-1 flex flex-col gap-1">
                <div className={`h-2.5 rounded-full transition-all duration-300 ${
                  isCompleted ? 'bg-isr-blue' : isActive ? 'bg-isr-blue ring-2 ring-blue-100' : 'bg-gray-200'
                }`} />
                <span className={`text-[10px] hidden md:block text-center mt-1 font-black ${
                  isActive ? 'text-isr-blue' : isCompleted ? 'text-blue-800/80' : 'text-gray-400'
                }`}>
                  {stepItem.shortTitle}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div className="p-8 text-right font-sans" dir="rtl">
        
        {/* Dynamic Screens */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStepInfo.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.18 }}
            className="space-y-6"
          >
            
            {/* STEP 0: Speaker Details (שם ומגדר) */}
            {activeStepInfo.id === 'speaker' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-gray-900 mb-1">איך קוראים לך?</h2>
                  <input
                    type="text"
                    id="speaker-name-input"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    placeholder="כל שם זה בסדר (למשל: משה, דנה...)"
                    className="w-full text-base font-bold px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-isr-blue focus:ring-1 focus:ring-isr-blue transition-all text-gray-800 placeholder-gray-400 shadow-inner"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-black text-gray-900 mb-1">מה המגדר שלך?</h2>
                  <p className="text-gray-400 text-xs mb-3">בחרו מגדר כדי שנוכל להתאים את הטקסט בצורה מושלמת</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSpeakerGender('male')}
                      className={`px-4.5 py-4 rounded-2xl border transition-all text-center cursor-pointer flex items-center justify-center gap-2.5 ${
                        speakerGender === 'male'
                          ? 'bg-blue-50/70 text-isr-blue border-isr-blue shadow-xs font-black'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-bold'
                      }`}
                    >
                      <span>זכר</span>
                      {speakerGender === 'male' && (
                        <span className="w-4 h-4 rounded-full bg-isr-blue flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSpeakerGender('female')}
                      className={`px-4.5 py-4 rounded-2xl border transition-all text-center cursor-pointer flex items-center justify-center gap-2.5 ${
                        speakerGender === 'female'
                          ? 'bg-blue-50/70 text-isr-blue border-isr-blue shadow-xs font-black'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-bold'
                      }`}
                    >
                      <span>נקבה</span>
                      {speakerGender === 'female' && (
                        <span className="w-4 h-4 rounded-full bg-isr-blue flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                        </span>
                      )}
                    </button>
                  </div>
                  
                  <p className="text-gray-400 text-xs font-semibold mt-3 text-right">
                    * כדי שנוכל להתאים את הטקסט ללשון זכר או נקבה
                  </p>
                </div>
              </div>
            )}

            {/* STEP 1: Who is the story about */}
            {activeStepInfo.id === 'who' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-900">על מי הסיפור שתרצה לשתף?</h2>
                <p className="text-gray-400 text-xs mb-4">בחרו מבין האפשרויות השונות:</p>

                <div className="flex flex-col gap-3">
                  {[
                    { key: 'child', label: 'על הבן או הבת שלי' },
                    { key: 'family', label: 'על קרוב משפחה' },
                    { key: 'friend', label: 'חברים וקרובים' },
                    { key: 'self', label: 'על עצמי ועל משפחתי' },
                    { key: 'other', label: 'אחר בהתאמה אישית' }
                  ].map((opt) => {
                    const isSelected = storyWho === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setStoryWho(opt.key as any);
                          // Reset events & pain selection on change
                          setSelectedEvent('');
                          setSelectedPain('');
                        }}
                        className={`text-right text-base px-5 py-4 rounded-2.5xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/70 text-isr-blue border-isr-blue shadow-sm font-black'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-bold'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-isr-blue flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" strokeWidth={4} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: What happened (מה קרה) */}
            {activeStepInfo.id === 'what' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-900 justify-end flex items-center gap-1.5">מה קרה באותה שבת?</h2>
                <p className="text-gray-400 text-xs mb-4">הרשימה הותאמה לבחירתכם הקודמת (ניתן לדלג או ללחוץ הבא):</p>

                <div className="flex flex-col gap-2.5">
                  {getEventPresets().map((preset) => {
                    const isSelected = selectedEvent === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setSelectedEvent(preset);
                        }}
                        className={`text-right text-sm px-5 py-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/70 text-isr-blue border-isr-blue shadow-sm font-black'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-bold'
                        }`}
                      >
                        <span>{preset}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-isr-blue flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* If custom event option is selected */}
                {(selectedEvent === 'אחר / אססון אחר, בהתאמה אישית' || selectedEvent === '') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-3"
                  >
                    <label className="block text-xs font-bold text-gray-500 mb-2">פרטו במילים שלכם אם תרצו:</label>
                    <textarea
                      value={customEventText}
                      onChange={(e) => setCustomEventText(e.target.value)}
                      placeholder="למשל: הבית שלנו נפגע, איבדנו את המשק החקלאי..."
                      rows={2}
                      className="w-full text-sm font-bold px-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-isr-blue focus:ring-1 focus:ring-isr-blue transition-all text-gray-800 shadow-inner resize-none"
                    />
                  </motion.div>
                )}
              </div>
            )}

            {/* STEP 3: Affected Person Name and Gender */}
            {activeStepInfo.id === 'person' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-black text-gray-900 mb-1">מה השם של האדם?</h2>
                  <p className="text-gray-400 text-xs mb-3">השם של יקירכם שעליו תרצו לספר (אופציונלי)</p>
                  <input
                    type="text"
                    value={lostPersonName}
                    onChange={(e) => setLostPersonName(e.target.value)}
                    placeholder="שם האדם (למשל: דניאל, נועה...)"
                    className="w-full text-base font-bold px-4.5 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-isr-blue focus:ring-1 focus:ring-isr-blue transition-all text-gray-800 placeholder-gray-400 shadow-inner"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-black text-gray-900 mb-1">זכר או נקבה?</h2>
                  <p className="text-gray-400 text-xs mb-3">בחרו מגדר כדי שנוכל להתאים את הטקסט בצורה מושלמת</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setLostPersonGender('male')}
                      className={`px-4.5 py-4 rounded-2xl border transition-all text-center cursor-pointer flex items-center justify-center gap-2.5 ${
                        lostPersonGender === 'male'
                          ? 'bg-blue-50/70 text-isr-blue border-isr-blue shadow-xs font-black'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-bold'
                      }`}
                    >
                      <span>זכר</span>
                      {lostPersonGender === 'male' && (
                        <span className="w-4 h-4 rounded-full bg-isr-blue flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setLostPersonGender('female')}
                      className={`px-4.5 py-4 rounded-2xl border transition-all text-center cursor-pointer flex items-center justify-center gap-2.5 ${
                        lostPersonGender === 'female'
                          ? 'bg-blue-50/70 text-isr-blue border-isr-blue shadow-xs font-black'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-bold'
                      }`}
                    >
                      <span>נקבה</span>
                      {lostPersonGender === 'female' && (
                        <span className="w-4 h-4 rounded-full bg-isr-blue flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                        </span>
                      )}
                    </button>
                  </div>

                  <p className="text-gray-400 text-xs font-semibold mt-3 text-right">
                    * כדי שנוכל להתאים את הטקסט ללשון זכר או נקבה
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: Pain and Toll (הכאב והמחיר מאז) */}
            {activeStepInfo.id === 'pain' && (
              <div className="space-y-4">
                <h2 className="text-lg font-black text-gray-900">בחרו את הכאב והמחיר שלכם מאז</h2>
                <p className="text-gray-400 text-xs mb-4">עכשיו בחירה רלוונטית של הכאב והמחיר מאז שהותאמה אישית:</p>

                <div className="flex flex-col gap-2.5">
                  {getPainPresets().map((preset) => {
                    const isSelected = selectedPain === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSelectedPain(preset)}
                        className={`text-right text-sm px-5 py-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-50/70 text-isr-blue border-isr-blue shadow-sm font-black'
                            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 font-bold'
                        }`}
                      >
                        <span className="leading-relaxed">{preset}</span>
                        {isSelected && (
                          <span className="w-4 h-4 rounded-full bg-isr-blue flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Pain Option */}
                {(selectedPain === 'אחר / תיאור כאב אישי...' || selectedPain === '') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-3"
                  >
                    <label className="block text-xs font-bold text-gray-500 mb-2">תארו במילים שלכם אם תרצו:</label>
                    <textarea
                      value={customPainText}
                      onChange={(e) => setCustomPainText(e.target.value)}
                      placeholder="המשיכו לתאר את השפעת האובדן, הטיפולים או החלל שעדיין שורף בלב..."
                      rows={3}
                      className="w-full text-sm font-bold px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-isr-blue focus:ring-1 focus:ring-isr-blue transition-all text-gray-800 shadow-inner resize-none"
                    />
                  </motion.div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation Action Buttons - "המשך לשלב הבא" is ALWAYS ACTIVE */}
        <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-100 font-sans">
          
          <button
            type="button"
            id="wizard-back-btn"
            onClick={handleBack}
            className={`px-6 py-3.5 text-sm font-bold rounded-2xl border transition-all cursor-pointer flex items-center gap-2 ${
              activeStep === 0
                ? 'opacity-0 pointer-events-none'
                : 'text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה</span>
          </button>
          
          <button
            type="button"
            id="wizard-next-btn"
            onClick={handleNext}
            className="px-10 py-4 text-base font-black rounded-2xl text-white shadow-xl transition-all duration-200 cursor-pointer bg-[#0038b8] hover:bg-[#002ca0] shadow-blue-200 hover:translate-y-[-1.5px] active:translate-y-0 flex items-center gap-2"
          >
            <span>{activeStep === totalStepsCount - 1 ? 'חולל תסריט ב-AI ✨' : 'המשך לשלב הבא'}</span>
            <ArrowLeft className="w-4 h-4" />
          </button>

        </div>

      </div>
    </div>
  );
}
