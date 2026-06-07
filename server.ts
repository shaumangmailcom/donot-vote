import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for body parsing
  app.use(express.json());

  // API route for script generation
  app.post("/api/generate-script", async (req: express.Request, res: express.Response) => {
    try {
      const { speakerName, speakerGender, relationshipType, lostPersonName, lostPersonGender, customRelationshipText, personalConnection, storyContext, emotionalImpact, callToAction } = req.body;

      // Access GEMINI_API_KEY from env
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "מפתח ה-API של Gemini אינו מוגדר בשרת. אנא ודא שהגדרת אותו ב-Secrets." });
      }

      // Initialize GoogleGenAI SDK with requirements
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const displayRelationship = relationshipType === 'other' 
        ? (customRelationshipText || 'אחר') 
        : relationshipType;

      const userPrompt = `
        צור תסריט אישי, קצר, תמציתי ומאוד נוגע ללב בעברית, המכוון לחברים ובני משפחה של הדובר.
        התסריט חייב להיות מהודק וקצר - בדיוק כ-6 עד 7 משפטים/שורות קצרות בסך הכל, שיתאימו לסרטון של 30 עד 40 שניות.

        שם הדובר/ת: ${speakerName || 'לא צוין'}
        מגדר הדובר/ת: ${speakerGender === 'female' ? 'נקבה (לשון פנייה של אישה, למשל: אני מבקשת, שירתי, פניתי, כאובה)' : 'זכר (לשון פנייה של גבר, למשל: אני מבקש, שירתי, פניתי, כאוב)'}
        קשר אישי ל-7 באוקטובר: ${displayRelationship} (אם רלוונטי: ${customRelationshipText || ''})
        שם יקיר הדובר שנפל/נרצח (אם רלוונטי): ${lostPersonName || 'לא צוין'}
        מגדר יקיר הדובר שנפל/נרצח (אם רלוונטי): ${lostPersonGender === 'female' ? 'נקבה (לשון היא, למשל: נרצחה, נפלה, נלקחה)' : 'זכר (לשון הוא, למשל: נרצח, נפל, נלקח)'}

        התסריט חייב לעשות שימוש אישי וישיר בשמות הללו ולשמור על המבנה המרוכז של 4 פסקאות, כאשר כל פונקציה מנוסחת במשפט יחיד וקצר:

        חלק 1: הקשר האישי לאירועים (הצגה קצרה של הדובר דוגמת "שמי ${speakerName || ''}" או "אני ${speakerName || ''}" וציון הקשר האישי, משפט אחד קצר בלבד):
        "${personalConnection || 'שלום לכולם, אני פונה אליכם באופן אישי על מה שחוויתי באותו יום נורא.'}"

        חלק 2: הסיפור ומה שקרה (אזכור קצר וכואב של ${lostPersonName || ''} או המחדל שחוויתם, משפט אחד או שניים קצרים בלבד):
        "${storyContext || 'איבדנו את היקר לנו מכל באותו יום נורא.'}"

        חלק 3: ההשפעה והכאב היום (משפט אחד קצר בלבד בלשון הדובר):
        "${emotionalImpact || 'הכאב מאז הוא בלתי נסבל וההפקרה נמשכת.'}"

        חלק 4: הקריאה לפעולה הברורה (הבקשה המפורשת מהקרובים אלינו לא להצביע לאף אחד שהיה בממשלה או כנסת שהיו חלק מהשלטון באסון ה-7 באוקטובר, משפט אחד קצר בלבד):
        "${callToAction || 'אני מבקש/ת מכם באופן אישי: אל תתנו עוד כוח או קול למי שהיה בממשלה ב-7 באוקטובר.'}"

        הוראות הפקה ובימוי קריטיות:
        1. התסריט כולו חייב להוביל ולהסתיים באופן מוחלט ושקול בסלוגן המאחד והמקרב: "משפחה וחברים לפני הקול".
        2. על הדובר לדבר בצורה אינטימית בגוף ראשון ("אני", "משפחתי"). התייחסו למגדר היקיר/ה בדיוק וברגישות עילאית (למשל, ${lostPersonGender === 'female' ? 'היא נרצחה/נפלה' : 'הוא נרצח/נפל'}), והדגישו את שמם (${lostPersonName || ''}) לאורך התסריט.
        3. חובה להקפיד בצורה מוחלטת על הדקדוק המגדרי שנמסר (${speakerGender === 'female' ? 'לשון נקבה' : 'לשון זכר'}). פעלים וכינויים של הדובר צריכים להיות מותאמים ב-100%!
        4. חלקו את התסריט בדיוק ל-6 עד 7 משפטים/שורות קצרים ביותר. כל שורה צריכה לכלול בין 5 ל-9 מילים לכל היותר (כדי שיוכלו לקרוא בנחת ולהבין בקלות).
        5. לכל שורה ספק משך זמן בשניות - בדיוק 5 או 6 שניות לכל שורה - כך שזמן הדיבור הכולל של 6-7 השורות יהיה בדיוק בין 30 ל-40 שניות.
        6. שמור על עברית תיקנית, רגישה ומאוד משכנעת.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: "You are an expert Israeli emotional campaign director and copywriter. Generate a powerful, respectful script in Hebrew targeting friends and family members. Step 4 must call upon viewers to not vote for anyone who held office in the government on October 7th. The final slide/line must culminate strongly in the slogan: 'משפחה וחברים לפני הקול'. Split the script logically into exactly 6 to 7 individual short lines suited for teleprompters and video subtitle overlays. For each line, return text in Hebrew and durationSeconds. Each line must be very short and be rated with exactly 5 or 6 seconds, ensuring the total script runtime is between 30 and 42 seconds long. Respond only in valid JSON matching the specified schema.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              introduction: { type: Type.STRING, description: "Heads-up or context of the speech" },
              lines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING, description: "The Hebrew line to speak" },
                    durationSeconds: { type: Type.INTEGER, description: "Estimated seconds to read this line naturally and slowly (must specify exactly 5 or 6)" }
                  },
                  required: ["text", "durationSeconds"]
                }
              }
            },
            required: ["title", "lines"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("לא התקבל טקסט ממודל ה-AI של Gemini.");
      }

      const parsed = JSON.parse(text);
      res.json(parsed);
    } catch (error: any) {
      console.error("Gemini GenAI Error:", error);
      res.status(500).json({ error: error.message || "ארעה שגיאה בעיבוד התסריט באמצעות ה-AI." });
    }
  });

  // Serve static files or use Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
