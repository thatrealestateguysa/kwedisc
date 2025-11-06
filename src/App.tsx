import React, { useMemo, useRef, useState } from \"react\";
import { Card, CardContent } from \"./components/ui/card\";
import { Button } from \"./components/ui/button\";
import { Input } from \"./components/ui/input\";
import { Download, Mail, Loader2 } from \"lucide-react\";

// THEME
const KW_RED = \"#b40101\";
const LOGO_SRC = \"/kw-explore-logo.png\";
const APP_NAME = \"Find Your Lead Gen WINWIN\";

// EMAIL (env fallbacks + Dawie's address)
const SENDER_EMAIL = \"Dawie.dutoit@kwsa.co.za\"; // reply-to / cc
const EMAILJS_SERVICE_ID = (import.meta as any).env?.VITE_EMAILJS_SERVICE_ID || \"your_service_id\";
const EMAILJS_TEMPLATE_ID = (import.meta as any).env?.VITE_EMAILJS_TEMPLATE_ID || \"your_template_id\";
const EMAILJS_PUBLIC_KEY = (import.meta as any).env?.VITE_EMAILJS_PUBLIC_KEY || \"your_public_key\";
const CC_EMAIL = SENDER_EMAIL;

// DISC types
type Trait = 'D'|'I'|'S'|'C';

// 20 PERSONAL (non-real estate) MOST/LEAST QUESTIONS
const QUESTIONS: { q: string; options: Record<Trait, string> }[] = [
  { q: \"When starting something new, you usually...\",
    options: { D: \"Jump in and figure it out on the way\",
               I: \"Talk it through with people first\",
               S: \"Plan a comfortable routine for it\",
               C: \"Research and outline the steps\" } },
  { q: \"On a free weekend, you're more likely to...\",
    options: { D: \"Tackle a big task or challenge\",
               I: \"See friends and try something fun\",
               S: \"Relax at home and recharge\",
               C: \"Organize, learn, or optimize something\" } },
  { q: \"At a party, you...\",
    options: { D: \"Drive the plan (where/when/what)\",
               I: \"Float around and connect with many\",
               S: \"Stay with a few close people\",
               C: \"Observe first, join where it fits\" } },
  { q: \"When a decision is needed, you rely on...\",
    options: { D: \"Speed and gut confidence\",
               I: \"How it will feel for people\",
               S: \"Harmony and stability\",
               C: \"Data and clear logic\" } },
  { q: \"When conflict shows up, you...\",
    options: { D: \"Address it head-on\",
               I: \"Smooth things over\",
               S: \"Keep calm and find common ground\",
               C: \"Clarify facts and process\" } },
  { q: \"Your workspace is usually...\",
    options: { D: \"Geared for action\",
               I: \"Lively and personal\",
               S: \"Comfortable and steady\",
               C: \"Organized and labeled\" } },
  { q: \"In a group task, you naturally...\",
    options: { D: \"Take the lead\",
               I: \"Motivate and involve others\",
               S: \"Support and keep it steady\",
               C: \"Quality-check and structure\" } },
  { q: \"Learning something new works best when you...\",
    options: { D: \"Do it hands-on\",
               I: \"Discuss it with people\",
               S: \"Practice until it feels natural\",
               C: \"Study the material first\" } },
  { q: \"Your communication style leans toward...\",
    options: { D: \"Direct and brief\",
               I: \"Warm and expressive\",
               S: \"Patient and thoughtful\",
               C: \"Precise and thorough\" } },
  { q: \"Faced with sudden change, you...\",
    options: { D: \"Adapt fast and push forward\",
               I: \"Keep spirits up and rally\",
               S: \"Seek stability and clarity\",
               C: \"Map the new plan carefully\" } },
  { q: \"When traveling, you prefer...\",
    options: { D: \"An efficient power itinerary\",
               I: \"Meeting people and finding moments\",
               S: \"Restful routine and comfort\",
               C: \"Museums, notes, and structure\" } },
  { q: \"Your risk appetite is...\",
    options: { D: \"High – move first\",
               I: \"Moderate – try it if exciting\",
               S: \"Measured – keep it safe\",
               C: \"Low – prove it first\" } },
  { q: \"Deadlines make you...\",
    options: { D: \"Sprint and win the clock\",
               I: \"Gather energy and deliver\",
               S: \"Plan steady progress\",
               C: \"Schedule buffers to finish early\" } },
  { q: \"When shopping, you...\",
    options: { D: \"Decide quickly\",
               I: \"Enjoy browsing\",
               S: \"Ask for trusted opinions\",
               C: \"Compare and read reviews\" } },
  { q: \"If a plan falls apart, you...\",
    options: { D: \"Create a new path immediately\",
               I: \"Keep morale high and improvise\",
               S: \"Stabilize and reset expectations\",
               C: \"Diagnose and rebuild the process\" } },
  { q: \"You feel most accomplished when...\",
    options: { D: \"A bold result is achieved\",
               I: \"People had a great experience\",
               S: \"Everyone stayed comfortable\",
               C: \"The outcome is accurate and elegant\" } },
  { q: \"Your notes/tools are...\",
    options: { D: \"Short action lists\",
               I: \"Voice notes/photos\",
               S: \"Calendars and reminders\",
               C: \"Tags, folders, spreadsheets\" } },
  { q: \"What bugs you the most is...\",
    options: { D: \"Wasted time\",
               I: \"Cold interactions\",
               S: \"Unnecessary conflict\",
               C: \"Inaccurate info\" } },
  { q: \"People describe you as...\",
    options: { D: \"Decisive\",
               I: \"Inspiring\",
               S: \"Dependable\",
               C: \"Thorough\" } },
  { q: \"When giving feedback, you prefer...\",
    options: { D: \"Be candid and clear\",
               I: \"Be encouraging and upbeat\",
               S: \"Be considerate and private\",
               C: \"Be detailed with examples\" } },
];

const TRAIT_INFO: Record<Trait,{ label: string; color: string }> = {
  D: { label: \"Dominance\", color: KW_RED },
  I: { label: \"Influence\", color: \"#e11d48\" },
  S: { label: \"Steadiness\", color: \"#2563eb\" },
  C: { label: \"Conscientiousness\", color: \"#0f766e\" },
};

// -------- Helpers for scoring & plans --------
const opposite: Record<Trait, Trait> = { D: 'S', I: 'C', S: 'D', C: 'I' };
const percent = (n: number) => Math.round((n / QUESTIONS.length) * 100);
const orderByScore = (obj: Record<Trait, number>): Trait[] => (Object.keys(obj) as Trait[]).sort((a,b)=>obj[b]-obj[a]);

function buildLeadGenPlan(primary: Trait, secondary?: Trait) {
  const base: Record<Trait, { title: string; daily: string[]; weekly: string[]; monthly: string[]; practical: string[] }> = {
    D: {
      title: \"Lead Gen Action Plan – Driver\",
      daily: [
        \"60‑minute power hour: focused dials/texts to hot & new leads\",
        \"Set 1 clear CTA per touch (book consult, valuation, tour)\",
        \"Tighten time blocks: prospecting → appointments → negotiation\",
      ],
      weekly: [
        \"FSBO/Expired outreach sprint (2 sessions)\",
        \"Host/partner an outcome‑driven event (e.g., 'Sell in 60 Days' clinic)\",
        \"Review pipeline: remove blockers, set deadlines\",
      ],
      monthly: [
        \"Refine your listing presentation with one new bold proof (case study, stat)\",
        \"Launch a direct‑response ad with a measurable offer\",
      ],
      practical: [
        \"Use short scripts that lead (e.g., 'Here’s the fastest path that protects your price—shall we schedule 20 minutes?')\",
        \"Track conversion by step; kill what's slow, double what's working\",
      ],
    },
    I: {
      title: \"Lead Gen Action Plan – Connector\",
      daily: [
        \"5 relationship touches (voice notes/DMs) – celebrate, invite, help\",
        \"Shoot 1 story/reel about a client win or neighborhood vibe\",
        \"Log 1 new person to your SOI with a memory hook\",
      ],
      weekly: [
        \"Run a fun micro‑event (coffee pop‑up, walk‑and‑talk preview)\",
        \"Open house as relationship engine (set 3 follow‑ups on the spot)\",
        \"Send a 'good news' email to your list (social proof, invite)\",
      ],
      monthly: [
        \"Host a community meetup or client appreciation mini‑event\",
        \"Batch content day with 4–6 short videos\",
      ],
      practical: [
        \"Use curiosity openers (e.g., 'Just out of curiosity…') and future‑pacing\",
        \"Turn every 'maybe' into a calendar invite or next micro‑step\",
      ],
    },
    S: {
      title: \"Lead Gen Action Plan – Stabilizer\",
      daily: [
        \"3 care calls + 2 handwritten notes\",
        \"Nurture 1 past client with a simple check‑in or resource\",
        \"Document promises in CRM and schedule gentle follow‑ups\",
      ],
      weekly: [
        \"Neighborhood nurture: door notes or porch drop‑bys\",
        \"Host a calm Q&A ('Understanding the process')\",
        \"Referral touch: 'Who can I take care of for you this month?'\",
      ],
      monthly: [
        \"Client care event (shredding day, movie night, park picnic)\",
        \"Update a step‑by‑step buyer/seller guide, share with warm list\",
      ],
      practical: [
        \"Lead with empathy; recap next steps after every convo\",
        \"Use gentle trial closes ('Would it help if…') to reduce friction\",
      ],
    },
    C: {
      title: \"Lead Gen Action Plan – Analyst\",
      daily: [
        \"Update market watch list; send 1 insight to 3 prospects\",
        \"Tidy CRM tags/segments; trigger one relevant drip\",
        \"Draft 1 data‑backed post (comps, absorption, payment scenarios)\",
      ],
      weekly: [
        \"Record a 3‑minute 'market logic' video with captions\",
        \"Host a micro‑webinar: 'What the data says about timing'\",
        \"Price‑preview CMAs for 3 homeowners (email a one‑page visual)\",
      ],
      monthly: [
        \"Ship a one‑pager 'Market at a Glance' to your farm list\",
        \"A/B test a landing page or lead magnet; iterate on conversion\",
      ],
      practical: [
        \"Use calibrated questions ('What would make the numbers work for you?')\",
        \"Visualize: charts, one‑pagers, decision matrices\",
      ],
    },
  };

  const mix = (a: string[], b?: string[]) => b ? Array.from(new Set([...a, ...b])).slice(0, 6) : a;
  const pri = base[primary];
  const sec = secondary ? base[secondary] : undefined;
  return {
    title: sec ? `${pri.title} + ${sec.title.replace('Lead Gen Action Plan – ', '')}` : pri.title,
    daily: mix(pri.daily, sec?.daily),
    weekly: mix(pri.weekly, sec?.weekly),
    monthly: mix(pri.monthly, sec?.monthly),
    practical: mix(pri.practical, sec?.practical),
  };
}

function buildNegotiationPlaybook(primary: Trait, secondary?: Trait) {
  const base: Record<Trait, { approach: string[]; tactics: string[]; watchouts: string[]; phrases: string[] }> = {
    D: {
      approach: [\"Own the frame, define outcomes, set clear timelines\"],
      tactics: [\"Set strong anchors\", \"Use deadlines and BATNA clarity\", \"Trade, don’t concede\"],
      watchouts: [\"Over‑pressuring slower styles\", \"Talking past emotions\"],
      phrases: [
        \"Here’s the fastest path that protects your outcome…\",
        \"What flexibility do we have on X if we deliver Y today?\",
      ],
    },
    I: {
      approach: [\"Build high trust and momentum, package win‑wins\"],
      tactics: [\"Trial closes\", \"Summarize gains often\", \"Name shared goals\"],
      watchouts: [\"Over‑promising\", \"Missing details in the excitement\"],
      phrases: [
        \"What would make this feel like a win for everyone?\",
        \"If we solved X for them, could you be open to Y?\",
      ],
    },
    S: {
      approach: [\"Collaborative pace, reduce stress, protect relationships\"],
      tactics: [\"Label emotions\", \"Offer safe next steps\", \"Create small agreements\"],
      watchouts: [\"Avoiding necessary conflict\", \"Too much delay\"],
      phrases: [
        \"It sounds like timing is stressful—what would feel manageable?\",
        \"Would it help if we handled X so you could comfortably do Y?\",
      ],
    },
    C: {
      approach: [\"Evidence‑based, logical progress, document everything\"],
      tactics: [\"Data counters\", \"Bracketing\", \"Calibrated questions\"],
      watchouts: [\"Over‑analyzing\", \"Under‑acknowledging feelings\"],
      phrases: [
        \"Help me understand how you calculated that number.\",
        \"According to the comps and absorption, a move to X achieves Y—how does that land?\",
      ],
    },
  };

  const merge = (a: string[], b?: string[]) => b ? Array.from(new Set([...a, ...b])).slice(0, 6) : a;
  const p = base[primary];
  const s = secondary ? base[secondary] : undefined;
  return {
    approach: merge(p.approach, s?.approach),
    tactics: merge(p.tactics, s?.tactics),
    watchouts: merge(p.watchouts, s?.watchouts),
    phrases: merge(p.phrases, s?.phrases),
  };
}

export default function App() {
  const [info, setInfo] = useState({ firstName: \"\", lastName: \"\", phone: \"\", email: \"\" });
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

  const plan = buildLeadGenPlan(primary, secondary);
  const neg = buildNegotiationPlaybook(primary, secondary);

  const progress = (answeredCount/QUESTIONS.length)*100;

  // ---- PDF helpers ----
  const makePDFFile = async () => {
    const html2canvas = (await import(\"html2canvas\")).default;
    const { jsPDF } = await import(\"jspdf\");
    const target = reportRef.current!;
    const canvas = await html2canvas(target, { scale: 2 });
    const pdf = new jsPDF();
    const imgData = canvas.toDataURL(\"image/png\");
    pdf.addImage(imgData, \"PNG\", 0, 0, 210, 297);
    const fileName = `${APP_NAME}_${info.firstName}_${info.lastName}.pdf`;
    const blob = pdf.output(\"blob\");
    const file = new File([blob], fileName, { type: \"application/pdf\" });
    return { file, fileName };
  };

  const downloadPDF = async () => {
    const html2canvas = (await import(\"html2canvas\")).default;
    const { jsPDF } = await import(\"jspdf\");
    const target = reportRef.current!;
    const canvas = await html2canvas(target, { scale: 2 });
    const pdf = new jsPDF();
    const imgData = canvas.toDataURL(\"image/png\");
    pdf.addImage(imgData, \"PNG\", 0, 0, 210, 297);
    pdf.save(`${APP_NAME}_${info.firstName}_${info.lastName}.pdf`);
  };

  const emailPDF = async () => {
    if (!info.firstName || !info.lastName || !info.email) { setErrors(\"Please complete your details before emailing.\"); return; }
    if (answers.some(a=>!a.most || !a.least)) { setErrors(\"Please answer Most & Least for all 20 questions.\"); return; }
    setSending(true);
    try {
      const emailjs = await import(\"emailjs-com\");
      await emailjs.init(EMAILJS_PUBLIC_KEY);
      const { file, fileName } = await makePDFFile();

      const params: Record<string, any> = {
        // Addressing (configure your EmailJS template to reference these)
        to_email: info.email,
        to_name: `${info.firstName} ${info.lastName}`,
        from_name: \"KW Explore | Find Your Lead Gen WINWIN\",
        from_email: SENDER_EMAIL,
        reply_to: SENDER_EMAIL,
        cc: CC_EMAIL, // add {{cc}} to your template CC field

        // Body variables
        agent_name: `${info.firstName} ${info.lastName}`,
        phone: info.phone,
        subject: \"Your Personalized DISC Report\",
        message: \"Attached is your personalized DISC report with Lead Gen plan & Negotiation playbook.\",

        // Attachment (actual PDF)
        attachments: [file],
      };

      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params);
      alert(\"✅ Email sent with your PDF attached (CC’d to Dawie). If it didn’t arrive, confirm EmailJS keys/template.\");
    } catch (e) {
      console.error(e);
      alert(\"Email failed. Please verify EmailJS service/template/public key and template variables (README). You can still Download PDF.\");
    } finally { setSending(false); }
  };

  return (
    <div className=\"min-h-screen bg-[#0b0b0d] text-neutral-100\">
      {/* HEADER */}
      <header className=\"border-b border-neutral-800 bg-neutral-900/90 sticky top-0 z-10 p-4 flex items-center gap-3\">
        <img src={LOGO_SRC} alt=\"KW Explore\" style={{height:'20px'}} />
        <h1 className=\"font-bold text-xl\" style={{ color: KW_RED }}>{APP_NAME}</h1>
      </header>

      <main className=\"max-w-3xl mx-auto p-4 space-y-4\">
        {/* DETAILS */}
        <Card className=\"bg-neutral-900 border-neutral-800\">
          <CardContent className=\"space-y-3\">
            <h2 className=\"text-lg font-semibold\" style={{ color: KW_RED }}>Your Details</h2>
            <div className=\"grid sm:grid-cols-2 gap-3\">
              <Input className=\"text-sm md:text-base py-2\" placeholder=\"Name\" value={info.firstName} onChange={(e)=>setInfo({...info, firstName:e.target.value})}/>
              <Input className=\"text-sm md:text-base py-2\" placeholder=\"Surname\" value={info.lastName} onChange={(e)=>setInfo({...info, lastName:e.target.value})}/>
              <Input className=\"text-sm md:text-base py-2\" placeholder=\"Phone\" value={info.phone} onChange={(e)=>setInfo({...info, phone:e.target.value})}/>
              <Input className=\"text-sm md:text-base py-2\" placeholder=\"Email\" type=\"email\" value={info.email} onChange={(e)=>setInfo({...info, email:e.target.value})}/>
            </div>
          </CardContent>
        </Card>

        {/* QUESTIONNAIRE */}
        <Card className=\"bg-neutral-900 border-neutral-800\">
          <CardContent className=\"space-y-4\">
            <h2 className=\"text-lg font-semibold\" style={{ color: KW_RED }}>Get To Know Yourself</h2>

            {/* progress bar */}
            <div className=\"w-full h-2 rounded-full bg-neutral-800 overflow-hidden\">
              <div className=\"h-full\" style={{ width: `${progress}%`, background: KW_RED }}></div>
            </div>
            <div className=\"text-xs text-neutral-400\">Answered: {answeredCount}/{QUESTIONS.length} • There are no right/wrong answers.</div>

            <div className=\"rounded-xl border border-neutral-800 p-3\">
              <div style={{fontSize:'22px', lineHeight:'1.35', fontWeight:700, marginBottom:'12px'}}>{currentIdx + 1}. {QUESTIONS[currentIdx].q}</div>
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                <div className=\"rounded-lg border border-neutral-800 p-3\">
                  <div className=\"text-sm text-neutral-100 mb-3 font-medium\">Most likely</div>
                  <div className=\"grid grid-cols-1 gap-3\">
                    {shuffledOptions[currentIdx].map(([code, text]) => {
                      const selected = answers[currentIdx].most === code;
                      return (
                        <button key={`most-${code}`}
                          onClick={() => {
                            const next = [...answers];
                            if (next[currentIdx].least === code) return;
                            next[currentIdx] = { ...next[currentIdx], most: code as Trait };
                            setAnswers(next);
                          }}
                          style={{ textAlign:'left', color:'#fff', border: '1px solid ' + (selected ? '#b40101' : '#3f3f46'), padding:'14px 16px', borderRadius:'12px', fontSize:'18px', background: selected ? '#1c1c20' : '#0f0f12' }}>{text}</button>
                      );
                    })}
                  </div>
                </div>
                <div className=\"rounded-lg border border-neutral-800 p-3\">
                  <div className=\"text-sm text-neutral-100 mb-3 font-medium\">Least likely</div>
                  <div className=\"grid grid-cols-1 gap-3\">
                    {shuffledOptions[currentIdx].map(([code, text]) => {
                      const selected = answers[currentIdx].least === code;
                      return (
                        <button key={`least-${code}`}
                          onClick={() => {
                            const next = [...answers];
                            if (next[currentIdx].most === code) return;
                            next[currentIdx] = { ...next[currentIdx], least: code as Trait };
                            setAnswers(next);
                          }}
                          style={{ textAlign:'left', color:'#fff', border: '1px solid ' + (selected ? '#b40101' : '#3f3f46'), padding:'14px 16px', borderRadius:'12px', fontSize:'18px', background: selected ? '#1c1c20' : '#0f0f12' }}>{text}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className=\"flex items-center justify-between mt-3 text-xs text-neutral-400\">
                <div>Question {currentIdx+1} of {QUESTIONS.length}</div>
                <div className=\"flex gap-2\">
                  <Button variant=\"secondary\" className=\"px-4 py-3 text-base md:text-lg\" onClick={()=>setCurrentIdx(Math.max(0, currentIdx-1))}>Previous</Button>
                  <Button style={{backgroundColor:KW_RED}} className=\"px-4 py-3 text-base md:text-lg\" onClick={()=>setCurrentIdx(Math.min(QUESTIONS.length-1, currentIdx+1))} disabled={!answers[currentIdx].most || !answers[currentIdx].least}>{currentIdx<QUESTIONS.length-1?'Next':'Finish'}</Button>
                </div>
              </div>
            </div>

            {errors && <div className=\"text-red-500 text-sm\">{errors}</div>}
            <div className=\"flex gap-2\">
              <Button onClick={downloadPDF} variant=\"secondary\"><Download className=\"h-4 w-4\"/>Download PDF</Button>
              <Button onClick={emailPDF} style={{backgroundColor:KW_RED}} className=\"gap-2\">{sending?<Loader2 className=\"h-4 w-4 animate-spin\"/>:<Mail className=\"h-4 w-4\"/>}Email Report</Button>
            </div>
          </CardContent>
        </Card>

        {/* HIDDEN REPORT (rendered to PDF) */}
        <div ref={reportRef} style={{position:'absolute', left:'-9999px', top:'-9999px', width:'800px'}}>
          <div className=\"bg-white text-black p-6 rounded-xl\" style={{fontFamily:'ui-sans-serif, system-ui'}}>
            <div className=\"flex items-center justify-between\">
              <img src={LOGO_SRC} alt=\"KW\" style={{height:'16px'}}/>
              <div style={{color:KW_RED, fontWeight:700}}>KW Explore</div>
            </div>
            <h2 className=\"font-bold text-xl mt-2\" style={{color:KW_RED}}>Personalized DISC Report</h2>
            <p><b>Name:</b> {info.firstName} {info.lastName} &nbsp; <b>Email:</b> {info.email}</p>

            {/* Summary */}
            <h3 className=\"font-semibold mt-3\">Executive Summary</h3>
            <p>Your natural emphasis appears strongest in <b>{TRAIT_INFO[primary].label}</b>{secondary?` with a supporting ${TRAIT_INFO[secondary].label} blend`:''}. Your adaptive pattern suggests you lean on complementary behaviors when under pressure.</p>

            <div className=\"grid\" style={{gridTemplateColumns:'1fr 1fr', gap:'12px'}}>
              <div>
                <h4 className=\"font-semibold\">Natural Style</h4>
                {(Object.keys(scores.natural) as Trait[]).map(k=>(<p key={k}>{TRAIT_INFO[k].label}: {scores.natural[k]} ({percent(scores.natural[k])}%)</p>))}
              </div>
              <div>
                <h4 className=\"font-semibold\">Adaptive Style</h4>
                {(Object.keys(scores.adaptive) as Trait[]).map(k=>(<p key={k}>{TRAIT_INFO[k].label}: {scores.adaptive[k]} ({percent(scores.adaptive[k])}%)</p>))}
              </div>
            </div>

            {/* Side-by-side chart */}
            <h3 className=\"font-semibold mt-3\">Natural vs Adaptive (Side-by-Side)</h3>
            <svg width=\"760\" height=\"240\">
              <g>
                <text x=\"20\" y=\"20\" fontSize=\"12\" fill=\"#111\">0–100%</text>
              </g>
              {(['D','I','S','C'] as Trait[]).map((k, i) => {
                const nat = percent(scores.natural[k]);
                const ada = percent(scores.adaptive[k]);
                const baseX = 60 + i * 170;
                const scale = 1.6; // 0–100 -> 160px
                const barBottom = 200;
                return (
                  <g key={k} transform={`translate(${baseX},0)`}>
                    <text x={0} y={barBottom + 20} fontSize=\"12\" fill=\"#111\">{TRAIT_INFO[k].label}</text>
                    <rect x={0} y={barBottom - ada*scale} width=\"50\" height={ada*scale} fill=\"#111\" />
                    <text x={0} y={barBottom - ada*scale - 5} fontSize=\"10\" fill=\"#111\">{ada}%</text>
                    <rect x={60} y={barBottom - nat*scale} width=\"50\" height={nat*scale} fill=\"#bfbfbf\" stroke=\"#111\" />
                    <text x={60} y={barBottom - nat*scale - 5} fontSize=\"10\" fill=\"#111\">{nat}%</text>
                  </g>
                );
              })}
              <line x1=\"40\" y1=\"200\" x2=\"740\" y2=\"200\" stroke=\"#111\" strokeWidth=\"1\"/>
            </svg>

            {/* Lead Gen Plan */}
            <h3 className=\"font-semibold mt-3\" style={{color:KW_RED}}>Lead Generation Action Plan</h3>
            <p><b>Focus:</b> {plan.title}</p>
            <div className=\"grid\" style={{gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <div>
                <h4 className=\"font-semibold\">Daily</h4>
                <ul style={{paddingLeft:'16px'}}>{plan.daily.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
              </div>
              <div>
                <h4 className=\"font-semibold\">Weekly</h4>
                <ul style={{paddingLeft:'16px'}}>{plan.weekly.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
              </div>
            </div>
            <div className=\"grid\" style={{gridTemplateColumns:'1fr 1fr', gap:'8px', marginTop:'6px'}}>
              <div>
                <h4 className=\"font-semibold\">Monthly</h4>
                <ul style={{paddingLeft:'16px'}}>{plan.monthly.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
              </div>
              <div>
                <h4 className=\"font-semibold\">Practical Ways</h4>
                <ul style={{paddingLeft:'16px'}}>{plan.practical.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
              </div>
            </div>

            {/* Negotiation Playbook */}
            <h3 className=\"font-semibold mt-3\" style={{color:KW_RED}}>Negotiation Playbook</h3>
            <div className=\"grid\" style={{gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
              <div>
                <h4 className=\"font-semibold\">Approach</h4>
                <ul style={{paddingLeft:'16px'}}>{neg.approach.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                <h4 className=\"font-semibold mt-2\">Tactics</h4>
                <ul style={{paddingLeft:'16px'}}>{neg.tactics.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
              </div>
              <div>
                <h4 className=\"font-semibold\">Watch‑outs</h4>
                <ul style={{paddingLeft:'16px'}}>{neg.watchouts.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
                <h4 className=\"font-semibold mt-2\">Useful Phrases</h4>
                <ul style={{paddingLeft:'16px'}}>{neg.phrases.map((x,i)=>(<li key={i}>• {x}</li>))}</ul>
              </div>
            </div>

            {/* 30‑60‑90 */}
            <h3 className=\"font-semibold mt-3\" style={{color:KW_RED}}>30‑60‑90 Implementation</h3>
            <ul style={{paddingLeft:'16px'}}>
              <li>• <b>Next 30 days:</b> Execute the daily/weekly cadence above. Track activity in your CRM.</li>
              <li>• <b>Days 31–60:</b> Double down on what converts; convert 1 tactic into a repeatable system.</li>
              <li>• <b>Days 61–90:</b> Add one new channel aligned to your style; ship a proof‑of‑value case study.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
