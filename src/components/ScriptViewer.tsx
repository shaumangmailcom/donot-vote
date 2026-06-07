import React, { useState } from 'react';
import { GeneratedScript, ScriptLine } from '../types';
import { RotateCw, Plus, Trash2, Clock, Check, AlertCircle, Camera, Sun, Image, Volume2 } from 'lucide-react';
import { motion } from 'motion/react';
import IsraeliFlag from './IsraeliFlag';

interface ScriptViewerProps {
  script: GeneratedScript;
  onConfirm: (finalScript: GeneratedScript) => void;
  onRegenerate: () => void;
}

export default function ScriptViewer({ script, onConfirm, onRegenerate }: ScriptViewerProps) {
  const [editedScript, setEditedScript] = useState<GeneratedScript>({ ...script });

  const handleLineTextChange = (index: number, newText: string) => {
    const updatedLines = [...editedScript.lines];
    updatedLines[index] = { ...updatedLines[index], text: newText };
    setEditedScript(prev => ({ ...prev, lines: updatedLines }));
  };

  const handleDurationChange = (index: number, delta: number) => {
    const updatedLines = [...editedScript.lines];
    const newDuration = Math.max(1, Math.min(12, updatedLines[index].durationSeconds + delta));
    updatedLines[index] = { ...updatedLines[index], durationSeconds: newDuration };
    setEditedScript(prev => ({ ...prev, lines: updatedLines }));
  };

  const handleAddLine = () => {
    const defaultNewLine: ScriptLine = {
      text: 'אני פונה ללב שלכם ומבקש/ת שתזכרו מי הפקיר אותנו.',
      durationSeconds: 5
    };
    setEditedScript(prev => ({
      ...prev,
      lines: [...prev.lines, defaultNewLine]
    }));
  };

  const handleRemoveLine = (index: number) => {
    if (editedScript.lines.length <= 1) return;
    const updatedLines = editedScript.lines.filter((_, i) => i !== index);
    setEditedScript(prev => ({ ...prev, lines: updatedLines }));
  };

  const handleSave = () => {
    onConfirm(editedScript);
  };

  const totalDuration = editedScript.lines.reduce((acc, line) => acc + line.durationSeconds, 0);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden font-sans text-right" id="script-viewer-card" dir="rtl">
      
      {/* Premium header with Israeli Flag and exact Israeli campaign titles */}
      <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-blue-50/70 to-white border-b border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <IsraeliFlag className="w-8 h-5.5 shadow-xs border border-blue-200" />
              <span>התסריט שלך מוכן ✨</span>
            </h1>
            <p className="text-gray-600 text-sm font-bold mt-1.5">
              עברו על הטקסט המוצע ושנו כמו שאתם מבינים. זו ההתחייבות שלכם.
            </p>
          </div>
          
          <div className="flex gap-4 items-center mr-auto ml-0 sm:mr-0 sm:ml-auto">
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-100 text-isr-blue rounded-xl text-xs font-black border border-blue-200 shadow-sm">
              <Clock className="w-4 h-4 text-isr-blue" />
              זמן דיבור מוערך: {totalDuration} שניות
            </div>
          </div>
        </div>

        {/* Attention alert block requested by user */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50/60 p-5 rounded-2xl border border-blue-100 text-sm text-blue-950 leading-relaxed font-semibold shadow-sm mb-6 flex gap-3.5 items-start">
          <AlertCircle className="w-6 h-6 text-isr-blue shrink-0 mt-0.5" />
          <div>
            <strong className="text-blue-900 font-black block mb-1">שימו לב! 💡</strong>
            במסך הבא, המערכת תנחה אתכם איך לשבת באופן מדוייק מול המצלמה ותציג בפניכם את הטקסט תוך כדי הקלטה, כך שאין לכם צורך להדפיס את הטקסט. תוכלו גם להקליט את עצמכם שוב ושוב עד שתרגישו שלמים עם התוצאה.
          </div>
        </div>

        {/* Director guidance requested by user */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2.5xl p-5 shadow-sm text-right">
          <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
            <span>🎬 הנחיות הבמאי:</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 leading-relaxed">
            <div className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
              <Camera className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-800 block mb-0.5 font-bold">צילום:</strong>
                הניחו את מצלמת הטלפון / המחשב שלכם מולכם, כשהיא יציבה.
              </div>
            </div>

            <div className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
              <Sun className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-800 block mb-0.5 font-bold">תאורה:</strong>
                מקור האור - מנורה / חלון עם אור יום - מול הפנים שלכם, מאחורי הטלפון המצלם אתכם.
              </div>
            </div>

            <div className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
              <Image className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-800 block mb-0.5 font-bold">רקע:</strong>
                אל תשבו צמודים לקיר אלא השתדלו לייצר עומק כלשהו מאחוריכם. שימו לב שהרקע שלכם מסודר ונעים.
              </div>
            </div>

            <div className="flex gap-2.5 items-start bg-white p-3 rounded-xl border border-slate-100 shadow-xs">
              <Volume2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-slate-800 block mb-0.5 font-bold">סאונד:</strong>
                דאגו שאין רעשי רקע (סגרו חלונות, אם אתם במקום רועש הקליטו בחדר פנימי). דברו בקול, לאט ובביטחון. הביעו בקול שלכם את התחושות שלכם.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Content Workspace */}
      <div className="p-8">
        <label className="block text-slate-400 text-xs font-black mb-4 uppercase tracking-wider">
          שורות הטקסט שיופיעו בטלפרומפטר במהלך ההקלטה (ניתן לערוך חופשי):
        </label>
        
        <div className="space-y-4 mb-8">
          {editedScript.lines.map((line, idx) => {
            const containsSlogan = line.text.includes('משפחה וחברים לפני הקול');
            const isCallToActionLine = line.text.includes('ממשלה') || line.text.includes('להצביע') || line.text.includes('מצביעים') || line.text.includes('בחירות');

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-2xl border transition-all ${
                  isCallToActionLine
                    ? 'border-red-200 bg-red-50/25'
                    : containsSlogan
                    ? 'border-blue-200 bg-blue-50/20'
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50/40'
                }`}
                id={`script-line-box-${idx}`}
              >
                <div className="flex items-start gap-4">
                  {/* Step Number Badge */}
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black leading-none mt-2 shrink-0 ${
                    isCallToActionLine
                      ? 'bg-red-100 text-red-700 border border-red-200'
                      : containsSlogan
                      ? 'bg-blue-100 text-isr-blue border border-blue-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Input Box and subtitle timing */}
                  <div className="flex-1 space-y-3">
                    <textarea
                      id={`line-input-${idx}`}
                      value={line.text}
                      onChange={(e) => handleLineTextChange(idx, e.target.value)}
                      rows={2}
                      className={`w-full text-base font-black px-3.5 py-2.5 bg-white border rounded-xl focus:outline-none transition-all leading-relaxed ${
                        isCallToActionLine
                          ? 'border-red-200 focus:border-red-500 text-red-950 shadow-sm'
                          : containsSlogan
                          ? 'border-blue-200 focus:border-isr-blue text-isr-blue shadow-sm'
                          : 'border-slate-200 focus:border-isr-blue text-slate-800'
                      }`}
                      placeholder="הקלידו את מילות התסריט לשלב זה..."
                    />

                    {/* Subtitle visual duration controllers */}
                    <div className="flex justify-between items-center bg-white/50 p-2 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">הצגת כתובית על הסרטון:</span>
                        <div className="flex items-center gap-1.5" dir="ltr">
                          <button
                            type="button"
                            onClick={() => handleDurationChange(idx, -1)}
                            className="w-7 h-7 flex items-center justify-center text-sm font-black rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 focus:outline-none cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-sm font-black text-slate-800 px-2 bg-slate-100 rounded min-w-14 text-center">
                            {line.durationSeconds} ש׳
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDurationChange(idx, 1)}
                            className="w-7 h-7 flex items-center justify-center text-sm font-black rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 focus:outline-none cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {editedScript.lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1 px-2.5 flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200 rounded-lg text-xs font-black transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          מחק שורה
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Add sentence option */}
        <button
          type="button"
          onClick={handleAddLine}
          className="w-full py-3.5 flex items-center justify-center gap-2 border-2 border-dashed border-blue-200 rounded-2xl hover:bg-blue-50/40 hover:border-blue-300 transition-colors text-isr-blue text-sm font-black cursor-pointer mb-8"
        >
          <Plus className="w-4 h-4" />
          הוספת שורה חדשה לתסריט
        </button>

        {/* Real Action confirmation footer */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onRegenerate}
            className="w-full sm:w-auto px-6 py-3.5 flex items-center justify-center gap-2 text-sm font-bold rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
            חזרה לעריכת השאלון ✍️
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="w-full sm:w-auto px-10 py-4 flex items-center justify-center gap-2 text-base font-black rounded-2xl text-white bg-isr-blue hover:bg-blue-800 shadow-xl shadow-blue-100 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            אישור התסריט ומעבר לצילום הוידאו 🎥
          </button>
        </div>
      </div>
    </div>
  );
}
