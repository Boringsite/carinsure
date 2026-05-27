import { useState } from "react";

const CA_BASE={ON:1920,BC:1450,AB:1735,QC:900,MB:1350,SK:1235,NS:1150,NB:1120,NL:1270,PE:1080,NT:1200,NU:1200,YT:1200};
const US_BASE={CA:2450,TX:2310,FL:3183,NY:2994,IL:1566,PA:1478,OH:1034,GA:2359,NC:1392,WA:1701,AZ:2026,CO:2568,MI:2864,WI:1087,NV:2100,NJ:2800,MA:2000,MD:1900,TN:1600,VA:1400,MO:1300,IN:1200,KY:1500,SC:1400,AL:1400,MN:1400};
const CA_PROVS=[["ON","Ontario"],["BC","British Columbia"],["AB","Alberta"],["QC","Quebec"],["MB","Manitoba"],["SK","Saskatchewan"],["NS","Nova Scotia"],["NB","New Brunswick"],["NL","Newfoundland"],["PE","PEI"]];
const US_STATES_L=[["CA","California"],["TX","Texas"],["FL","Florida"],["NY","New York"],["IL","Illinois"],["PA","Pennsylvania"],["OH","Ohio"],["GA","Georgia"],["NC","North Carolina"],["WA","Washington"],["AZ","Arizona"],["CO","Colorado"],["MI","Michigan"],["WI","Wisconsin"],["NV","Nevada"],["NJ","New Jersey"],["MA","Massachusetts"],["MD","Maryland"],["TN","Tennessee"],["VA","Virginia"]];
const STEPS=["Location","About you","Your vehicle","Driving history","Coverage","Discounts","Results"];

function calcPremium(p) {
  const base = p.country === "CA" ? (CA_BASE[p.province] || 1500) : (US_BASE[p.usState] || 1800);
  let a = base;
  if (p.coverage === "liability_only") a *= 0.45;
  else if (p.coverage === "standard") a *= 0.75;
  const age = +p.age || 35;
  if (age < 18) a *= 2.5;
  else if (age <= 21) a *= 2.0;
  else if (age <= 24) a *= 1.6;
  else if (age <= 29) a *= 1.2;
  else if (age > 74) a *= 1.25;
  else if (age > 64) a *= 1.1;
  if (p.marital === "married") a *= 0.95;
  const yl = +p.yearsLic || 5;
  if (yl < 1) a *= 1.5;
  else if (yl < 3) a *= 1.2;
  const val = +p.vValue || 25000;
  if (val > 80000) a *= 1.35;
  else if (val > 50000) a *= 1.2;
  else if (val > 35000) a *= 1.1;
  else if (val < 10000) a *= 0.85;
  const m = (p.vModel || "").toLowerCase();
  if (["civic","rav4","f-150","f150","ram","tucson","sorento"].some(x => m.includes(x))) a *= 1.12;
  if ((p.vMake || "").toLowerCase().includes("tesla")) a *= 1.25;
  if (p.vUse === "rideshare") a *= 1.35;
  else if (p.vUse === "business") a *= 1.2;
  else if (p.vUse === "commute_long") a *= 1.1;
  const km = +p.km || 15000;
  if (km < 8000) a *= 0.88;
  else if (km > 25000) a *= 1.1;
  if (p.parking === "garage") a *= 0.93;
  else if (p.parking === "high_theft") a *= 1.15;
  a += (+p.atFault || 0) * a * 0.28;
  a += (+p.tickets || 0) * a * 0.12;
  if (p.dui) a *= 1.8;
  const lapse = +p.lapse || 0;
  if (lapse > 12) a *= 1.25;
  else if (lapse > 6) a *= 1.15;
  const ded = +p.ded || 1000;
  if (ded >= 2000) a *= 0.75;
  else if (ded >= 1000) a *= 0.87;
  else if (ded <= 250) a *= 1.1;
  let disc = 0;
  if (p.winterTires && p.country === "CA") disc += 0.08;
  if (p.bundle) disc += 0.15;
  if (p.telematics) disc += 0.12;
  if (p.multi) disc += 0.1;
  a *= (1 - Math.min(disc, 0.45));
  return { annual: Math.round(a), monthly: Math.round(a / 12), disc: Math.round(disc * 100) };
}

const INIT = {
  country:"CA", province:"ON", usState:"CA", city:"",
  age:"", marital:"single", yearsLic:"", newToCountry:false,
  vYear:new Date().getFullYear(), vMake:"", vModel:"", vValue:30000,
  vUse:"personal", financed:false, leased:false, parking:"driveway", km:15000,
  atFault:0, tickets:0, dui:false, lapse:0,
  coverage:"full", liability:"1M", ded:1000,
  winterTires:false, bundle:false, telematics:false, multi:false, student:false, military:false,
};

function C(props) {
  const s = { display:"block", width:"100%", padding:"10px 14px", borderRadius:10, fontSize:14,
    border: props.on ? "2px solid #dc2626" : "1px solid #d1d5db",
    background: props.on ? "#fef2f2" : "transparent",
    color: props.on ? "#dc2626" : "#374151",
    cursor:"pointer", textAlign:"left", marginBottom:6, fontFamily:"inherit" };
  return <button style={s} onClick={props.onClick}>{props.children}</button>;
}

function W({ type, children }) {
  const colors = { r:["#fef2f2","#dc2626"], g:["#f0fdf4","#16a34a"], a:["#fffbeb","#d97706"], b:["#eff6ff","#2563eb"] };
  const [bg, fg] = colors[type] || colors.b;
  return <div style={{ background:bg, color:fg, padding:"8px 12px", borderRadius:8, fontSize:12, lineHeight:1.6, marginTop:6 }}>{children}</div>;
}

function fmtC(n) { return "$" + Math.round(n).toLocaleString(); }

export default function InsuranceWizard() {
  const [step, setStep] = useState(0);
  const [p, setP] = useState({...INIT});
  const upd = (k, v) => setP(prev => ({ ...prev, [k]: v }));
  const pr = calcPremium(p);
  const progress = (step / (STEPS.length - 1)) * 100;
  const vModelLower = (p.vModel || "").toLowerCase();
  const vMakeLower = (p.vMake || "").toLowerCase();
  const isHighTheft = vModelLower.indexOf("civic")>-1 || vModelLower.indexOf("rav4")>-1 || vModelLower.indexOf("f-150")>-1 || vModelLower.indexOf("f150")>-1 || vModelLower.indexOf("tucson")>-1 || vModelLower.indexOf("sorento")>-1 || vModelLower.indexOf("ram")>-1;
  const isTesla = vMakeLower.indexOf("tesla") > -1;

  const provName = p.country === "CA"
    ? (CA_PROVS.find(x => x[0] === p.province) || ["",""])[1]
    : (US_STATES_L.find(x => x[0] === p.usState) || ["",""])[1];

  return (
    <div style={{ fontFamily:"'Outfit',system-ui,sans-serif", background:"#f9fafb", minHeight:"100vh" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap'); *{box-sizing:border-box}`}</style>

      <div style={{ background:"white", borderBottom:"1px solid #e5e7eb", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:640, margin:"0 auto", padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:18, fontWeight:700 }}>Insurance<span style={{ color:"#dc2626" }}>Wizard</span></div>
          {step > 0 && step < STEPS.length - 1 && p.age && (
            <div style={{ padding:"4px 12px", background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:20, fontSize:13, fontWeight:600, color:"#dc2626" }}>
              Est. {fmtC(pr.monthly)}/mo
            </div>
          )}
        </div>
        <div style={{ height:3, background:"#f3f4f6" }}>
          <div style={{ height:"100%", background:"#dc2626", width:progress+"%", transition:"width 0.4s" }} />
        </div>
      </div>

      <div style={{ maxWidth:640, margin:"0 auto", padding:"24px 16px 80px" }}>

        <div style={{ display:"flex", gap:6, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
          {STEPS.slice(0,-1).map((s,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
              <div style={{ width:24, height:24, borderRadius:"50%",
                background: i < step ? "#16a34a" : i === step ? "#dc2626" : "#e5e7eb",
                color: i <= step ? "white" : "#6b7280",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:11, fontWeight:700 }}>
                {i < step ? "v" : i + 1}
              </div>
              {i === step && <span style={{ fontSize:12, color:"#dc2626", fontWeight:600 }}>{s}</span>}
            </div>
          ))}
        </div>

        <div key={step}>

          {step === 0 && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, marginBottom:8 }}>Where do you live?</h1>
              <W type="b">Your city matters enormously. Brampton Ontario averages $2,900/year while Ottawa averages $1,213 -- same car, same driver.</W>
              <div style={{ marginTop:16, marginBottom:4, fontSize:13, color:"#6b7280", fontWeight:600 }}>Country</div>
              <div style={{ display:"flex", gap:8, marginBottom:12 }}>
                {[["CA","Canada"],["US","United States"]].map(([v,l]) => (
                  <C key={v} on={p.country===v} onClick={() => upd("country",v)}>{l}</C>
                ))}
              </div>
              {p.country === "CA" ? (
                <div>
                  <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6 }}>Province</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                    {CA_PROVS.map(([code,name]) => (
                      <button key={code} onClick={() => upd("province",code)}
                        style={{ padding:"7px 12px", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                          border: p.province===code ? "2px solid #dc2626" : "1px solid #d1d5db",
                          background: p.province===code ? "#fef2f2" : "transparent",
                          color: p.province===code ? "#dc2626" : "#374151" }}>
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6 }}>State</div>
                  <select value={p.usState} onChange={e => upd("usState",e.target.value)}
                    style={{ width:"100%", padding:"9px 10px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14, marginBottom:12, fontFamily:"inherit", background:"white" }}>
                    {US_STATES_L.map(([c,n]) => <option key={c} value={c}>{n}</option>)}
                  </select>
                </div>
              )}
              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6 }}>City (optional)</div>
              <input value={p.city} onChange={e => upd("city",e.target.value)}
                placeholder={p.country==="CA" ? "e.g. Toronto, Ottawa..." : "e.g. Austin, Miami..."}
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14, fontFamily:"inherit" }} />
              <W type="b">
                {(p.country==="CA" && (p.province==="BC"||p.province==="MB"||p.province==="SK"))
                  ? "Public insurance province -- you cannot shop around for basic coverage, but can for optional collision and comprehensive."
                  : "Private insurance market -- shopping around is essential. Rates vary up to 40% between insurers for identical coverage."}
              </W>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>About you</h1>
              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6 }}>Your age</div>
              <input type="number" min={16} max={99} value={p.age} onChange={e => upd("age",e.target.value)}
                placeholder="e.g. 35"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #d1d5db", fontSize:15, fontFamily:"'Courier New',monospace", marginBottom:4 }} />
              {p.age && +p.age < 25 && <W type="a">Drivers under 25 pay 1.5-2.5x more. A telematics app is your fastest way to save.</W>}
              {p.age && +p.age >= 25 && +p.age < 65 && <W type="g">Prime age range -- great rates for you.</W>}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:14 }}>Marital status</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[["single","Single"],["married","Married"],["common_law","Common-law"],["divorced","Divorced"]].map(([v,l]) => (
                  <button key={v} onClick={() => upd("marital",v)}
                    style={{ padding:"8px 14px", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                      border: p.marital===v ? "2px solid #dc2626" : "1px solid #d1d5db",
                      background: p.marital===v ? "#fef2f2" : "transparent",
                      color: p.marital===v ? "#dc2626" : "#374151" }}>
                    {l}
                  </button>
                ))}
              </div>

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:14 }}>Years licensed</div>
              <input type="number" min={0} max={60} value={p.yearsLic} onChange={e => upd("yearsLic",e.target.value)}
                placeholder="e.g. 10"
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #d1d5db", fontSize:15, fontFamily:"'Courier New',monospace" }} />

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:14 }}>New to {p.country==="CA"?"Canada":"the US"}?</div>
              <div style={{ display:"flex", gap:8 }}>
                {[["false","No"],["true","Yes - I have international driving history"]].map(([v,l]) => (
                  <C key={v} on={String(p.newToCountry)===v} onClick={() => upd("newToCountry",v==="true")}>{l}</C>
                ))}
              </div>
              {p.newToCountry && <W type="b">Bring your foreign driving record when getting quotes. Intact and Aviva in Canada have newcomer programs that recognize international experience.</W>}
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>Your vehicle</h1>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6 }}>Year</div>
                  <select value={p.vYear} onChange={e => upd("vYear",+e.target.value)}
                    style={{ width:"100%", padding:"9px 10px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14, fontFamily:"inherit", background:"white" }}>
                    {Array.from({length:25},(_,i) => new Date().getFullYear()+1-i).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6 }}>Make</div>
                  <select value={p.vMake} onChange={e => upd("vMake",e.target.value)}
                    style={{ width:"100%", padding:"9px 10px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14, fontFamily:"inherit", background:"white" }}>
                    {["","Acura","Audi","BMW","Chevrolet","Dodge","Ford","GMC","Honda","Hyundai","Jeep","Kia","Mazda","Mercedes-Benz","Nissan","RAM","Subaru","Tesla","Toyota","Volkswagen","Other"].map(m => <option key={m} value={m}>{m||"Select..."}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:12 }}>Model</div>
              <input value={p.vModel} onChange={e => upd("vModel",e.target.value)}
                placeholder="e.g. Civic, RAV4, F-150..."
                style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"1px solid #d1d5db", fontSize:14, fontFamily:"inherit" }} />
              {p.vModel && isHighTheft && (
                <W type="r">This vehicle is on Canada's top stolen list. Comprehensive coverage is essential.</W>
              )}
              {isTesla && (
                <W type="a">Tesla repairs average 3-4x higher. Ensure your coverage reflects replacement cost.</W>
              )}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:12 }}>
                Vehicle value: <span style={{ color:"#dc2626", fontWeight:700 }}>{fmtC(p.vValue)}</span>
              </div>
              <input type="range" min={1000} max={200000} step={1000} value={p.vValue} onChange={e => upd("vValue",+e.target.value)} style={{ width:"100%", accentColor:"#dc2626" }} />
              {p.vValue < 5000 && <W type="a">Under $5,000 -- dropping collision and comprehensive may save more than the car is worth.</W>}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:12 }}>Ownership</div>
              <div style={{ display:"flex", gap:8 }}>
                {[["owned","Owned"],["financed","Financed"],["leased","Leased"]].map(([v,l]) => (
                  <button key={v} onClick={() => { upd("financed",v==="financed"); upd("leased",v==="leased"); }}
                    style={{ flex:1, padding:"9px", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                      border: ((v==="financed"&&p.financed)||(v==="leased"&&p.leased)||(v==="owned"&&!p.financed&&!p.leased)) ? "2px solid #dc2626" : "1px solid #d1d5db",
                      background: ((v==="financed"&&p.financed)||(v==="leased"&&p.leased)||(v==="owned"&&!p.financed&&!p.leased)) ? "#fef2f2" : "transparent",
                      color: ((v==="financed"&&p.financed)||(v==="leased"&&p.leased)||(v==="owned"&&!p.financed&&!p.leased)) ? "#dc2626" : "#374151" }}>
                    {l}
                  </button>
                ))}
              </div>
              {(p.financed||p.leased) && <W type="r">Your lender requires collision and comprehensive. Not optional.</W>}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:12 }}>Primary use</div>
              {[["personal","Personal use"],["commute_short","Daily commute under 20km"],["commute_long","Daily commute over 20km"],["business","Business use"],["rideshare","Rideshare or delivery (Uber, DoorDash...)"]].map(([v,l]) => (
                <C key={v} on={p.vUse===v} onClick={() => upd("vUse",v)}>{l}</C>
              ))}
              {p.vUse === "rideshare" && <W type="r">Your personal policy does NOT cover rideshare use. You need a rideshare endorsement -- without it you have zero coverage while waiting for rides.</W>}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:12 }}>
                Annual km driven: <span style={{ color:"#dc2626", fontWeight:700 }}>{(+p.km).toLocaleString()}</span>
              </div>
              <input type="range" min={1000} max={50000} step={1000} value={p.km} onChange={e => upd("km",+e.target.value)} style={{ width:"100%", accentColor:"#dc2626" }} />
              {p.km < 10000 && <W type="g">Low mileage qualifies for discounts with most insurers.</W>}
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>Driving history</h1>

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6 }}>At-fault accidents (last 6 years)</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                {[0,1,2,3,4].map(n => (
                  <button key={n} onClick={() => upd("atFault",n)}
                    style={{ flex:1, padding:"9px", borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit", textAlign:"center",
                      border: p.atFault===n ? "2px solid #dc2626" : "1px solid #d1d5db",
                      background: p.atFault===n ? "#fef2f2" : "transparent",
                      color: p.atFault===n ? "#dc2626" : "#374151" }}>
                    {n===4?"4+":n}
                  </button>
                ))}
              </div>
              {p.atFault > 0 && <W type="r">Each at-fault accident adds 20-40% for up to 6 years.</W>}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:14 }}>Traffic tickets (last 3 years)</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                {[0,1,2,3].map(n => (
                  <button key={n} onClick={() => upd("tickets",n)}
                    style={{ flex:1, padding:"9px", borderRadius:8, fontSize:14, cursor:"pointer", fontFamily:"inherit", textAlign:"center",
                      border: p.tickets===n ? "2px solid #dc2626" : "1px solid #d1d5db",
                      background: p.tickets===n ? "#fef2f2" : "transparent",
                      color: p.tickets===n ? "#dc2626" : "#374151" }}>
                    {n===3?"3+":n}
                  </button>
                ))}
              </div>

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:14 }}>DUI or DWI in last 10 years</div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                {[["false","No"],["true","Yes"]].map(([v,l]) => (
                  <C key={v} on={String(p.dui)===v} onClick={() => upd("dui",v==="true")}>{l}</C>
                ))}
              </div>
              {p.dui && <W type="r">A DUI typically results in 80-150% premium increase. Some standard insurers will not cover you.</W>}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:14 }}>Coverage lapse</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[["0","None"],["2","1-3 months"],["5","4-6 months"],["9","7-12 months"],["18","Over 1 year"]].map(([v,l]) => (
                  <button key={v} onClick={() => upd("lapse",+v)}
                    style={{ padding:"8px 12px", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                      border: p.lapse===+v ? "2px solid #dc2626" : "1px solid #d1d5db",
                      background: p.lapse===+v ? "#fef2f2" : "transparent",
                      color: p.lapse===+v ? "#dc2626" : "#374151" }}>
                    {l}
                  </button>
                ))}
              </div>
              {p.lapse > 6 && <W type="a">A significant lapse is treated like a new driver. Get any coverage now to start rebuilding.</W>}
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>Coverage needs</h1>

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6 }}>Coverage level</div>
              {[["liability_only","Liability only","Legal minimum. Does NOT cover damage to your own vehicle."],["standard","Standard coverage","Liability plus collision and comprehensive."],["full","Full coverage","Everything plus optional add-ons."]].map(([v,l,d]) => (
                <button key={v} onClick={() => upd("coverage",v)}
                  style={{ display:"block", width:"100%", padding:"12px 14px", borderRadius:10, fontSize:14, cursor:"pointer", textAlign:"left", marginBottom:8, fontFamily:"inherit",
                    border: p.coverage===v ? "2px solid #dc2626" : "1px solid #d1d5db",
                    background: p.coverage===v ? "#fef2f2" : "transparent",
                    color: p.coverage===v ? "#dc2626" : "#374151" }}>
                  <div style={{ fontWeight:600 }}>{l}</div>
                  <div style={{ fontSize:12, marginTop:3, opacity:0.7 }}>{d}</div>
                </button>
              ))}
              {(p.financed||p.leased) && p.coverage==="liability_only" && <W type="r">Your lender requires collision and comprehensive. Liability only will not satisfy your loan.</W>}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:14 }}>Liability limit</div>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {(p.country==="CA"
                  ? [["200K","$200K"],["500K","$500K"],["1M","$1M"],["2M","$2M"]]
                  : [["state_min","State min"],["50_100","50/100"],["100_300","100/300"],["250_500","250/500"]]
                ).map(([v,l]) => (
                  <button key={v} onClick={() => upd("liability",v)}
                    style={{ padding:"8px 14px", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"inherit",
                      border: p.liability===v ? "2px solid #dc2626" : "1px solid #d1d5db",
                      background: p.liability===v ? "#fef2f2" : "transparent",
                      color: p.liability===v ? "#dc2626" : "#374151" }}>
                    {l}
                  </button>
                ))}
              </div>
              {((p.country==="CA"&&p.liability==="200K")||(p.country==="US"&&p.liability==="state_min")) && (
                <W type="r">Minimum is dangerously low. Upgrading to {p.country==="CA"?"$1M":"100/300"} costs only $5-15/month more.</W>
              )}

              <div style={{ fontSize:13, color:"#6b7280", fontWeight:600, marginBottom:6, marginTop:14 }}>
                Deductible: <span style={{ color:"#dc2626", fontWeight:700 }}>{fmtC(p.ded)}</span>
              </div>
              <input type="range" min={250} max={5000} step={250} value={p.ded} onChange={e => upd("ded",+e.target.value)} style={{ width:"100%", accentColor:"#dc2626" }} />
              <div style={{ fontSize:12, color:"#6b7280", marginTop:4 }}>
                {p.ded >= 2000 ? "High deductible saves ~25%. Only if you have emergency savings." : p.ded >= 1000 ? "Good balance of savings and manageable cost." : "Consider raising to $1,000+ to lower your premium."}
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, marginBottom:8 }}>Discounts</h1>
              <p style={{ fontSize:14, color:"#6b7280", marginBottom:16 }}>Check all that apply. Each one can save 5-20%.</p>

              {[["bundle",p.bundle,"Own or rent a home (bundle home + auto)","Bundling saves 15-20%."],["telematics",p.telematics,"Use a safe driving app","Saves 10-25% -- biggest discount for most drivers."],["multi",p.multi,"2 or more vehicles in household","Multi-vehicle discount: 10-15%."]].map(([k,v,l,d]) => (
                <div key={k} onClick={() => upd(k,!v)}
                  style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"11px 14px", borderRadius:10, cursor:"pointer", marginBottom:6,
                    border: v ? "2px solid #dc2626" : "1px solid #d1d5db",
                    background: v ? "#fef2f2" : "white" }}>
                  <div style={{ width:20, height:20, borderRadius:4, border:"1px solid #d1d5db", background:v?"#dc2626":"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"white", flexShrink:0, marginTop:1 }}>
                    {v ? "v" : ""}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight: v ? 600 : 400, color: v ? "#dc2626" : "#374151" }}>{l}</div>
                    <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{d}</div>
                  </div>
                </div>
              ))}

              {p.country === "CA" && (
                <div onClick={() => upd("winterTires",!p.winterTires)}
                  style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"11px 14px", borderRadius:10, cursor:"pointer", marginBottom:6,
                    border: p.winterTires ? "2px solid #dc2626" : "1px solid #d1d5db",
                    background: p.winterTires ? "#fef2f2" : "white" }}>
                  <div style={{ width:20, height:20, borderRadius:4, border:"1px solid #d1d5db", background:p.winterTires?"#dc2626":"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"white", flexShrink:0, marginTop:1 }}>
                    {p.winterTires ? "v" : ""}
                  </div>
                  <div>
                    <div style={{ fontSize:14, color: p.winterTires ? "#dc2626" : "#374151" }}>Winter tires installed</div>
                    <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>5-10% discount in most provinces.</div>
                  </div>
                </div>
              )}

              {+p.age < 25 && (
                <div onClick={() => upd("student",!p.student)}
                  style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"11px 14px", borderRadius:10, cursor:"pointer", marginBottom:6,
                    border: p.student ? "2px solid #dc2626" : "1px solid #d1d5db",
                    background: p.student ? "#fef2f2" : "white" }}>
                  <div style={{ width:20, height:20, borderRadius:4, border:"1px solid #d1d5db", background:p.student?"#dc2626":"white", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"white", flexShrink:0, marginTop:1 }}>
                    {p.student ? "v" : ""}
                  </div>
                  <div>
                    <div style={{ fontSize:14, color: p.student ? "#dc2626" : "#374151" }}>Full-time student with B+ average</div>
                    <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>Good student discount: 5-15%.</div>
                  </div>
                </div>
              )}

              {pr.disc > 0 && <W type="g">{pr.disc}% in discounts active</W>}
            </div>
          )}

          {step === 6 && (
            <div>
              <h1 style={{ fontSize:24, fontWeight:700, marginBottom:16 }}>Your personalized results</h1>

              <div style={{ padding:22, background:"#fef2f2", border:"1px solid #fca5a5", borderRadius:16, marginBottom:16 }}>
                <div style={{ fontSize:12, color:"#9ca3af", marginBottom:4 }}>Estimated annual premium</div>
                <div style={{ fontSize:52, fontWeight:700, color:"#dc2626", letterSpacing:"-1px", lineHeight:1 }}>{fmtC(pr.annual)}</div>
                <div style={{ fontSize:14, color:"#6b7280", marginTop:6 }}>{fmtC(pr.monthly)}/month</div>
                {pr.disc > 0 && <div style={{ marginTop:8, fontSize:13, color:"#16a34a" }}>{pr.disc}% in active discounts applied</div>}
                <div style={{ marginTop:14, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[["Location",(p.city?p.city+", ":"")+provName],["Vehicle",([p.vYear,p.vMake,p.vModel].filter(Boolean).join(" "))||"Not specified"],["Coverage",p.coverage==="full"?"Full coverage":p.coverage==="standard"?"Standard":"Liability only"],["Deductible",fmtC(p.ded)]].map(([l,v]) => (
                    <div key={l} style={{ background:"white", borderRadius:8, padding:"8px 12px" }}>
                      <div style={{ fontSize:11, color:"#9ca3af", marginBottom:2 }}>{l}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#374151" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {[p.vUse==="rideshare"&&"Your personal policy does NOT cover rideshare use. Ask every insurer about a rideshare endorsement.",
                (p.financed||p.leased)&&p.coverage==="liability_only"&&"Your lender requires collision and comprehensive. Liability only is not permitted.",
                ((p.country==="CA"&&p.liability==="200K")||(p.country==="US"&&p.liability==="state_min"))&&("Your liability limit is dangerously low. Upgrading to "+(p.country==="CA"?"$1M":"100/300")+" costs only $5-15/month more."),
                p.vValue<5000&&p.coverage==="full"&&("Vehicle worth "+fmtC(p.vValue)+". Consider dropping collision and comprehensive."),
              ].filter(Boolean).map((w,i) => <W key={i} type="r">{w}</W>)}

              <div style={{ marginTop:16, marginBottom:16 }}>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Best insurers for your profile</div>
                {(p.country==="CA"
                  ? [["Ratehub.ca","Compare 50+ insurers","https://www.ratehub.ca/car-insurance"],["Intact Insurance","Best for most drivers","https://www.intact.net/en/get-a-quote"],["Belairdirect","Best online rates","https://www.belairdirect.com/en/auto-insurance/get-a-quote.html"],["Kanetix.ca","Side-by-side comparison","https://www.kanetix.ca/auto-insurance"]]
                  : [["Insurify","Compare 20+ insurers","https://insurify.com/car-insurance"],["The Zebra","100+ companies","https://www.thezebra.com/auto-insurance/"],["State Farm","Largest US insurer","https://www.statefarm.com/insurance/auto"],["GEICO","Often cheapest","https://www.geico.com/auto-insurance/"]]
                ).map(([n,d,u]) => (
                  <a key={n} href={u} target="_blank" rel="noopener noreferrer"
                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", background:"white", border:"1px solid #e5e7eb", borderRadius:10, textDecoration:"none", marginBottom:6 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:"#111827" }}>{n}</div>
                      <div style={{ fontSize:12, color:"#6b7280", marginTop:2 }}>{d}</div>
                    </div>
                    <div style={{ color:"#dc2626", fontSize:13, fontWeight:600 }}>Get quote</div>
                  </a>
                ))}
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:6 }}>Affiliate links -- we may earn a commission. Always compare at least 3 quotes.</div>
              </div>

              <button onClick={() => { setStep(0); setP({...INIT}); }}
                style={{ padding:"10px 22px", borderRadius:10, border:"1px solid #d1d5db", background:"transparent", color:"#6b7280", fontSize:14, cursor:"pointer", fontFamily:"inherit" }}>
                Start over
              </button>
            </div>
          )}

          {step < STEPS.length - 1 && (
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:28, gap:10 }}>
              {step > 0
                ? <button onClick={() => setStep(s => s-1)} style={{ padding:"12px 24px", borderRadius:10, border:"1px solid #d1d5db", background:"transparent", color:"#6b7280", fontSize:15, cursor:"pointer", fontFamily:"inherit" }}>Back</button>
                : <div />
              }
              <button onClick={() => setStep(s => s+1)} style={{ padding:"13px 32px", borderRadius:10, background:"#dc2626", color:"white", fontSize:15, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"inherit", flex:step===0?1:"none", maxWidth:200 }}>
                {step === STEPS.length - 2 ? "See my results" : "Next"}
              </button>
            </div>
          )}

        </div>

        <div style={{ marginTop:32, paddingTop:16, borderTop:"1px solid #e5e7eb", fontSize:11, color:"#9ca3af", textAlign:"center" }}>
          Premium estimates are approximate. Actual rates depend on your address, vehicle, and insurer. Always get quotes from licensed professionals. Some links are affiliate links.
        </div>
      </div>
      </div>
    </div>
  );
}
