import React, { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "./components/ui/card.tsx";
import { Button } from "./components/ui/button.tsx";
import { Input } from "./components/ui/input.tsx";
import { Download, Mail, Loader2 } from "lucide-react";

const KW_RED = "#b40101";
const LOGO_SRC = "/kw-explore-logo.png";
const APP_NAME = "Find Your Lead Gen WINWIN";

const SENDER_EMAIL = "Dawie.dutoit@kwsa.co.za";
const EMAILJS_SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || "your_service_id";
const EMAILJS_TEMPLATE_ID = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || "your_template_id";
const EMAILJS_PUBLIC_KEY = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || "your_public_key";
const CC_EMAIL = SENDER_EMAIL;

type Trait = 'D'|'I'|'S'|'C';

const QUESTIONS: { q: string; options: Record<Trait, string> }[] = [
  { q: "When starting something new, you usually...", options: { D: "Jump in and figure it out on the way", I: "Talk it through with people first", S: "Plan a comfortable routine for it", C: "Research and outline the steps" } },
  { q: "On a free weekend, you're more likely to...", options: { D: "Tackle a big task or challenge", I: "See friends and try something fun", S: "Relax at home and recharge", C: "Organize, learn, or optimize something" } },
  { q: "At a party, you...", options: { D: "Drive the plan (where/when/what)", I: "Float around and connect with many", S: "Stay with a few close people", C: "Observe first, join where it fits" } },
  { q: "When a decision is needed, you rely on...", options: { D: "Speed and gut confidence", I: "How it will feel for people", S: "Harmony and stability", C: "Data and clear logic" } },
  { q: "When conflict shows up, you...", options: { D: "Address it head-on", I: "Smooth things over", S: "Keep calm and find common ground", C: "Clarify facts and process" } },
  { q: "Your workspace is usually...", options: { D: "Geared for action", I: "Lively and personal", S: "Comfortable and steady", C: "Organized and labeled" } },
  { q: "In a group task, you naturally...", options: { D: "Take the lead", I: "Motivate and involve others", S: "Support and keep it steady", C: "Quality-check and structure" } },
  { q: "Learning something new works best when you...", options: { D: "Do it hands-on", I: "Discuss it with people", S: "Practice until it feels natural", C: "Study the material first" } },
  { q: "Your communication style leans toward...", options: { D: "Direct and brief", I: "Warm and expressive", S: "Patient and thoughtful", C: "Precise and thorough" } },
  { q: "Faced with sudden change, you...", options: { D: "Adapt fast and push forward", I: "Keep spirits up and rally", S: "Seek stability and clarity", C: "Map the new plan carefully" } },
  { q: "When traveling, you prefer...", options: { D: "An efficient power itinerary", I: "Meeting people and finding moments", S: "Restful routine and comfort", C: "Museums, notes, and structure" } },
  { q: "Your risk appetite is...", options: { D: "High – move first", I: "Moderate – try it if exciting", S: "Measured – keep it safe", C: "Low – prove it first" } },
  { q: "Deadlines make you...", options: { D: "Sprint and win the clock", I: "Gather energy and deliver", S: "Plan steady progress", C: "Schedule buffers to finish early" } },
  { q: "When shopping, you...", options: { D: "Decide quickly", I: "Enjoy browsing", S: "Ask for trusted opinions", C: "Compare and read reviews" } },
  { q: "If a plan falls apart, you...", options: { D: "Create a new path immediately", I: "Keep morale high and improvise", S: "Stabilize and reset expectations", C: "Diagnose and rebuild the process" } },
  { q: "You feel most accomplished when...", options: { D: "A bold result is achieved", I: "People had a great experience", S: "Everyone stayed comfortable", C: "The outcome is accurate and elegant" } },
  { q: "Your notes/tools are...", options: { D: "Short action lists", I: "Voice notes/photos", S: "Calendars and reminders", C: "Tags, folders, spreadsheets" } },
  { q: "What bugs you the most is...", options: { D: "Wasted time", I: "Cold interactions", S: "Unnecessary conflict", C: "Inaccurate info" } },
  { q: "People describe you as...", options: { D: "Decisive", I: "Inspiring", S: "Dependable", C: "Thorough" } },
  { q: "When giving feedback, you prefer...", options: { D: "Be candid and clear", I: "Be encouraging and upbeat", S: "Be considerate and private", C: "Be detailed with examples" } },
];

const TRAIT_INFO: Record<Trait,{ label: string; color: string }> = {
  D: { label: "Dominance", color: KW_RED },
  I: { label: "Influence", color: "#e11d48" },
  S: { label: "Steadiness", color: "#2563eb" },
  C: { label: "Conscientiousness", color: "#0f766e" },
};

const opposite: Record<Trait, Trait> = { D: 'S', I: 'C', S: 'D', C: 'I' };
const percent = (n: number) => Math.round((n / QUESTIONS.length) * 100);

export default function App() {
  const [info, setInfo] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [answers, setAnswers] = useState<{ most: Trait|null; least: Trait|null }[]>(Array(QUESTIONS.length).fill(null).map(()=>({most:null, least:null})));
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<string|null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const reportRef = useRef<HTMLDivElement|null>(null);

  const shuffledOptions = useMemo(() => QUESTIONS.map(q => (Object.entries(q.options) as [Trait, string][]).sort(()=>Math.random()-0.5)), []);
  const answeredCount = useMemo(()=> answers.filter(a=>a.most && a.least).length, [answers]);

  const scores = useMemo(() => {
    const natural: Record<Trait,number> = { D:0, I:0, S:0, C:0 };
    const adaptive: Record<Trait,number> = { D:0, I:0, S:0, C:0 };
    answers.forEach(a=>{ if (a.most) natural[a.most]+=1; if (a.least) adaptive[ opposite[a.least!] ]+=1; });
    return { natural, adaptive };
  }, [answers]);

  const progress = (answeredCount/QUESTIONS.length)*100;

  const makePDFAndFile = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const target = reportRef.current!;
    const canvas = await html2canvas(target, { scale: 2 });
    const pdf = new jsPDF();
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    const fileName = `${APP_NAME}_${info.firstName}_${info.lastName}.pdf`;
    const blob = pdf.output("blob");
    const file = new File([blob], fileName, { type: "application/pdf" });
    return { file, fileName };
  };

  const downloadPDF = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const target = reportRef.current!;
    const canvas = await html2canvas(target, { scale: 2 });
    const pdf = new jsPDF();
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    pdf.save(`${APP_NAME}_${info.firstName}_${info.lastName}.pdf`);
  };

  const emailPDF = async () => {
    if (!info.firstName || !info.lastName || !info.email) { setErrors("Please complete your details before emailing."); return; }
    if (answers.some(a=>!a.most || !a.least)) { setErrors("Please answer Most & Least for all 20 questions."); return; }
    setSending(true);
    try {
      const emailjs = await import("emailjs-com");
      await emailjs.init(EMAILJS_PUBLIC_KEY);
      const { file, fileName } = await makePDFAndFile();
      const params: Record<string, any> = {
        to_email: info.email,
        to_name: `${info.firstName} ${info.lastName}`,
        from_name: "KW Explore | Find Your Lead Gen WINWIN",
        from_email: SENDER_EMAIL,
        reply_to: SENDER_EMAIL,
        cc: SENDER_EMAIL,
        subject: "Your Personalized DISC Report",
        message: "Attached is your personalized DISC report with Lead Gen plan & Negotiation playbook.",
        attachments: [file],
      };
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
      alert("✅ Email sent with your PDF attached (CC’d to Dawie).");
    } catch (e) { console.error(e); alert("Email failed. Check EmailJS setup."); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10 p-4 flex items-center gap-3">
        <img src={LOGO_SRC} alt="KW Explore" style={{height:'12px'}} />
        <h1 className="font-bold text-xl" style={{ color: '#b40101' }}>{APP_NAME}</h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="card border border-neutral-800">
          <div className="p-4 space-y-3">
            <h2 className="text-lg font-semibold" style={{ color: '#b40101' }}>Your Details</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input className="text-base md:text-lg py-3" placeholder="Name" value={info.firstName} onChange={(e)=>setInfo({...info, firstName:e.target.value})}/>
              <Input className="text-base md:text-lg py-3" placeholder="Surname" value={info.lastName} onChange={(e)=>setInfo({...info, lastName:e.target.value})}/>
              <Input className="text-base md:text-lg py-3" placeholder="Phone" value={info.phone} onChange={(e)=>setInfo({...info, phone:e.target.value})}/>
              <Input className="text-base md:text-lg py-3" placeholder="Email" type="email" value={info.email} onChange={(e)=>setInfo({...info, email:e.target.value})}/>
            </div>
          </div>
        </div>

        <div className="card border border-neutral-800">
          <div className="p-4 space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: '#b40101' }}>Get To Know Yourself</h2>
            <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden"><div className="h-full" style={{ width: `${(answeredCount/20)*100}%`, background: '#b40101' }}></div></div>
            <div className="text-xs text-neutral-400">Answered: {answeredCount}/20 • There are no right/wrong answers.</div>
            <div className="rounded-xl border border-neutral-800 p-3">
              <div style={{fontSize:'22px', lineHeight:'1.35', fontWeight:700, marginBottom:'12px'}}>{currentIdx + 1}. {QUESTIONS[currentIdx].q}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs text-neutral-400 mb-2">Most likely</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(QUESTIONS[currentIdx].options).sort(()=>Math.random()-0.5).map(([code, text]) => {
                      const selected = answers[currentIdx].most === code;
                      return (
                        <button key={`most-${code}`}
                          onClick={() => { const next = [...answers]; if (next[currentIdx].least === code) return; next[currentIdx] = { ...next[currentIdx], most: code as Trait }; setAnswers(next); }}
                          style={{ textAlign:'left', border: '1px solid ' + (selected ? '#b40101' : '#3f3f46'), padding:'14px 16px', borderRadius:'12px', fontSize:'18px', background: selected ? '#141416' : 'transparent' }}>{text}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs text-neutral-400 mb-2">Least likely</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(QUESTIONS[currentIdx].options).sort(()=>Math.random()-0.5).map(([code, text]) => {
                      const selected = answers[currentIdx].least === code;
                      return (
                        <button key={`least-${code}`}
                          onClick={() => { const next = [...answers]; if (next[currentIdx].most === code) return; next[currentIdx] = { ...next[currentIdx], least: code as Trait }; setAnswers(next); }}
                          style={{ textAlign:'left', border: '1px solid ' + (selected ? '#b40101' : '#3f3f46'), padding:'14px 16px', borderRadius:'12px', fontSize:'18px', background: selected ? '#141416' : 'transparent' }}>{text}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-neutral-400">
                <div>Question {currentIdx+1} of 20</div>
                <div className="flex gap-2">
                  <button className="btn btn-secondary px-4 py-3 text-base md:text-lg" onClick={()=>setCurrentIdx(Math.max(0, currentIdx-1))}>Previous</button>
                  <button className="btn btn-primary px-4 py-3 text-base md:text-lg" onClick={()=>setCurrentIdx(Math.min(19, currentIdx+1))} disabled={!answers[currentIdx].most || !answers[currentIdx].least}>{currentIdx<19?'Next':'Finish'}</button>
                </div>
              </div>
            </div>
            {errors && <div className="text-red-500 text-sm">{errors}</div>}
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={downloadPDF}>Download PDF</button>
              <button className="btn btn-primary gap-2" onClick={emailPDF}>{sending? 'Sending…' : 'Email Report'}</button>
            </div>
          </div>
        </div>

        <div ref={reportRef} style={{position:'absolute', left:'-9999px', top:'-9999px', width:'800px'}}>
          <div className="bg-white text-black p-6 rounded-xl" style={{fontFamily:'ui-sans-serif, system-ui'}}>
            <div className="flex items-center justify-between">
              <img src={LOGO_SRC} alt="KW" style={{height:'16px'}}/>
              <div style={{color:'#b40101', fontWeight:700}}>KW Explore</div>
            </div>
            <h2 className="font-bold text-xl mt-2" style={{color:'#b40101'}}>Personalized DISC Report</h2>
            <p><b>Name:</b> {info.firstName} {info.lastName} &nbsp; <b>Email:</b> {info.email}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
