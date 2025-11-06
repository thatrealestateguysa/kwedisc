import React, { useMemo, useRef, useState } from "react";
import { Download, Mail, Loader2 } from "lucide-react";

// Inline UI primitives (no external ./components imports)
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary' }> = ({variant='primary', className='', ...props}) => (
  <button {...props} className={`btn ${variant==='primary'?'btn-primary':'btn-secondary'} ${className}`}/>
);
const Panel: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className='', ...props}) => (
  <div {...props} className={`panel ${className}`}></div>
);
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref)=> (
  <input ref={ref} {...props} className={`input ${props.className||''}`} />
));
Input.displayName='Input';

// Theme & branding
const KW_RED = "#b40101";
const LOGO_SRC = "/kw-explore-logo.png";
const APP_NAME = "Find Your Lead Gen WINWIN";

// EmailJS env
const SENDER_EMAIL = "Dawie.dutoit@kwsa.co.za";
const EMAILJS_SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || "";

// DISC
type Trait = 'D'|'I'|'S'|'C';

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

const TRAIT_INFO: Record<Trait,{ label: string; color: string }> = {
  D: { label: "Dominance", color: KW_RED },
  I: { label: "Influence", color: "#e11d48" },
  S: { label: "Steadiness", color: "#2563eb" },
  C: { label: "Conscientiousness", color: "#0f766e" },
};

const opposite: Record<Trait, Trait> = { D: 'S', I: 'C', S: 'D', C: 'I' };
const percent = (n: number) => Math.round((n / QUESTIONS.length) * 100);
const orderByScore = (obj: Record<Trait, number>): Trait[] => (Object.keys(obj) as Trait[]).sort((a,b)=>obj[b]-obj[a]);

export default function App(){
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

  const primaryOrder = orderByScore(scores.natural);
  const primary = primaryOrder[0];
  const secondary = primaryOrder[1];

  const progress = (answeredCount/QUESTIONS.length)*100;

  // PDF helpers
  const makePDFBlob = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const target = reportRef.current!;
    const canvas = await html2canvas(target, { scale: 2 });
    const pdf = new jsPDF();
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, 210, 297);
    return pdf.output("blob");
  };
  const blobToBase64 = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const downloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(reportRef.current!, { scale: 2 });
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
    pdf.save(`${APP_NAME}_${info.firstName}_${info.lastName}.pdf`);
  };

  const emailPDF = async () => {
    if (!info.firstName || !info.lastName || !info.email) { setErrors("Please complete your details before emailing."); return; }
    if (answers.some(a=>!a.most || !a.least)) { setErrors("Please answer Most & Least for all 20 questions."); return; }
    if (!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) { setErrors("Email service is not configured on the server (environment variables missing). You can still download the PDF."); return; }

    setSending(true);
    try {
      const emailjs = await import("emailjs-com");
      await emailjs.init(EMAILJS_PUBLIC_KEY);

      const blob = await makePDFBlob();
      const base64 = await blobToBase64(blob);
      const fileName = `${APP_NAME}_${info.firstName}_${info.lastName}.pdf`;

      // Send to both: recipient & Dawie via comma-separated recipients if template uses {{to_email}}
      const toCombined = `${info.email}, ${SENDER_EMAIL}`;

      const params: Record<string, any> = {
        to_email: toCombined,
        to_name: `${info.firstName} ${info.lastName}`,
        from_name: "KW Explore | Find Your Lead Gen WINWIN",
        reply_to: SENDER_EMAIL,
        subject: "Your Personalized DISC Report",
        message: "Attached is your personalized DISC report with Lead Gen plan & Negotiation playbook.",
        // Attachment as base64 (EmailJS browser-friendly)
        attachments: [ { name: fileName, data: base64 } ],
        // Extra fields (optional in your template)
        agent_name: `${info.firstName} ${info.lastName}`,
        phone: info.phone,
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
      alert("✅ Email sent with your PDF attached to you and Dawie.");
    } catch (e) {
      console.error(e);
      alert("Email failed. Check EmailJS keys/template and that your template uses {{to_email}} and supports attachments.");
    } finally { setSending(false); }
  };

  return (
    <>
      {/* Header */}
      <div className="header">
        <div className="header-inner">
          <img className="logo" src={LOGO_SRC} alt="KW Explore" />
          <div className="app-title">{APP_NAME}</div>
        </div>
        <div className="red-rule"></div>
      </div>

      <div className="container">
        {/* Details */}
        <Panel className="p-4" >
          <div className="section-title">Your Details</div>
          <div className="details-grid">
            <Input placeholder="Name" value={info.firstName} onChange={(e)=>setInfo({...info, firstName:e.target.value})} />
            <Input placeholder="Surname" value={info.lastName} onChange={(e)=>setInfo({...info, lastName:e.target.value})} />
            <Input placeholder="Phone" value={info.phone} onChange={(e)=>setInfo({...info, phone:e.target.value})} />
            <Input placeholder="Email" type="email" value={info.email} onChange={(e)=>setInfo({...info, email:e.target.value})} />
          </div>
        </Panel>

        {/* Questionnaire */}
        <Panel className="p-4" style={{marginTop:'14px'}}>
          <div className="section-title">Get To Know Yourself</div>
          <div className="progress" style={{marginBottom:'6px'}}><span style={{width:`${progress}%`}}/></div>
          <div className="meta">Answered: {answeredCount}/{QUESTIONS.length} • There are no right/wrong answers.</div>

          <div style={{fontSize:'22px', fontWeight:800, marginTop:'14px', marginBottom:'10px'}}>
            {currentIdx + 1}. {QUESTIONS[currentIdx].q}
          </div>

          <div className="grid-2">
            {/* Most */}
            <div className="panel p-3" style={{background:'#121316'}}>
              <div className="meta" style={{marginBottom:'8px', color:'#e5e7eb', fontWeight:700}}>Most likely</div>
              <div style={{display:'grid', gap:'10px'}}>
                { (Object.entries(QUESTIONS[currentIdx].options) as [Trait,string][]) /* keep fixed order per Q; UI reads clean */
                  .map(([code, text]) => {
                    const selected = answers[currentIdx].most === code;
                    return (
                      <button key={`most-${code}`}
                        onClick={()=>{
                          const next=[...answers];
                          if(next[currentIdx].least===code)return;
                          next[currentIdx] = {...next[currentIdx], most: code};
                          setAnswers(next);
                        }}
                        className={`tile ${selected?'selected':''}`}
                      >{text}</button>
                    );
                })}
              </div>
            </div>

            {/* Least */}
            <div className="panel p-3" style={{background:'#121316'}}>
              <div className="meta" style={{marginBottom:'8px', color:'#e5e7eb', fontWeight:700}}>Least likely</div>
              <div style={{display:'grid', gap:'10px'}}>
                { (Object.entries(QUESTIONS[currentIdx].options) as [Trait,string][]) 
                  .map(([code, text]) => {
                    const selected = answers[currentIdx].least === code;
                    return (
                      <button key={`least-${code}`}
                        onClick={()=>{
                          const next=[...answers];
                          if(next[currentIdx].most===code)return;
                          next[currentIdx] = {...next[currentIdx], least: code};
                          setAnswers(next);
                        }}
                        className={`tile ${selected?'selected':''}`}
                      >{text}</button>
                    );
                })}
              </div>
            </div>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'12px'}}>
            <div className="meta">Question {currentIdx+1} of {QUESTIONS.length}</div>
            <div className="footer-actions">
              <Button variant="secondary" onClick={()=>setCurrentIdx(Math.max(0, currentIdx-1))}>Previous</Button>
              <Button onClick={()=>setCurrentIdx(Math.min(QUESTIONS.length-1, currentIdx+1))} disabled={!answers[currentIdx].most || !answers[currentIdx].least}>{
                currentIdx<QUESTIONS.length-1?'Next':'Finish'
              }</Button>
            </div>
          </div>

          {errors && <div style={{color:'#ef4444', marginTop:'8px'}} className="small">{errors}</div>}

          <div className="footer-actions" style={{marginTop:'10px'}}>
            <Button variant="secondary" onClick={downloadPDF}><Download className="h-4 w-4"/>Download PDF</Button>
            <Button onClick={emailPDF}>{sending?<Loader2 className="h-4 w-4 animate-spin"/>:<Mail className="h-4 w-4"/>}Email Report</Button>
          </div>
        </Panel>

        {/* Hidden Report for PDF */}
        <div ref={reportRef} style={{position:'absolute', left:'-9999px', top:'-9999px', width:'800px'}}>
          <div style={{background:'#fff', color:'#111', padding:'24px', borderRadius:'14px', fontFamily:'ui-sans-serif, system-ui'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <img src={LOGO_SRC} alt="KW" style={{height:'18px'}}/>
              <div style={{color:KW_RED, fontWeight:800}}>KW Explore</div>
            </div>
            <h2 style={{color:KW_RED, fontSize:'22px', fontWeight:800, margin:'10px 0'}}>Personalized DISC Report</h2>
            <div className="small"><b>Name:</b> {info.firstName} {info.lastName} &nbsp; <b>Email:</b> {info.email}</div>

            {/* Compute scores again inside */}
            <Report scores={{
              natural: { D: scores.natural.D, I: scores.natural.I, S: scores.natural.S, C: scores.natural.C },
              adaptive: { D: scores.adaptive.D, I: scores.adaptive.I, S: scores.adaptive.S, C: scores.adaptive.C }
            }} primary={primary} secondary={secondary} />
          </div>
        </div>
      </div>
    </>
  );
}

// Report section extracted for PDF rendering
function Report({scores, primary, secondary}:{scores: {natural: Record<Trait,number>, adaptive: Record<Trait,number>}, primary: Trait, secondary: Trait}){
  const pct = (n:number)=> Math.round((n/20)*100);
  return (
    <div>
      <h3 style={{fontWeight:700, marginTop:'6px'}}>Executive Summary</h3>
      <p>Your natural emphasis appears strongest in <b>{TRAIT_INFO[primary].label}</b>{secondary?` with a supporting ${TRAIT_INFO[secondary].label} blend`:''}. Your adaptive pattern suggests you lean on complementary behaviors under pressure.</p>

      {/* Side-by-side bars */}
      <h3 style={{fontWeight:700, marginTop:'6px'}}>Natural vs Adaptive (Side-by-Side)</h3>
      <svg width="760" height="240">
        {(['D','I','S','C'] as Trait[]).map((k, i) => {
          const nat = pct(scores.natural[k]);
          const ada = pct(scores.adaptive[k]);
          const baseX = 60 + i * 170;
          const scale = 1.6;
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

      {/* Lead Gen and Negotiation sections */}
      {(() => {
        const buildLeadGenPlan = (primary: Trait, secondary?: Trait) => {
          const base: Record<Trait, { title: string; daily: string[]; weekly: string[]; monthly: string[]; practical: string[] }> = {
            D: { title:'Lead Gen Action Plan – Driver',
                 daily:['60‑minute power hour: focused dials/texts to hot & new leads','Set 1 clear CTA per touch','Tighten time blocks'],
                 weekly:['FSBO/Expired sprint (2)','Outcome‑driven event','Pipeline review'],
                 monthly:['Upgrade listing proof','Launch a direct‑response ad'],
                 practical:['Lead with short, decisive scripts','Track conversion by step'] },
            I: { title:'Lead Gen Action Plan – Connector',
                 daily:['5 relationship touches','1 story/reel','Log 1 new SOI contact'],
                 weekly:['Fun micro‑event','Open house engine','Good‑news email'],
                 monthly:['Community/client event','Batch 4–6 short videos'],
                 practical:['Curiosity openers & future‑pacing','Every maybe → next step'] },
            S: { title:'Lead Gen Action Plan – Stabilizer',
                 daily:['3 care calls + 2 notes','Past‑client nurture','Document promises in CRM'],
                 weekly:['Neighborhood nurture','Calm Q&A','Referral touch'],
                 monthly:['Client care event','Update buyer/seller guide'],
                 practical:['Lead with empathy','Gentle trial closes'] },
            C: { title:'Lead Gen Action Plan – Analyst',
                 daily:['Market watch → 3 insights','Tidy CRM segments','Data‑backed post'],
                 weekly:['3‑min “market logic” video','Micro‑webinar','Price‑preview CMAs'],
                 monthly:['One‑pager “Market at a Glance”','A/B test one funnel'],
                 practical:['Calibrated questions','Visualize decisions'] },
          };
          const mix = (a:string[], b?:string[]) => b ? Array.from(new Set([...a,...b])).slice(0,6) : a;
          const pri = base[primary]; const sec = secondary ? base[secondary] : undefined;
          return { title: sec ? `${pri.title} + ${sec.title.replace('Lead Gen Action Plan – ', '')}` : pri.title,
                   daily: mix(pri.daily, sec?.daily), weekly: mix(pri.weekly, sec?.weekly),
                   monthly: mix(pri.monthly, sec?.monthly), practical: mix(pri.practical, sec?.practical) };
        };
        const buildNegotiationPlaybook = (primary: Trait, secondary?: Trait) => {
          const base: Record<Trait,{approach:string[]; tactics:string[]; watchouts:string[]; phrases:string[]}> = {
            D:{approach:['Own the frame, define outcomes, set timelines'], tactics:['Anchors','Deadlines/BATNA','Trade, don’t concede'], watchouts:['Over‑pressure','Miss emotions'], phrases:['Fastest path that protects your outcome…','If we deliver Y, can we get X today?']},
            I:{approach:['Trust + momentum; package win‑wins'], tactics:['Trial closes','Summarize gains','Name shared goals'], watchouts:['Over‑promise','Miss details'], phrases:['What makes this a win for everyone?','If we solved X for them, could you do Y?']},
            S:{approach:['Collaborative pace; reduce stress'], tactics:['Label emotions','Safe next steps','Small agreements'], watchouts:['Avoid conflict','Delay'], phrases:['What would feel manageable?','Would it help if we handled X so you could do Y?']},
            C:{approach:['Evidence‑based; document'], tactics:['Data counters','Bracketing','Calibrated questions'], watchouts:['Over‑analyze','Under‑acknowledge feelings'], phrases:['How did you calculate that?','Comps suggest X→Y—how does that land?']},
          };
          const merge=(a:string[],b?:string[])=>b?Array.from(new Set([...a,...b])).slice(0,6):a;
          const p=base[primary], s=secondary?base[secondary]:undefined;
          return {approach:merge(p.approach,s?.approach),tactics:merge(p.tactics,s?.tactics),watchouts:merge(p.watchouts,s?.watchouts),phrases:merge(p.phrases,s?.phrases)};
        };

        const primaryOrder = (['D','I','S','C'] as Trait[]).sort((a,b)=>scores.natural[b]-scores.natural[a]);
        const p = primaryOrder[0], s = primaryOrder[1];
        const plan = buildLeadGenPlan(p, s);
        const neg = buildNegotiationPlaybook(p, s);

        return (
          <div>
            <h3 style={{color: '#b40101', fontWeight:700, marginTop:'10px'}}>Lead Generation Action Plan</h3>
            <p><b>Focus:</b> {plan.title}</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><h4 style={{fontWeight:700}}>Daily</h4><ul style={{paddingLeft:'16px'}}>{plan.daily.map((x,i)=>(<li key={i}>• {x}</li>))}</ul></div>
              <div><h4 style={{fontWeight:700}}>Weekly</h4><ul style={{paddingLeft:'16px'}}>{plan.weekly.map((x,i)=>(<li key={i}>• {x}</li>))}</ul></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div><h4 style={{fontWeight:700}}>Monthly</h4><ul style={{paddingLeft:'16px'}}>{plan.monthly.map((x,i)=>(<li key={i}>• {x}</li>))}</ul></div>
              <div><h4 style={{fontWeight:700}}>Practical Ways</h4><ul style={{paddingLeft:'16px'}}>{plan.practical.map((x,i)=>(<li key={i}>• {x}</li>))}</ul></div>
            </div>

            <h3 style={{color: '#b40101', fontWeight:700, marginTop:'10px'}}>Negotiation Playbook</h3>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px'}}>
              <div>
                <h4 style={{fontWeight:700}}>Approach</h4><ul style={{paddingLeft:'16px'}}>{neg.approach.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                <h4 style={{fontWeight:700, marginTop:'6px'}}>Tactics</h4><ul style={{paddingLeft:'16px'}}>{neg.tactics.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
              </div>
              <div>
                <h4 style={{fontWeight:700}}>Watch‑outs</h4><ul style={{paddingLeft:'16px'}}>{neg.watchouts.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                <h4 style={{fontWeight:700, marginTop:'6px'}}>Useful Phrases</h4><ul style={{paddingLeft:'16px'}}>{neg.phrases.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
              </div>
            </div>

            <h3 style={{color: '#b40101', fontWeight:700, marginTop:'10px'}}>30‑60‑90 Implementation</h3>
            <ul style={{paddingLeft:'16px'}}>
              <li>• <b>Next 30 days:</b> Execute the daily/weekly cadence above. Track activity in your CRM.</li>
              <li>• <b>Days 31–60:</b> Double down on what converts; convert 1 tactic into a repeatable system.</li>
              <li>• <b>Days 61–90:</b> Add one new channel aligned to your style; ship a proof‑of‑value case study.</li>
            </ul>
          </div>
        );
      })()}
    </div>
  );
}
