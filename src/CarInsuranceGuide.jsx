import { useState, useEffect, useRef } from "react";

// ── Premium calculation engine ─────────────────────────────────────────────────
function calcPremium(profile) {
  const {
    country, province, usState, city, cityRate,
    age, gender, maritalStatus, yearsLicensed, occupation,
    vehicleYear, vehicleMake, vehicleModel, vehicleValue, vehicleUse,
    annualKm, parkingType, winterTires,
    atFaultAccidents, notAtFaultAccidents, tickets, dui, lapseMonths,
    coverageLevel, liabilityLimit, deductible,
    bundleHome, telematics, multiVehicle,
    rideshare, financed, newDriver, studentDiscount,
  } = profile;

  // Base from location
  const CA_BASE = {
    ON: 1920, BC: 1450, AB: 1735, QC: 900, MB: 1350, SK: 1235,
    NS: 1150, NB: 1120, NL: 1270, PE: 1080, NT: 1200, NU: 1200, YT: 1200,
  };
  const US_BASE = {
    CA: 2450, TX: 2310, FL: 3183, NY: 2994, IL: 1566, PA: 1478,
    OH: 1034, GA: 2359, NC: 1392, WA: 1701, AZ: 2026, CO: 2568,
    MI: 2864, WI: 1087, NV: 2100, NJ: 2800, MA: 2000, MD: 1900,
    TN: 1600, VA: 1400, MO: 1300, IN: 1200, KY: 1500, SC: 1400,
    AL: 1400, MN: 1400, OR: 1600, CT: 1800, OK: 1800, UT: 1400,
    IA: 1100, KS: 1300, NE: 1500, AR: 1600, MS: 1500, LA: 2400,
    ID: 1200, MT: 1600, WY: 1300, ND: 1100, SD: 1200, NM: 1500,
    VT: 1200, NH: 1100, ME: 1100, RI: 1800, DE: 1500, HI: 1100,
    AK: 1400, DC: 2200, WV: 1400
  };

  let annual = cityRate || (country === "CA"
    ? (CA_BASE[province] || 1500)
    : (US_BASE[usState] || 1800));

  // Coverage level
  if (coverageLevel === "liability_only") annual *= 0.45;
  else if (coverageLevel === "standard") annual *= 0.75;
  // else full = 1.0

  // Age multipliers
  if (age < 18) annual *= 2.5;
  else if (age <= 19) annual *= 2.2;
  else if (age <= 21) annual *= 1.9;
  else if (age <= 24) annual *= 1.6;
  else if (age <= 29) annual *= 1.2;
  else if (age <= 64) annual *= 1.0;
  else if (age <= 74) annual *= 1.1;
  else annual *= 1.25;

  // Gender (where applicable)
  if (gender === "male" && age < 25) annual *= 1.15;

  // Marital status
  if (maritalStatus === "married") annual *= 0.95;
  else if (maritalStatus === "widowed") annual *= 0.97;

  // Years licensed
  if (yearsLicensed < 1) annual *= 1.5;
  else if (yearsLicensed < 2) annual *= 1.3;
  else if (yearsLicensed < 3) annual *= 1.15;
  else if (yearsLicensed < 5) annual *= 1.05;

  // Vehicle factors
  if (vehicleValue > 80000) annual *= 1.35;
  else if (vehicleValue > 50000) annual *= 1.2;
  else if (vehicleValue > 35000) annual *= 1.1;
  else if (vehicleValue < 10000) annual *= 0.85;

  // Vehicle age
  const vehicleAge = new Date().getFullYear() - vehicleYear;
  if (vehicleAge <= 1) annual *= 1.1;
  else if (vehicleAge >= 15) annual *= 0.85;

  // High theft vehicles
  const highTheftModels = ["civic", "crv", "cr-v", "rav4", "f-150", "f150", "ram", "equinox", "silverado"];
  if (highTheftModels.some(m => (vehicleModel || "").toLowerCase().includes(m))) {
    annual *= 1.12;
  }

  // EV premium
  if (vehicleMake?.toLowerCase().includes("tesla") || vehicleModel?.toLowerCase().includes("electric") || vehicleModel?.toLowerCase().includes("ev")) {
    annual *= 1.25;
  }

  // Vehicle use
  if (vehicleUse === "rideshare") annual *= 1.35;
  else if (vehicleUse === "business") annual *= 1.2;
  else if (vehicleUse === "commute_long") annual *= 1.1;

  // Annual km / mileage
  if (annualKm < 8000) annual *= 0.88;
  else if (annualKm < 12000) annual *= 0.94;
  else if (annualKm > 25000) annual *= 1.1;
  else if (annualKm > 40000) annual *= 1.2;

  // Parking
  if (parkingType === "garage") annual *= 0.93;
  else if (parkingType === "street") annual *= 1.07;
  else if (parkingType === "high_theft_area") annual *= 1.15;

  // Driving record
  annual += (atFaultAccidents || 0) * (annual * 0.28);
  annual += (notAtFaultAccidents || 0) * (annual * 0.05);
  annual += (tickets || 0) * (annual * 0.12);
  if (dui) annual *= 1.8;

  // Coverage lapse
  if (lapseMonths > 12) annual *= 1.25;
  else if (lapseMonths > 6) annual *= 1.15;
  else if (lapseMonths > 0) annual *= 1.08;

  // Deductible
  if (deductible >= 2000) annual *= 0.75;
  else if (deductible >= 1500) annual *= 0.82;
  else if (deductible >= 1000) annual *= 0.87;
  else if (deductible <= 250) annual *= 1.1;

  // High liability
  if (liabilityLimit === "2M" || liabilityLimit === "1M_umbrella") annual *= 1.08;
  else if (liabilityLimit === "2M_plus") annual *= 1.15;

  // Discounts
  let discountTotal = 0;
  if (winterTires && country === "CA") discountTotal += 0.08;
  if (bundleHome) discountTotal += 0.15;
  if (telematics) discountTotal += 0.12;
  if (multiVehicle) discountTotal += 0.1;
  if (studentDiscount && age < 25) discountTotal += 0.08;
  if (occupation === "teacher" || occupation === "engineer" || occupation === "nurse") discountTotal += 0.05;

  annual *= (1 - Math.min(discountTotal, 0.45));
  if (financed) annual = Math.max(annual, (country === "CA" ? CA_BASE[province] : US_BASE[usState] || 1800) * 0.6);

  return {
    annual: Math.round(annual),
    monthly: Math.round(annual / 12),
    biweekly: Math.round(annual / 26),
    discountPct: Math.round(discountTotal * 100),
  };
}

// ── Recommendation engine ──────────────────────────────────────────────────────
function generateRecommendations(profile, premium) {
  const recs = [];
  const warnings = [];
  const coverageSuggestions = [];

  // Coverage recommendations
  if (profile.financed || profile.leased) {
    coverageSuggestions.push({ type: "required", text: "Collision + Comprehensive required by your lender. Not optional.", icon: "⚠️" });
  }
  if (profile.vehicleValue > 30000 && profile.coverageLevel === "liability_only") {
    warnings.push("Your vehicle is worth " + "$" + profile.vehicleValue.toLocaleString() + " but you have liability only. A total loss would cost you the full replacement value.");
  }
  if (profile.vehicleValue < 5000 && profile.coverageLevel === "full") {
    recs.push({ text: "Your vehicle is only worth " + "$" + profile.vehicleValue.toLocaleString() + ". Dropping collision and comprehensive could save you " + "$" + Math.round(premium.annual * 0.4).toLocaleString() + "/year, more than the car may be worth.", icon: "💡" });
  }

  // High theft vehicles
  const highTheft = ["civic", "rav4", "f-150", "f150", "ram", "equinox"];
  if (highTheft.some(m => (profile.vehicleModel || "").toLowerCase().includes(m))) {
    coverageSuggestions.push({ type: "important", text: "Your " + profile.vehicleModel + " is on Canada's top stolen vehicles list. Comprehensive coverage is essential, without it a theft pays you nothing.", icon: "🔐" });
  }

  // EV
  if (profile.vehicleMake?.toLowerCase().includes("tesla")) {
    coverageSuggestions.push({ type: "info", text: "Tesla repairs average 3-4x higher than equivalent gas vehicles. Even minor fender-benders cost $5,000+. Ensure your comprehensive and collision limits reflect replacement cost, not depreciated value.", icon: "⚡" });
  }

  // Rideshare
  if (profile.vehicleUse === "rideshare") {
    warnings.push("Your personal policy excludes rideshare coverage. You need a rideshare endorsement or commercial policy. Period 1 (app on, no ride accepted) is the highest-risk coverage gap.");
  }

  // Young driver
  if (profile.age < 25) {
    recs.push({ text: "As a driver under 25, telematics programs (app-based safe driving tracking) can reduce your premium by 10-25%. This is the fastest way to lower your rate.", icon: "📱" });
  }

  // New to Canada / lapse
  if (profile.lapseMonths > 6) {
    recs.push({ text: "Your coverage lapse is increasing your premium. Get any coverage now, even a basic policy, to start rebuilding your insurance history. Lapse discounts typically disappear after 3 consecutive years of coverage.", icon: "⏰" });
  }

  // Bundle opportunity
  if (!profile.bundleHome && profile.maritalStatus !== "single") {
    recs.push({ text: "Bundling home and auto with the same insurer typically saves 15-20%. If you own or rent your home, get a combined quote.", icon: "🏠" });
  }

  // Deductible
  if (profile.deductible < 500 && premium.annual > 2000) {
    recs.push({ text: "Raising your deductible from " + "$" + profile.deductible + " to $1,000 could save approximately " + "$" + Math.round(premium.annual * 0.13).toLocaleString() + "/year. Only choose a deductible you can comfortably pay if needed.", icon: "💰" });
  }

  // Winter tires Canada
  if (profile.country === "CA" && !profile.winterTires) {
    recs.push({ text: "Installing winter tires saves 5-10% with most Canadian insurers and is legally required in BC from Oct 1 - Mar 31 on many routes. Cost of tires is typically recovered in 1-2 seasons of discount.", icon: "❄️" });
  }

  // Liability limit
  if (profile.liabilityLimit === "200K" && profile.country === "CA") {
    warnings.push("$200,000 liability is the legal minimum in most provinces but dangerously low. A serious injury lawsuit can easily exceed $1M. Upgrading to $1M liability typically costs only $5-15/month more.");
  }
  if ((profile.liabilityLimit === "25_50" || profile.liabilityLimit === "state_min") && profile.country === "US") {
    warnings.push("State minimum liability is rarely sufficient. A serious accident can exceed $500K in medical and legal costs. Experts recommend at least 100/300/100 coverage.");
  }

  return { recs, warnings, coverageSuggestions };
}

// ── Insurer matching ──────────────────────────────────────────────────────────
function getInsurerMatches(profile, country) {
  const CA_INSURERS = [
    { name: "Intact Insurance", type: "major", strengths: ["Largest insurer in Canada", "Strong claims service", "Available in all provinces", "Good newcomer programs"], bestFor: ["Most drivers", "Bundling home+auto", "Newcomers to Canada"], quote: "https://www.intact.net/en/get-a-quote" },
    { name: "TD Insurance", type: "major", strengths: ["Competitive rates for professionals", "Association member discounts", "Strong digital experience"], bestFor: ["TD banking customers", "Professionals", "Alumni associations"], quote: "https://www.tdinsurance.com/getaquote" },
    { name: "Aviva Canada", type: "major", strengths: ["Good for high-value vehicles", "Strong comprehensive coverage options", "Multiple discount programs"], bestFor: ["High-value vehicles", "Bundling", "Safe drivers"], quote: "https://www.avivacanada.com/get-a-quote" },
    { name: "Desjardins / Certas", type: "major", strengths: ["Best rates in Quebec", "Strong in Ontario and Atlantic", "Loyalty rewards program"], bestFor: ["Quebec residents", "Long-term customers", "Credit union members"], quote: "https://www.certas.ca/en/auto/get-a-quote" },
    { name: "Belairdirect", type: "online", strengths: ["Online-first = lower overhead = lower rates", "Strong telematics program", "Transparent pricing"], bestFor: ["Tech-savvy drivers", "Telematics users", "Online buyers"], quote: "https://www.belairdirect.com/en/auto-insurance/get-a-quote.html" },
    { name: "Sonnet Insurance", type: "online", strengths: ["100% online", "Instant quotes", "Modern digital experience", "Competitive for urban drivers"], bestFor: ["Urban drivers", "Digital-first users", "Simple coverage needs"], quote: "https://www.sonnet.ca/auto-insurance/get-a-quote" },
    { name: "CAA Insurance", type: "specialty", strengths: ["Exclusive to CAA members", "Strong roadside included", "Loyalty rewards"], bestFor: ["CAA members", "Drivers who want roadside", "Frequent travellers"], quote: "https://www.caasco.com/insurance/auto" },
    { name: "Ratehub.ca", type: "comparison", strengths: ["Compares 50+ insurers at once", "Find lowest rate for your profile", "No obligation"], bestFor: ["All drivers", "Rate shoppers", "Annual comparison"], quote: "https://www.ratehub.ca/car-insurance" },
    { name: "Kanetix.ca", type: "comparison", strengths: ["Canadian comparison tool", "Multiple quotes in minutes", "Broker referrals available"], bestFor: ["Comparison shopping", "High-risk drivers", "Complex situations"], quote: "https://www.kanetix.ca/auto-insurance" },
  ];
  const US_INSURERS = [
    { name: "State Farm", type: "major", strengths: ["Largest US insurer", "Local agent network", "Strong claims service", "Good Drive Safe & Save telematics"], bestFor: ["Most drivers", "Those wanting local agent", "Bundling"], quote: "https://www.statefarm.com/insurance/auto" },
    { name: "GEICO", type: "major", strengths: ["Often cheapest rates", "Strong digital experience", "Military discounts", "Wide availability"], bestFor: ["Price-conscious drivers", "Military/federal employees", "Simple coverage needs"], quote: "https://www.geico.com/auto-insurance/" },
    { name: "Progressive", type: "major", strengths: ["Snapshot telematics saves up to 30%", "Name Your Price tool", "Good for high-risk drivers"], bestFor: ["Telematics users", "High-risk drivers", "Price shoppers"], quote: "https://www.progressive.com/auto/" },
    { name: "Allstate", type: "major", strengths: ["Drivewise telematics", "Accident forgiveness", "Milewise pay-per-mile for low-mileage drivers"], bestFor: ["Low-mileage drivers", "Safe drivers", "Those wanting forgiveness"], quote: "https://www.allstate.com/auto-insurance" },
    { name: "USAA", type: "specialty", strengths: ["Best rates for military families", "Excellent customer satisfaction", "Comprehensive coverage options"], bestFor: ["Military and veterans ONLY", "Military families"], quote: "https://www.usaa.com/inet/wc/auto-insurance" },
    { name: "Amica", type: "quality", strengths: ["Top customer satisfaction scores", "Dividend policies return premium", "Excellent claims handling"], bestFor: ["Quality-focused buyers", "Long-term customers", "Those who want best service"], quote: "https://www.amica.com/auto-insurance" },
    { name: "Insurify", type: "comparison", strengths: ["Compare 20+ insurers instantly", "AI-powered matching", "No spam guarantee"], bestFor: ["All drivers", "Rate comparison", "First-time buyers"], quote: "https://insurify.com/car-insurance" },
    { name: "The Zebra", type: "comparison", strengths: ["Compare 100+ companies", "No personal info required initially", "Educational resources"], bestFor: ["Anonymous comparison", "Research phase", "All drivers"], quote: "https://www.thezebra.com/auto-insurance/" },
    { name: "Jerry", type: "comparison", strengths: ["45-second quotes", "Monitors for rate drops", "No spam policy"], bestFor: ["Busy drivers", "Rate monitoring", "Mobile-first users"], quote: "https://jerry.ai/car-insurance" },
  ];

  const list = country === "CA" ? CA_INSURERS : US_INSURERS;

  // Score each insurer based on profile
  return list.map(ins => {
    let score = 50;
    if (ins.type === "comparison") score += 20; // always useful
    if (profile.bundleHome && ins.strengths.some(s => s.toLowerCase().includes("bundle"))) score += 15;
    if (profile.telematics && ins.strengths.some(s => s.toLowerCase().includes("telematic"))) score += 15;
    if (profile.age < 25 && ins.strengths.some(s => s.toLowerCase().includes("young"))) score += 10;
    if (profile.vehicleUse === "rideshare" && ins.strengths.some(s => s.toLowerCase().includes("rideshare"))) score += 20;
    if (ins.name === "USAA" && !profile.military) score = 5;
    return { ...ins, score };
  }).sort((a, b) => b.score - a.score);
}

// ── Wizard steps config ────────────────────────────────────────────────────────
const STEPS = [
  { id: "location", title: "Where do you live?", icon: "📍", why: "Your location is the single biggest factor in your premium. Brampton Ontario averages $2,900/year while Ottawa averages $1,213, same car, same driver, totally different city." },
  { id: "driver", title: "About you", icon: "👤", why: "Your age, experience, and profile can change your premium by 2-3x. We ask only what insurers actually use." },
  { id: "vehicle", title: "Your vehicle", icon: "🚗", why: "The make, model, year, and value of your car affects both your premium and which coverages you need." },
  { id: "history", title: "Driving history", icon: "📋", why: "Your claims and ticket history are the second-biggest premium factor. Even one at-fault accident adds 20-40% for up to 6 years." },
  { id: "coverage", title: "Coverage needs", icon: "🛡️", why: "We'll help you choose the right coverage, not too little (dangerous) and not too much (expensive). Most people are either underinsured or paying for coverage they don't need." },
  { id: "lifestyle", title: "Lifestyle factors", icon: "⚡", why: "A few more questions that unlock significant discounts many drivers miss." },
  { id: "results", title: "Your personalized report", icon: "📊", why: "" },
];

const CA_PROVINCES_LIST = [
  ["ON","Ontario"], ["BC","British Columbia"], ["AB","Alberta"], ["QC","Quebec"],
  ["MB","Manitoba"], ["SK","Saskatchewan"], ["NS","Nova Scotia"], ["NB","New Brunswick"],
  ["NL","Newfoundland"], ["PE","PEI"], ["NT","NWT"], ["NU","Nunavut"], ["YT","Yukon"],
];
const US_STATES_LIST = [
  ["CA","California"], ["TX","Texas"], ["FL","Florida"], ["NY","New York"], ["IL","Illinois"],
  ["PA","Pennsylvania"], ["OH","Ohio"], ["GA","Georgia"], ["NC","North Carolina"], ["WA","Washington"],
  ["AZ","Arizona"], ["CO","Colorado"], ["MI","Michigan"], ["WI","Wisconsin"], ["NV","Nevada"],
  ["NJ","New Jersey"], ["MA","Massachusetts"], ["MD","Maryland"], ["TN","Tennessee"], ["VA","Virginia"],
  ["MO","Missouri"], ["IN","Indiana"], ["KY","Kentucky"], ["SC","South Carolina"], ["AL","Alabama"],
  ["MN","Minnesota"], ["OR","Oregon"], ["CT","Connecticut"], ["OK","Oklahoma"], ["UT","Utah"],
  ["IA","Iowa"], ["KS","Kansas"], ["NE","Nebraska"], ["AR","Arkansas"], ["MS","Mississippi"],
  ["LA","Louisiana"], ["ID","Idaho"], ["MT","Montana"], ["WY","Wyoming"], ["ND","North Dakota"],
  ["SD","South Dakota"], ["NM","New Mexico"], ["VT","Vermont"], ["NH","New Hampshire"], ["ME","Maine"],
  ["RI","Rhode Island"], ["DE","Delaware"], ["HI","Hawaii"], ["AK","Alaska"], ["DC","Washington DC"],
  ["WV","West Virginia"],
];

function fmtC(n) { return "$" + Math.round(n).toLocaleString(); }

// ── Main Component ─────────────────────────────────────────────────────────────
export default function InsuranceWizard() {
  const [step, setStep] = useState(0);
  const [lightMode, setLightMode] = useState(() => localStorage.getItem("cig_theme") === "light");
  const [animDir, setAnimDir] = useState("forward");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [copied, setCopied] = useState(false);
  const topRef = useRef(null);

  const lm = lightMode;
  useEffect(() => { localStorage.setItem("cig_theme", lm ? "light" : "dark"); }, [lm]);

  // Profile state
  const [profile, setProfile] = useState({
    // Location
    country: "CA", province: "ON", usState: "CA", city: "", cityRate: null,
    // Driver
    age: "", gender: "prefer_not", maritalStatus: "single", yearsLicensed: "",
    occupation: "other", newToCountry: false,
    // Vehicle
    vehicleYear: new Date().getFullYear(), vehicleMake: "", vehicleModel: "",
    vehicleValue: 30000, vehicleUse: "personal", financed: false, leased: false,
    parkingType: "driveway", annualKm: 15000,
    // History
    atFaultAccidents: 0, notAtFaultAccidents: 0, tickets: 0, dui: false,
    lapseMonths: 0, yearsWithCurrentInsurer: 0,
    // Coverage
    coverageLevel: "full", liabilityLimit: country === "CA" ? "1M" : "100_300",
    deductible: 1000, accidentForgiveness: false, replacementCost: false,
    roadsideAssistance: false,
    // Lifestyle
    winterTires: false, bundleHome: false, telematics: false, multiVehicle: false,
    studentDiscount: false, rideshare: false, military: false, vehicleUse2: "personal",
  });

  const update = (key, val) => setProfile(p => ({ ...p, [key]: val }));

  const premium = calcPremium(profile);
  const { recs, warnings, coverageSuggestions } = generateRecommendations(profile, premium);
  const insurers = getInsurerMatches(profile, profile.country);

  const goNext = () => {
    setAnimDir("forward");
    setStep(s => Math.min(s + 1, STEPS.length - 1));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  const goPrev = () => {
    setAnimDir("back");
    setStep(s => Math.max(s - 1, 0));
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateAIReport = async () => {
    setAiLoading(true);
    setAiReport("");
    try {
      const profileSummary = `
Driver profile:
- Location: ${profile.country === "CA" ? `${profile.city || ""} ${CA_PROVINCES_LIST.find(p => p[0] === profile.province)?.[1] || profile.province}, Canada` : `${profile.city || ""} ${US_STATES_LIST.find(s => s[0] === profile.usState)?.[1] || profile.usState}, USA`}
- Age: ${profile.age}, Gender: ${profile.gender}, Married: ${profile.maritalStatus}
- Licensed for: ${profile.yearsLicensed} years
- Vehicle: ${profile.vehicleYear} ${profile.vehicleMake} ${profile.vehicleModel}, worth ${fmtC(profile.vehicleValue)}
- Financed/leased: ${profile.financed || profile.leased ? "Yes" : "No"}
- Annual km/miles: ${profile.annualKm.toLocaleString()}
- Parking: ${profile.parkingType}
- Vehicle use: ${profile.vehicleUse}
- At-fault accidents last 6 years: ${profile.atFaultAccidents}
- Tickets last 3 years: ${profile.tickets}
- DUI: ${profile.dui ? "Yes" : "No"}
- Coverage lapse: ${profile.lapseMonths} months
- Coverage level: ${profile.coverageLevel}
- Deductible: ${fmtC(profile.deductible)}
- Winter tires: ${profile.winterTires ? "Yes" : "No"}
- Bundle home+auto: ${profile.bundleHome ? "Yes" : "No"}
- Telematics: ${profile.telematics ? "Yes" : "No"}
- Rideshare driver: ${profile.rideshare ? "Yes" : "No"}
- Estimated annual premium: ${fmtC(premium.annual)}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a friendly, expert Canadian and US car insurance advisor. Based on this driver profile, write a concise, personalized insurance recommendation report in plain English. Include:
1. A brief summary of their risk profile (2-3 sentences)
2. The 3 most important coverage recommendations specific to their situation
3. The top 2-3 ways they could reduce their premium right now
4. One key risk they should be aware of based on their profile
5. A recommended next step

Be specific, practical, and conversational. No jargon. Keep total response under 400 words. Use short paragraphs, no bullet points, no headers with # symbols.

${profileSummary}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "Unable to generate report. Please try again.";
      setAiReport(text);
    } catch (e) {
      setAiReport("Unable to generate your personalized report right now. Your estimated premium and recommendations above are based on your profile.");
    }
    setAiLoading(false);
  };

  const progress = step / (STEPS.length - 1) * 100;
  const currentStep = STEPS[step];

  return (
    <div ref={topRef} style={{ fontFamily: "'Outfit','Plus Jakarta Sans',system-ui,sans-serif", background: lm ? "#f5f7fa" : "#080c12", color: lm ? "#111827" : "#e8edf4", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        :root {
          --bg: ${lm ? "#f5f7fa" : "#080c12"};
          --bg2: ${lm ? "#ffffff" : "#0e1420"};
          --bg3: ${lm ? "#f0f3f8" : "#141b28"};
          --border: ${lm ? "rgba(220,38,38,0.2)" : "rgba(239,68,68,0.2)"};
          --border2: ${lm ? "rgba(220,38,38,0.08)" : "rgba(239,68,68,0.08)"};
          --red: ${lm ? "#dc2626" : "#f87171"};
          --red-dim: ${lm ? "rgba(220,38,38,0.07)" : "rgba(248,113,113,0.1)"};
          --green: ${lm ? "#16a34a" : "#4ade80"};
          --green-dim: ${lm ? "rgba(22,163,74,0.08)" : "rgba(74,222,128,0.08)"};
          --gold: ${lm ? "#b45309" : "#fbbf24"};
          --text: ${lm ? "#111827" : "#e8edf4"};
          --text2: ${lm ? "#4b5563" : "#8899aa"};
          --text3: ${lm ? "#9ca3af" : "#445566"};
        }
        *{box-sizing:border-box;margin:0;padding:0}
        input,select,button{font-family:'Outfit',system-ui}
        button{cursor:pointer;border:none;background:none;color:inherit}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:var(--bg2)}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
        .fade-in{animation:fadeIn 0.35s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .opt-btn{padding:10px 16px;border-radius:10px;font-size:14px;font-weight:600;border:1.5px solid var(--border2);background:transparent;color:var(--text2);cursor:pointer;transition:all 0.15s;text-align:left;width:100%}
        .opt-btn:hover{border-color:var(--border);color:var(--text);background:var(--red-dim)}
        .opt-btn.active{border-color:var(--red);background:var(--red-dim);color:var(--red);font-weight:700}
        .range{width:100%;accent-color:var(--red);height:4px;cursor:pointer}
        .select{background:var(--bg3);border:1.5px solid var(--border2);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;outline:none;width:100%}
        .select:focus{border-color:var(--red)}
        .text-input{width:100%;background:var(--bg3);border:1.5px solid var(--border2);border-radius:10px;padding:10px 14px;color:var(--text);font-size:14px;outline:none}
        .text-input:focus{border-color:var(--red)}
        .num-input{width:100%;background:var(--bg3);border:1.5px solid var(--border2);border-radius:10px;padding:10px 14px;color:var(--text);font-size:15px;font-family:'Space Mono',monospace;outline:none}
        .num-input:focus{border-color:var(--red)}
        .card{background:var(--bg2);border:1px solid var(--border2);border-radius:14px;padding:18px}
        .br-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border2);font-size:13px}
        .br-row:last-child{border-bottom:none}
        .ins-card{background:var(--bg3);border-radius:12px;padding:14px;border:1px solid var(--border2);transition:border-color 0.15s;cursor:pointer}
        .ins-card:hover{border-color:var(--border)}
        .why-box{background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.15);border-radius:10px;padding:10px 14px;font-size:12px;color:#60a5fa;line-height:1.6;margin-bottom:16px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spinner{width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--red);border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block}
      `}</style>

      {/* Header */}
      <header style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border2)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#dc2626,#991b1b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚗</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.5px" }}>Insurance<span style={{ color: "var(--red)" }}>Wizard</span></div>
              <div style={{ fontSize: 10, color: "var(--text2)" }}>Personalized quote estimator</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* Live estimate pill */}
            {step > 0 && step < STEPS.length - 1 && profile.age && (
              <div style={{ padding: "5px 12px", background: "var(--red-dim)", border: "1px solid var(--border)", borderRadius: 20, fontSize: 12, fontWeight: 700, color: "var(--red)", fontFamily: "'Space Mono',monospace" }}>
                Est. {fmtC(premium.monthly)}/mo
              </div>
            )}
            <button onClick={() => setLightMode(v => !v)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border2)", background: "transparent", fontSize: 15 }}>{lm ? "🌙" : "☀️"}</button>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 3, background: "var(--bg3)" }}>
          <div style={{ height: "100%", background: "var(--red)", width: progress + "%", transition: "width 0.4s ease", borderRadius: "0 2px 2px 0" }} />
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* Step indicator */}
        {step < STEPS.length - 1 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto" }}>
            {STEPS.slice(0, -1).map((s, i) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: i < step ? "var(--green)" : i === step ? "var(--red)" : "var(--bg3)", border: `1.5px solid ${i <= step ? (i < step ? "var(--green)" : "var(--red)") : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: i <= step ? "#fff" : "var(--text3)", transition: "all 0.3s" }}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 11, color: i === step ? "var(--red)" : i < step ? "var(--green)" : "var(--text3)", fontWeight: i === step ? 700 : 500, display: i === step ? "block" : "none" }}>{s.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className="fade-in" key={step}>

          {/* Step header */}
          {step < STEPS.length - 1 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{currentStep.icon}</div>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.5px", marginBottom: 8 }}>{currentStep.title}</h1>
              {currentStep.why && (
                <div className="why-box">💡 <strong>Why we ask:</strong> {currentStep.why}</div>
              )}
            </div>
          )}

          {/* ── STEP 0: LOCATION ── */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Country</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["CA","🇨🇦 Canada"],["US","🇺🇸 United States"]].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${profile.country === val ? "active" : ""}`} style={{ flex: 1, textAlign: "center" }} onClick={() => update("country", val)}>{label}</button>
                  ))}
                </div>
              </div>

              {profile.country === "CA" ? (
                <div>
                  <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Province</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {CA_PROVINCES_LIST.map(([code, name]) => (
                      <button key={code} className={`opt-btn ${profile.province === code ? "active" : ""}`} style={{ width: "auto", padding: "8px 14px", fontSize: 13 }} onClick={() => update("province", code)}>{name}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>State</div>
                  <select className="select" value={profile.usState} onChange={e => update("usState", e.target.value)}>
                    {US_STATES_LIST.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>City / Town <span style={{ fontSize: 11, color: "var(--text3)" }}>(optional, improves accuracy)</span></div>
                <input className="text-input" placeholder={profile.country === "CA" ? "e.g. Toronto, Ottawa, Calgary..." : "e.g. Austin, Miami, Seattle..."} value={profile.city} onChange={e => update("city", e.target.value)} />
              </div>

              {profile.province && (
                <div style={{ padding: "12px 16px", background: "var(--red-dim)", border: "1px solid var(--border)", borderRadius: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
                    {profile.country === "CA" ? `${CA_PROVINCES_LIST.find(p => p[0] === profile.province)?.[1]}, ` : `${US_STATES_LIST.find(s => s[0] === profile.usState)?.[1]}, `}
                    {profile.country === "CA" && ["BC","MB","SK"].includes(profile.province) ? "🏛️ Public insurance province" : "🏢 Private insurance market"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text2)" }}>
                    {profile.country === "CA" && ["BC","MB","SK"].includes(profile.province)
                      ? "Government-run insurance. Basic coverage is set by the province. You can shop for optional collision and comprehensive."
                      : "Private competitive market. Shopping around is essential, rates vary up to 40% between insurers for the same driver."}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 1: DRIVER ── */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Your age</div>
                <input className="num-input" type="number" min={16} max={99} placeholder="e.g. 35" value={profile.age} onChange={e => update("age", +e.target.value)} />
                {profile.age && profile.age < 25 && (
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 6, padding: "5px 10px", background: "rgba(245,158,11,0.08)", borderRadius: 6 }}>
                    ⚠️ Drivers under 25 pay 1.5-2.5x more. Telematics programs are your fastest path to savings.
                  </div>
                )}
                {profile.age && profile.age >= 25 && profile.age < 65 && (
                  <div style={{ fontSize: 12, color: "var(--green)", marginTop: 6 }}>✅ Prime age range for insurance rates</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Gender <span style={{ fontSize: 11, color: "var(--text3)" }}>(where used as a rating factor)</span></div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["male","Male"],["female","Female"],["non_binary","Non-binary"],["prefer_not","Prefer not to say"]].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${profile.gender === val ? "active" : ""}`} style={{ width: "auto" }} onClick={() => update("gender", val)}>{label}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Note: Ontario and most Canadian provinces prohibit gender as a rating factor. Some US states allow it.</div>
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Marital status</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["single","Single"],["married","Married"],["common_law","Common-law"],["divorced","Divorced"],["widowed","Widowed"]].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${profile.maritalStatus === val ? "active" : ""}`} style={{ width: "auto" }} onClick={() => update("maritalStatus", val)}>{label}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>
                  Years licensed <span style={{ fontSize: 12, color: "var(--text3)" }}>(how long you've had a full license)</span>
                </div>
                <input className="num-input" type="number" min={0} max={60} placeholder="e.g. 10" value={profile.yearsLicensed} onChange={e => update("yearsLicensed", +e.target.value)} />
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Occupation <span style={{ fontSize: 11, color: "var(--text3)" }}>(some occupations qualify for discounts)</span></div>
                <select className="select" value={profile.occupation} onChange={e => update("occupation", e.target.value)}>
                  <option value="other">Other / Prefer not to say</option>
                  <option value="teacher">Teacher / Professor</option>
                  <option value="engineer">Engineer / Scientist</option>
                  <option value="nurse">Nurse / Healthcare worker</option>
                  <option value="doctor">Doctor</option>
                  <option value="lawyer">Lawyer / Legal professional</option>
                  <option value="accountant">Accountant / Finance professional</option>
                  <option value="retired">Retired</option>
                  <option value="student">Student</option>
                  <option value="military">Military / Ex-military</option>
                  <option value="police">Police / Emergency services</option>
                  <option value="tradesperson">Tradesperson / Contractor</option>
                  <option value="self_employed">Self-employed</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Are you new to {profile.country === "CA" ? "Canada" : "this country"}?</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["true","Yes, I have international driving history"],["false","No, Canadian/US driving history"]].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${String(profile.newToCountry) === val ? "active" : ""}`} onClick={() => update("newToCountry", val === "true")}>{label}</button>
                  ))}
                </div>
                {profile.newToCountry && (
                  <div style={{ fontSize: 12, color: "#60a5fa", marginTop: 8, padding: "8px 12px", background: "rgba(59,130,246,0.06)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.15)" }}>
                    💡 Bring your foreign driving record (obtained from your home country's motor vehicle authority) when getting quotes. Many Canadian insurers, especially Intact and Aviva, have newcomer programs that recognize your international experience.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2: VEHICLE ── */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Year</div>
                  <select className="select" value={profile.vehicleYear} onChange={e => update("vehicleYear", +e.target.value)}>
                    {Array.from({ length: 30 }, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Make</div>
                  <select className="select" value={profile.vehicleMake} onChange={e => update("vehicleMake", e.target.value)}>
                    <option value="">Select make...</option>
                    {["Acura","Audi","BMW","Buick","Cadillac","Chevrolet","Chrysler","Dodge","Ford","Genesis","GMC","Honda","Hyundai","Infiniti","Jeep","Kia","Land Rover","Lexus","Lincoln","Mazda","Mercedes-Benz","Mitsubishi","Nissan","Porsche","RAM","Subaru","Tesla","Toyota","Volkswagen","Volvo","Other"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Model</div>
                <input className="text-input" placeholder="e.g. Civic, RAV4, F-150, Model 3..." value={profile.vehicleModel} onChange={e => update("vehicleModel", e.target.value)} />
                {profile.vehicleModel && ["civic","rav4","f-150","f150","tucson","sorento"].some(m => profile.vehicleModel.toLowerCase().includes(m)) && (
                  <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6, padding: "5px 10px", background: "rgba(239,68,68,0.06)", borderRadius: 6 }}>
                    ⚠️ This vehicle is on Canada's top stolen vehicles list. Comprehensive coverage is essential.
                  </div>
                )}
                {profile.vehicleMake?.toLowerCase().includes("tesla") && (
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 6, padding: "5px 10px", background: "rgba(245,158,11,0.08)", borderRadius: 6 }}>
                    ⚡ Tesla repairs average 3-4x higher than equivalent gas vehicles. Ensure your coverage reflects replacement cost, not depreciated value.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>
                  Current vehicle value <span style={{ fontSize: 12, color: "var(--red)", fontFamily: "'Space Mono',monospace", fontWeight: 800 }}>{fmtC(profile.vehicleValue)}</span>
                </div>
                <input type="range" className="range" min={1000} max={200000} step={1000} value={profile.vehicleValue} onChange={e => update("vehicleValue", +e.target.value)} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                  <span>$1K</span><span>$200K</span>
                </div>
                {profile.vehicleValue < 5000 && (
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 6, padding: "5px 10px", background: "rgba(245,158,11,0.08)", borderRadius: 6 }}>
                    💡 For vehicles under $5,000, dropping collision and comprehensive may save more than the car is worth.
                  </div>
                )}
                {profile.vehicleValue > 60000 && (
                  <div style={{ fontSize: 12, color: "#60a5fa", marginTop: 6, padding: "5px 10px", background: "rgba(59,130,246,0.06)", borderRadius: 6 }}>
                    💡 High-value vehicle, consider replacement cost coverage and a lower deductible to avoid large out-of-pocket costs.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>How is the vehicle owned?</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["owned","Owned outright"],["financed","Financed (loan)"],["leased","Leased"]].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${(val === "financed" && profile.financed) || (val === "leased" && profile.leased) || (val === "owned" && !profile.financed && !profile.leased) ? "active" : ""}`} style={{ width: "auto" }}
                      onClick={() => { update("financed", val === "financed"); update("leased", val === "leased"); }}>
                      {label}
                    </button>
                  ))}
                </div>
                {(profile.financed || profile.leased) && (
                  <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6, padding: "5px 10px", background: "rgba(239,68,68,0.06)", borderRadius: 6 }}>
                    ⚠️ Your lender requires collision and comprehensive coverage. These are mandatory, not optional, for financed and leased vehicles.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Primary vehicle use</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    ["personal","Personal use, errands, leisure, occasional commute"],
                    ["commute_short","Daily commute, under 20km/12mi each way"],
                    ["commute_long","Daily commute, over 20km/12mi each way"],
                    ["business","Business use, client visits, sales calls, deliveries"],
                    ["rideshare","Rideshare / delivery, Uber, Lyft, DoorDash, etc."],
                  ].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${profile.vehicleUse === val ? "active" : ""}`} onClick={() => update("vehicleUse", val)}>{label}</button>
                  ))}
                </div>
                {profile.vehicleUse === "rideshare" && (
                  <div style={{ fontSize: 12, color: "var(--red)", marginTop: 8, padding: "8px 12px", background: "rgba(239,68,68,0.06)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", lineHeight: 1.7 }}>
                    ⚠️ Critical: Your personal policy does NOT cover rideshare or delivery use. You need a rideshare endorsement or commercial policy. Without it, you have zero coverage during Period 1 (app on, waiting for a ride). Ask any insurer specifically about rideshare coverage.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>
                  Annual {profile.country === "CA" ? "kilometres" : "miles"} driven <span style={{ fontSize: 13, color: "var(--red)", fontFamily: "'Space Mono',monospace", fontWeight: 800 }}>{profile.annualKm.toLocaleString()}</span>
                </div>
                <input type="range" className="range" min={1000} max={50000} step={1000} value={profile.annualKm} onChange={e => update("annualKm", +e.target.value)} />
                {profile.annualKm < 10000 && (
                  <div style={{ fontSize: 12, color: "var(--green)", marginTop: 4 }}>✅ Low mileage, you qualify for low-mileage discounts with most insurers</div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Where do you primarily park overnight?</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["garage","Private garage"],["driveway","Private driveway"],["lot","Private lot / carport"],["street","Street parking"],["high_theft_area","Street in high-theft area"]].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${profile.parkingType === val ? "active" : ""}`} style={{ width: "auto" }} onClick={() => update("parkingType", val)}>{label}</button>
                  ))}
                </div>
                {profile.parkingType === "garage" && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 4 }}>✅ Garage parking qualifies for a reduced comprehensive premium</div>}
                {profile.parkingType === "high_theft_area" && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>⚠️ High-theft parking adds 10-15% to your comprehensive premium</div>}
              </div>
            </div>
          )}

          {/* ── STEP 3: HISTORY ── */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>At-fault accidents in the last 6 years</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0,1,2,3,"4+"].map(n => (
                    <button key={n} className={`opt-btn ${profile.atFaultAccidents === (n === "4+" ? 4 : n) ? "active" : ""}`} style={{ flex: 1, textAlign: "center" }}
                      onClick={() => update("atFaultAccidents", n === "4+" ? 4 : n)}>{n}</button>
                  ))}
                </div>
                {profile.atFaultAccidents > 0 && (
                  <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6, padding: "5px 10px", background: "rgba(239,68,68,0.06)", borderRadius: 6 }}>
                    Each at-fault accident typically adds 20-40% to your premium for 6 years in most provinces.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Not-at-fault accidents in the last 3 years</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0,1,2,"3+"].map(n => (
                    <button key={n} className={`opt-btn ${profile.notAtFaultAccidents === (n === "3+" ? 3 : n) ? "active" : ""}`} style={{ flex: 1, textAlign: "center" }}
                      onClick={() => update("notAtFaultAccidents", n === "3+" ? 3 : n)}>{n}</button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>Not-at-fault accidents can still affect your premium in some provinces, typically a small increase.</div>
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Traffic tickets / convictions in the last 3 years</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 8, padding: "6px 10px", background: "var(--bg3)", borderRadius: 6 }}>Include: speeding tickets, distracted driving, failing to stop, careless driving</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[0,1,2,"3+"].map(n => (
                    <button key={n} className={`opt-btn ${profile.tickets === (n === "3+" ? 3 : n) ? "active" : ""}`} style={{ flex: 1, textAlign: "center" }}
                      onClick={() => update("tickets", n === "3+" ? 3 : n)}>{n}</button>
                  ))}
                </div>
                {profile.tickets > 0 && (
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 6, padding: "5px 10px", background: "rgba(245,158,11,0.08)", borderRadius: 6 }}>
                    Each ticket typically adds 5-15% to your premium. Serious convictions (stunt driving, DUI) can double your rate or trigger cancellation.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>DUI / DWI / impaired driving conviction in last 10 years</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["false","No"],["true","Yes"]].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${String(profile.dui) === val ? "active" : ""}`} style={{ flex: 1, textAlign: "center" }}
                      onClick={() => update("dui", val === "true")}>{label}</button>
                  ))}
                </div>
                {profile.dui && (
                  <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8 }}>
                    A DUI conviction typically results in 80-150% premium increase and may require an SR-22 (US) or high-risk insurance (Canada). Some standard insurers will not cover you. We'll recommend appropriate insurers for your situation.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Months without insurance coverage (if any lapse)</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[["0","None"],["1-3","1-3 months"],["4-6","4-6 months"],["7-12","7-12 months"],["12+","Over a year"]].map(([val, label]) => (
                    <button key={val} className={`opt-btn ${(val === "0" && profile.lapseMonths === 0) || (val === "1-3" && profile.lapseMonths > 0 && profile.lapseMonths <= 3) || (val === "4-6" && profile.lapseMonths >= 4 && profile.lapseMonths <= 6) || (val === "7-12" && profile.lapseMonths >= 7 && profile.lapseMonths <= 12) || (val === "12+" && profile.lapseMonths > 12) ? "active" : ""}`} style={{ width: "auto" }}
                      onClick={() => update("lapseMonths", val === "0" ? 0 : val === "1-3" ? 2 : val === "4-6" ? 5 : val === "7-12" ? 9 : 18)}>
                      {label}
                    </button>
                  ))}
                </div>
                {profile.lapseMonths > 6 && (
                  <div style={{ fontSize: 12, color: "var(--gold)", marginTop: 6, padding: "5px 10px", background: "rgba(245,158,11,0.08)", borderRadius: 6 }}>
                    A significant lapse is treated like a new driver by many insurers. Get any continuous coverage now to start rebuilding your history.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: COVERAGE ── */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Coverage level</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["liability_only", "Liability only", "Legal minimum. Covers damage you cause to others. Does NOT cover damage to your own vehicle. Not recommended if your car is worth more than $5,000 or is financed."],
                    ["standard", "Standard coverage", "Liability + collision + comprehensive. Covers your vehicle in most scenarios. Most common choice for vehicles worth $10,000+."],
                    ["full", "Full coverage + extras", "Everything in standard plus optional add-ons like accident forgiveness, replacement cost, rental coverage, and enhanced accident benefits."],
                  ].map(([val, label, desc]) => (
                    <button key={val} className={`opt-btn ${profile.coverageLevel === val ? "active" : ""}`} onClick={() => update("coverageLevel", val)} style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 700 }}>{label}</div>
                      <div style={{ fontSize: 12, marginTop: 3, color: profile.coverageLevel === val ? "inherit" : "var(--text3)", lineHeight: 1.5 }}>{desc}</div>
                    </button>
                  ))}
                </div>
                {(profile.financed || profile.leased) && profile.coverageLevel === "liability_only" && (
                  <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6, padding: "5px 10px", background: "rgba(239,68,68,0.06)", borderRadius: 6 }}>
                    ❌ Your lender requires collision and comprehensive. Liability only is not permitted on a financed or leased vehicle.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 4 }}>Liability limit</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>Protects your personal assets if you cause a serious accident. The minimum is rarely enough.</div>
                {profile.country === "CA" ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[["200K","$200K (legal min)"],["500K","$500K"],["1M","$1M (recommended)"],["2M","$2M (best protection)"]].map(([val, label]) => (
                      <button key={val} className={`opt-btn ${profile.liabilityLimit === val ? "active" : ""}`} style={{ width: "auto" }} onClick={() => update("liabilityLimit", val)}>{label}</button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[["state_min","State minimum"],["50_100","50/100/50"],["100_300","100/300/100 (recommended)"],["250_500","250/500/250 (best protection)"]].map(([val, label]) => (
                      <button key={val} className={`opt-btn ${profile.liabilityLimit === val ? "active" : ""}`} style={{ width: "auto" }} onClick={() => update("liabilityLimit", val)}>{label}</button>
                    ))}
                  </div>
                )}
                {((profile.country === "CA" && profile.liabilityLimit === "200K") || (profile.country === "US" && profile.liabilityLimit === "state_min")) && (
                  <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6, padding: "5px 10px", background: "rgba(239,68,68,0.06)", borderRadius: 6 }}>
                    ⚠️ Minimum liability is dangerously low. A serious injury lawsuit can exceed $1M+. Upgrading to {profile.country === "CA" ? "$1M" : "100/300/100"} typically costs only $5-15/month more.
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>
                  Deductible (collision and comprehensive), <span style={{ color: "var(--red)", fontFamily: "'Space Mono',monospace" }}>{fmtC(profile.deductible)}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 8 }}>The amount YOU pay after a claim before insurance kicks in. Higher deductible = lower premium.</div>
                <input type="range" className="range" min={250} max={5000} step={250} value={profile.deductible} onChange={e => update("deductible", +e.target.value)} />
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                  {profile.deductible >= 2000 ? "💰 High deductible saves ~25% on collision/comprehensive premium. Choose this only if you have strong emergency savings." :
                   profile.deductible >= 1000 ? "✅ Good balance of savings and manageable out-of-pocket cost." :
                   "Standard deductible. Consider raising to $1,000+ if you have solid savings."}
                </div>
              </div>

              {profile.coverageLevel === "full" && (
                <div>
                  <div style={{ fontSize: 14, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Optional add-ons</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      ["accidentForgiveness", "Accident forgiveness", "Prevents your first at-fault accident from raising your premium. Worth it after 5+ years clean record."],
                      ["replacementCost", "Replacement cost coverage", "Pays to replace with a brand-new vehicle instead of depreciated value. Usually only for vehicles under 2 years old."],
                      ["roadsideAssistance", "Roadside assistance", "Covers towing, battery boost, lockout, flat tire. Check if you already have this through CAA/AAA or a credit card."],
                    ].map(([key, label, desc]) => (
                      <div key={key} onClick={() => update(key, !profile[key])} style={{ display: "flex", gap: 12, padding: "10px 14px", background: profile[key] ? "var(--red-dim)" : "var(--bg3)", border: `1.5px solid ${profile[key] ? "var(--red)" : "var(--border2)"}`, borderRadius: 10, cursor: "pointer", alignItems: "flex-start" }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: profile[key] ? "var(--red)" : "var(--bg2)", border: `1.5px solid ${profile[key] ? "var(--red)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", flexShrink: 0, marginTop: 1 }}>
                          {profile[key] ? "✓" : ""}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{label}</div>
                          <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5: LIFESTYLE ── */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 14, color: "var(--text2)", marginBottom: 4 }}>These questions unlock discounts many drivers leave on the table. Answer honestly, they can save you 20-40%.</div>

              {[
                ...(profile.country === "CA" ? [["winterTires", "❄️ Winter tires installed", "Most Canadian insurers discount 5-10%. Legally required in BC on many routes Oct 1-Mar 31."]] : []),
                ["bundleHome", "🏠 You own or rent a home (bundle discount)", "Bundling auto and home/renters insurance typically saves 15-20%."],
                ["telematics", "📱 Willing to try telematics (app-based safe driving)", "An app tracks your speed, braking, and time of day. Saves 10-30%, the biggest single discount available to most drivers."],
                ["multiVehicle", "🚗 You have 2+ vehicles in your household", "Multi-vehicle discount: 10-15% off each vehicle when insured together."],
                ...(profile.age < 25 ? [["studentDiscount", "🎓 Full-time student with B+ average", "Good student discount: 5-15% with most insurers."]] : []),
                ["rideshare", "🚕 You drive for Uber, Lyft, DoorDash, or similar", "Important for getting the right coverage recommendation."],
                ...(profile.country === "US" ? [["military", "🎖️ Current or former military / veteran", "USAA offers the best rates for military families. Other insurers also offer military discounts."]] : []),
              ].map(([key, label, desc]) => (
                <div key={key} onClick={() => update(key, !profile[key])} style={{ display: "flex", gap: 12, padding: "14px 16px", background: profile[key] ? "var(--red-dim)" : "var(--bg2)", border: `1.5px solid ${profile[key] ? "var(--red)" : "var(--border2)"}`, borderRadius: 12, cursor: "pointer", alignItems: "flex-start", transition: "all 0.15s" }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: profile[key] ? "var(--red)" : "var(--bg3)", border: `1.5px solid ${profile[key] ? "var(--red)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", flexShrink: 0, marginTop: 1 }}>
                    {profile[key] ? "✓" : ""}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 3, lineHeight: 1.55 }}>{desc}</div>
                  </div>
                </div>
              ))}

              {premium.discountPct > 0 && (
                <div style={{ padding: "12px 16px", background: "var(--green-dim)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 12, fontSize: 13, color: "var(--green)", fontWeight: 600 }}>
                  ✅ {premium.discountPct}% in discounts active, saving you approx. {fmtC(Math.round(premium.annual * premium.discountPct / (100 - premium.discountPct)))}/year
                </div>
              )}
            </div>
          )}

          {/* ── STEP 6: RESULTS ── */}
          {step === 6 && (
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.5px", marginBottom: 4 }}>📊 Your Personalized Report</div>
              <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>
                Based on everything you've told us. Not a guarantee, actual quotes may vary. Use this to guide your conversations with insurers.
              </p>

              {/* Premium estimate */}
              <div style={{ padding: "24px", background: lm ? "linear-gradient(135deg,#fef2f2,#fff)" : "linear-gradient(135deg,#1a0a0a,#0e1420)", border: "1px solid var(--border)", borderRadius: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Estimated annual premium</div>
                <div style={{ fontSize: 52, fontWeight: 900, color: "var(--red)", fontFamily: "'Space Mono',monospace", letterSpacing: "-1px", lineHeight: 1 }}>{fmtC(premium.annual)}</div>
                <div style={{ fontSize: 14, color: "var(--text2)", marginTop: 6 }}>
                  {fmtC(premium.monthly)}/month · {fmtC(premium.biweekly)}/bi-weekly
                </div>
                {premium.discountPct > 0 && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "var(--green)" }}>
                    ✅ {premium.discountPct}% in active discounts applied
                  </div>
                )}
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
                  {[
                    ["Location", profile.country === "CA" ? (profile.city ? `${profile.city}, ${profile.province}` : CA_PROVINCES_LIST.find(p => p[0] === profile.province)?.[1]) : (profile.city ? `${profile.city}, ${profile.usState}` : US_STATES_LIST.find(s => s[0] === profile.usState)?.[1])],
                    ["Vehicle", `${profile.vehicleYear || ""} ${profile.vehicleMake || ""} ${profile.vehicleModel || ""}`.trim() || "Not specified"],
                    ["Coverage", profile.coverageLevel === "full" ? "Full coverage" : profile.coverageLevel === "standard" ? "Standard" : "Liability only"],
                    ["Deductible", fmtC(profile.deductible)],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: "var(--bg3)", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 10, color: "var(--text3)", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings */}
              {warnings.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  {warnings.map((w, i) => (
                    <div key={i} style={{ padding: "12px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, marginBottom: 8, fontSize: 13, color: "var(--text2)", lineHeight: 1.65, borderLeft: "3px solid var(--red)" }}>
                      🔴 <strong style={{ color: "var(--red)" }}>Warning:</strong> {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Coverage suggestions */}
              {coverageSuggestions.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Coverage recommendations for your situation</div>
                  {coverageSuggestions.map((s, i) => (
                    <div key={i} style={{ padding: "10px 14px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 10, marginBottom: 6, fontSize: 13, color: "var(--text2)", lineHeight: 1.65 }}>
                      {s.icon} {s.text}
                    </div>
                  ))}
                </div>
              )}

              {/* Savings recommendations */}
              {recs.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>💰 How to reduce your premium</div>
                  {recs.map((r, i) => (
                    <div key={i} style={{ padding: "10px 14px", background: "var(--green-dim)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 10, marginBottom: 6, fontSize: 13, color: "var(--text2)", lineHeight: 1.65 }}>
                      {r.icon} {r.text}
                    </div>
                  ))}
                </div>
              )}

              {/* AI-powered personalized report */}
              <div style={{ marginBottom: 16, padding: "18px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  ✨ AI-Powered Personal Insurance Analysis
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(220,38,38,0.1)", color: "var(--red)", fontWeight: 700 }}>Powered by Claude</span>
                </div>
                {!aiReport && !aiLoading && (
                  <>
                    <p style={{ fontSize: 13, color: "var(--text2)", marginBottom: 12, lineHeight: 1.65 }}>
                      Get a plain-English analysis of your specific risk profile, personalized coverage advice, and the exact steps to take next, written specifically for your situation.
                    </p>
                    <button onClick={generateAIReport} style={{ padding: "11px 22px", background: "var(--red)", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none" }}>
                      Generate my personalized report
                    </button>
                  </>
                )}
                {aiLoading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0", color: "var(--text2)", fontSize: 13 }}>
                    <div className="spinner" />
                    Analyzing your profile and generating personalized recommendations...
                  </div>
                )}
                {aiReport && (
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{aiReport}</div>
                    <button onClick={() => { navigator.clipboard.writeText(aiReport); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      style={{ marginTop: 12, padding: "7px 16px", borderRadius: 8, border: "1px solid var(--border2)", background: "transparent", color: "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {copied ? "✓ Copied!" : "📋 Copy report"}
                    </button>
                  </div>
                )}
              </div>

              {/* Insurer recommendations */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>🏢 Best insurers for your profile</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {insurers.slice(0, 6).map(ins => (
                    <a key={ins.name} href={ins.quote} target="_blank" rel="noopener noreferrer sponsored"
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, padding: "14px 16px", background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: 12, textDecoration: "none", transition: "border-color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = "var(--red)"}
                      onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border2)"}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{ins.name}</span>
                          <span style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, background: ins.type === "comparison" ? "rgba(59,130,246,0.1)" : "var(--red-dim)", color: ins.type === "comparison" ? "#60a5fa" : "var(--red)", fontWeight: 700 }}>
                            {ins.type === "comparison" ? "Compare" : ins.type === "online" ? "Online" : ins.type === "specialty" ? "Specialty" : "Major"}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{ins.bestFor.slice(0, 2).join(" · ")}</div>
                      </div>
                      <div style={{ color: "var(--red)", fontSize: 14, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>Get quote →</div>
                    </a>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 8 }}>Affiliate links, we may earn a commission at no cost to you. Always compare at least 3 quotes.</div>
              </div>

              {/* Start over */}
              <button onClick={() => { setStep(0); setProfile({ country: "CA", province: "ON", usState: "CA", city: "", cityRate: null, age: "", gender: "prefer_not", maritalStatus: "single", yearsLicensed: "", occupation: "other", newToCountry: false, vehicleYear: new Date().getFullYear(), vehicleMake: "", vehicleModel: "", vehicleValue: 30000, vehicleUse: "personal", financed: false, leased: false, parkingType: "driveway", annualKm: 15000, atFaultAccidents: 0, notAtFaultAccidents: 0, tickets: 0, dui: false, lapseMonths: 0, yearsWithCurrentInsurer: 0, coverageLevel: "full", liabilityLimit: "1M", deductible: 1000, accidentForgiveness: false, replacementCost: false, roadsideAssistance: false, winterTires: false, bundleHome: false, telematics: false, multiVehicle: false, studentDiscount: false, rideshare: false, military: false }); setAiReport(""); }}
                style={{ padding: "10px 22px", borderRadius: 10, border: "1px solid var(--border2)", background: "transparent", color: "var(--text2)", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8 }}>
                ↩ Start over with a new profile
              </button>
            </div>
          )}

          {/* Navigation */}
          {step < STEPS.length - 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 10 }}>
              {step > 0 ? (
                <button onClick={goPrev} style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid var(--border2)", background: "transparent", color: "var(--text2)", fontSize: 15, fontWeight: 600 }}>← Back</button>
              ) : <div />}
              <button onClick={goNext} style={{ padding: "13px 32px", borderRadius: 10, background: "var(--red)", color: "#fff", fontSize: 15, fontWeight: 800, flex: step === 0 ? 1 : "none", maxWidth: 300 }}>
                {step === STEPS.length - 2 ? "See my results →" : "Next →"}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: "1px solid var(--border2)", fontSize: 11, color: "var(--text3)", lineHeight: 1.7, textAlign: "center" }}>
          Premium estimates are approximate and for informational purposes only. Actual rates depend on your specific address, complete vehicle details, and individual insurer criteria. Always get quotes from licensed insurance professionals. Some links are affiliate links.
        </div>
      </div>
    </div>
  );
}
