import React, { useMemo, useRef, useState } from "react";
import { Download, Mail, Loader2 } from "lucide-react";

// Minimal inline UI
const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary' }> = ({variant='primary', className='', ...props}) => (
  <button {...props} className={`btn ${variant==='primary'?'btn-primary':'btn-secondary'} ${className}`}/>
);
const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className='', ...props}) => (<div {...props} className={`card ${className}`}></div>);
const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className='', ...props}) => (<div {...props} className={`p-4 ${className}`}></div>);
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref)=> (<input ref={ref} {...props} className={`input ${props.className||''}`} />));
Input.displayName='Input';

// THEME / BRAND
const KW_RED = "#b40101";
const LOGO_SRC = "/kw-explore-logo.png";
const APP_NAME = "Find Your Lead Gen WINWIN";

// EmailJS (configure in Netlify env)
const SENDER_EMAIL = "Dawie.dutoit@kwsa.co.za"; // reply-to + default CC
const EMAILJS_SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY  = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY  || "";
const CC_EMAIL = SENDER_EMAIL;

type Trait = 'D'|'I'|'S'|'C';

const QUESTIONS: { q: string; options: Record<Trait,string>; domain: 'work' | 'personal' }[] = [
  // WORK (10)
  { domain:'work', q: "In client meetings, you typically...", options: { D:"Set the agenda and drive to decisions", I:"Build rapport and keep energy high", S:"Keep it comfortable and steady", C:"Walk through a structured plan with data" } },
  { domain:'work', q: "When prospecting time starts, you...", options: { D:"Dial immediately—no warm-up", I:"Start with quick social touches", S:"Review your list and ease into calls", C:"Check CRM segments and scripts first" } },
  { domain:'work', q: "Your follow-up habit tends to...", options: { D:"Be short and direct with a clear CTA", I:"Be friendly and story-driven", S:"Be consistent and caring", C:"Be detailed with links and facts" } },
  { domain:'work', q: "In a negotiation you...", options: { D:"Set a strong anchor and timeline", I:"Create momentum and shared wins", S:"Lower tension and find common ground", C:"Use evidence and process to persuade" } },
  { domain:'work', q: "Facing a missed target, you...", options: { D:"Change strategy fast and push", I:"Rally energy and try new angles", S:"Stabilize routine and persist", C:"Diagnose the numbers and refine" } },
  { domain:'work', q: "Preparing a listing/buyer presentation, you...", options: { D:"Hit the key points and outcomes", I:"Make it visual and engaging", S:"Make it calm and step-by-step", C:"Make it precise with comps and graphs" } },
  { domain:'work', q: "During open houses you...", options: { D:"Qualify quickly and book meetings", I:"Welcome everyone and connect", S:"Make people feel at ease", C:"Capture details and answer with data" } },
  { domain:'work', q: "Your CRM approach is...", options: { D:"Action lists and next steps", I:"Notes about people and moments", S:"Reminders and relationship cues", C:"Tags, fields, and reporting" } },
  { domain:'work', q: "Under tight deadlines you...", options: { D:"Sprint and decide", I:"Keep spirits up and move", S:"Stay calm and sequence tasks", C:"Re-plan precisely to finish early" } },
  { domain:'work', q: "When pricing a property you...", options: { D:"Choose a bold but realistic number", I:"Consider appeal and narrative", S:"Aim for safe, steady interest", C:"Model comps, absorption, and scenarios" } },
  // PERSONAL (10)
  { domain:'personal', q: "On a free weekend, you're more likely to...", options: { D:"Tackle a big task or challenge", I:"See friends and try something fun", S:"Relax at home and recharge", C:"Organize, learn, or optimize something" } },
  { domain:'personal', q: "At a party, you...", options: { D:"Drive the plan (where/when/what)", I:"Float around and connect with many", S:"Stay with a few close people", C:"Observe first, join where it fits" } },
  { domain:'personal', q: "When a decision is needed, you rely on...", options: { D:"Speed and gut confidence", I:"How it will feel for people", S:"Harmony and stability", C:"Data and clear logic" } },
  { domain:'personal', q: "When conflict shows up, you...", options: { D:"Address it head-on", I:"Smooth things over", S:"Keep calm and find common ground", C:"Clarify facts and process" } },
  { domain:'personal', q: "Your workspace is usually...", options: { D:"Geared for action", I:"Lively and personal", S:"Comfortable and steady", C:"Organized and labeled" } },
  { domain:'personal', q: "Learning something new works best when you...", options: { D:"Do it hands-on", I:"Discuss it with people", S:"Practice until it feels natural", C:"Study the material first" } },
  { domain:'personal', q: "Your communication style leans toward...", options: { D:"Direct and brief", I:"Warm and expressive", S:"Patient and thoughtful", C:"Precise and thorough" } },
  { domain:'personal', q: "When traveling, you prefer...", options: { D:"An efficient power itinerary", I:"Meeting people and finding moments", S:"Restful routine and comfort", C:"Museums, notes, and structure" } },
  { domain:'personal', q: "Your risk appetite is...", options: { D:"High – move first", I:"Moderate – try it if exciting", S:"Measured – keep it safe", C:"Low – prove it first" } },
  { domain:'personal', q: "You feel most accomplished when...", options: { D:"A bold result is achieved", I:"People had a great experience", S:"Everyone stayed comfortable", C:"The outcome is accurate and elegant" } }
];

const TRAIT_INFO: Record<Trait,{label:string;color:string}> = {
  D: { label: "Dominance",          color: KW_RED },
  I: { label: "Influence",           color: "#e11d48" },
  S: { label: "Steadiness",          color: "#2563eb" },
  C: { label: "Conscientiousness",   color: "#0f766e" },
};

const STYLE_TITLES: Record<Trait,string> = { D:"Driver", I:"Connector", S:"Stabilizer", C:"Analyst" };

const opposite: Record<Trait,Trait> = { D:'S', I:'C', S:'D', C:'I' };
const percent = (n:number)=>Math.round((n/QUESTIONS.length)*100);
const orderByScore = (obj:Record<Trait,number>) => (Object.keys(obj) as Trait[]).sort((a,b)=>obj[b]-obj[a]);

function buildLeadGenPlan(primary:Trait, secondary?:Trait){
  const base: Record<Trait,{title:string;daily:string[];weekly:string[];monthly:string[];practical:string[]}> = {
    D:{title:'Lead Gen Action Plan – Driver',daily:['60‑minute power hour: focused dials/texts to hot & new leads','Set 1 clear CTA per touch (book consult, valuation, tour)','Tighten time blocks: prospecting → appointments → negotiation'],weekly:['FSBO/Expired outreach sprint (2 sessions)','Host/partner an outcome‑driven event (e.g., "Sell in 60 Days" clinic)','Review pipeline: remove blockers, set deadlines'],monthly:['Refine your listing presentation with one new bold proof (case study, stat)','Launch a direct‑response ad with a measurable offer'],practical:['Use short scripts that lead (e.g., "Here’s the fastest path that protects your price—shall we schedule 20 minutes?")','Track conversion by step; kill what\\'s slow, double what\\'s working']},
    I:{title:'Lead Gen Action Plan – Connector',daily:['5 relationship touches (voice notes/DMs) – celebrate, invite, help','Shoot 1 story/reel about a client win or neighborhood vibe','Log 1 new person to your SOI with a memory hook'],weekly:['Run a fun micro‑event (coffee pop‑up, walk‑and‑talk preview)','Open house as relationship engine (set 3 follow‑ups on the spot)','Send a "good news" email to your list (social proof, invite)'],monthly:['Host a community meetup or client appreciation mini‑event','Batch content day with 4–6 short videos'],practical:['Use curiosity openers (e.g., "Just out of curiosity…") and future‑pacing','Turn every "maybe" into a calendar invite or next micro‑step']},
    S:{title:'Lead Gen Action Plan – Stabilizer',daily:['3 care calls + 2 handwritten notes','Nurture 1 past client with a simple check‑in or resource','Document promises in CRM and schedule gentle follow‑ups'],weekly:['Neighborhood nurture: door notes or porch drop‑bys','Host a calm Q&A ("Understanding the process")','Referral touch: "Who can I take care of for you this month?"'],monthly:['Client care event (shredding day, movie night, park picnic)','Update a step‑by‑step buyer/seller guide, share with warm list'],practical:['Lead with empathy; recap next steps after every convo','Use gentle trial closes ("Would it help if…") to reduce friction']},
    C:{title:'Lead Gen Action Plan – Analyst',daily:['Update market watch list; send 1 insight to 3 prospects','Tidy CRM tags/segments; trigger one relevant drip','Draft 1 data‑backed post (comps, absorption, payment scenarios)'],weekly:['Record a 3‑minute "market logic" video with captions','Host a micro‑webinar: "What the data says about timing"','Price‑preview CMAs for 3 homeowners (email a one‑page visual)'],monthly:['Ship a one‑pager "Market at a Glance" to your farm list','A/B test a landing page or lead magnet; iterate on conversion'],practical:['Use calibrated questions ("What would make the numbers work for you?")','Visualize: charts, one‑pagers, decision matrices']}
  };
  const mix=(a:string[],b?:string[])=>b?Array.from(new Set([...a,...b])).slice(0,6):a;
  const p=base[primary]; const s=secondary?base[secondary]:undefined;
  return {title:s?`${p.title} + ${s.title.replace('Lead Gen Action Plan – ', '')}`:p.title,daily:mix(p.daily,s?.daily),weekly:mix(p.weekly,s?.weekly),monthly:mix(p.monthly,s?.monthly),practical:mix(p.practical,s?.practical)};
}

function buildNegotiationPlaybook(primary:Trait, secondary?:Trait){
  const base: Record<Trait,{approach:string[];tactics:string[];watchouts:string[];phrases:string[]}> = {
    D:{approach:['Own the frame, define outcomes, set clear timelines'],tactics:['Set strong anchors','Use deadlines and BATNA clarity','Trade, don’t concede'],watchouts:['Over‑pressuring slower styles','Talking past emotions'],phrases:['Here’s the fastest path that protects your outcome…','What flexibility do we have on X if we deliver Y today?']},
    I:{approach:['Build high trust and momentum, package win‑wins'],tactics:['Trial closes','Summarize gains often','Name shared goals'],watchouts:['Over‑promising','Missing details in the excitement'],phrases:['What would make this feel like a win for everyone?','If we solved X for them, could you be open to Y?']},
    S:{approach:['Collaborative pace, reduce stress, protect relationships'],tactics:['Label emotions','Offer safe next steps','Create small agreements'],watchouts:['Avoiding necessary conflict','Too much delay'],phrases:['It sounds like timing is stressful—what would feel manageable?','Would it help if we handled X so you could comfortably do Y?']},
    C:{approach:['Evidence‑based, logical progress, document everything'],tactics:['Data counters','Bracketing','Calibrated questions'],watchouts:['Over‑analyzing','Under‑acknowledging feelings'],phrases:['Help me understand how you calculated that number.','According to the comps and absorption, a move to X achieves Y—how does that land?']}
  };
  const merge=(a:string[],b?:string[])=>b?Array.from(new Set([...a,...b])).slice(0,6):a;
  const p=base[primary], s=secondary?base[secondary]:undefined;
  return {approach:merge(p.approach,s?.approach),tactics:merge(p.tactics,s?.tactics),watchouts:merge(p.watchouts,s?.watchouts),phrases:merge(p.phrases,s?.phrases)};
}

export default function App(){
  const [info,setInfo]=useState({firstName:'',lastName:'',phone:'',email:''});
  const [answers,setAnswers]=useState<{most:Trait|null;least:Trait|null}[]>(Array(QUESTIONS.length).fill(null).map(()=>({most:null,least:null})));
  const [sending,setSending]=useState(false);
  const [errors,setErrors]=useState<string|null>(null);
  const [currentIdx,setCurrentIdx]=useState(0);
  const reportRef=useRef<HTMLDivElement|null>(null);
  const formRef=useRef<HTMLFormElement|null>(null);
  const fileRef=useRef<HTMLInputElement|null>(null);

  const shuffledOptions=useMemo(()=>QUESTIONS.map(q=>(Object.entries(q.options) as [Trait,string][]).sort(()=>Math.random()-0.5)),[]);
  const answeredCount=useMemo(()=>answers.filter(a=>a.most&&a.least).length,[answers]);

  const scores=useMemo(()=>{ const natural:Record<Trait,number>={D:0,I:0,S:0,C:0}; const adaptive:Record<Trait,number>={D:0,I:0,S:0,C:0}; answers.forEach(a=>{ if(a.most) natural[a.most]+=1; if(a.least) adaptive[opposite[a.least as Trait]]+=1; }); return {natural,adaptive}; },[answers]);

  const primaryOrder=orderByScore(scores.natural); const primary=primaryOrder[0]; const secondary=primaryOrder[1];
  const plan=buildLeadGenPlan(primary,secondary); const neg=buildNegotiationPlaybook(primary,secondary); const styleLabel = secondary ? `${STYLE_TITLES[primary]}–${STYLE_TITLES[secondary]}` : STYLE_TITLES[primary];
  const progress=(answeredCount/QUESTIONS.length)*100;

  // PDF builder
  const buildPdfAndDataUrl = async ()=>{
    if(!reportRef.current) throw new Error('Report not ready');
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const el = reportRef.current!;
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p','mm','a4');
    const pageWidth = 210, pageHeight = 297; const imgWidth = pageWidth; const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight; let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) { position = heightLeft - imgHeight; pdf.addPage(); pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight); heightLeft -= pageHeight; }
    const name = `${APP_NAME}_${info.firstName}_${info.lastName}.pdf`;
    const blob = pdf.output('blob');
    const file = new File([blob], name, { type: 'application/pdf' });
    const dataUrl = pdf.output('datauristring');
    return { pdf, file, dataUrl, name };
  };

  const downloadPDF = async ()=>{ 
    try { const { pdf } = await buildPdfAndDataUrl(); pdf.save(`${APP_NAME}_${info.firstName}_${info.lastName}.pdf`); }
    catch(e){ setErrors('Could not generate PDF. Complete your info/questions and try again.'); console.error(e); }
  };

  // EmailJS send
  const emailPDF = async ()=>{
    if(!info.firstName||!info.lastName||!info.email){setErrors('Please complete your details before emailing.');return;}
    if(answers.some(a=>!a.most||!a.least)){setErrors('Please answer Most & Least for all 20 questions.');return;}
    if(!EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID){
      setErrors('Email is not configured. Add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID and VITE_EMAILJS_PUBLIC_KEY in Netlify → Site settings → Environment.');
      return;
    }
    setSending(true);
    try{
      const emailjs = await import('emailjs-com');
      await emailjs.init(EMAILJS_PUBLIC_KEY);
      const { file } = await buildPdfAndDataUrl();
      const dt = new DataTransfer(); dt.items.add(file); if(fileRef.current) fileRef.current.files = dt.files; else throw new Error('Attachment input missing');

      const f = formRef.current!;
      (f.elements.namedItem('to_email') as HTMLInputElement).value = info.email;
      (f.elements.namedItem('to_name') as HTMLInputElement).value = `${info.firstName} ${info.lastName}`;
      (f.elements.namedItem('from_name') as HTMLInputElement).value = 'KW Explore | Find Your Lead Gen WINWIN';
      (f.elements.namedItem('reply_to') as HTMLInputElement).value = SENDER_EMAIL;
      (f.elements.namedItem('cc') as HTMLInputElement).value = CC_EMAIL;
      (f.elements.namedItem('phone') as HTMLInputElement).value = info.phone || '';
      (f.elements.namedItem('subject') as HTMLInputElement).value = 'Your Personalized DISC Report';
      (f.elements.namedItem('message') as HTMLInputElement).value = 'Attached is your personalized DISC report with Lead Gen plan & Negotiation playbook.';

      await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, f);
      alert('✅ Email sent with your PDF attached (CC’d to Dawie).');
      setErrors(null);
    }catch(e){
      console.error(e);
      setErrors('Email failed. Confirm keys, template fields (to_email, cc, from_name, reply_to, phone, subject, message) and an attachment input named "report_pdf".');
      alert('Email failed. See console and ensure EmailJS template has the required fields.');
    }finally{ setSending(false); }
  };

  return (
    <div className="min-h-screen" style={{background:'#0b0b0d', color:'#e5e7eb'}}>
      {/* Hidden EmailJS form */}
      <form ref={formRef} style={{display:'none'}}>
        <input type="email" name="to_email" />
        <input type="text" name="to_name" />
        <input type="text" name="from_name" />
        <input type="email" name="reply_to" />
        <input type="email" name="cc" />
        <input type="text" name="phone" />
        <input type="text" name="subject" />
        <textarea name="message" />
        <input ref={fileRef} type="file" name="report_pdf" />
      </form>

      {/* HEADER */}
      <header style={{borderBottom:'1px solid #26262b', background:'#111113', position:'sticky', top:0, zIndex:10, padding:'12px 16px', display:'flex', alignItems:'center', gap:'12px'}}>
        <img src={LOGO_SRC} alt="KW Explore" style={{height:'22px'}} />
        <h1 style={{fontWeight:800, fontSize:'18px', color:KW_RED}}>{APP_NAME}</h1>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        {/* DETAILS */}
        <Card>
          <CardContent className="space-y-3">
            <h2 style={{ color: KW_RED, fontWeight:700 }}>Your Details</h2>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
              <Input placeholder="Name" value={info.firstName} onChange={(e)=>setInfo({...info, firstName:e.target.value})}/>
              <Input placeholder="Surname" value={info.lastName} onChange={(e)=>setInfo({...info, lastName:e.target.value})}/>
              <Input placeholder="Phone" value={info.phone} onChange={(e)=>setInfo({...info, phone:e.target.value})}/>
              <Input placeholder="Email" type="email" value={info.email} onChange={(e)=>setInfo({...info, email:e.target.value})}/>
            </div>
          </CardContent>
        </Card>

        {/* QUESTIONNAIRE */}
        <Card>
          <CardContent className="space-y-4">
            <h2 style={{ color: KW_RED, fontWeight:700 }}>Get To Know Yourself</h2>
            <div style={{width:'100%', height:'8px', borderRadius:'6px', background:'#1c1c20', overflow:'hidden'}}>
              <div style={{height:'100%', width:`${progress}%`, background:KW_RED}}/>
            </div>
            <div className="text-neutral-400" style={{fontSize:'12px'}}>Answered: {answeredCount}/{QUESTIONS.length}</div>

            <div className="rounded-lg border p-3">
              <div style={{fontSize:'22px', lineHeight:'1.35', fontWeight:700, marginBottom:'12px'}}>{currentIdx + 1}. {QUESTIONS[currentIdx].q}</div>
              <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
                <div className="rounded-lg border p-3">
                  <div style={{fontSize:'13px', marginBottom:'10px'}}>Most likely</div>
                  <div className="grid" style={{gap:'10px'}}>
                    { (Object.entries(QUESTIONS[currentIdx].options) as [Trait, string][]).sort(()=>Math.random()-0.5).map(([code, text])=>{
                        const selected = answers[currentIdx].most === code;
                        return (
                          <button key={`most-${code}`} onClick={()=>{ const next=[...answers]; if(next[currentIdx].least===code) return; next[currentIdx]={...next[currentIdx], most: code as Trait}; setAnswers(next); }}
                            style={{ textAlign:'left', color:'#fff', border:'1px solid '+(selected?KW_RED:'#3f3f46'), padding:'14px 16px', borderRadius:'12px', fontSize:'18px', background:selected?'#1c1c20':'#0f0f12' }}>{text}</button>
                        );
                    })}
                  </div>
                </div>
                <div className="rounded-lg border p-3">
                  <div style={{fontSize:'13px', marginBottom:'10px'}}>Least likely</div>
                  <div className="grid" style={{gap:'10px'}}>
                    { (Object.entries(QUESTIONS[currentIdx].options) as [Trait, string][]).sort(()=>Math.random()-0.5).map(([code, text])=>{
                        const selected = answers[currentIdx].least === code;
                        return (
                          <button key={`least-${code}`} onClick={()=>{ const next=[...answers]; if(next[currentIdx].most===code) return; next[currentIdx]={...next[currentIdx], least: code as Trait}; setAnswers(next); }}
                            style={{ textAlign:'left', color:'#fff', border:'1px solid '+(selected?KW_RED:'#3f3f46'), padding:'14px 16px', borderRadius:'12px', fontSize:'18px', background:selected?'#1c1c20':'#0f0f12' }}>{text}</button>
                        );
                    })}
                  </div>
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'12px', fontSize:'12px', color:'#9ca3af'}}>
                <div>Question {currentIdx+1} of {QUESTIONS.length}</div>
                <div style={{display:'flex', gap:'8px'}}>
                  <Button variant="secondary" onClick={()=>setCurrentIdx(Math.max(0, currentIdx-1))}>Previous</Button>
                  <Button style={{backgroundColor:KW_RED}} onClick={()=>setCurrentIdx(Math.min(QUESTIONS.length-1, currentIdx+1))} disabled={!answers[currentIdx].most||!answers[currentIdx].least}>{currentIdx<QUESTIONS.length-1?'Next':'Finish'}</Button>
                </div>
              </div>
            </div>

            {errors && <div className="text-red-500" style={{fontSize:'12px'}}>{errors}</div>}
            <div style={{display:'flex', gap:'8px'}}>
              <Button onClick={downloadPDF} variant="secondary"><Download className="h-4 w-4"/> Download PDF</Button>
              <Button onClick={emailPDF} className="gap-2" style={{backgroundColor:KW_RED}}>{sending?<Loader2 className="h-4 w-4 animate-spin"/>:<Mail className="h-4 w-4"/>} Email Report</Button>
            </div>
          </CardContent>
        </Card>

        {/* WHITE REPORT HTML */}
        <div ref={reportRef} style={{position:'absolute', left:'-9999px', top:'-9999px', width:'794px'}}>
          <div style={{background:'#fff', color:'#000', fontFamily:'ui-sans-serif, system-ui', padding:'28px', lineHeight:1.6}}>

            {/* COVER */}
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
              <img src={LOGO_SRC} alt="KW Explore" style={{height:'28px'}}/>
              <div style={{color:KW_RED, fontWeight:800, fontSize:'18px'}}>KW Explore</div>
            </div>
            <div style={{marginTop:'80px', textAlign:'center'}}>
              <div style={{fontSize:'32px', fontWeight:900, color:KW_RED}}>Find Your Lead Gen WINWIN</div>
              <div style={{fontSize:'18px', marginTop:'8px'}}>Personalized DISC® Report</div>
              <div style={{marginTop:'16px', fontSize:'13px'}}>
                <b>{info.firstName} {info.lastName}</b> · {info.email || '—'} · {info.phone || '—'}
              </div>
              <div style={{marginTop:'10px', fontSize:'14px'}}><b>DISC Style:</b> {styleLabel}</div>
            </div>

            {/* EXEC SUMMARY */}
            <h2 style={{color:KW_RED, fontSize:'18px', fontWeight:800, margin:'28px 0 8px'}}>Executive Summary</h2>
            <p style={{fontSize:'12px'}}>Your natural emphasis appears strongest in <b>{TRAIT_INFO[primary].label}</b>{secondary?` with a supporting ${TRAIT_INFO[secondary].label} blend`:''}. Your adaptive pattern reflects how you flex under pressure.</p>

            {/* NATURAL vs ADAPTIVE */}
            <h2 style={{color:KW_RED, fontSize:'18px', fontWeight:800, margin:'28px 0 8px'}}>Natural vs Adaptive</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
              <div>
                <h3 style={{fontWeight:700, fontSize:'14px'}}>Natural Style</h3>
                {(Object.keys(scores.natural) as Trait[]).map(k=>(<div key={k} style={{fontSize:'12px'}}>{TRAIT_INFO[k].label}: {scores.natural[k]} ({percent(scores.natural[k])}%)</div>))}
              </div>
              <div>
                <h3 style={{fontWeight:700, fontSize:'14px'}}>Adaptive Style</h3>
                {(Object.keys(scores.adaptive) as Trait[]).map(k=>(<div key={k} style={{fontSize:'12px'}}>{TRAIT_INFO[k].label}: {scores.adaptive[k]} ({percent(scores.adaptive[k])}%)</div>))}
              </div>
            </div>
            <h3 style={{fontWeight:700, fontSize:'14px', marginTop:'10px'}}>Side‑by‑Side Bars</h3>
            <svg width="738" height="240">
              <g><text x="20" y="20" fontSize="12" fill="#111">0–100%</text></g>
              {(['D','I','S','C'] as Trait[]).map((k, i) => {
                const nat = percent(scores.natural[k]);
                const ada = percent(scores.adaptive[k]);
                const baseX = 60 + i * 170; const scale = 1.6; const barBottom = 200;
                return (
                  <g key={k} transform={`translate(${baseX},0)`}>
                    <text x={0} y={barBottom + 20} fontSize="12" fill="#111">{TRAIT_INFO[k].label}</text>
                    <rect x={0} y={barBottom - ada*scale} width={52} height={ada*scale} fill="#111" />
                    <text x={0} y={barBottom - ada*scale - 5} fontSize="10" fill="#111">{ada}%</text>
                    <rect x={60} y={barBottom - nat*scale} width={52} height={nat*scale} fill="#bfbfbf" stroke="#111" />
                    <text x={60} y={barBottom - nat*scale - 5} fontSize="10" fill="#111">{nat}%</text>
                  </g>
                );
              })}
              <line x1="40" y1="200" x2="730" y2="200" stroke="#111" strokeWidth="1"/>
            </svg>

            {/* Strengths */}
            <h2 style={{color:KW_RED, fontSize:'18px', fontWeight:800, margin:'28px 0 8px'}}>Strengths & Blind Spots</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', fontSize:'12px'}}>
              <div>
                <h3 style={{fontWeight:700}}>Your Superpowers</h3>
                <ul>
                  {({D:['Decisive momentum','Bias for action','Comfort with challenge'], I:['Builds rapport fast','Storytelling & optimism','Energizes groups'], S:['Calm reliability','Patient follow‑through','Trust‑building presence'], C:['Accuracy & logic','Preparation & process','Data‑driven framing']} as Record<Trait,string[]>)[primary].map((x,i)=>(<li key={i}>{x}</li>))}
                </ul>
              </div>
              <div>
                <h3 style={{fontWeight:700}}>Watch‑outs</h3>
                <ul>
                  {({D:['May rush details','Can sound blunt','Impatience with slow pace'], I:['May gloss over details','Can over‑promise','Dislikes conflict'], S:['May avoid hard pushes','Slow to change','Can say yes too often'], C:['May over‑analyze','Can sound critical','Slower to decide'] } as Record<Trait,string[]>)[primary].map((x,i)=>(<li key={i}>{x}</li>))}
                </ul>
              </div>
            </div>

            {/* COMMUNICATION */}
            <h2 style={{color:KW_RED, fontSize:'18px', fontWeight:800, margin:'28px 0 8px'}}>Communicating with Each Style</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', fontSize:'12px'}}>
              <div>
                <h3 style={{fontWeight:700}}>With D</h3>
                <ul><li>Be brief, outcome‑first. Offer choices + deadlines.</li><li>Lead gen: clear CTA (valuation / consult) and time‑boxed options.</li><li>Negotiation: anchor early, trade value for value.</li></ul>
              </div>
              <div>
                <h3 style={{fontWeight:700}}>With I</h3>
                <ul><li>Warm tone. Story + social proof. Celebrate milestones.</li><li>Lead gen: invites to community/open‑house experiences.</li><li>Negotiation: trial closes, summarize shared wins.</li></ul>
              </div>
              <div>
                <h3 style={{fontWeight:700}}>With S</h3>
                <ul><li>Lower pressure. Clarify steps. Remove risk.</li><li>Lead gen: gentle follow‑ups, resources, simple checklists.</li><li>Negotiation: label emotions; create safe, small agreements.</li></ul>
              </div>
              <div>
                <h3 style={{fontWeight:700}}>With C</h3>
                <ul><li>Evidence + process. Share sources and comparisons.</li><li>Lead gen: one‑pagers, CMAs, market logic videos.</li><li>Negotiation: calibrated questions; document everything.</li></ul>
              </div>
            </div>

            {/* LEAD GEN PLAN */}
            <h2 style={{color:KW_RED, fontSize:'18px', fontWeight:800, margin:'28px 0 8px'}}>Lead Generation Action Plan</h2>
            <div style={{fontSize:'12px'}}><b>Focus:</b> {plan.title}</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', fontSize:'12px', marginTop:'8px'}}>
              <div><h3 style={{fontWeight:700}}>Daily</h3><ul>{plan.daily.map((x,i)=>(<li key={i}>{x}</li>))}</ul></div>
              <div><h3 style={{fontWeight:700}}>Weekly</h3><ul>{plan.weekly.map((x,i)=>(<li key={i}>{x}</li>))}</ul></div>
              <div><h3 style={{fontWeight:700}}>Monthly</h3><ul>{plan.monthly.map((x,i)=>(<li key={i}>{x}</li>))}</ul></div>
              <div><h3 style={{fontWeight:700}}>Practical Ways</h3><ul>{plan.practical.map((x,i)=>(<li key={i}>{x}</li>))}</ul></div>
            </div>

            {/* NEGOTIATION */}
            <h2 style={{color:KW_RED, fontSize:'18px', fontWeight:800, margin:'28px 0 8px'}}>Negotiation Playbook & Fallback</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', fontSize:'12px'}}>
              <div>
                <h3 style={{fontWeight:700}}>Approach</h3>
                <ul>{neg.approach.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
                <h3 style={{fontWeight:700, marginTop:'6px'}}>Tactics</h3>
                <ul>{neg.tactics.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
              </div>
              <div>
                <h3 style={{fontWeight:700}}>Watch‑outs</h3>
                <ul>{neg.watchouts.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
                <h3 style={{fontWeight:700, marginTop:'6px'}}>Useful Phrases</h3>
                <ul>{neg.phrases.map((x,i)=>(<li key={i}>{x}</li>))}</ul>
              </div>
            </div>

            <div style={{marginTop:'8px', fontSize:'12px'}}>
              <b>Fallback (when talks stall):</b>
              <ol style={{paddingLeft:'20px'}}>
                <li>Reset the frame with goals and constraints in one sentence.</li>
                <li>Label the tension (“It sounds like timing is the real worry”).</li>
                <li>Ask one calibrated question to unlock movement (“What would need to be true for X?”).</li>
                <li>Trade (never concede): if we deliver Y today, can you move to X?</li>
                <li>Summarize agreements in writing and schedule next checkpoint.</li>
              </ol>
            </div>

            {/* 30-60-90 */}
            <h2 style={{color:KW_RED, fontSize:'18px', fontWeight:800, margin:'28px 0 8px'}}>30–60–90 Implementation</h2>
            <ul style={{fontSize:'12px'}}>
              <li><b>Next 30 days:</b> Execute the daily/weekly cadence. Track in CRM.</li>
              <li><b>31–60 days:</b> Double down on what converts; templatize your messages.</li>
              <li><b>61–90 days:</b> Add one new channel aligned to your style; publish one case study.</li>
            </ul>

            {/* SCOREBOARD */}
            <h2 style={{color:KW_RED, fontSize:'18px', fontWeight:800, margin:'28px 0 8px'}}>Scoreboard & Checklists</h2>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:'12px'}}>
              <thead><tr><th style={{border:'1px solid #111', padding:'6px'}}>Metric</th><th style={{border:'1px solid #111', padding:'6px'}}>Target</th><th style={{border:'1px solid #111', padding:'6px'}}>Weekly Actual</th></tr></thead>
              <tbody>
                <tr><td style={{border:'1px solid #111', padding:'6px'}}>Convos</td><td style={{border:'1px solid #111', padding:'6px'}}>50</td><td style={{border:'1px solid #111', padding:'6px'}}></td></tr>
                <tr><td style={{border:'1px solid #111', padding:'6px'}}>Appts set</td><td style={{border:'1px solid #111', padding:'6px'}}>5</td><td style={{border:'1px solid #111', padding:'6px'}}></td></tr>
                <tr><td style={{border:'1px solid #111', padding:'6px'}}>Listings or Offers</td><td style={{border:'1px solid #111', padding:'6px'}}>2</td><td style={{border:'1px solid #111', padding:'6px'}}></td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}