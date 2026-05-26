import { useState, useEffect, useRef } from "react";

const CA_PROVINCES_LIST = [
  ["ON","Ontario"],["BC","British Columbia"],["AB","Alberta"],["QC","Quebec"],
  ["MB","Manitoba"],["SK","Saskatchewan"],["NS","Nova Scotia"],["NB","New Brunswick"],
  ["NL","Newfoundland"],["PE","PEI"],["NT","NWT"],["NU","Nunavut"],["YT","Yukon"],
];
const US_STATES_LIST = [
  ["CA","California"],["TX","Texas"],["FL","Florida"],["NY","New York"],["IL","Illinois"],
  ["PA","Pennsylvania"],["OH","Ohio"],["GA","Georgia"],["NC","North Carolina"],["WA","Washington"],
  ["AZ","Arizona"],["CO","Colorado"],["MI","Michigan"],["WI","Wisconsin"],["NV","Nevada"],
  ["NJ","New Jersey"],["MA","Massachusetts"],["MD","Maryland"],["TN","Tennessee"],["VA","Virginia"],
  ["MO","Missouri"],["IN","Indiana"],["KY","Kentucky"],["SC","South Carolina"],["AL","Alabama"],
  ["MN","Minnesota"],["OR","Oregon"],["CT","Connecticut"],["OK","Oklahoma"],["UT","Utah"],
  ["IA","Iowa"],["KS","Kansas"],["NE","Nebraska"],["AR","Arkansas"],["MS","Mississippi"],
  ["LA","Louisiana"],["ID","Idaho"],["MT","Montana"],["WY","Wyoming"],["ND","North Dakota"],
  ["SD","South Dakota"],["NM","New Mexico"],["VT","Vermont"],["NH","New Hampshire"],["ME","Maine"],
  ["RI","Rhode Island"],["DE","Delaware"],["HI","Hawaii"],["AK","Alaska"],["DC","Washington DC"],["WV","West Virginia"],
];
const CA_BASE = {ON:1920,BC:1450,AB:1735,QC:900,MB:1350,SK:1235,NS:1150,NB:1120,NL:1270,PE:1080,NT:1200,NU:1200,YT:1200};
const US_BASE = {CA:2450,TX:2310,FL:3183,NY:2994,IL:1566,PA:1478,OH:1034,GA:2359,NC:1392,WA:1701,AZ:2026,CO:2568,MI:2864,WI:1087,NV:2100,NJ:2800,MA:2000,MD:1900,TN:1600,VA:1400,MO:1300,IN:1200,KY:1500,SC:1400,AL:1400,MN:1400,OR:1600,CT:1800,OK:1800,UT:1400,IA:1100,KS:1300,NE:1500,AR:1600,MS:1500,LA:2400,ID:1200,MT:1600,WY:1300,ND:1100,SD:1200,NM:1500,VT:1200,NH:1100,ME:1100,RI:1800,DE:1500,HI:1100,AK:1400,DC:2200,WV:1400};
const CA_INSURERS = [
  {name:"Intact Insurance",type:"major",bestFor:["Most drivers","Newcomers to Canada","Bundling"],quote:"https://www.intact.net/en/get-a-quote"},
  {name:"TD Insurance",type:"major",bestFor:["TD banking customers","Professionals"],quote:"https://www.tdinsurance.com/getaquote"},
  {name:"Aviva Canada",type:"major",bestFor:["High-value vehicles","Safe drivers"],quote:"https://www.avivacanada.com/get-a-quote"},
  {name:"Belairdirect",type:"online",bestFor:["Telematics users","Online buyers"],quote:"https://www.belairdirect.com/en/auto-insurance/get-a-quote.html"},
  {name:"Sonnet Insurance",type:"online",bestFor:["Urban drivers","Digital-first"],quote:"https://www.sonnet.ca/auto-insurance/get-a-quote"},
  {name:"Ratehub.ca",type:"comparison",bestFor:["All drivers","Rate shoppers"],quote:"https://www.ratehub.ca/car-insurance"},
  {name:"Kanetix.ca",type:"comparison",bestFor:["Comparison shopping","High-risk drivers"],quote:"https://www.kanetix.ca/auto-insurance"},
];
const US_INSURERS = [
  {name:"State Farm",type:"major",bestFor:["Most drivers","Local agent preferred"],quote:"https://www.statefarm.com/insurance/auto"},
  {name:"GEICO",type:"major",bestFor:["Price-conscious drivers","Military"],quote:"https://www.geico.com/auto-insurance/"},
  {name:"Progressive",type:"major",bestFor:["Telematics users","High-risk drivers"],quote:"https://www.progressive.com/auto/"},
  {name:"Allstate",type:"major",bestFor:["Low-mileage drivers","Safe drivers"],quote:"https://www.allstate.com/auto-insurance"},
  {name:"Insurify",type:"comparison",bestFor:["All drivers","Rate comparison"],quote:"https://insurify.com/car-insurance"},
  {name:"The Zebra",type:"comparison",bestFor:["Anonymous comparison","All drivers"],quote:"https://www.thezebra.com/auto-insurance/"},
  {name:"Jerry",type:"comparison",bestFor:["Rate monitoring","Mobile-first"],quote:"https://jerry.ai/car-insurance"},
];
const STEPS = [
  {id:"location",title:"Where do you live?",icon:"📍",why:"Your location is the single biggest factor. Brampton Ontario averages $2,900/year while Ottawa averages $1,213 -- same car, same driver."},
  {id:"driver",title:"About you",icon:"👤",why:"Your age and experience can change your premium by 2-3x. We ask only what insurers actually use."},
  {id:"vehicle",title:"Your vehicle",icon:"🚗",why:"Make, model, year and value affects both your premium and which coverages you need."},
  {id:"history",title:"Driving history",icon:"📋",why:"One at-fault accident adds 20-40% to your premium for up to 6 years."},
  {id:"coverage",title:"Coverage needs",icon:"🛡️",why:"Most people are either underinsured or overpaying. We help you find the right balance."},
  {id:"lifestyle",title:"Discounts",icon:"💰",why:"These questions unlock discounts many drivers miss -- some save 10-25% each."},
  {id:"results",title:"Your results",icon:"📊",why:""},
];
function fmtC(n){return "$"+Math.round(n).toLocaleString();}
function calcPremium(p){
  const base=p.cityRate||(p.country==="CA"?(CA_BASE[p.province]||1500):(US_BASE[p.usState]||1800));
  let a=base;
  if(p.coverageLevel==="liability_only")a*=0.45;
  else if(p.coverageLevel==="standard")a*=0.75;
  const age=+p.age||35;
  if(age<18)a*=2.5;else if(age<=19)a*=2.2;else if(age<=21)a*=1.9;else if(age<=24)a*=1.6;else if(age<=29)a*=1.2;else if(age>74)a*=1.25;else if(age>64)a*=1.1;
  if(p.gender==="male"&&age<25)a*=1.15;
  if(p.maritalStatus==="married")a*=0.95;
  const yl=+p.yearsLicensed||5;
  if(yl<1)a*=1.5;else if(yl<2)a*=1.3;else if(yl<3)a*=1.15;
  const val=+p.vehicleValue||25000;
  if(val>80000)a*=1.35;else if(val>50000)a*=1.2;else if(val>35000)a*=1.1;else if(val<10000)a*=0.85;
  const vAge=new Date().getFullYear()-(+p.vehicleYear||new Date().getFullYear());
  if(vAge<=1)a*=1.1;else if(vAge>=15)a*=0.85;
  const model=(p.vehicleModel||"").toLowerCase();
  if(["civic","rav4","f-150","f150","ram","equinox","tucson","sorento"].some(m=>model.includes(m)))a*=1.12;
  if((p.vehicleMake||"").toLowerCase().includes("tesla"))a*=1.25;
  if(p.vehicleUse==="rideshare")a*=1.35;else if(p.vehicleUse==="business")a*=1.2;else if(p.vehicleUse==="commute_long")a*=1.1;
  const km=+p.annualKm||15000;
  if(km<8000)a*=0.88;else if(km>25000)a*=1.1;
  if(p.parkingType==="garage")a*=0.93;else if(p.parkingType==="high_theft_area")a*=1.15;else if(p.parkingType==="street")a*=1.07;
  a+=(+p.atFaultAccidents||0)*a*0.28;
  a+=(+p.tickets||0)*a*0.12;
  if(p.dui)a*=1.8;
  const lapse=+p.lapseMonths||0;
  if(lapse>12)a*=1.25;else if(lapse>6)a*=1.15;else if(lapse>0)a*=1.08;
  const ded=+p.deductible||1000;
  if(ded>=2000)a*=0.75;else if(ded>=1000)a*=0.87;else if(ded<=250)a*=1.1;
  let disc=0;
  if(p.winterTires&&p.country==="CA")disc+=0.08;
  if(p.bundleHome)disc+=0.15;
  if(p.telematics)disc+=0.12;
  if(p.multiVehicle)disc+=0.1;
  a*=(1-Math.min(disc,0.45));
  return{annual:Math.round(a),monthly:Math.round(a/12),discountPct:Math.round(disc*100)};
}
const EMPTY_PROFILE = {
  country:"CA",province:"ON",usState:"CA",city:"",cityRate:null,
  age:"",gender:"prefer_not",maritalStatus:"single",yearsLicensed:"",occupation:"other",newToCountry:false,
  vehicleYear:new Date().getFullYear(),vehicleMake:"",vehicleModel:"",vehicleValue:30000,
  vehicleUse:"personal",financed:false,leased:false,parkingType:"driveway",annualKm:15000,
  atFaultAccidents:0,notAtFaultAccidents:0,tickets:0,dui:false,lapseMonths:0,
  coverageLevel:"full",liabilityLimit:"1M",deductible:1000,
  accidentForgiveness:false,replacementCost:false,roadsideAssistance:false,
  winterTires:false,bundleHome:false,telematics:false,multiVehicle:false,
  studentDiscount:false,rideshare:false,military:false,
};
export default function InsuranceWizard(){
  const [step,setStep]=useState(0);
  const [lm,setLm]=useState(()=>localStorage.getItem("cig_theme")==="light");
  const [aiLoading,setAiLoading]=useState(false);
  const [aiReport,setAiReport]=useState("");
  const [copied,setCopied]=useState(false);
  const topRef=useRef(null);
  useEffect(()=>{localStorage.setItem("cig_theme",lm?"light":"dark");},[lm]);
  const [p,setP]=useState({...EMPTY_PROFILE});
  const upd=(k,v)=>setP(prev=>({...prev,[k]:v}));
  const premium=calcPremium(p);
  const insurers=p.country==="CA"?CA_INSURERS:US_INSURERS;
  const goNext=()=>{setStep(s=>Math.min(s+1,STEPS.length-1));topRef.current?.scrollIntoView({behavior:"smooth"});};
  const goPrev=()=>{setStep(s=>Math.max(s-1,0));topRef.current?.scrollIntoView({behavior:"smooth"});};
  const resetProfile=()=>{setStep(0);setAiReport("");setP({...EMPTY_PROFILE});};
  const generateAIReport=async()=>{
    setAiLoading(true);setAiReport("");
    try{
      const summary=`Driver: age ${p.age}, ${p.maritalStatus}, ${p.yearsLicensed} yrs licensed, ${p.country==="CA"?CA_PROVINCES_LIST.find(x=>x[0]===p.province)?.[1]:US_STATES_LIST.find(x=>x[0]===p.usState)?.[1]}. Vehicle: ${p.vehicleYear} ${p.vehicleMake} ${p.vehicleModel}, value ${fmtC(p.vehicleValue)}, ${p.financed?"financed":p.leased?"leased":"owned"}, use ${p.vehicleUse}, ${p.annualKm.toLocaleString()} km/yr, parking ${p.parkingType}. History: ${p.atFaultAccidents} at-fault, ${p.tickets} tickets, DUI ${p.dui}, lapse ${p.lapseMonths} months. Coverage: ${p.coverageLevel}, deductible ${fmtC(p.deductible)}. Discounts: winter tires ${p.winterTires}, bundle ${p.bundleHome}, telematics ${p.telematics}. Estimated: ${fmtC(premium.annual)}/yr.`;
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",max_tokens:1000,
          messages:[{role:"user",content:`You are a friendly car insurance expert for Canada and the US. Write a concise personalized insurance report in plain English for this driver. Include: 1) A 2-sentence risk profile summary. 2) Their 3 most important coverage recommendations. 3) Top 2 ways to lower their premium. 4) One key risk specific to their situation. 5) Recommended next step. Be specific, practical, no jargon, under 350 words, no markdown headers or bullet points.\n\n${summary}`}]
        })
      });
      const data=await res.json();
      setAiReport(data.content?.[0]?.text||"Unable to generate report. Please try again.");
    }catch(e){setAiReport("Unable to generate report right now. Your estimate and recommendations above are based on your profile.");}
    setAiLoading(false);
  };
  const progress=(step/(STEPS.length-1))*100;
  return(
    <div ref={topRef} style={{fontFamily:"'Outfit','Plus Jakarta Sans',system-ui,sans-serif",background:lm?"#f5f7fa":"#080c12",color:lm?"#111827":"#e8edf4",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input,select,button{font-family:'Outfit',system-ui}
        button{cursor:pointer;border:none;background:none;color:inherit}
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:${lm?"#fff":"#0e1420"}} ::-webkit-scrollbar-thumb{background:${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"};border-radius:2px}
        .fade{animation:fade 0.3s ease} @keyframes fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .opt{padding:10px 14px;border-radius:10px;font-size:14px;font-weight:600;border:1.5px solid ${lm?"rgba(220,38,38,0.1)":"rgba(239,68,68,0.1)"};background:transparent;color:${lm?"#4b5563":"#8899aa"};cursor:pointer;transition:all 0.15s;text-align:left;width:100%}
        .opt:hover{border-color:${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"};color:${lm?"#111827":"#e8edf4"};background:${lm?"rgba(220,38,38,0.07)":"rgba(248,113,113,0.1)"}}
        .opt.on{border-color:${lm?"#dc2626":"#f87171"};background:${lm?"rgba(220,38,38,0.07)":"rgba(248,113,113,0.1)"};color:${lm?"#dc2626":"#f87171"};font-weight:700}
        .sel{background:${lm?"#f0f3f8":"#141b28"};border:1.5px solid ${lm?"rgba(220,38,38,0.1)":"rgba(239,68,68,0.1)"};border-radius:10px;padding:10px 12px;color:${lm?"#111827":"#e8edf4"};font-size:14px;outline:none;width:100%}
        .inp{width:100%;background:${lm?"#f0f3f8":"#141b28"};border:1.5px solid ${lm?"rgba(220,38,38,0.1)":"rgba(239,68,68,0.1)"};border-radius:10px;padding:10px 14px;color:${lm?"#111827":"#e8edf4"};font-size:14px;outline:none}
        .ninp{width:100%;background:${lm?"#f0f3f8":"#141b28"};border:1.5px solid ${lm?"rgba(220,38,38,0.1)":"rgba(239,68,68,0.1)"};border-radius:10px;padding:10px 14px;color:${lm?"#111827":"#e8edf4"};font-size:15px;font-family:'Space Mono',monospace;outline:none}
        .rng{width:100%;accent-color:${lm?"#dc2626":"#f87171"};height:4px;cursor:pointer}
        .card{background:${lm?"#fff":"#0e1420"};border:1px solid ${lm?"rgba(220,38,38,0.08)":"rgba(239,68,68,0.08)"};border-radius:14px;padding:18px}
        .row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid ${lm?"rgba(220,38,38,0.08)":"rgba(239,68,68,0.08)"};font-size:13px}
        .row:last-child{border-bottom:none}
        .warn{padding:8px 12px;border-radius:8px;font-size:12px;line-height:1.6;margin-top:6px}
        .warn-red{background:rgba(239,68,68,0.06);color:${lm?"#dc2626":"#f87171"};border:1px solid rgba(239,68,68,0.2)}
        .warn-gold{background:rgba(245,158,11,0.08);color:${lm?"#b45309":"#fbbf24"}}
        .warn-green{background:rgba(22,163,74,0.08);color:${lm?"#16a34a":"#4ade80"}}
        .warn-blue{background:rgba(59,130,246,0.08);color:#60a5fa;border:1px solid rgba(59,130,246,0.2)}
        .chk{display:flex;gap:12px;padding:12px 14px;border-radius:12px;cursor:pointer;transition:all 0.15s;align-items:flex-start;margin-bottom:8px}
        .chk-off{background:${lm?"#fff":"#0e1420"};border:1.5px solid ${lm?"rgba(220,38,38,0.1)":"rgba(239,68,68,0.1)"}}
        .chk-on{background:${lm?"rgba(220,38,38,0.07)":"rgba(248,113,113,0.1)"};border:1.5px solid ${lm?"#dc2626":"#f87171"}}
        .chkbox{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;color:#fff;flex-shrink:0;margin-top:1px}
        .chkbox-off{background:${lm?"#f0f3f8":"#141b28"};border:1.5px solid ${lm?"rgba(220,38,38,0.1)":"rgba(239,68,68,0.1)"}}
        .chkbox-on{background:${lm?"#dc2626":"#f87171"}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{width:18px;height:18px;border:2px solid ${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"};border-top-color:${lm?"#dc2626":"#f87171"};border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
      `}</style>

      <header style={{background:lm?"#fff":"#0e1420",borderBottom:`1px solid ${lm?"rgba(220,38,38,0.1)":"rgba(239,68,68,0.1)"}`,position:"sticky",top:0,zIndex:50}}>
        <div style={{maxWidth:660,margin:"0 auto",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#dc2626,#991b1b)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🚗</div>
            <div>
              <div style={{fontSize:17,fontWeight:900,letterSpacing:"-0.5px"}}>Insurance<span style={{color:lm?"#dc2626":"#f87171"}}>Wizard</span></div>
              <div style={{fontSize:10,color:lm?"#4b5563":"#8899aa"}}>Personalized quote estimator</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {step>0&&step<STEPS.length-1&&p.age&&(
              <div style={{padding:"5px 12px",background:lm?"rgba(220,38,38,0.07)":"rgba(248,113,113,0.1)",border:`1px solid ${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"}`,borderRadius:20,fontSize:12,fontWeight:700,color:lm?"#dc2626":"#f87171",fontFamily:"'Space Mono',monospace"}}>
                Est. {fmtC(premium.monthly)}/mo
              </div>
            )}
            <button onClick={()=>setLm(v=>!v)} style={{padding:"6px 10px",borderRadius:8,border:`1px solid ${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"}`,background:"transparent",fontSize:15}}>{lm?"🌙":"☀️"}</button>
          </div>
        </div>
        <div style={{height:3,background:lm?"#f0f3f8":"#141b28"}}>
          <div style={{height:"100%",background:lm?"#dc2626":"#f87171",width:progress+"%",transition:"width 0.4s ease"}} />
        </div>
      </header>

      <div style={{maxWidth:660,margin:"0 auto",padding:"24px 16px 80px"}}>

        {step<STEPS.length-1&&(
          <div style={{display:"flex",gap:6,marginBottom:20,overflowX:"auto"}}>
            {STEPS.slice(0,-1).map((s,i)=>(
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:i<step?lm?"#16a34a":"#4ade80":i===step?lm?"#dc2626":"#f87171":lm?"#f0f3f8":"#141b28",border:`1.5px solid ${i<=step?(i<step?lm?"#16a34a":"#4ade80":lm?"#dc2626":"#f87171"):lm?"rgba(220,38,38,0.1)":"rgba(239,68,68,0.1)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:i<=step?"#fff":lm?"#9ca3af":"#445566"}}>
                  {i<step?"✓":i+1}
                </div>
                {i===step&&<span style={{fontSize:11,color:lm?"#dc2626":"#f87171",fontWeight:700}}>{s.title}</span>}
              </div>
            ))}
          </div>
        )}

        <div className="fade" key={step}>

          {step<STEPS.length-1&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:28,marginBottom:6}}>{STEPS[step].icon}</div>
              <h1 style={{fontSize:26,fontWeight:900,color:lm?"#111827":"#e8edf4",letterSpacing:"-0.5px",marginBottom:8}}>{STEPS[step].title}</h1>
              <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#60a5fa",lineHeight:1.6}}>
                {STEPS[step].why}
              </div>
            </div>
          )}

          {step===0&&(
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Country</div>
                <div style={{display:"flex",gap:8}}>
                  {[["CA","🇨🇦 Canada"],["US","🇺🇸 United States"]].map(([val,label])=>(
                    <button key={val} className={"opt"+(p.country===val?" on":"")} style={{flex:1,textAlign:"center"}} onClick={()=>upd("country",val)}>{label}</button>
                  ))}
                </div>
              </div>
              {p.country==="CA"?(
                <div>
                  <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Province</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {CA_PROVINCES_LIST.map(([code,name])=>(
                      <button key={code} className={"opt"+(p.province===code?" on":"")} style={{width:"auto",padding:"8px 14px",fontSize:13}} onClick={()=>upd("province",code)}>{name}</button>
                    ))}
                  </div>
                </div>
              ):(
                <div>
                  <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>State</div>
                  <select className="sel" value={p.usState} onChange={e=>upd("usState",e.target.value)}>
                    {US_STATES_LIST.map(([code,name])=><option key={code} value={code}>{name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>City <span style={{fontSize:11,color:lm?"#9ca3af":"#445566"}}>(optional - improves accuracy)</span></div>
                <input className="inp" placeholder={p.country==="CA"?"e.g. Toronto, Ottawa, Calgary...":"e.g. Austin, Miami, Seattle..."} value={p.city} onChange={e=>upd("city",e.target.value)} />
              </div>
              <div className="warn warn-blue">
                {p.country==="CA"&&["BC","MB","SK"].includes(p.province)
                  ?"Public insurance province -- basic coverage is set by the government. You can still shop for optional collision and comprehensive."
                  :"Private insurance market -- shopping around is essential. Rates vary up to 40% between insurers for the same driver."}
              </div>
            </div>
          )}

          {step===1&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Your age</div>
                <input className="ninp" type="number" min={16} max={99} placeholder="e.g. 35" value={p.age} onChange={e=>upd("age",e.target.value)} />
                {p.age&&+p.age<25&&<div className="warn warn-gold">Drivers under 25 pay 1.5-2.5x more. Telematics programs are your fastest path to savings.</div>}
                {p.age&&+p.age>=25&&+p.age<65&&<div className="warn warn-green">Prime age range for insurance rates</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Gender <span style={{fontSize:11,color:lm?"#9ca3af":"#445566"}}>(where used as a rating factor)</span></div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[["male","Male"],["female","Female"],["non_binary","Non-binary"],["prefer_not","Prefer not to say"]].map(([val,label])=>(
                    <button key={val} className={"opt"+(p.gender===val?" on":"")} style={{width:"auto"}} onClick={()=>upd("gender",val)}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Marital status</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[["single","Single"],["married","Married"],["common_law","Common-law"],["divorced","Divorced"],["widowed","Widowed"]].map(([val,label])=>(
                    <button key={val} className={"opt"+(p.maritalStatus===val?" on":"")} style={{width:"auto"}} onClick={()=>upd("maritalStatus",val)}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Years licensed (full license)</div>
                <input className="ninp" type="number" min={0} max={60} placeholder="e.g. 10" value={p.yearsLicensed} onChange={e=>upd("yearsLicensed",e.target.value)} />
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Occupation <span style={{fontSize:11,color:lm?"#9ca3af":"#445566"}}>(some qualify for discounts)</span></div>
                <select className="sel" value={p.occupation} onChange={e=>upd("occupation",e.target.value)}>
                  <option value="other">Other</option>
                  <option value="teacher">Teacher / Professor</option>
                  <option value="engineer">Engineer / Scientist</option>
                  <option value="nurse">Nurse / Healthcare worker</option>
                  <option value="doctor">Doctor</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="accountant">Accountant / Finance</option>
                  <option value="retired">Retired</option>
                  <option value="student">Student</option>
                  <option value="military">Military / Ex-military</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>New to {p.country==="CA"?"Canada":"the US"}?</div>
                <div style={{display:"flex",gap:8}}>
                  {[["true","Yes - I have international driving history"],["false","No - local driving history"]].map(([val,label])=>(
                    <button key={val} className={"opt"+(String(p.newToCountry)===val?" on":"")} style={{flex:1}} onClick={()=>upd("newToCountry",val==="true")}>{label}</button>
                  ))}
                </div>
                {p.newToCountry&&<div className="warn warn-blue">Bring your foreign driving record when getting quotes. Intact and Aviva in Canada have newcomer programs that recognize international experience.</div>}
              </div>
            </div>
          )}

          {step===2&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Year</div>
                  <select className="sel" value={p.vehicleYear} onChange={e=>upd("vehicleYear",+e.target.value)}>
                    {Array.from({length:30},(_,i)=>new Date().getFullYear()+1-i).map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Make</div>
                  <select className="sel" value={p.vehicleMake} onChange={e=>upd("vehicleMake",e.target.value)}>
                    <option value="">Select...</option>
                    {["Acura","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Ford","Genesis","GMC","Honda","Hyundai","Infiniti","Jeep","Kia","Land Rover","Lexus","Mazda","Mercedes-Benz","Mitsubishi","Nissan","Porsche","RAM","Subaru","Tesla","Toyota","Volkswagen","Volvo","Other"].map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Model</div>
                <input className="inp" placeholder="e.g. Civic, RAV4, F-150..." value={p.vehicleModel} onChange={e=>upd("vehicleModel",e.target.value)} />
                {p.vehicleModel&&["civic","rav4","f-150","f150","tucson","sorento"].some(m=>p.vehicleModel.toLowerCase().includes(m))&&(
                  <div className="warn warn-red">This vehicle is on Canada's top stolen vehicles list. Comprehensive coverage is essential.</div>
                )}
                {(p.vehicleMake||"").toLowerCase().includes("tesla")&&(
                  <div className="warn warn-gold">Tesla repairs average 3-4x higher than gas vehicles. Ensure coverage reflects replacement cost.</div>
                )}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Vehicle value <span style={{color:lm?"#dc2626":"#f87171",fontFamily:"'Space Mono',monospace",fontWeight:800}}>{fmtC(p.vehicleValue)}</span></div>
                <input type="range" className="rng" min={1000} max={200000} step={1000} value={p.vehicleValue} onChange={e=>upd("vehicleValue",+e.target.value)} />
                {p.vehicleValue<5000&&<div className="warn warn-gold">Under $5,000. Consider dropping collision and comprehensive -- it may cost more than the car is worth.</div>}
                {p.vehicleValue>60000&&<div className="warn warn-blue">High-value vehicle. Consider replacement cost coverage and a lower deductible.</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Ownership</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[["owned","Owned outright"],["financed","Financed (loan)"],["leased","Leased"]].map(([val,label])=>(
                    <button key={val} className={"opt"+((val==="financed"&&p.financed)||(val==="leased"&&p.leased)||(val==="owned"&&!p.financed&&!p.leased)?" on":"")} style={{width:"auto"}}
                      onClick={()=>{upd("financed",val==="financed");upd("leased",val==="leased");}}>
                      {label}
                    </button>
                  ))}
                </div>
                {(p.financed||p.leased)&&<div className="warn warn-red">Your lender requires collision and comprehensive. Mandatory for financed and leased vehicles.</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Primary use</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[["personal","Personal use -- errands, leisure, occasional commute"],["commute_short","Daily commute -- under 20km each way"],["commute_long","Daily commute -- over 20km each way"],["business","Business use -- client visits, deliveries"],["rideshare","Rideshare / delivery -- Uber, Lyft, DoorDash etc."]].map(([val,label])=>(
                    <button key={val} className={"opt"+(p.vehicleUse===val?" on":"")} onClick={()=>upd("vehicleUse",val)}>{label}</button>
                  ))}
                </div>
                {p.vehicleUse==="rideshare"&&<div className="warn warn-red">Your personal policy does NOT cover rideshare use. You need a rideshare endorsement. Without it you have zero coverage while waiting for rides.</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Annual km driven <span style={{color:lm?"#dc2626":"#f87171",fontFamily:"'Space Mono',monospace"}}>{p.annualKm.toLocaleString()}</span></div>
                <input type="range" className="rng" min={1000} max={50000} step={1000} value={p.annualKm} onChange={e=>upd("annualKm",+e.target.value)} />
                {p.annualKm<10000&&<div className="warn warn-green">Low mileage -- you qualify for low-mileage discounts</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Overnight parking</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[["garage","Private garage"],["driveway","Driveway"],["lot","Private lot"],["street","Street"],["high_theft_area","High-theft area"]].map(([val,label])=>(
                    <button key={val} className={"opt"+(p.parkingType===val?" on":"")} style={{width:"auto"}} onClick={()=>upd("parkingType",val)}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step===3&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>At-fault accidents in the last 6 years</div>
                <div style={{display:"flex",gap:8}}>
                  {[0,1,2,3,4].map(n=>(
                    <button key={n} className={"opt"+(p.atFaultAccidents===n?" on":"")} style={{flex:1,textAlign:"center"}} onClick={()=>upd("atFaultAccidents",n)}>{n===4?"4+":n}</button>
                  ))}
                </div>
                {p.atFaultAccidents>0&&<div className="warn warn-red">Each at-fault accident adds 20-40% for up to 6 years in most provinces.</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Traffic tickets in the last 3 years</div>
                <div style={{display:"flex",gap:8}}>
                  {[0,1,2,3].map(n=>(
                    <button key={n} className={"opt"+(p.tickets===n?" on":"")} style={{flex:1,textAlign:"center"}} onClick={()=>upd("tickets",n)}>{n===3?"3+":n}</button>
                  ))}
                </div>
                {p.tickets>0&&<div className="warn warn-gold">Each ticket typically adds 5-15% to your premium.</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>DUI / DWI conviction in last 10 years</div>
                <div style={{display:"flex",gap:8}}>
                  {[["false","No"],["true","Yes"]].map(([val,label])=>(
                    <button key={val} className={"opt"+(String(p.dui)===val?" on":"")} style={{flex:1,textAlign:"center"}} onClick={()=>upd("dui",val==="true")}>{label}</button>
                  ))}
                </div>
                {p.dui&&<div className="warn warn-red">A DUI typically results in 80-150% premium increase. Some standard insurers will not cover you.</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Months without insurance (lapse)</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {[["0","None"],["2","1-3 months"],["5","4-6 months"],["9","7-12 months"],["18","Over a year"]].map(([val,label])=>(
                    <button key={val} className={"opt"+(p.lapseMonths===+val?" on":"")} style={{width:"auto"}} onClick={()=>upd("lapseMonths",+val)}>{label}</button>
                  ))}
                </div>
                {p.lapseMonths>6&&<div className="warn warn-gold">A significant lapse is treated like a new driver. Get any coverage now to start rebuilding your history.</div>}
              </div>
            </div>
          )}

          {step===4&&(
            <div style={{display:"flex",flexDirection:"column",gap:18}}>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Coverage level</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {[["liability_only","Liability only","Legal minimum. Does NOT cover damage to your own vehicle. Not recommended if your car is worth more than $5,000 or is financed."],["standard","Standard coverage","Liability + collision + comprehensive. Covers your vehicle in most scenarios. Best for vehicles worth $10,000+."],["full","Full coverage","Everything in standard plus optional add-ons like accident forgiveness and replacement cost."]].map(([val,label,desc])=>(
                    <button key={val} className={"opt"+(p.coverageLevel===val?" on":"")} onClick={()=>upd("coverageLevel",val)} style={{textAlign:"left"}}>
                      <div style={{fontWeight:700}}>{label}</div>
                      <div style={{fontSize:12,marginTop:3,lineHeight:1.5,color:p.coverageLevel===val?"inherit":lm?"#9ca3af":"#445566"}}>{desc}</div>
                    </button>
                  ))}
                </div>
                {(p.financed||p.leased)&&p.coverageLevel==="liability_only"&&<div className="warn warn-red">Your lender requires collision and comprehensive. Liability only is not permitted on a financed vehicle.</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:4}}>Liability limit</div>
                <div style={{fontSize:12,color:lm?"#9ca3af":"#445566",marginBottom:8}}>Protects your assets if you cause a serious accident. The minimum is rarely enough.</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {p.country==="CA"
                    ?[["200K","$200K (min)"],["500K","$500K"],["1M","$1M (recommended)"],["2M","$2M (best)"]].map(([val,label])=>(
                      <button key={val} className={"opt"+(p.liabilityLimit===val?" on":"")} style={{width:"auto"}} onClick={()=>upd("liabilityLimit",val)}>{label}</button>
                    ))
                    :[["state_min","State min"],["50_100","50/100/50"],["100_300","100/300/100"],["250_500","250/500/250"]].map(([val,label])=>(
                      <button key={val} className={"opt"+(p.liabilityLimit===val?" on":"")} style={{width:"auto"}} onClick={()=>upd("liabilityLimit",val)}>{label}</button>
                    ))
                  }
                </div>
                {((p.country==="CA"&&p.liabilityLimit==="200K")||(p.country==="US"&&p.liabilityLimit==="state_min"))&&<div className="warn warn-red">Minimum liability is dangerously low. Upgrading to {p.country==="CA"?"$1M":"100/300/100"} costs only $5-15/month more.</div>}
              </div>
              <div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",fontWeight:600,marginBottom:8}}>Deductible <span style={{color:lm?"#dc2626":"#f87171",fontFamily:"'Space Mono',monospace"}}>{fmtC(p.deductible)}</span></div>
                <input type="range" className="rng" min={250} max={5000} step={250} value={p.deductible} onChange={e=>upd("deductible",+e.target.value)} />
                <div style={{fontSize:12,color:lm?"#4b5563":"#8899aa",marginTop:4}}>
                  {p.deductible>=2000?"High deductible saves ~25%. Choose only if you have strong emergency savings.":p.deductible>=1000?"Good balance of savings and manageable out-of-pocket cost.":"Consider raising to $1,000+ to reduce your premium."}
                </div>
              </div>
            </div>
          )}

          {step===5&&(
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",marginBottom:12}}>Check all that apply. These unlock significant discounts many drivers miss.</div>
              {([
                ...(p.country==="CA"?[["winterTires",p.winterTires,"❄️ Winter tires installed","5-10% discount. Required in BC Oct 1-Mar 31 on many routes."]]:[] ),
                ["bundleHome",p.bundleHome,"🏠 You own or rent a home","Bundling home and auto saves 15-20%."],
                ["telematics",p.telematics,"📱 Willing to use a safe driving app","Saves 10-25%. Biggest single discount for most drivers."],
                ["multiVehicle",p.multiVehicle,"🚗 2+ vehicles in household","Multi-vehicle discount: 10-15% off each vehicle."],
                ...(+p.age<25?[["studentDiscount",p.studentDiscount,"🎓 Full-time student with B+ average","Good student discount: 5-15%."]]:[] ),
                ...(p.country==="US"?[["military",p.military,"🎖️ Current or former military","USAA offers best rates for military families."]]:[] ),
              ]).map(([key,val,label,desc])=>(
                <div key={key} className={"chk "+(val?"chk-on":"chk-off")} onClick={()=>upd(key,!val)}>
                  <div className={"chkbox "+(val?"chkbox-on":"chkbox-off")}>{val?"✓":""}</div>
                  <div>
                    <div style={{fontSize:15,fontWeight:600,color:lm?"#111827":"#e8edf4"}}>{label}</div>
                    <div style={{fontSize:12,color:lm?"#4b5563":"#8899aa",marginTop:3,lineHeight:1.5}}>{desc}</div>
                  </div>
                </div>
              ))}
              {premium.discountPct>0&&<div className="warn warn-green" style={{marginTop:8}}>{premium.discountPct}% in discounts active</div>}
            </div>
          )}

          {step===6&&(
            <div>
              <div style={{fontSize:24,fontWeight:900,color:lm?"#111827":"#e8edf4",letterSpacing:"-0.5px",marginBottom:4}}>📊 Your Personalized Report</div>
              <p style={{fontSize:14,color:lm?"#4b5563":"#8899aa",marginBottom:20}}>Based on everything you told us. Use this to guide your conversations with insurers.</p>

              <div style={{padding:22,background:lm?"linear-gradient(135deg,#fef2f2,#fff)":"linear-gradient(135deg,#1a0a0a,#0e1420)",border:`1px solid ${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"}`,borderRadius:16,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:lm?"#4b5563":"#8899aa",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Estimated annual premium</div>
                <div style={{fontSize:52,fontWeight:900,color:lm?"#dc2626":"#f87171",fontFamily:"'Space Mono',monospace",letterSpacing:"-1px",lineHeight:1}}>{fmtC(premium.annual)}</div>
                <div style={{fontSize:14,color:lm?"#4b5563":"#8899aa",marginTop:6}}>{fmtC(premium.monthly)}/month</div>
                {premium.discountPct>0&&<div style={{marginTop:8,fontSize:13,color:lm?"#16a34a":"#4ade80"}}>{premium.discountPct}% in active discounts applied</div>}
                <div style={{marginTop:14,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    ["Location",p.country==="CA"?(p.city?p.city+", ":"")+CA_PROVINCES_LIST.find(x=>x[0]===p.province)?.[1]:(p.city?p.city+", ":"")+US_STATES_LIST.find(x=>x[0]===p.usState)?.[1]],
                    ["Vehicle",([p.vehicleYear,p.vehicleMake,p.vehicleModel].filter(Boolean).join(" "))||"Not specified"],
                    ["Coverage",p.coverageLevel==="full"?"Full coverage":p.coverageLevel==="standard"?"Standard":"Liability only"],
                    ["Deductible",fmtC(p.deductible)],
                  ].map(([label,val])=>(
                    <div key={label} style={{background:lm?"#f0f3f8":"#141b28",borderRadius:8,padding:"8px 12px"}}>
                      <div style={{fontSize:10,color:lm?"#9ca3af":"#445566",marginBottom:2}}>{label}</div>
                      <div style={{fontSize:13,fontWeight:600,color:lm?"#111827":"#e8edf4"}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {[
                p.vehicleUse==="rideshare"&&"Your personal policy does NOT cover rideshare use. Ask every insurer specifically about a rideshare endorsement.",
                (p.financed||p.leased)&&p.coverageLevel==="liability_only"&&"Your lender requires collision and comprehensive. Liability only will not satisfy your loan agreement.",
                ((p.country==="CA"&&p.liabilityLimit==="200K")||(p.country==="US"&&p.liabilityLimit==="state_min"))&&("Your liability limit is the legal minimum and dangerously low. Upgrading to "+(p.country==="CA"?"$1M":"100/300/100")+" costs only $5-15/month more."),
                p.vehicleValue<5000&&p.coverageLevel==="full"&&("Your vehicle is worth "+fmtC(p.vehicleValue)+". Consider dropping collision and comprehensive."),
              ].filter(Boolean).map((w,i)=>(
                <div key={i} className="warn warn-red" style={{marginBottom:8}}>Warning: {w}</div>
              ))}

              <div style={{marginBottom:14,padding:18,background:lm?"#fff":"#0e1420",border:`1px solid ${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"}`,borderRadius:14}}>
                <div style={{fontSize:15,fontWeight:800,color:lm?"#111827":"#e8edf4",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                  AI Insurance Analysis
                  <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"rgba(220,38,38,0.1)",color:lm?"#dc2626":"#f87171",fontWeight:700}}>Powered by Claude</span>
                </div>
                {!aiReport&&!aiLoading&&(
                  <div>
                    <p style={{fontSize:13,color:lm?"#4b5563":"#8899aa",marginBottom:12,lineHeight:1.65}}>Get a plain-English analysis of your risk profile, personalized coverage advice, and exact next steps.</p>
                    <button onClick={generateAIReport} style={{padding:"11px 22px",background:lm?"#dc2626":"#f87171",color:"#fff",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>
                      Generate my personalized report
                    </button>
                  </div>
                )}
                {aiLoading&&(
                  <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0",color:lm?"#4b5563":"#8899aa",fontSize:13}}>
                    <div className="spin" />
                    Analyzing your profile...
                  </div>
                )}
                {aiReport&&(
                  <div>
                    <div style={{fontSize:13,color:lm?"#4b5563":"#8899aa",lineHeight:1.85,whiteSpace:"pre-wrap"}}>{aiReport}</div>
                    <button onClick={()=>{navigator.clipboard.writeText(aiReport);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
                      style={{marginTop:12,padding:"7px 16px",borderRadius:8,border:`1px solid ${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"}`,background:"transparent",color:lm?"#4b5563":"#8899aa",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                      {copied?"Copied!":"Copy report"}
                    </button>
                  </div>
                )}
              </div>

              <div style={{marginBottom:14}}>
                <div style={{fontSize:15,fontWeight:800,color:lm?"#111827":"#e8edf4",marginBottom:12}}>Best insurers for your profile</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {insurers.map(ins=>(
                    <a key={ins.name} href={ins.quote} target="_blank" rel="noopener noreferrer sponsored"
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"14px 16px",background:lm?"#fff":"#0e1420",border:`1px solid ${lm?"rgba(220,38,38,0.08)":"rgba(239,68,68,0.08)"}`,borderRadius:12,textDecoration:"none"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor=lm?"#dc2626":"#f87171"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor=lm?"rgba(220,38,38,0.08)":"rgba(239,68,68,0.08)"}>
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                          <span style={{fontSize:14,fontWeight:700,color:lm?"#111827":"#e8edf4"}}>{ins.name}</span>
                          <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:ins.type==="comparison"?"rgba(59,130,246,0.1)":"rgba(220,38,38,0.1)",color:ins.type==="comparison"?"#60a5fa":lm?"#dc2626":"#f87171",fontWeight:700}}>
                            {ins.type==="comparison"?"Compare":ins.type==="online"?"Online":"Major"}
                          </span>
                        </div>
                        <div style={{fontSize:12,color:lm?"#4b5563":"#8899aa"}}>{ins.bestFor.slice(0,2).join("  |  ")}</div>
                      </div>
                      <div style={{color:lm?"#dc2626":"#f87171",fontSize:13,fontWeight:700,flexShrink:0}}>Get quote</div>
                    </a>
                  ))}
                </div>
                <div style={{fontSize:11,color:lm?"#9ca3af":"#445566",marginTop:8}}>Affiliate links -- we may earn a commission at no cost to you. Always compare at least 3 quotes.</div>
              </div>

              <button onClick={resetProfile} style={{padding:"10px 22px",borderRadius:10,border:`1px solid ${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"}`,background:"transparent",color:lm?"#4b5563":"#8899aa",fontSize:14,fontWeight:600,cursor:"pointer"}}>
                Start over with a new profile
              </button>
            </div>
          )}

          {step<STEPS.length-1&&(
            <div style={{display:"flex",justifyContent:"space-between",marginTop:28,gap:10}}>
              {step>0
                ?<button onClick={goPrev} style={{padding:"12px 24px",borderRadius:10,border:`1px solid ${lm?"rgba(220,38,38,0.2)":"rgba(239,68,68,0.2)"}`,background:"transparent",color:lm?"#4b5563":"#8899aa",fontSize:15,fontWeight:600}}>Back</button>
                :<div/>
              }
              <button onClick={goNext} style={{padding:"13px 32px",borderRadius:10,background:lm?"#dc2626":"#f87171",color:"#fff",fontSize:15,fontWeight:800,flex:step===0?1:"none",maxWidth:300}}>
                {step===STEPS.length-2?"See my results":"Next"}
              </button>
            </div>
          )}

        </div>

        <div style={{marginTop:32,paddingTop:16,borderTop:`1px solid ${lm?"rgba(220,38,38,0.08)":"rgba(239,68,68,0.08)"}`,fontSize:11,color:lm?"#9ca3af":"#445566",lineHeight:1.7,textAlign:"center"}}>
          Premium estimates are approximate. Actual rates depend on your address, vehicle details, and insurer criteria. Always get quotes from licensed professionals. Some links are affiliate links.
        </div>

      </div>
    </div>
    </div>
  );
}
