import React, { useMemo, useRef, useState } from "react";
import { Download, Mail, Loader2 } from "lucide-react";

const KW_RED = "#b40101";
const APP_NAME = "Find Your Lead Gen WINWIN";
const LOGO_SRC = "/kw-explore-logo.png";

type Trait = 'D'|'I'|'S'|'C';
const TRAIT_INFO: Record<Trait,{ label: string; color: string }> = {
  D: { label: "Dominance", color: KW_RED },
  I: { label: "Influence", color: "#e11d48" },
  S: { label: "Steadiness", color: "#2563eb" },
  C: { label: "Conscientiousness", color: "#0f766e" },
};

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary' }> = ({variant='primary', className='', ...props}) => (
  <button {...props} className={`btn ${variant==='primary'?'btn-primary':'btn-secondary'} ${className}`}/>
);
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className='', ...props}) => (
  <div {...props} className={`card ${className}`}></div>
);
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref)=> (
  <input ref={ref} {...props} className={`input ${props.className||''}`} />
));
Input.displayName='Input';

const SENDER_EMAIL = "Dawie.dutoit@kwsa.co.za";
const EMAILJS_SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || "";

type QA = { most: Trait|null; least: Trait|null };
type Scores = { natural: Record<Trait, number>, adaptive: Record<Trait, number> };

const QUESTIONS: { q: string; options: Record<Trait, string> }[] = [
  { q: "When starting something new, you usually...",
    options: { D: "Jump in and figure it out on the way",
               I: "Talk it through with people first",
               S: "Plan a comfortable routine for it",
               C: "Research and outline the steps" } },
  { q: "On a free weekend, you're more likely to...",
    options: { D: "Tackle a big task or challenge",
               I: "See friends and try something fun",
               S: "Relax at home and recharge",
               C: "Organize, learn, or optimize something" } },
  { q: "At a party, you...",
    options: { D: "Drive the plan (where/when/what)",
               I: "Float around and connect with many",
               S: "Stay with a few close people",
               C: "Observe first, join where it fits" } },
  { q: "When a decision is needed, you rely on...",
    options: { D: "Speed and gut confidence",
               I: "How it will feel for people",
               S: "Harmony and stability",
               C: "Data and clear logic" } },
  { q: "When conflict shows up, you...",
    options: { D: "Address it head-on",
               I: "Smooth things over",
               S: "Keep calm and find common ground",
               C: "Clarify facts and process" } },
  { q: "Your workspace is usually...",
    options: { D: "Geared for action",
               I: "Lively and personal",
               S: "Comfortable and steady",
               C: "Organized and labeled" } },
  { q: "In a group task, you naturally...",
    options: { D: "Take the lead",
               I: "Motivate and involve others",
               S: "Support and keep it steady",
               C: "Quality-check and structure" } },
  { q: "Learning something new works best when you...",
    options: { D: "Do it hands-on",
               I: "Discuss it with people",
               S: "Practice until it feels natural",
               C: "Study the material first" } },
  { q: "Your communication style leans toward...",
    options: { D: "Direct and brief",
               I: "Warm and expressive",
               S: "Patient and thoughtful",
               C: "Precise and thorough" } },
  { q: "Faced with sudden change, you...",
    options: { D: "Adapt fast and push forward",
               I: "Keep spirits up and rally",
               S: "Seek stability and clarity",
               C: "Map the new plan carefully" } },
  { q: "When traveling, you prefer...",
    options: { D: "An efficient power itinerary",
               I: "Meeting people and finding moments",
               S: "Restful routine and comfort",
               C: "Museums, notes, and structure" } },
  { q: "Your risk appetite is...",
    options: { D: "High – move first",
               I: "Moderate – try it if exciting",
               S: "Measured – keep it safe",
               C: "Low – prove it first" } },
  { q: "Deadlines make you...",
    options: { D: "Sprint and win the clock",
               I: "Gather energy and deliver",
               S: "Plan steady progress",
               C: "Schedule buffers to finish early" } },
  { q: "When shopping, you...",
    options: { D: "Decide quickly",
               I: "Enjoy browsing",
               S: "Ask for trusted opinions",
               C: "Compare and read reviews" } },
  { q: "If a plan falls apart, you...",
    options: { D: "Create a new path immediately",
               I: "Keep morale high and improvise",
               S: "Stabilize and reset expectations",
               C: "Diagnose and rebuild the process" } },
  { q: "You feel most accomplished when...",
    options: { D: "A bold result is achieved",
               I: "People had a great experience",
               S: "Everyone stayed comfortable",
               C: "The outcome is accurate and elegant" } },
  { q: "Your notes/tools are...",
    options: { D: "Short action lists",
               I: "Voice notes/photos",
               S: "Calendars and reminders",
               C: "Tags, folders, spreadsheets" } },
  { q: "What bugs you the most is...",
    options: { D: "Wasted time",
               I: "Cold interactions",
               S: "Unnecessary conflict",
               C: "Inaccurate info" } },
  { q: "People describe you as...",
    options: { D: "Decisive",
               I: "Inspiring",
               S: "Dependable",
               C: "Thorough" } },
  { q: "When giving feedback, you prefer...",
    options: { D: "Be candid and clear",
               I: "Be encouraging and upbeat",
               S: "Be considerate and private",
               C: "Be detailed with examples" } },
];

const opposite: Record<Trait, Trait> = { D: 'S', I: 'C', S: 'D', C: 'I' };
const percent = (n: number) => Math.round((n / QUESTIONS.length) * 100);
const orderByScore = (obj: Record<Trait, number>): Trait[] => (Object.keys(obj) as Trait[]).sort((a,b)=>obj[b]-obj[a]);

function buildLeadGen(primary: Trait, secondary?: Trait) {
  const base: Record<Trait, { title: string; daily: string[]; weekly: string[]; monthly: string[]; practical: string[] }> = {
    D: { title:'Driver', daily:['Power hour: hot/new leads','One decisive CTA per touch','Hard time blocks'],
         weekly:['FSBO/Expired sprints','Outcome clinic event','Pipeline prune'], monthly:['Upgrade listing proof','Run a direct-response ad'],
         practical:['Short leading scripts','Track conversion per step'] },
    I: { title:'Connector', daily:['5 relationship touches','1 story/reel','Log 1 new SOI'],
         weekly:['Fun micro-event','Open house engine','Good-news email'], monthly:['Community/client event','Batch short videos'],
         practical:['Curiosity openers','Turn “maybe” into next step'] },
    S: { title:'Stabilizer', daily:['3 care calls + 2 notes','Past-client nurture','Document promises in CRM'],
         weekly:['Neighborhood nurture','Calm Q&A','Referral touch'], monthly:['Client care event','Update guides'],
         practical:['Empathy first; recap steps','Gentle trial closes'] },
    C: { title:'Analyst', daily:['Send 3 insights','Tidy tags','Data-backed post'],
         weekly:['3-min “market logic” video','Micro-webinar','Price-preview CMAs'], monthly:['Market-at-a-Glance one-pager','A/B test one funnel'],
         practical:['Calibrated questions','Visual decision aids'] },
  };
  const mix = (a:string[], b?:string[]) => b ? Array.from(new Set([...a, ...b])).slice(0,6) : a;
  const p = base[primary]; const s = secondary ? base[secondary] : undefined;
  return { title: s ? f"{p.title} + {s.title}" : p.title, daily: mix(p.daily, s?.daily),
           weekly: mix(p.weekly, s?.weekly), monthly: mix(p.monthly, s?.monthly), practical: mix(p.practical, s?.practical) };
}

function buildNegotiation(primary: Trait, secondary?: Trait){
  const base: Record<Trait,{approach:string[]; tactics:string[]; watchouts:string[]; phrases:string[]}> = {
    D:{approach:['Own the frame, define outcomes, set timelines'], tactics:['Anchors','Deadlines/BATNA','Trade, don’t concede'], watchouts:['Over-pressure','Miss emotions'], phrases:['Fastest path that protects your outcome…','If we deliver Y, can we get X today?']},
    I:{approach:['Trust + momentum; package win-wins'], tactics:['Trial closes','Summarize gains','Name shared goals'], watchouts:['Over-promise','Miss details'], phrases:['What makes this a win for everyone?','If we solved X for them, could you do Y?']},
    S:{approach:['Collaborative pace; reduce stress'], tactics:['Label emotions','Safe next steps','Small agreements'], watchouts:['Avoid conflict','Delay'], phrases:['What would feel manageable?','Would it help if we handled X so you could do Y?']},
    C:{approach:['Evidence-based; document'], tactics:['Data counters','Bracketing','Calibrated questions'], watchouts:['Over-analyze','Under-acknowledge feelings'], phrases:['How did you calculate that?','Comps suggest X→Y—how does that land?']},
  };
  const merge=(a:string[],b?:string[])=>b?Array.from(new Set([...a,...b])).slice(0,6):a;
  const p=base[primary], s=secondary?base[secondary]:undefined;
  return {approach:merge(p.approach,s?.approach),tactics:merge(p.tactics,s?.tactics),watchouts:merge(p.watchouts,s?.watchouts),phrases:merge(p.phrases,s?.phrases)};
}

const COMM_LEAD: Record<Trait,string[]> = {
  D: ['Keep it brief, outcome-first','Use numbers + deadlines','Clear CTA: book, price, or timeline'],
  I: ['Be warm and high-energy','Use stories and social proof','Invite to friendly micro-events'],
  S: ['Be calm and patient','Clarify steps and remove risk','Offer support resources'],
  C: ['Send facts before meeting','Show comps and process','Invite questions; document decisions'],
};
const COMM_NEGOTIATE: Record<Trait,string[]> = {
  D: ['Frame around results','Offer options with trade-offs','Decide fast, document later'],
  I: ['Emphasize relationship wins','Keep tone positive','Summarize agreements often'],
  S: ['Lower tension; protect relationships','Propose safe next steps','Build small yeses'],
  C: ['Lead with verified data','Use calibrated questions','Write it up clearly'],
};

export default function App(){
  const [info, setInfo] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [answers, setAnswers] = useState<QA[]>(Array(QUESTIONS.length).fill(null).map(()=>({most:null, least:null})));
  const [sending, setSending] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [errors, setErrors] = useState<string|null>(null);
  const reportRef = useRef<HTMLDivElement|null>(null);

  const answeredCount = answers.filter(a=>a.most && a.least).length;
  const progress = (answeredCount/QUESTIONS.length)*100;

  const scores: Scores = useMemo(()=>{
    const natural:{[k in Trait]:number}={D:0,I:0,S:0,C:0};
    const adaptive:{[k in Trait]:number}={D:0,I:0,S:0,C:0};
    answers.forEach(a=>{ if(a.most) natural[a.most]+=1; if(a.least) adaptive[ opposite[a.least!] ]+=1; });
    return { natural, adaptive };
  },[answers]);

  const order = orderByScore(scores.natural);
  const primary = order[0]; const secondary = order[1];
  const lead = buildLeadGen(primary, secondary);
  const nego = buildNegotiation(primary, secondary);

  // PDF: convert each .pdf-page to image and add to jsPDF
  const generatePDFBlob = async ()=>{
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit:'mm', format:'a4' });
    const pages = reportRef.current!.querySelectorAll(".pdf-page");
    for (let i=0;i<pages.length;i++){
      const node = pages[i] as HTMLElement;
      const canvas = await html2canvas(node, { scale: 2 });
      const img = canvas.toDataURL("image/png");
      if(i>0) doc.addPage();
      doc.addImage(img, "PNG", 0, 0, 210, 297);
    }
    return doc.output("blob");
  };

  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject)=>{
    const r = new FileReader();
    r.onloadend = ()=> resolve((r.result as string).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

  const downloadPDF = async ()=>{
    const { jsPDF } = await import("jspdf");
    const b = await generatePDFBlob();
    const arrayBuffer = await b.arrayBuffer();
    const pdf = new jsPDF({ unit:'mm', format:'a4' });
    // quick import: easiest is to save blob via URL in browser
    const url = URL.createObjectURL(new Blob([arrayBuffer], {type: "application/pdf"}));
    const a = document.createElement("a"); a.href=url; a.download=`${APP_NAME}_${info.firstName}_${info.lastName}.pdf`; a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  };

  const emailPDF = async ()=>{
    if (!info.firstName || !info.lastName || !info.email) { setErrors("Please complete your details before emailing."); return; }
    if (answers.some(a=>!a.most || !a.least)) { setErrors("Please answer all 20 questions (Most & Least)."); return; }
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) { setErrors("Email service is not configured on the server."); return; }
    setSending(true);
    try{
      const emailjs = await import("emailjs-com");
      await emailjs.init(EMAILJS_PUBLIC_KEY);
      const blob = await generatePDFBlob();
      const base64 = await blobToBase64(blob);
      const fileName = `${APP_NAME}_${info.firstName}_${info.lastName}.pdf`;
      const params:any = {
        to_email: f"{info.email}, {SENDER_EMAIL}",
        to_name: f"{info.firstName} {info.lastName}",
        from_name: "KW Explore | Find Your Lead Gen WINWIN",
        reply_to: SENDER_EMAIL,
        subject: "Your Personalized DISC Report",
        message: "Attached is your personalized DISC report with your Lead Gen plan & Negotiation playbook.",
        attachments: [ { name: fileName, data: base64 } ],
        agent_name: f"{info.firstName} {info.lastName}",
        phone: info.phone,
      };
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
      alert("✅ Email sent with your PDF attached to you and Dawie.");
    }catch(e){ console.error(e); alert("Email failed. Check EmailJS keys/template and attachment settings."); }
    finally{ setSending(false); }
  };

  return (<div className="min-h-screen bg-[#0b0b0d] text-neutral-100">
    <header className="border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10 p-4 flex items-center gap-3">
      <img src={LOGO_SRC} alt="KW Explore" style={{height:'22px'}}/>
      <h1 className="font-bold text-xl" style={{ color: KW_RED }}>{APP_NAME}</h1>
    </header>

    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <Card className="p-4">
        <h2 style={{color:KW_RED}} className="font-semibold text-lg mb-2">Your Details</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input placeholder="Name" value={info.firstName} onChange={e=>setInfo({...info, firstName:e.target.value})}/>
          <Input placeholder="Surname" value={info.lastName} onChange={e=>setInfo({...info, lastName:e.target.value})}/>
          <Input placeholder="Phone" value={info.phone} onChange={e=>setInfo({...info, phone:e.target.value})}/>
          <Input placeholder="Email" type="email" value={info.email} onChange={e=>setInfo({...info, email:e.target.value})}/>
        </div>
      </Card>

      <Card className="p-4">
        <h2 style={{color:KW_RED}} className="font-semibold text-lg mb-3">Get To Know Yourself</h2>
        <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden mb-2"><div className="h-full" style={{ width:`${progress}%`, background: KW_RED }}></div></div>
        <div className="text-xs text-neutral-400 mb-3">Answered: {answeredCount}/{QUESTIONS.length}</div>

        <div className="rounded-xl border border-neutral-800 p-3">
          <div style={{fontSize:'22px', fontWeight:800, marginBottom:'12px'}}>{currentIdx+1}. {QUESTIONS[currentIdx].q}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-neutral-800 p-3">
              <div className="text-sm text-neutral-100 mb-3 font-medium">Most likely</div>
              <div className="grid grid-cols-1 gap-3">
                {(Object.entries(QUESTIONS[currentIdx].options) as [Trait,string][]).map(([k,text])=>{
                  const selected = answers[currentIdx].most===k;
                  return <button key={"most-"+k} onClick={()=>{ const n=[...answers]; if(n[currentIdx].least===k) return; n[currentIdx]={...n[currentIdx], most:k as Trait}; setAnswers(n); }} style={{ textAlign:'left', color:'#fff', border: '1px solid ' + (selected ? '#b40101' : '#3f3f46'), padding:'14px 16px', borderRadius:'12px', fontSize:'18px', background: selected ? '#1c1c20' : '#0f0f12' }}>{text}</button>
                })}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-800 p-3">
              <div className="text-sm text-neutral-100 mb-3 font-medium">Least likely</div>
              <div className="grid grid-cols-1 gap-3">
                {(Object.entries(QUESTIONS[currentIdx].options) as [Trait,string][]).map(([k,text])=>{
                  const selected = answers[currentIdx].least===k;
                  return <button key={"least-"+k} onClick={()=>{ const n=[...answers]; if(n[currentIdx].most===k) return; n[currentIdx]={...n[currentIdx], least:k as Trait}; setAnswers(n); }} style={{ textAlign:'left', color:'#fff', border: '1px solid ' + (selected ? '#b40101' : '#3f3f46'), padding:'14px 16px', borderRadius:'12px', fontSize:'18px', background: selected ? '#1c1c20' : '#0f0f12' }}>{text}</button>
                })}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-neutral-400">
            <div>Question {currentIdx+1} of {QUESTIONS.length}</div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={()=>setCurrentIdx(Math.max(0,currentIdx-1))}>Previous</Button>
              <Button onClick={()=>setCurrentIdx(Math.min(QUESTIONS.length-1,currentIdx+1))} disabled={!answers[currentIdx].most || !answers[currentIdx].least}>{currentIdx<QUESTIONS.length-1?'Next':'Finish'}</Button>
            </div>
          </div>
        </div>

        {errors && <div className="text-red-500 text-sm mt-2">{errors}</div>}
        <div className="flex gap-2 mt-3">
          <Button variant="secondary" onClick={downloadPDF}><Download className="h-4 w-4"/>Download PDF</Button>
          <Button onClick={emailPDF}><Mail className="h-4 w-4"/>{sending?' Sending…':' Email Report'}</Button>
        </div>
      </Card>

      {/* Hidden PDF document (multi-page) */}
      <div ref={reportRef} style={{position:'absolute', left:'-9999px', top:'-9999px'}}>
        <div className="pdf-doc">
          {/* Page 1 – Cover */}
          <div className="pdf-page">
            <div className="flex between center">
              <img src={LOGO_SRC} alt="KW" style={{height:'18px'}}/>
              <div className="pdf-meta">Find Your Lead Gen WINWIN</div>
            </div>
            <div className="rule"></div>
            <div className="pdf-h1">Personalized DISC Report</div>
            <div className="small"><b>Name:</b> {info.firstName} {info.lastName} &nbsp;&nbsp; <b>Phone:</b> {info.phone} &nbsp;&nbsp; <b>Email:</b> {info.email}</div>
            <div style={{marginTop:'20px'}}>
              <div className="pdf-h2">How this report helps</div>
              <p>This report translates your 20-question Most/Least choices into Natural and Adaptive DISC patterns, then turns that into a Keller Williams–style Lead Generation plan and an evidence-based Negotiation playbook. Headings are KW red; body text is black to match your brand.</p>
            </div>
          </div>

          {/* Page 2 – Scores + Chart */}
          <div className="pdf-page">
            <div className="pdf-h1">Natural and Adaptive Styles</div>
            <div className="grid2">
              <div>
                <div className="pdf-h2">Natural (who you are)</div>
                {(Object.keys(scores.natural) as Trait[]).map(k=>(
                  <div key={k} className="small">{TRAIT_INFO[k].label}: <b>{scores.natural[k]}</b> / 20 ({percent(scores.natural[k])}%)</div>
                ))}
              </div>
              <div>
                <div className="pdf-h2">Adaptive (how you flex)</div>
                {(Object.keys(scores.adaptive) as Trait[]).map(k=>(
                  <div key={k} className="small">{TRAIT_INFO[k].label}: <b>{scores.adaptive[k]}</b> / 20 ({percent(scores.adaptive[k])}%)</div>
                ))}
              </div>
            </div>

            <div className="pdf-h2" style={{marginTop:'10px'}}>Side-by-Side Comparison</div>
            <svg width="720" height="260">
              {(['D','I','S','C'] as Trait[]).map((k,i)=>{
                const nat = percent(scores.natural[k]); const ada = percent(scores.adaptive[k]);
                const x = 60 + i*165; const bottom = 220; const scale = 1.6;
                return (<g key={k} transform={`translate(${x},0)`}>
                  <text x={0} y={bottom+18} fontSize="12" fill="#000">{TRAIT_INFO[k].label}</text>
                  <rect x={0} y={bottom - ada*scale} width="50" height={ada*scale} fill="#111"/>
                  <text x={0} y={bottom - ada*scale - 5} fontSize="10"> {ada}% </text>
                  <rect x={60} y={bottom - nat*scale} width="50" height={nat*scale} fill="#c5c5c5" stroke="#111"/>
                  <text x={60} y={bottom - nat*scale - 5} fontSize="10"> {nat}% </text>
                </g>);
              })}
              <line x1="40" y1="220" x2="700" y2="220" stroke="#000" strokeWidth="1"/>
            </svg>

            <div className="pdf-h2">Executive Summary</div>
            <p>Your natural emphasis appears strongest in <b>{TRAIT_INFO[primary].label}</b>{secondary?` with a supporting ${TRAIT_INFO[secondary].label} blend`:''}. Under pressure, you adapt by leaning into complementary behaviors shown in the Adaptive bars.</p>
          </div>

          {/* Page 3 – Style Deep Dive */}
          <div className="pdf-page">
            <div className="pdf-h1">Your Style Pattern – At a Glance</div>
            <div className="grid2">
              <div>
                <div className="pdf-h2">Natural strengths</div>
                <ul>
                  <li>Top energy in <b>{TRAIT_INFO[primary].label}</b> drives decisions and momentum.</li>
                  <li>Support from <b>{TRAIT_INFO[secondary].label}</b> gives you a reliable second gear.</li>
                  <li>Greatest lift will come from aligning your day to this blend.</li>
                </ul>
                <div className="pdf-h2">Potential snags</div>
                <ul>
                  <li>Over-using your top style may stress opposite styles.</li>
                  <li>Adapting for too long can reduce energy; schedule resets.</li>
                </ul>
              </div>
              <div>
                <div className="pdf-h2">Where you win</div>
                <ul>
                  <li>Situations that reward your <b>{TRAIT_INFO[primary].label}</b> focus.</li>
                  <li>Teams that appreciate your contribution lane.</li>
                  <li>Clients who value your primary style cues.</li>
                </ul>
                <div className="pdf-h2">Best environments</div>
                <ul>
                  <li>Clear goals and feedback loops.</li>
                  <li>Room to use your top strengths daily.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Page 4 – Lead Gen Plan */}
          <div className="pdf-page">
            <div className="pdf-h1">Lead Generation Action Plan</div>
            <p><b>Focus:</b> {lead.title}</p>
            <div className="grid2">
              <div>
                <div className="pdf-h2">Daily</div>
                <ul>{lead.daily.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
                <div className="pdf-h2">Monthly</div>
                <ul>{lead.monthly.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
              </div>
              <div>
                <div className="pdf-h2">Weekly</div>
                <ul>{lead.weekly.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
                <div className="pdf-h2">Practical Ways</div>
                <ul>{lead.practical.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
              </div>
            </div>
            <div className="pdf-h2">Messaging that fits your style</div>
            <ul>
              <li><b>D:</b> outcomes, speed, deadlines.</li>
              <li><b>I:</b> story, social proof, invites.</li>
              <li><b>S:</b> calm process, low risk, support.</li>
              <li><b>C:</b> facts, comps, clear steps.</li>
            </ul>
          </div>

          {/* Page 5 – Negotiation */}
          <div className="pdf-page">
            <div className="pdf-h1">Negotiation Playbook (Natural First)</div>
            <div className="grid2">
              <div>
                <div className="pdf-h2">Approach</div>
                <ul>{nego.approach.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
                <div className="pdf-h2">Tactics</div>
                <ul>{nego.tactics.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
              </div>
              <div>
                <div className="pdf-h2">Watch‑outs</div>
                <ul>{nego.watchouts.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
                <div className="pdf-h2">Phrases</div>
                <ul>{nego.phrases.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
              </div>
            </div>
            <p className="small"><b>Fallback (Adaptive) Mode:</b> If talks stall, shift briefly into your adaptive strengths to reduce friction, then return to your natural gear to close.</p>
          </div>

          {/* Page 6 – Communicate with other styles (Lead Gen) */}
          <div className="pdf-page">
            <div className="pdf-h1">Communicating for Lead Gen (By Client Style)</div>
            <div className="grid2">
              {(['D','I','S','C'] as Trait[]).map(t=>(
                <div key={t}>
                  <div className="pdf-h2">{TRAIT_INFO[t].label}</div>
                  <ul>{COMM_LEAD[t].map((x,i)=>(<li key={i}>{x}</li>))}</ul>
                </div>
              ))}
            </div>
          </div>

          {/* Page 7 – Communicate with other styles (Negotiation) */}
          <div className="pdf-page">
            <div className="pdf-h1">Negotiation: Speak Their Language</div>
            <div className="grid2">
              {(['D','I','S','C'] as Trait[]).map(t=>(
                <div key={t}>
                  <div className="pdf-h2">{TRAIT_INFO[t].label}</div>
                  <ul>{COMM_NEGOTIATE[t].map((x,i)=>(<li key={i}>{x}</li>))}</ul>
                </div>
              ))}
            </div>
          </div>

          {/* Page 8 – 30-60-90 */}
          <div className="pdf-page">
            <div className="pdf-h1">30‑60‑90 Implementation</div>
            <div className="grid2">
              <div>
                <div className="pdf-h2">Next 30 days</div>
                <ul>
                  <li>Execute the daily/weekly cadence with ruthless consistency.</li>
                  <li>Book two listing/buyer consults using your style‑matched messaging.</li>
                  <li>Track all activity and conversion by step in your CRM.</li>
                </ul>
                <div className="pdf-h2">Days 31–60</div>
                <ul>
                  <li>Double down on the top two lead sources by conversion.</li>
                  <li>Turn one tactic into a documented system (SOP) with checklist.</li>
                  <li>Publish 1 proof‑of‑value post/case study.</li>
                </ul>
              </div>
              <div>
                <div className="pdf-h2">Days 61–90</div>
                <ul>
                  <li>Add one new channel aligned to your style (e.g., data one‑pager, event, or FSBO sprint).</li>
                  <li>Refine your negotiation scripts; rehearse objections weekly.</li>
                  <li>Ship an updated listing/buyer packet with your style strengths.</li>
                </ul>
                <div className="pdf-h2">Scoreboard</div>
                <ul>
                  <li>Inputs: dials/touches, appts set, showings, offers.</li>
                  <li>Outputs: signed agreements, closed units, GCI.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Page 9 – Scripts & Phrases */}
          <div className="pdf-page">
            <div className="pdf-h1">Scripts & Phrases by Style</div>
            <div className="grid2">
              <div>
                <div className="pdf-h2">Lead Gen</div>
                <ul>
                  <li><b>D:</b> “Here’s the shortest path from A→B. Want a 15‑minute strategy huddle?”</li>
                  <li><b>I:</b> “Quick story—my client saved X doing Y. Want the same game plan?”</li>
                  <li><b>S:</b> “I’ll walk you through each step and handle the heavy lifting. Is that helpful?”</li>
                  <li><b>C:</b> “I’ve prepared a one‑page analysis of your options. Can I send it?”</li>
                </ul>
              </div>
              <div>
                <div className="pdf-h2">Negotiation</div>
                <ul>
                  <li><b>D:</b> “If we can secure X today, can you move on Y?”</li>
                  <li><b>I:</b> “So we all feel good: if they get X, can we agree to Y?”</li>
                  <li><b>S:</b> “What would feel comfortable if we proposed X?”</li>
                  <li><b>C:</b> “Based on the comps and absorption, X→Y is reasonable—thoughts?”</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Page 10 – About DISC */}
          <div className="pdf-page">
            <div className="pdf-h1">About This Assessment</div>
            <p className="small">20 Most/Least questions were used to estimate Natural and Adaptive tendencies across four factors: Dominance (D), Influence (I), Steadiness (S), and Conscientiousness (C). The strategies in this report draw on proven Keller Williams models (lead gen cadence, MREA thinking) and practical negotiations patterns.</p>
            <div className="pdf-h2">Next steps</div>
            <ul>
              <li>Save this PDF and schedule a 15‑minute debrief with your Team Leader.</li>
              <li>Block your next 30‑day cadence in your calendar today.</li>
              <li>Track conversion weekly and iterate the plan.</li>
            </ul>
            <div className="rule"></div>
            <div className="small">© KW Explore — Find Your Lead Gen WINWIN</div>
          </div>
        </div>
      </div>
    </main>
  </div>);
}
