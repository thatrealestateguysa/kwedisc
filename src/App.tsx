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

const QUESTIONS = [
  { q: "When meeting a new client, you usually...", options: {
    D: "Take charge and set clear expectations",
    I: "Engage warmly to build connection",
    S: "Listen carefully to understand their needs",
    C: "Ask structured questions and note details",
  }},
  { q: "In stressful negotiations, you tend to...", options: {
    D: "Stay firm and drive toward resolution",
    I: "Keep it light and persuasive",
    S: "Maintain calm and empathy",
    C: "Rely on facts and accuracy",
  }},
  { q: "When organizing your day...", options: {
    D: "Focus on key results and speed",
    I: "Stay flexible and spontaneous",
    S: "Keep a steady rhythm and routine",
    C: "Plan and check every detail",
  }},
  { q: "Your lead generation strength is...", options: {
    D: "Taking initiative and closing fast",
    I: "Networking and energizing people",
    S: "Building long-term relationships",
    C: "Analyzing markets and tailoring strategies",
  }},
];

const TRAIT_INFO = {
  D: { label: "Dominance", color: KW_RED },
  I: { label: "Influence", color: "#e11d48" },
  S: { label: "Steadiness", color: "#2563eb" },
  C: { label: "Conscientiousness", color: "#0f766e" },
};

type TraitCode = keyof typeof TRAIT_INFO;
type QA = { most: TraitCode | null; least: TraitCode | null };
const initAnswers = () => Array(QUESTIONS.length).fill(null).map(()=>({most:null, least:null})) as QA[];

export default function App() {
  const [info, setInfo] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [answers, setAnswers] = useState<QA[]>(initAnswers());
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<string|null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const reportRef = useRef<HTMLDivElement|null>(null);

  const shuffledOptions = useMemo(() =>
    QUESTIONS.map(q => (Object.entries(q.options) as [TraitCode, string][]) .sort(() => Math.random() - 0.5)), []);
  const answeredCount = useMemo(()=> answers.filter(a=>a.most && a.least).length, [answers]);

  const scores = useMemo(() => {
    const natural = { D:0, I:0, S:0, C:0 } as Record<TraitCode, number>;
    const adaptive = { D:0, I:0, S:0, C:0 } as Record<TraitCode, number>;
    const opposite: Record<TraitCode, TraitCode> = { D:'S', I:'C', S:'D', C:'I' };
    answers.forEach(a=>{
      if (a.most) natural[a.most] += 1;
      if (a.least) adaptive[ opposite[a.least] ] += 1;
    });
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
    if (answers.some(a=>!a.most || !a.least)) { setErrors("Please answer Most & Least for all questions."); return; }
    setSending(true);
    try {
      const dataUrl = await makePDF();
      const emailjs = await import("emailjs-com");
      const base64 = dataUrl.split(",")[1];
      await emailjs.init(EMAILJS_PUBLIC_KEY);
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        from_email: "Dawie.dutoit@kwsa.co.za",
        to_email: info.email,
        cc_email: "Dawie.dutoit@kwsa.co.za",
        agent_name: `${info.firstName} ${info.lastName}`,
        pdf_data_base64: base64,
      });
      alert("Your personalized DISC PDF has been emailed (CC’d to Dawie). Great work!");
    } catch (e) {
      alert("Email failed. Please verify EmailJS settings or download manually.");
    } finally { setSending(false); }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10 p-4 flex items-center gap-3">
        <img src={LOGO_SRC} alt="KW Explore" className="h-8" />
        <h1 className="font-bold text-xl" style={{ color: KW_RED }}>{APP_NAME}</h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="space-y-3">
            <h2 className="text-lg font-semibold" style={{ color: KW_RED }}>Your Details</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Input placeholder="Name" value={info.firstName} onChange={(e)=>setInfo({...info, firstName:e.target.value})}/>
              <Input placeholder="Surname" value={info.lastName} onChange={(e)=>setInfo({...info, lastName:e.target.value})}/>
              <Input placeholder="Phone" value={info.phone} onChange={(e)=>setInfo({...info, phone:e.target.value})}/>
              <Input placeholder="Email" type="email" value={info.email} onChange={(e)=>setInfo({...info, email:e.target.value})}/>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="space-y-4">
            <h2 className="text-lg font-semibold" style={{ color: KW_RED }}>Get To Know Yourself</h2>
            <div className="rounded-xl border border-neutral-800 p-3">
              <div className="text-sm mb-2">{currentIdx + 1}. {QUESTIONS[currentIdx].q}</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs text-neutral-400 mb-2">Most likely</div>
                  <div className="grid sm:grid-cols-2 gap-2">
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
                          className={`text-left rounded-lg border px-3 py-2 ${selected ? 'ring-2 ring-red-700' : 'border-neutral-700'}`}>{text}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-800 p-3">
                  <div className="text-xs text-neutral-400 mb-2">Least likely</div>
                  <div className="grid sm:grid-cols-2 gap-2">
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
                          className={`text-left rounded-lg border px-3 py-2 ${selected ? 'ring-2 ring-red-700' : 'border-neutral-700'}`}>{text}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-neutral-400">
                <div>Answered: {answeredCount}/{QUESTIONS.length}</div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={()=>setCurrentIdx(Math.max(0, currentIdx-1))}>Previous</Button>
                  <Button style={{backgroundColor:KW_RED}} onClick={()=>setCurrentIdx(Math.min(QUESTIONS.length-1, currentIdx+1))} disabled={!answers[currentIdx].most || !answers[currentIdx].least}>{currentIdx<QUESTIONS.length-1?'Next':'Finish'}</Button>
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
            {Object.keys(scores.natural).map(k=>(<p key={k}>{TRAIT_INFO[k].label}: {scores.natural[k]} ({percent(scores.natural[k])}%)</p>))}
            <h3 className="font-semibold mt-3">Adaptive Style</h3>
            {Object.keys(scores.adaptive).map(k=>(<p key={k}>{TRAIT_INFO[k].label}: {scores.adaptive[k]} ({percent(scores.adaptive[k])}%)</p>))}
          </div>
        </div>
      </main>
    </div>
  );
}
