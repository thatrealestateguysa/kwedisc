import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import Button from "./components/ui/button";
import Input from "./components/ui/input";
import { Download, Mail, Loader2 } from "lucide-react";

const KW_RED = "#b40101";
const LOGO_SRC = "/kw-explore-logo.png";
const APP_NAME = "Find Your Lead Gen WINWIN";
const EMAILJS_SERVICE_ID = "your_service_id";
const EMAILJS_TEMPLATE_ID = "your_template_id";
const EMAILJS_PUBLIC_KEY = "your_public_key";
const CC_EMAIL = "Dawie.dutoit@kwsa.co.za";

type Trait = 'D'|'I'|'S'|'C';

const QUESTIONS: { q:string; options: Record<Trait,string> }[] = [
  { "q": "When meeting a new client, you usually...", "options": {"D": "Take charge and set clear expectations", "I": "Engage warmly to build connection", "S": "Listen carefully to understand their needs", "C": "Ask structured questions and note details"} },
  { "q": "In stressful negotiations, you tend to...", "options": {"D": "Stay firm and drive toward resolution", "I": "Keep it light and persuasive", "S": "Maintain calm and empathy", "C": "Rely on facts and accuracy"} },
  { "q": "When organizing your day...", "options": {"D": "Focus on key results and speed", "I": "Stay flexible and spontaneous", "S": "Keep a steady rhythm and routine", "C": "Plan and check every detail"} },
  { "q": "Your lead generation strength is...", "options": {"D": "Taking initiative and closing fast", "I": "Networking and energizing people", "S": "Building long-term relationships", "C": "Analyzing markets and tailoring strategies"} },
  { "q": "When pricing a listing, you prioritize...", "options": {"D": "Speed to market to win attention", "I": "Storytelling to spark demand", "S": "Seller comfort and readiness", "C": "CMA accuracy and absorption"} },
  { "q": "When a lender delay happens, you...", "options": {"D": "Escalate and remove blockers", "I": "Keep everyone positive and moving", "S": "Reassure client and steady the plan", "C": "Re-map timelines and contingencies"} },
  { "q": "At open houses, your focus is...", "options": {"D": "Book consults now", "I": "Meet people and build buzz", "S": "Make guests comfortable", "C": "Capture data and analyze"} },
  { "q": "Your follow-up style is...", "options": {"D": "Direct and concise", "I": "Warm and personable", "S": "Patient and steady", "C": "Detailed and precise"} },
  { "q": "On teams, you\u2019re most often the...", "options": {"D": "Driver/closer", "I": "Motivator/connector", "S": "Stabilizer/care", "C": "Analyst/systems"} },
  { "q": "You prefer scripts that...", "options": {"D": "Hit hard and fast", "I": "Feel natural to say", "S": "Build comfort and safety", "C": "Explain the logic"} },
  { "q": "When a client is indecisive, you...", "options": {"D": "Make a recommendation", "I": "Re-energize their vision", "S": "Give supportive space", "C": "Provide decision matrices"} },
  { "q": "Your calendar is...", "options": {"D": "Aggressively time-blocked", "I": "Flexible for opportunities", "S": "Predictable routine", "C": "Highly structured with buffers"} },
  { "q": "Your social content is mostly...", "options": {"D": "Direct CTAs that convert", "I": "Fun, engaging videos", "S": "Community highlights", "C": "Educational market posts"} },
  { "q": "In tough markets, you...", "options": {"D": "Increase activity and dominate", "I": "Stay visible and upbeat", "S": "Double care calls", "C": "Refine strategy via data"} },
  { "q": "Your pet peeve in a deal is...", "options": {"D": "Wasted time", "I": "Negativity", "S": "Conflict", "C": "Inaccuracy"} },
  { "q": "Clients hire you because you...", "options": {"D": "Win results", "I": "Are inspiring", "S": "Are caring", "C": "Are thorough"} },
  { "q": "Your favorite buyer consult tool is...", "options": {"D": "Clear action plan", "I": "Lifestyle visioning", "S": "Expectations & support", "C": "Needs analysis & data"} },
  { "q": "When you learn, you...", "options": {"D": "Drill and execute", "I": "Practice with people", "S": "Repeat until natural", "C": "Understand logic first"} },
  { "q": "Your CRM usage is mostly...", "options": {"D": "Hot leads and key moves", "I": "Personal notes and details", "S": "Regular check-ins", "C": "Tags, segments, analytics"} },
  { "q": "Your listing presentation strength is...", "options": {"D": "Setting agenda and leading", "I": "Stories that excite", "S": "Easing worries", "C": "Data and airtight pricing"} }
];

const TRAIT_INFO: Record<Trait,{ label:string; color:string }> = {
  D: { label: "Dominance", color: KW_RED },
  I: { label: "Influence", color: "#e11d48" },
  S: { label: "Steadiness", color: "#2563eb" },
  C: { label: "Conscientiousness", color: "#0f766e" },
};

type QA = { most: Trait | null; least: Trait | null };
const initAnswers = () => Array(QUESTIONS.length).fill(null).map(()=>({most:null, least:null})) as QA[];

export default function App() {
  const [info, setInfo] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [answers, setAnswers] = useState<QA[]>(initAnswers());
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<string|null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const reportRef = useRef<HTMLDivElement|null>(null);

  const shuffledOptions = useMemo(() =>
    QUESTIONS.map(q => (Object.entries(q.options) as [Trait, string][]) .sort(() => Math.random() - 0.5)), []);
  const answeredCount = useMemo(()=> answers.filter(a=>a.most && a.least).length, [answers]);

  const scores = useMemo(() => {
    const natural: Record<Trait,number> = { D:0, I:0, S:0, C:0 };
    const adaptive: Record<Trait,number> = { D:0, I:0, S:0, C:0 };
    const opposite: Record<Trait,Trait> = { D:'S', I:'C', S:'D', C:'I' };
    answers.forEach(a=>{ if (a.most) natural[a.most] += 1; if (a.least) adaptive[ opposite[a.least] ] += 1; });
    return { natural, adaptive };
  }, [answers]);

  const percent = (n: number) => Math.round((n / QUESTIONS.length) * 100);

  const makePDF = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const target = reportRef.current!;
    const canvas = await html2canvas(target, { scale: 2 });
    const pdf = new jsPDF();
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save(`${APP_NAME}_${info.firstName}_${info.lastName}.pdf`);
    return pdf.output("datauristring");
  };

  const emailPDF = async () => {
    if (!info.firstName || !info.lastName || !info.email) { setErrors("Please complete your details before emailing."); return; }
    if (answers.some(a=>!a.most || !a.least)) { setErrors("Please answer Most & Least for all 20 questions."); return; }
    setSending(true);
    try {
      const dataUrl = await makePDF();
      const emailjs = await import("emailjs-com");
      const base64 = dataUrl.split(",")[1];
      await emailjs.init(EMAILJS_PUBLIC_KEY);
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_email: "Dawie.dutoit@kwsa.co.za",
        to_email: info.email,
        cc_email: CC_EMAIL,
        agent_name: `${info.firstName} ${info.lastName}`,
        pdf_data_base64: base64,
      });
      alert("Your personalized DISC PDF has been emailed (CC’d to Dawie). Great work!");
    } catch (e) { alert("Email failed. Please verify EmailJS settings or download manually."); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10 p-4 flex items-center gap-3">
        <img src={LOGO_SRC} alt="KW Explore" className="h-6 md:h-8" />
        <h1 className="font-bold text-xl" style={{ color: KW_RED }}>{APP_NAME}</h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold" style={{ color: KW_RED }}>Your Details</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input className="text-base md:text-lg py-3" placeholder="Name" value={info.firstName} onChange={(e)=>setInfo({...info, firstName:e.target.value})}/>
              <Input className="text-base md:text-lg py-3" placeholder="Surname" value={info.lastName} onChange={(e)=>setInfo({...info, lastName:e.target.value})}/>
              <Input className="text-base md:text-lg py-3" placeholder="Phone" value={info.phone} onChange={(e)=>setInfo({...info, phone:e.target.value})}/>
              <Input className="text-base md:text-lg py-3" placeholder="Email" type="email" value={info.email} onChange={(e)=>setInfo({...info, email:e.target.value})}/>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: KW_RED }}>Get To Know Yourself</h2>
            <div className="rounded-xl border border-neutral-800 p-3">
              <div className="text-base md:text-lg font-medium mb-3">{currentIdx + 1}. {QUESTIONS[currentIdx].q}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs text-neutral-400 mb-2">Most likely</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shuffledOptions[currentIdx].map(([code, text]) => {
                      const selected = answers[currentIdx].most === code;
                      return (
                        <button key={`most-${code}`}
                          onClick={() => {
                            const next = [...answers];
                            if (next[currentIdx].least === code) return;
                            next[currentIdx] = { ...next[currentIdx], most: code };
                            setAnswers(next);
                          }}
                          className={`text-left rounded-lg border px-4 py-3 text-base md:text-lg ${selected ? 'ring-2 ring-red-700' : 'border-neutral-700'}`}>{text}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs text-neutral-400 mb-2">Least likely</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {shuffledOptions[currentIdx].map(([code, text]) => {
                      const selected = answers[currentIdx].least === code;
                      return (
                        <button key={`least-${code}`}
                          onClick={() => {
                            const next = [...answers];
                            if (next[currentIdx].most === code) return;
                            next[currentIdx] = { ...next[currentIdx], least: code };
                            setAnswers(next);
                          }}
                          className={`text-left rounded-lg border px-4 py-3 text-base md:text-lg ${selected ? 'ring-2 ring-red-700' : 'border-neutral-700'}`}>{text}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-neutral-400">
                <div>Answered: {answeredCount}/{QUESTIONS.length}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" className="px-4 py-3 text-base md:text-lg" onClick={()=>setCurrentIdx(Math.max(0, currentIdx-1))}>Previous</Button>
                  <Button style={{backgroundColor:KW_RED}} className="px-4 py-3 text-base md:text-lg" onClick={()=>setCurrentIdx(Math.min(QUESTIONS.length-1, currentIdx+1))} disabled={!answers[currentIdx].most || !answers[currentIdx].least}>{currentIdx<QUESTIONS.length-1?'Next':'Finish'}</Button>
                </div>
              </div>
            </div>
            {errors && <div className="text-red-500 text-sm">{errors}</div>}
            <div className="flex gap-2">
              <Button onClick={makePDF} variant="secondary"><Download className="h-4 w-4"/>Download PDF</Button>
              <Button onClick={emailPDF} style={{backgroundColor:KW_RED}} className="gap-2">{sending?<Loader2 className="h-4 w-4 animate-spin"/>:<Mail className="h-4 w-4"/>}Email Report</Button>
            </div>
          </CardContent>
        </Card>

        <div ref={reportRef} style={{position:'absolute', left:'-9999px', top:'-9999px', width:'800px'}}>
          <div className="bg-white text-black p-4 rounded-xl">
            <img src={LOGO_SRC} alt="KW" className="h-6 mb-2"/>
            <h2 className="font-bold text-lg" style={{color:KW_RED}}>Personalized DISC Report</h2>
            <p>Name: {info.firstName} {info.lastName}</p>
            <p>Email: {info.email}</p>
            <h3 className="font-semibold mt-3">Natural Style</h3>
            {(Object.keys(scores.natural) as Trait[]).map(k=>(<p key={k}>{TRAIT_INFO[k].label}: {scores.natural[k]} ({percent(scores.natural[k])}%)</p>))}
            <h3 className="font-semibold mt-3">Adaptive Style</h3>
            {(Object.keys(scores.adaptive) as Trait[]).map(k=>(<p key={k}>{TRAIT_INFO[k].label}: {scores.adaptive[k]} ({percent(scores.adaptive[k])}%)</p>))}

            <h3 className="font-semibold mt-4">Natural vs Adaptive (Side-by-Side)</h3>
            <svg width="760" height="240">
              <g>
                <text x="20" y="20" fontSize="12" fill="#111">0–100%</text>
                <g transform="translate(580,10)">
                  <rect x="0" y="0" width="14" height="14" fill="#111"/>
                  <text x="20" y="12" fontSize="12" fill="#111">Adaptive</text>
                  <rect x="100" y="0" width="14" height="14" fill="#bfbfbf" stroke="#111"/>
                  <text x="120" y="12" fontSize="12" fill="#111">Natural</text>
                </g>
              </g>
              {(['D','I','S','C'] as Trait[]).map((k, i) => {
                const nat = percent(scores.natural[k]);
                const ada = percent(scores.adaptive[k]);
                const baseX = 60 + i * 170;
                const scale = 1.6; // 0–100 -> 0–160px
                const barBottom = 200;
                return (
                  <g key={k} transform={`translate(${baseX},0)`}>
                    <text x={0} y={barBottom + 20} fontSize="12" fill="#111">{TRAIT_INFO[k].label}</text>
                    <rect x={0} y={barBottom - ada*scale} width={50} height={ada*scale} fill="#111" />
                    <text x={0} y={barBottom - ada*scale - 5} fontSize="10" fill="#111">{ada}%</text>
                    <rect x={60} y={barBottom - nat*scale} width={50} height={nat*scale} fill="#bfbfbf" stroke="#111" />
                    <text x={60} y={barBottom - nat*scale - 5} fontSize="10" fill="#111">{nat}%</text>
                  </g>
                );
              })}
              <line x1="40" y1="200" x2="740" y2="200" stroke="#111" strokeWidth="1"/>
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}
