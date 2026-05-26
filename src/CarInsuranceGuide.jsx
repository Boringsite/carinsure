import { useState, useEffect, useRef } from "react";

// ── Data ──────────────────────────────────────────────────────────────────────

const CA_PROVINCES = {
  ON: {
    name: "Ontario", system: "private", avgPremium: 1920, minLiability: 200000,
    tort: "modified", noFault: true, mandatoryCoverage: ["Third-party liability ($200K min)", "Accident benefits", "Uninsured motorist", "Direct compensation property damage"],
    optionalCoverage: ["Collision", "Comprehensive", "DCPD waiver", "Loss of use", "OPCF endorsements"],
    notes: "Highest premiums in Canada. Regulated by FSRA. No-fault accident benefits mandatory. Can shop around, many private insurers compete.",
    firstTimeSavings: "New to Ontario? Ask about 'newcomer discounts' and use your international driving record.",
    regulator: "FSRA (Financial Services Regulatory Authority of Ontario)",
    link: "https://www.fsrao.ca",
    insurers: ["Intact", "TD Insurance", "Aviva", "Desjardins", "Sonnet", "Belairdirect", "CAA", "Economical"],
  },
  AB: {
    name: "Alberta", system: "private", avgPremium: 1735, minLiability: 200000,
    tort: "full", noFault: false, mandatoryCoverage: ["Third-party liability ($200K min)", "Accident benefits", "Uninsured motorist"],
    optionalCoverage: ["Collision", "Comprehensive", "All perils", "Specified perils", "Loss of use", "Roadside assistance"],
    notes: "Second highest premiums. Full tort system, you can sue at-fault drivers. Rates rising due to hailstorm claims, car theft, and inflation.",
    firstTimeSavings: "Alberta has no rate cap since 2019, shop aggressively at renewal time.",
    regulator: "AIRB (Automobile Insurance Rate Board)",
    link: "https://www.airb.ab.ca",
    insurers: ["Intact", "TD Insurance", "Aviva", "Wawanesa", "Economical", "CAA", "Sonnet"],
  },
  BC: {
    name: "British Columbia", system: "public", avgPremium: 1450, minLiability: 200000,
    tort: "no-fault", noFault: true, mandatoryCoverage: ["Basic Autoplan (ICBC)", "Third-party liability ($200K)", "Accident benefits", "Uninsured motorist"],
    optionalCoverage: ["Enhanced accident benefits", "Extended third party", "Collision", "Comprehensive", "Additional towing"],
    notes: "Public insurance through ICBC. Cannot shop around for basic coverage. Optional collision and comprehensive can be added through ICBC or private insurers.",
    firstTimeSavings: "New to BC? Your out-of-province driving record transfers to ICBC's Claim-Free Discount ladder.",
    regulator: "ICBC (Insurance Corporation of BC)",
    link: "https://www.icbc.com",
    insurers: ["ICBC (basic)", "Intact (optional)", "Aviva (optional)", "Wawanesa (optional)"],
  },
  QC: {
    name: "Quebec", system: "hybrid", avgPremium: 900, minLiability: 50000,
    tort: "no-fault", noFault: true, mandatoryCoverage: ["SAAQ (bodily injury, government)", "Civil liability (private insurer)", "Uninsured motorist"],
    optionalCoverage: ["Collision", "Comprehensive", "All perils", "Replacement cost", "Road assistance"],
    notes: "Lowest premiums in Canada. Hybrid system: SAAQ covers all bodily injuries (no-fault), private insurers cover property damage. Very competitive market.",
    firstTimeSavings: "Quebec's SAAQ bodily injury is automatically included in your driver's license fee, you only need private insurance for property damage.",
    regulator: "AMF (Autorité des marchés financiers)",
    link: "https://www.autorite.qc.ca",
    insurers: ["Intact", "Desjardins", "Belairdirect", "La Personnelle", "TD Insurance", "Sonnet"],
  },
  MB: {
    name: "Manitoba", system: "public", avgPremium: 1350, minLiability: 500000,
    tort: "no-fault", noFault: true, mandatoryCoverage: ["MPI Basic (Autopac)", "$500K third-party liability", "Personal injury protection", "Uninsured motorist"],
    optionalCoverage: ["Extension (higher liability)", "Collision", "Comprehensive", "Rental vehicle"],
    notes: "Public insurance through Manitoba Public Insurance. Rates set by PUB (Public Utilities Board). One of the best accident benefit systems in Canada.",
    firstTimeSavings: "MPI offers usage-based insurance discounts, ask about the Autopac Telematics program.",
    regulator: "MPI (Manitoba Public Insurance)",
    link: "https://www.mpi.mb.ca",
    insurers: ["MPI (Autopac, mandatory)", "Private for optional coverage"],
  },
  SK: {
    name: "Saskatchewan", system: "public", avgPremium: 1235, minLiability: 200000,
    tort: "no-fault", noFault: true, mandatoryCoverage: ["SGI PLATE Coverage", "Third-party liability ($200K)", "Accident benefits"],
    optionalCoverage: ["SGI Canada (optional extras)", "Collision", "Comprehensive", "Extension packages"],
    notes: "Public insurance through SGI. No-fault system covers injuries. Optional coverages available through SGI Canada and private brokers.",
    regulator: "SGI (Saskatchewan Government Insurance)",
    link: "https://www.sgi.sk.ca",
    insurers: ["SGI (mandatory)", "SGI Canada (optional)", "Private brokers for additional"],
  },
  NS: { name: "Nova Scotia", system: "private", avgPremium: 1150, minLiability: 500000, tort: "modified", noFault: false, mandatoryCoverage: ["Third-party liability ($500K min)", "Accident benefits", "Uninsured motorist"], optionalCoverage: ["Collision", "Comprehensive", "SEF endorsements"], notes: "Competitive private market. Higher minimum liability than most provinces at $500K.", regulator: "NSURI (Nova Scotia Utility and Review Board)", link: "https://nsuarb.novascotia.ca", insurers: ["Intact", "Aviva", "TD Insurance", "Wawanesa", "Economical"] },
  NB: { name: "New Brunswick", system: "private", avgPremium: 1120, minLiability: 200000, tort: "modified", noFault: false, mandatoryCoverage: ["Third-party liability ($200K min)", "Accident benefits", "Uninsured motorist"], optionalCoverage: ["Collision", "Comprehensive", "SEF endorsements"], notes: "Private competitive market with fewer claims than Ontario. Relatively stable rates.", regulator: "FCNB (Financial and Consumer Services Commission)", link: "https://fcnb.ca", insurers: ["Intact", "Aviva", "TD Insurance", "Sonnet"] },
  NL: { name: "Newfoundland", system: "private", avgPremium: 1270, minLiability: 200000, tort: "full", noFault: false, mandatoryCoverage: ["Third-party liability ($200K min)", "Accident benefits", "Uninsured motorist"], optionalCoverage: ["Collision", "Comprehensive"], notes: "Full tort system. Fewer insurers than mainland provinces but stable market.", regulator: "PUB NL", link: "https://pub.nl.ca", insurers: ["Intact", "Aviva", "TD Insurance"] },
  PE: { name: "PEI", system: "private", avgPremium: 1080, minLiability: 200000, tort: "modified", noFault: false, mandatoryCoverage: ["Third-party liability ($200K min)", "Accident benefits", "Uninsured motorist"], optionalCoverage: ["Collision", "Comprehensive"], notes: "Lowest premiums among private insurance provinces. Small market, low claim frequency.", regulator: "IRAC (Island Regulatory and Appeals Commission)", link: "https://www.irac.pe.ca", insurers: ["Intact", "Aviva", "TD Insurance"] },
};

const US_STATES = {
  CA: { name: "California", avgPremium: 2450, minLiability: "15/30/5", noFault: false, tort: "full", notes: "One of the highest premiums in the US. Cannot use gender as a rating factor. Good Driver Discount mandatory for eligible drivers.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "Mercury", "Farmers"] },
  TX: { name: "Texas", avgPremium: 2310, minLiability: "30/60/25", noFault: false, tort: "full", notes: "Rising premiums due to severe weather events. Strong competition among insurers. Personal auto policies regulated by TDI.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "USAA", "Farmers"] },
  FL: { name: "Florida", avgPremium: 3183, minLiability: "10/20/10", noFault: true, tort: "no-fault", notes: "Highest premiums in the US. No-fault PIP required. High fraud rates and hurricane risk drive costs. Consider insurer financial strength carefully.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "Citizens"] },
  NY: { name: "New York", avgPremium: 2994, minLiability: "25/50/10", noFault: true, tort: "no-fault", notes: "Second highest US premiums. No-fault PIP required. NYC drivers pay significantly more than upstate. High fraud rates.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "NY Central Mutual"] },
  IL: { name: "Illinois", avgPremium: 1566, minLiability: "25/50/20", noFault: false, tort: "full", notes: "Moderate premiums with strong competition. Chicago drivers pay significantly more than rural areas.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "Erie"] },
  PA: { name: "Pennsylvania", avgPremium: 1478, minLiability: "15/30/5", noFault: "choice", tort: "choice", notes: "Choice no-fault state, choose limited tort (lower premium) or full tort (sue for any injury). Full tort recommended.", insurers: ["State Farm", "GEICO", "Progressive", "Erie", "Nationwide"] },
  OH: { name: "Ohio", avgPremium: 1034, minLiability: "25/50/25", noFault: false, tort: "full", notes: "Among the lowest premiums in the US. Strong competition, low fraud rates, moderate weather risk.", insurers: ["State Farm", "GEICO", "Progressive", "Nationwide", "Erie"] },
  GA: { name: "Georgia", avgPremium: 2359, minLiability: "25/50/25", noFault: false, tort: "full", notes: "Rising premiums due to severe weather and high accident rates. Atlanta metro significantly more expensive than rural areas.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "Farmers"] },
  NC: { name: "North Carolina", avgPremium: 1392, minLiability: "30/60/25", noFault: false, tort: "full", notes: "NCRB (Rate Bureau) regulates rates tightly. Competitive market with strong regional insurers. Relatively affordable.", insurers: ["State Farm", "GEICO", "Progressive", "North Carolina Farm Bureau", "Erie"] },
  WA: { name: "Washington", avgPremium: 1701, minLiability: "25/50/10", noFault: false, tort: "full", notes: "Moderate premiums. Seattle metro significantly more expensive. Cannot use credit score as of 2025.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "Pemco"] },
  AZ: { name: "Arizona", avgPremium: 2026, minLiability: "25/50/15", noFault: false, tort: "full", notes: "Rising premiums due to car theft and severe weather. Phoenix metro among most expensive in state.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "Farmers"] },
  CO: { name: "Colorado", avgPremium: 2568, minLiability: "25/50/15", noFault: false, tort: "full", notes: "Sharply rising premiums due to hailstorms and high accident rates. Comprehensive especially important for hail damage.", insurers: ["State Farm", "GEICO", "Progressive", "Allstate", "Farmers"] },
  MI: { name: "Michigan", avgPremium: 2864, minLiability: "50/100/10", noFault: true, tort: "no-fault", notes: "Third highest US premiums. Unlimited PIP medical historically drove costs. 2019 reform allows PIP limits, choose carefully.", insurers: ["State Farm", "Progressive", "Allstate", "Farm Bureau", "Auto-Owners"] },
  WI: { name: "Wisconsin", avgPremium: 1087, minLiability: "25/50/10", noFault: false, tort: "full", notes: "Among the most affordable US states. Low population density, low fraud rates, moderate weather.", insurers: ["State Farm", "GEICO", "Progressive", "American Family", "Erie"] },
};

// Vehicle cost to insure (monthly full coverage estimates)
const VEHICLE_COSTS = {
  "Honda Civic": { ca: 145, us: 110, theft: "High", rating: "Good", notes: "Most stolen car in Canada 2024. Consider comprehensive carefully." },
  "Honda CR-V": { ca: 158, us: 104, theft: "Medium", rating: "Excellent", notes: "Strong safety ratings reduce collision premium." },
  "Toyota Corolla": { ca: 138, us: 107, theft: "Low", rating: "Excellent", notes: "Low repair costs and excellent safety = one of cheapest to insure." },
  "Toyota RAV4": { ca: 162, us: 113, theft: "Very High", rating: "Good", notes: "Top 3 stolen vehicles in Canada. Comprehensive premium will be high." },
  "Ford F-150": { ca: 175, us: 131, theft: "High", rating: "Good", notes: "Trucks have lower collision risk but higher repair costs." },
  "Dodge RAM 1500": { ca: 182, us: 138, theft: "High", rating: "Good", notes: "Higher repair costs than F-150. Consider deductible carefully." },
  "Tesla Model Y": { ca: 285, us: 241, theft: "Low", rating: "Good", notes: "Expensive to repair, even minor fender benders cost $5,000+. Premium reflects repair cost." },
  "Tesla Model 3": { ca: 262, us: 218, theft: "Low", rating: "Excellent", notes: "Strong safety ratings but very expensive parts. Monthly premium reflects this." },
  "Subaru Outback": { ca: 142, us: 96, theft: "Low", rating: "Excellent", notes: "One of cheapest mid-size SUVs to insure. Strong safety + low theft + affordable parts." },
  "BMW 3 Series": { ca: 218, us: 175, theft: "Medium", rating: "Good", notes: "Luxury vehicles cost more to repair. Even OEM parts are expensive." },
  "Mercedes C-Class": { ca: 235, us: 188, theft: "Medium", rating: "Good", notes: "High parts cost and specialized repair shops drive premium up." },
  "Ford Mustang": { ca: 245, us: 201, theft: "Low", rating: "Below Average", notes: "Sports cars carry higher statistical accident risk. Young male drivers pay premium price." },
  "Chevrolet Silverado": { ca: 172, us: 127, theft: "Medium", rating: "Good", notes: "Large pickup, affordable parts vs F-150 but similar theft exposure." },
  "Hyundai Tucson": { ca: 155, us: 108, theft: "High", rating: "Good", notes: "Hyundai vehicles had high theft rates 2022-2024. Software fix available, get it installed." },
  "Kia Sorento": { ca: 158, us: 112, theft: "High", rating: "Good", notes: "Same Kia/Hyundai theft vulnerability. Confirm software update with dealer." },
  "Nissan Sentra": { ca: 141, us: 103, theft: "Low", rating: "Good", notes: "Affordable to insure. Low repair costs and low theft risk." },
  "Jeep Grand Cherokee": { ca: 192, us: 154, theft: "Medium", rating: "Below Average", notes: "Higher rollover risk historically. Premium reflects this." },
  "GMC Sierra": { ca: 178, us: 134, theft: "Medium", rating: "Good", notes: "Similar to Silverado, solid value for truck insurance." },
  "Volkswagen Golf": { ca: 152, us: 109, theft: "Low", rating: "Excellent", notes: "European build but affordable parts. Strong safety ratings." },
  "Mazda CX-5": { ca: 148, us: 101, theft: "Low", rating: "Excellent", notes: "Consistently one of the cheapest SUVs to insure. Excellent safety, low theft." },
};

// Rating factors
const RATING_FACTORS = [
  { factor: "Driving record", impact: "Very High", detail: "One at-fault accident can raise your premium 20-40% for 6 years in Ontario. Tickets (speeding 20km+ over) add 5-25%. A clean record is worth protecting, consider accident forgiveness." },
  { factor: "Age and experience", impact: "Very High", detail: "Drivers under 25 pay 2-4x more than experienced adults. A 20-year-old pays ~$393/mo vs $187 for a 40-year-old. Rates drop significantly at 25." },
  { factor: "Vehicle make and model", impact: "High", detail: "The car you drive can change your premium by $100-200/month. A Tesla Model Y costs $145 more/month to insure than a Subaru Outback, both mid-size SUVs." },
  { factor: "Where you live", impact: "High", detail: "Your postal/ZIP code matters enormously. Downtown Toronto drivers pay 40-60% more than Sudbury drivers. Urban density, theft rates, and accident frequency all factor in." },
  { factor: "Coverage limits and deductibles", impact: "High", detail: "A $500 deductible vs $2,000 deductible can save 20-30% on collision premium. Higher liability limits add relatively little to premium but protect your assets significantly." },
  { factor: "Annual mileage", impact: "Medium", detail: "Low-mileage drivers (<10,000 km/yr) often qualify for discounts. Telematics programs can verify this and save 10-30%." },
  { factor: "Credit score (US only)", impact: "Medium", detail: "Most US states allow credit score as a rating factor. A poor credit score can increase premiums 40-80% in some states. California, Hawaii, and Washington prohibit this." },
  { factor: "Marital status", impact: "Low-Medium", detail: "Married drivers statistically have fewer accidents. Premium reduction is modest (3-7%) but applies in most jurisdictions." },
  { factor: "Bundling (home + auto)", impact: "Medium", detail: "Bundling home and auto insurance typically saves 10-25%. Most major insurers offer multi-policy discounts." },
  { factor: "Winter tires (Canada)", impact: "Medium", detail: "Most Canadian insurers offer 5-15% discount for winter tires. Quebec mandates them Dec 1-Mar 15. Mandatory in most of BC in winter conditions." },
];

const DISCOUNTS = [
  { name: "Multi-vehicle", savings: "10-20%", desc: "Insure 2+ vehicles with the same company" },
  { name: "Bundle home + auto", savings: "10-25%", desc: "Home and auto with same insurer" },
  { name: "Winter tires (Canada)", savings: "5-15%", desc: "Most CA insurers discount for winter tires" },
  { name: "Telematics / usage-based", savings: "10-30%", desc: "App tracks driving habits and rewards safe drivers" },
  { name: "Loyalty", savings: "3-10%", desc: "Staying with same insurer 3+ years" },
  { name: "Winter storage", savings: "15-25%", desc: "Storing vehicle seasonally (no driving Nov-Mar)" },
  { name: "Good student", savings: "5-15%", desc: "Full-time students with B+ average" },
  { name: "Mature driver course", savings: "5-10%", desc: "Defensive driving course (55+ drivers)" },
  { name: "New vehicle", savings: "5-10%", desc: "New cars have better safety tech" },
  { name: "Accident-free", savings: "5-20%", desc: "Clean record for 3-6+ years" },
  { name: "Winter storage", savings: "15-25%", desc: "Seasonal storage, comprehensive only Nov-Apr" },
  { name: "Paperless / autopay", savings: "2-5%", desc: "Small discount for digital billing" },
];

const COVERAGE_TYPES = [
  {
    name: "Third-Party Liability", required: true, ca: true, us: true,
    what: "Pays for damage you cause to other people's property and bodily injury. This is the most important coverage you can have.",
    caMin: "$200,000 minimum in most provinces. Experts recommend $1M-$2M, a serious accident lawsuit can easily exceed $200K.",
    usMin: "Varies by state (e.g., 25/50/25 means $25K/person, $50K/accident, $25K property). Experts recommend 100/300/100.",
    riskOfSkipping: "You could be personally liable for hundreds of thousands of dollars if you seriously injure someone.",
  },
  {
    name: "Accident Benefits (CA) / PIP (US)", required: true, ca: true, us: "some",
    what: "Pays your medical expenses, income replacement, and rehabilitation costs regardless of who caused the accident.",
    caMin: "Mandatory in all provinces. Amounts vary, Ontario statutory benefits start at $3,500 for minor injuries.",
    usMin: "Required in no-fault states. Minimum limits often inadequate, consider higher amounts.",
    riskOfSkipping: "Required by law in Canada. In the US, if you're in a no-fault state, you must carry it.",
  },
  {
    name: "Collision", required: false, ca: true, us: true,
    what: "Pays to repair or replace your car if you hit another vehicle or object, regardless of fault.",
    caMin: "Optional but required by lenders/lessors if you finance or lease your vehicle.",
    usMin: "Optional unless required by lender. Worth carrying if your car is worth more than $4,000.",
    riskOfSkipping: "You pay 100% of repair costs if you cause an accident. On a $40,000 car this could be devastating.",
  },
  {
    name: "Comprehensive", required: false, ca: true, us: true,
    what: "Covers theft, vandalism, fire, flooding, hail, hitting an animal, and other non-collision damage.",
    caMin: "Optional but highly recommended in Canada given extreme weather and high theft rates (especially Honda Civic, Toyota RAV4).",
    usMin: "Optional. Essential in states with severe weather (FL, CO, TX) and high theft areas.",
    riskOfSkipping: "Your car is stolen = you get nothing. Your car is destroyed by a hailstorm = you pay full replacement.",
  },
  {
    name: "Uninsured Motorist", required: true, ca: true, us: "most",
    what: "Protects you if you're hit by a driver with no insurance or insufficient insurance.",
    caMin: "Mandatory in all Canadian provinces.",
    usMin: "Required in many states. About 12% of US drivers are uninsured, essential protection.",
    riskOfSkipping: "If an uninsured driver totals your car and injures you, you may have no recourse.",
  },
  {
    name: "Accident Forgiveness", required: false, ca: true, us: true,
    what: "Protects your premium from increasing after your first at-fault accident.",
    caMin: "Available as an add-on from most major Canadian insurers. Very worthwhile after 5+ years of clean record.",
    usMin: "Available from most major US insurers as a policy feature or endorsement.",
    riskOfSkipping: "One at-fault accident can raise your premium 20-40% for 6 years in Ontario. Forgiveness is often worth the cost.",
  },
  {
    name: "Replacement Cost", required: false, ca: true, us: true,
    what: "Pays to replace your vehicle with a brand-new equivalent, not the depreciated value.",
    caMin: "Usually available for vehicles under 2 years old. Without it, a $40,000 car written off after 2 years might only get you $28,000.",
    usMin: "Called 'new car replacement' in the US. Usually available for vehicles under 2 years old.",
    riskOfSkipping: "Standard collision/comprehensive only pays depreciated value, could be thousands less than what you need to replace the car.",
  },
];

const SWITCHING_TIPS = [
  { tip: "Start shopping 30 days before renewal", detail: "Your insurer relies on inertia. 30 days gives you time to compare without a coverage gap. Most insurers will match a competitor's quote if you ask directly." },
  { tip: "Never cancel before you have a new policy", detail: "A lapse in coverage, even 1 day, can be rated as 'no prior insurance' and increase your premium significantly. Always have overlap." },
  { tip: "Check your new policy starts the day your old one ends", detail: "Coordinate exact dates. Your new insurer needs your old policy's expiry date." },
  { tip: "Get at least 3 quotes", detail: "Comparing 3 companies saves an average of $709/year. The same coverage can vary by $1,000+ between insurers for the same driver profile." },
  { tip: "Ask about early cancellation fees", detail: "Some insurers charge a short-rate penalty for cancelling mid-term. Others use pro-rata (you get back exactly the unused portion). Know before you cancel." },
  { tip: "Tell your new insurer about all vehicles and drivers", detail: "Failure to disclose household drivers, even occasional ones, can void your coverage at claim time. Disclose everyone in your household with a license." },
  { tip: "Update your mortgage lender if you have a home", detail: "If you bundle home and auto, your mortgage lender is listed on your home policy. When you switch, send proof of new coverage within 30 days." },
  { tip: "Transfer your claims history, not just your rating", detail: "In Canada, your insurance history follows your Ontario/provincial policy number. Ask your new insurer how to transfer your experience properly." },
];

const FAQ = [
  { q: "What factors affect my car insurance rate the most?", a: "Your driving record has the single biggest impact, one at-fault accident can raise premiums 20-40% for up to 6 years. Your age (under 25 means 2-4x higher rates), vehicle choice (a Tesla costs $145/month more than a Subaru Outback), and where you live (downtown Toronto vs. Sudbury) are the other major factors. Bundling home and auto, installing winter tires, and choosing a higher deductible are the fastest ways to reduce your premium." },
  { q: "Why is Ontario the most expensive province for car insurance?", a: "Ontario's high premiums stem from several factors: dense traffic leading to more accidents, high rates of insurance fraud (estimated $1.6 billion annually), a regulated tort system that allows injury lawsuits, and some of North America's highest accident benefit payouts. Ontario drivers pay roughly $1,920/year on average, twice what Quebec drivers pay for equivalent coverage." },
  { q: "Why does BC, Manitoba, and Saskatchewan use public car insurance?", a: "These provinces use government-run insurance monopolies, ICBC (BC), MPI (Manitoba), and SGI (Saskatchewan). The theory is that removing profit motive lowers rates. In practice, BC and Manitoba rates are moderate, while Saskatchewan is among Canada's most affordable. BC switched to a no-fault system in 2021 to reduce costs. Drivers in these provinces cannot shop around for basic coverage." },
  { q: "What is the difference between no-fault and tort car insurance?", a: "In a no-fault system (BC, Manitoba, Saskatchewan, Quebec, and some US states), you claim from your own insurer regardless of who caused the accident. This speeds up claims but limits your right to sue for pain and suffering. In a tort system (Ontario, Alberta, Atlantic provinces, most US states), you can sue the at-fault driver for damages. Tort systems typically have higher premiums but more compensation options for serious injuries." },
  { q: "How much liability insurance do I really need?", a: "The legal minimum ($200K in most Canadian provinces, 25/50/25 in most US states) is dangerously low. A serious accident can result in millions in medical costs and lawsuits. Most insurance professionals recommend at least $1 million in liability coverage in Canada and 100/300/100 in the US. The cost difference between minimum and $1M is often only $5-15/month, a small price for enormous protection." },
  { q: "Should I choose a higher or lower deductible?", a: "A higher deductible ($1,000-$2,000) lowers your monthly premium but means you pay more out of pocket after a claim. If you have a solid emergency fund and are a safe driver, a higher deductible makes sense. If an unexpected $2,000 expense would be a hardship, stick with a lower deductible. Calculate the annual premium savings and divide by the deductible difference to find your break-even point." },
  { q: "Does my credit score affect car insurance in Canada?", a: "In Canada, insurers are generally prohibited from using credit score as a rating factor in most provinces, unlike the US where it is widely used. However, insurers may use credit information for payment plans and administrative purposes. In the US, a poor credit score can increase your car insurance premium by 40-80% in most states. California, Hawaii, Massachusetts, and Washington prohibit credit-based insurance scoring." },
  { q: "How do I get a discount for being a new Canadian driver?", a: "Your driving experience from another country can often be recognized by Canadian insurers. Bring your foreign driver's license, your international driving record (obtained from your home country's DMV/transport authority), and any proof of no-claims history. Some insurers (particularly Intact and Aviva) have specific newcomer programs. ICBC in BC has a formal International Driver Experience Program." },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtC(n) { return "$" + Math.round(n).toLocaleString(); }

function getPremiumColor(premium, avg) {
  const ratio = premium / avg;
  if (ratio <= 0.85) return "#22c55e";
  if (ratio <= 1.15) return "#f59e0b";
  return "#ef4444";
}

function calcSavings(current, newPremium) {
  return current - newPremium;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function CarInsuranceGuide() {
  const [country, setCountry] = useState("CA");
  const [province, setProvince] = useState("ON");
  const [usState, setUsState] = useState("CA");
  const [tab, setTab] = useState("guide");
  const [lightMode, setLightMode] = useState(() => localStorage.getItem("cig_theme") === "light");
  const [openFaq, setOpenFaq] = useState(null);
  const [openCoverage, setOpenCoverage] = useState(null);
  const [openFactor, setOpenFactor] = useState(null);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [currentPremium, setCurrentPremium] = useState(1800);
  const [driverAge, setDriverAge] = useState(35);
  const [driverRecord, setDriverRecord] = useState("clean");
  const [annualKm, setAnnualKm] = useState(15000);
  const [hasWinterTires, setHasWinterTires] = useState(false);
  const [hasBundle, setHasBundle] = useState(false);
  const [hasTelematics, setHasTelematics] = useState(false);
  const [vehicleAge, setVehicleAge] = useState(3);
  const [coverageLevel, setCoverageLevel] = useState("full");
  const [deductible, setDeductible] = useState(500);
  const [copied, setCopied] = useState(false);
  const lm = lightMode;

  useEffect(() => { localStorage.setItem("cig_theme", lm ? "light" : "dark"); }, [lm]);

  // URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("country") === "US") setCountry("US");
    if (params.get("province") && CA_PROVINCES[params.get("province")]) setProvince(params.get("province"));
    if (params.get("state") && US_STATES[params.get("state")]) setUsState(params.get("state"));
    const loc = country === "CA" ? CA_PROVINCES[province]?.name : US_STATES[usState]?.name;
    document.title = `Car Insurance Guide ${loc ? `,  ${loc}` : "Canada & US"} | CarInsureGuide.com`;
  }, []);

  const locationData = country === "CA" ? CA_PROVINCES[province] : US_STATES[usState];

  // Estimate calculator
  const estimate = (() => {
    const base = locationData?.avgPremium || 1600;
    let monthly = base / 12;
    if (driverAge < 25) monthly *= 1.8;
    else if (driverAge < 30) monthly *= 1.25;
    else if (driverAge > 65) monthly *= 1.1;
    if (driverRecord === "one_accident") monthly *= 1.3;
    else if (driverRecord === "two_plus") monthly *= 1.6;
    else if (driverRecord === "dui") monthly *= 2.2;
    if (annualKm < 10000) monthly *= 0.9;
    else if (annualKm > 25000) monthly *= 1.1;
    if (coverageLevel === "liability_only") monthly *= 0.45;
    if (deductible >= 1000) monthly *= 0.85;
    if (deductible >= 2000) monthly *= 0.75;
    let discounts = 0;
    if (hasWinterTires && country === "CA") discounts += 0.08;
    if (hasBundle) discounts += 0.15;
    if (hasTelematics) discounts += 0.15;
    monthly *= (1 - discounts);
    const annual = monthly * 12;
    const savings = currentPremium - annual;
    return { monthly: Math.round(monthly), annual: Math.round(annual), savings: Math.round(savings), discountPct: Math.round(discounts * 100) };
  })();

  const filteredVehicles = Object.entries(VEHICLE_COSTS).filter(([name]) =>
    name.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif", background: lm ? "#f5f7fa" : "#080c12", color: lm ? "#111827" : "#e8edf4", minHeight: "100vh", overflowX: "hidden", transition: "background 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Mono:wght@400;700&display=swap');
        :root {
          --bg: ${lm ? "#f5f7fa" : "#080c12"};
          --bg2: ${lm ? "#ffffff" : "#0e1420"};
          --bg3: ${lm ? "#f0f3f8" : "#141b28"};
          --border: ${lm ? "rgba(220,38,38,0.2)" : "rgba(239,68,68,0.2)"};
          --border2: ${lm ? "rgba(220,38,38,0.09)" : "rgba(239,68,68,0.09)"};
          --red: ${lm ? "#dc2626" : "#f87171"};
          --red-dim: ${lm ? "rgba(220,38,38,0.08)" : "rgba(248,113,113,0.1)"};
          --gold: ${lm ? "#b45309" : "#fbbf24"};
          --green: ${lm ? "#16a34a" : "#4ade80"};
          --text: ${lm ? "#111827" : "#e8edf4"};
          --text2: ${lm ? "#4b5563" : "#8899aa"};
          --text3: ${lm ? "#9ca3af" : "#445566"};
          --radius: 14px;
        }
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:var(--bg);font-family:'Outfit',system-ui}
        input,button,select{font-family:'Outfit',system-ui}
        button{cursor:pointer;border:none;background:none;color:inherit}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:var(--bg2)}
        ::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px}
        .fade-in{animation:fadeIn 0.3s ease}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .tab-btn{padding:9px 16px;border-radius:9px;font-size:12px;font-weight:700;transition:all 0.2s;color:var(--text2);border:1px solid transparent;white-space:nowrap;cursor:pointer}
        .tab-btn:hover{color:var(--text);background:var(--red-dim)}
        .tab-btn.active{background:var(--red-dim);border-color:var(--border);color:var(--red)}
        .card{background:var(--bg2);border:1px solid var(--border2);border-radius:var(--radius);padding:18px}
        .card:hover{border-color:var(--border)}
        .faq-item{border-bottom:1px solid var(--border2)}
        .faq-q{padding:16px 0;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-size:14px;font-weight:600;gap:12px;color:var(--text)}
        .faq-q:hover{color:var(--red)}
        .faq-a{font-size:13px;color:var(--text2);line-height:1.75;padding-bottom:16px}
        .br-row{display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border2);font-size:13px}
        .br-row:last-child{border-bottom:none}
        .grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
        .select{background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;outline:none;width:100%}
        .range{width:100%;accent-color:var(--red);height:4px;cursor:pointer}
        .num-input{width:100%;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text);font-size:13px;outline:none}
        .num-input:focus{border-color:var(--red)}
        .badge{font-size:10px;padding:2px 8px;border-radius:20px;font-weight:700;display:inline-block}
        .b-red{background:rgba(239,68,68,0.12);color:var(--red)}
        .b-green{background:rgba(74,222,128,0.12);color:var(--green)}
        .b-gold{background:rgba(251,191,36,0.12);color:var(--gold)}
        .b-blue{background:rgba(59,130,246,0.12);color:#60a5fa}
        .pill-btn{padding:6px 14px;border-radius:20px;font-size:12px;font-weight:600;border:1px solid var(--border2);background:transparent;color:var(--text2);cursor:pointer;transition:all 0.15s}
        .pill-btn:hover,.pill-btn.active{border-color:var(--border);color:var(--red);background:var(--red-dim)}
        .vehicle-row{padding:10px 12px;border-radius:8px;cursor:pointer;transition:background 0.15s;border:1px solid transparent;margin-bottom:4px}
        .vehicle-row:hover{background:var(--bg3);border-color:var(--border2)}
        .vehicle-row.selected{background:var(--red-dim);border-color:var(--border)}
        .prov-btn{padding:7px 12px;border-radius:8px;font-size:12px;font-weight:700;border:1px solid var(--border2);background:transparent;color:var(--text2);cursor:pointer;transition:all 0.15s;white-space:nowrap}
        .prov-btn:hover{border-color:var(--border);color:var(--red)}
        .prov-btn.active{background:var(--red-dim);border-color:var(--border);color:var(--red)}
        .mono{font-family:'Space Mono',monospace}
        @media print{header,.tab-btn,.range,.num-input,.select,button:not(.no-print){display:none!important}body{background:white!important;color:black!important}}
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--border2)", background: "var(--bg2)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#dc2626,#991b1b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🚗</div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.5px" }}>
                CarInsure<span style={{ color: "var(--red)" }}>Guide</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 500 }}>
                {country === "CA" ? (CA_PROVINCES[province]?.name || "Canada") : (US_STATES[usState]?.name || "US")} · Free · No signup
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 3, background: "var(--bg3)", borderRadius: 8, padding: 3 }}>
              {["CA", "US"].map(c => (
                <button key={c} onClick={() => setCountry(c)} style={{ padding: "5px 12px", borderRadius: 6, background: country === c ? "var(--red)" : "transparent", color: country === c ? "#fff" : "var(--text2)", fontSize: 12, fontWeight: 700 }}>
                  {c === "CA" ? "🇨🇦 Canada" : "🇺🇸 US"}
                </button>
              ))}
            </div>
            <button onClick={() => setLightMode(v => !v)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", fontSize: 15 }}>{lm ? "🌙" : "☀️"}</button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "18px 16px 80px" }}>

        {/* Province/State selector */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "var(--text2)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {country === "CA" ? "Select your province" : "Select your state"}
          </div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {country === "CA"
              ? Object.entries(CA_PROVINCES).map(([code, data]) => (
                <button key={code} className={`prov-btn ${province === code ? "active" : ""}`} onClick={() => setProvince(code)}>
                  {code}
                  {data.system === "public" && <span style={{ marginLeft: 3, fontSize: 9, color: "var(--text3)" }}>pub</span>}
                </button>
              ))
              : Object.entries(US_STATES).map(([code, data]) => (
                <button key={code} className={`prov-btn ${usState === code ? "active" : ""}`} onClick={() => setUsState(code)}>
                  {code}
                </button>
              ))
            }
          </div>
        </div>

        {/* Province/State highlight banner */}
        {locationData && (
          <div className="fade-in" style={{ marginBottom: 18, padding: "14px 18px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>
                {locationData.name}, {locationData.system === "public" ? "🏛️ Public Insurance" : locationData.system === "hybrid" ? "🔀 Hybrid System" : "🏢 Private Insurance"}
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.65, maxWidth: 600 }}>{locationData.notes}</div>
              {locationData.firstTimeSavings && (
                <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", background: "rgba(74,222,128,0.08)", padding: "5px 10px", borderRadius: 6, display: "inline-block" }}>
                  💡 {locationData.firstTimeSavings}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, color: "var(--text2)", marginBottom: 2 }}>Average annual premium</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: getPremiumColor(locationData.avgPremium, 1400), fontFamily: "'Space Mono',monospace" }}>{fmtC(locationData.avgPremium)}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{fmtC(Math.round(locationData.avgPremium / 12))}/mo · 2025 average</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid var(--border2)", paddingBottom: 10, overflowX: "auto" }}>
          {[
            ["guide", "🗺️ Province Guide"],
            ["estimate", "🧮 Rate Estimator"],
            ["vehicles", "🚗 Insurance by Vehicle"],
            ["coverage", "🛡️ Coverage Explainer"],
            ["discounts", "💰 Discounts Finder"],
            ["factors", "📊 Rating Factors"],
            ["switching", "🔄 Switching Guide"],
            ["glossary", "📖 Glossary"],
          ].map(([id, label]) => (
            <button key={id} className={`tab-btn ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* ── PROVINCE GUIDE TAB ── */}
        {tab === "guide" && (
          <div className="fade-in">
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: "var(--text)" }}>
              {country === "CA" ? "🇨🇦 Canadian Car Insurance Guide" : "🇺🇸 US Car Insurance Guide"}, {locationData?.name}
            </div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>
              {country === "CA"
                ? "Car insurance in Canada is provincially regulated. Each province has different rules, minimums, and systems. Here's exactly what you need to know."
                : "US car insurance varies significantly by state. Coverage requirements, legal systems, and average costs differ enormously. Here's what matters in your state."}
            </p>

            <div className="grid2">
              {/* Mandatory coverage */}
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
                  ✅ Mandatory Coverage in {locationData?.name}
                </div>
                {locationData?.mandatoryCoverage?.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border2)", alignItems: "flex-start", fontSize: 13 }}>
                    <span style={{ color: "var(--green)", flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ color: "var(--text2)" }}>{c}</span>
                  </div>
                ))}
              </div>

              {/* Optional coverage */}
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
                  ➕ Optional Coverage in {locationData?.name}
                </div>
                {locationData?.optionalCoverage?.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border2)", alignItems: "flex-start", fontSize: 13 }}>
                    <span style={{ color: "var(--text2)", flexShrink: 0, marginTop: 1 }}>+</span>
                    <span style={{ color: "var(--text2)" }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insurer list */}
            <div className="card" style={{ marginTop: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
                🏢 Major Insurers in {locationData?.name}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {locationData?.insurers?.map(ins => (
                  <span key={ins} style={{ padding: "5px 12px", background: "var(--bg3)", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid var(--border2)" }}>{ins}</span>
                ))}
              </div>
              {country === "CA" && locationData?.system === "private" && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text2)", padding: "8px 12px", background: "var(--red-dim)", borderRadius: 8, border: "1px solid var(--border)" }}>
                  💡 Private insurance province, you can and should shop around. Getting 3+ quotes at renewal can save you $500-1,500/year.
                </div>
              )}
              {country === "CA" && locationData?.system === "public" && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text2)", padding: "8px 12px", background: "rgba(59,130,246,0.08)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.2)" }}>
                  🏛️ Public insurance province, basic coverage is fixed by the government. You can still shop for optional collision and comprehensive from private insurers.
                </div>
              )}
            </div>

            {/* Province comparison table */}
            {country === "CA" && (
              <div className="card" style={{ marginTop: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>📊 Canada Province Comparison</div>
                <div style={{ overflowX: "auto" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 80px", gap: 8, padding: "5px 8px", fontSize: 10, color: "var(--text3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", minWidth: 460 }}>
                    <div>Province</div><div>Avg/Year</div><div>System</div><div>Tort</div><div>Min Liab</div>
                  </div>
                  {Object.entries(CA_PROVINCES).map(([code, data]) => (
                    <div key={code} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 80px", gap: 8, padding: "8px 8px", borderRadius: 6, background: code === province ? "var(--red-dim)" : "transparent", cursor: "pointer", minWidth: 460, fontSize: 13 }}
                      onClick={() => setProvince(code)}>
                      <div style={{ fontWeight: 700, color: code === province ? "var(--red)" : "var(--text)" }}>{data.name}{code === province ? " ✓" : ""}</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontWeight: 700, color: getPremiumColor(data.avgPremium, 1400) }}>{fmtC(data.avgPremium)}</div>
                      <div style={{ color: "var(--text2)" }}>
                        <span className={`badge ${data.system === "public" ? "b-blue" : data.system === "hybrid" ? "b-gold" : "b-red"}`}>{data.system}</span>
                      </div>
                      <div style={{ color: "var(--text2)", fontSize: 11 }}>{data.tort}</div>
                      <div style={{ color: "var(--text2)", fontFamily: "'Space Mono',monospace", fontSize: 11 }}>${(data.minLiability / 1000).toFixed(0)}K</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Affiliate placement */}
            <div style={{ marginTop: 16, padding: "14px 18px", background: "linear-gradient(135deg,var(--red-dim),transparent)", border: "1px solid var(--border)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 3 }}>
                  Ready to find a better rate in {locationData?.name}?
                </div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>
                  Compare quotes from top insurers. {country === "CA" ? "Takes 5 minutes. No obligation." : "Average savings: $709/year. No credit check."}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {country === "CA" ? (
                  <>
                    <a href="https://www.ratehub.ca/car-insurance" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 18px", borderRadius: 9, background: "var(--red)", color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Compare on Ratehub →</a>
                    <a href="https://www.kanetix.ca" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 16px", borderRadius: 9, background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Kanetix.ca →</a>
                  </>
                ) : (
                  <>
                    <a href="https://www.insurify.com" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 18px", borderRadius: 9, background: "var(--red)", color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Compare on Insurify →</a>
                    <a href="https://www.thezebra.com" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 16px", borderRadius: 9, background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>The Zebra →</a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── RATE ESTIMATOR TAB ── */}
        {tab === "estimate" && (
          <div className="fade-in">
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: "var(--text)" }}>Rate Estimator</div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>Get a rough estimate of what you should be paying, and see which factors are costing you the most.</p>

            <div className="grid2">
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="card">
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 14 }}>Your driver profile</div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="br-row" style={{ border: "none", paddingBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>Driver age</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--red)", fontFamily: "'Space Mono',monospace" }}>{driverAge}</span>
                    </div>
                    <input type="range" className="range" min={16} max={80} step={1} value={driverAge} onChange={e => setDriverAge(+e.target.value)} />
                    {driverAge < 25 && <div style={{ fontSize: 11, color: "var(--red)", marginTop: 3 }}>⚠️ Under 25: premiums are 1.8x higher on average</div>}
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, marginBottom: 6 }}>Driving record</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {[["clean", "✅ Clean"], ["one_accident", "⚠️ 1 Accident"], ["two_plus", "❌ 2+ Incidents"], ["dui", "🚫 DUI/DWI"]].map(([val, label]) => (
                        <button key={val} onClick={() => setDriverRecord(val)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${driverRecord === val ? "var(--red)" : "var(--border2)"}`, background: driverRecord === val ? "var(--red-dim)" : "transparent", color: driverRecord === val ? "var(--red)" : "var(--text2)", fontSize: 12, fontWeight: 700 }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="br-row" style={{ border: "none", paddingBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>{country === "CA" ? "Annual km driven" : "Annual miles driven"}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", fontFamily: "'Space Mono',monospace" }}>{annualKm.toLocaleString()}</span>
                    </div>
                    <input type="range" className="range" min={2000} max={40000} step={1000} value={annualKm} onChange={e => setAnnualKm(+e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <div className="br-row" style={{ border: "none", paddingBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>Vehicle age (years)</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", fontFamily: "'Space Mono',monospace" }}>{vehicleAge} yrs old</span>
                    </div>
                    <input type="range" className="range" min={0} max={20} step={1} value={vehicleAge} onChange={e => setVehicleAge(+e.target.value)} />
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>Coverage and discounts</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, marginBottom: 6 }}>Coverage level</div>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[["liability_only", "Liability only"], ["full", "Full coverage"]].map(([val, label]) => (
                        <button key={val} onClick={() => setCoverageLevel(val)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${coverageLevel === val ? "var(--red)" : "var(--border2)"}`, background: coverageLevel === val ? "var(--red-dim)" : "transparent", color: coverageLevel === val ? "var(--red)" : "var(--text2)", fontSize: 12, fontWeight: 700 }}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div className="br-row" style={{ border: "none", paddingBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600 }}>Deductible</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", fontFamily: "'Space Mono',monospace" }}>{fmtC(deductible)}</span>
                    </div>
                    <input type="range" className="range" min={250} max={5000} step={250} value={deductible} onChange={e => setDeductible(+e.target.value)} />
                    {deductible >= 1000 && <div style={{ fontSize: 11, color: "var(--green)", marginTop: 3 }}>✅ Higher deductible saves ~{deductible >= 2000 ? "25" : "15"}% on collision/comprehensive</div>}
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, marginBottom: 8 }}>Active discounts</div>
                  {[
                    ...(country === "CA" ? [["hasWinterTires", hasWinterTires, setHasWinterTires, "❄️ Winter tires installed", "~8% discount"]] : []),
                    ["hasBundle", hasBundle, setHasBundle, "🏠 Bundle home + auto", "~15% discount"],
                    ["hasTelematics", hasTelematics, setHasTelematics, "📱 Telematics/usage-based", "~15% discount"],
                  ].map(([key, val, setter, label, saving]) => (
                    <div key={key} onClick={() => setter(v => !v)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, cursor: "pointer", background: val ? "var(--red-dim)" : "var(--bg3)", border: `1px solid ${val ? "var(--border)" : "var(--border2)"}`, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--text)" }}>{label}</span>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--green)" }}>{saving}</span>
                        <div style={{ width: 20, height: 20, borderRadius: "50%", background: val ? "var(--green)" : "var(--bg2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff" }}>{val ? "✓" : ""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Results */}
                <div className="card" style={{ background: lm ? "linear-gradient(135deg,#fef2f2,#fff)" : "linear-gradient(135deg,#1a0a0a,#0e1420)", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Estimated monthly premium</div>
                  <div style={{ fontSize: 44, fontWeight: 900, color: "var(--red)", fontFamily: "'Space Mono',monospace", letterSpacing: "-1px", lineHeight: 1 }}>{fmtC(estimate.monthly)}</div>
                  <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{fmtC(estimate.annual)}/year · {locationData?.name}</div>
                  {estimate.discountPct > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "var(--green)", background: "rgba(74,222,128,0.08)", padding: "4px 10px", borderRadius: 6, display: "inline-block" }}>
                      ✅ {estimate.discountPct}% in active discounts applied
                    </div>
                  )}
                </div>

                {/* Current vs estimated */}
                <div className="card">
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>Compare to what you pay now</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, marginBottom: 4 }}>Your current annual premium</div>
                    <input type="number" className="num-input" value={currentPremium} onChange={e => setCurrentPremium(+e.target.value)} />
                  </div>
                  {currentPremium > 0 && (
                    <div style={{ padding: "12px 14px", background: estimate.savings > 0 ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.06)", borderRadius: 10, border: `1px solid ${estimate.savings > 0 ? "rgba(74,222,128,0.2)" : "var(--border)"}` }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: estimate.savings > 0 ? "var(--green)" : "var(--red)", fontFamily: "'Space Mono',monospace" }}>
                        {estimate.savings > 0 ? `You may be overpaying ${fmtC(estimate.savings)}/yr` : `Your rate seems competitive`}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
                        {estimate.savings > 200 ? "Worth shopping around, get 3 quotes before your next renewal." : "Your current rate is near the estimated average for your profile."}
                      </div>
                    </div>
                  )}
                </div>

                {/* Key factors driving cost */}
                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>What's driving your estimate</div>
                  {[
                    { label: "Province/State base rate", val: fmtC((locationData?.avgPremium || 1600) / 12) + "/mo", color: "var(--text)" },
                    { label: "Age adjustment", val: driverAge < 25 ? "+80% (under 25)" : driverAge < 30 ? "+25%" : "No adjustment", color: driverAge < 25 ? "var(--red)" : driverAge < 30 ? "var(--gold)" : "var(--green)" },
                    { label: "Driving record", val: driverRecord === "clean" ? "No adjustment" : driverRecord === "one_accident" ? "+30%" : driverRecord === "two_plus" ? "+60%" : "+120% (DUI)", color: driverRecord === "clean" ? "var(--green)" : "var(--red)" },
                    { label: "Coverage level", val: coverageLevel === "liability_only" ? "-55% (liability only)" : "Full coverage", color: coverageLevel === "liability_only" ? "var(--gold)" : "var(--text)" },
                    { label: "Deductible choice", val: deductible >= 2000 ? "-25%" : deductible >= 1000 ? "-15%" : "Standard $500", color: deductible >= 1000 ? "var(--green)" : "var(--text)" },
                    { label: "Active discounts", val: estimate.discountPct > 0 ? `-${estimate.discountPct}%` : "None active", color: estimate.discountPct > 0 ? "var(--green)" : "var(--text3)" },
                  ].map(r => (
                    <div key={r.label} className="br-row">
                      <span style={{ color: "var(--text2)", fontSize: 12 }}>{r.label}</span>
                      <span style={{ color: r.color, fontWeight: 700, fontSize: 12 }}>{r.val}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div style={{ padding: "12px 14px", background: "var(--red-dim)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 13, color: "var(--text2)" }}>
                  <strong style={{ color: "var(--text)" }}>This is an estimate only</strong>, actual rates depend on your specific vehicle, address, credit history (US), and insurer. Always get 3+ real quotes.
                  <div style={{ marginTop: 8 }}>
                    <a href={country === "CA" ? "https://www.ratehub.ca/car-insurance" : "https://www.insurify.com"} target="_blank" rel="noopener noreferrer sponsored" style={{ color: "var(--red)", fontWeight: 700, textDecoration: "none" }}>
                      Get real quotes now →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── VEHICLES TAB ── */}
        {tab === "vehicles" && (
          <div className="fade-in">
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: "var(--text)" }}>Insurance Cost by Vehicle</div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 8 }}>
              <cite index="98-1">Your vehicle choice can add $100-200/month to your insurance costs. A Subaru Outback costs $96/month to insure vs $241 for a Tesla Model Y, both mid-size SUVs, but a $1,740/year gap.</cite>
            </p>
            <p style={{ fontSize: 13, color: "var(--text3)", marginBottom: 16 }}>Estimates based on full coverage for a 35-year-old driver with a clean record in an average urban area. Actual rates vary.</p>

            <div style={{ marginBottom: 14 }}>
              <input className="num-input" placeholder="Search vehicles..." value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} style={{ fontFamily: "'Outfit',system-ui", maxWidth: 300 }} />
            </div>

            <div className="grid2">
              <div>
                {filteredVehicles.map(([name, data]) => (
                  <div key={name} className={`vehicle-row ${selectedVehicle === name ? "selected" : ""}`} onClick={() => setSelectedVehicle(selectedVehicle === name ? null : name)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{name}</div>
                        <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                          <span className={`badge ${data.theft === "Very High" || data.theft === "High" ? "b-red" : data.theft === "Medium" ? "b-gold" : "b-green"}`}>
                            Theft: {data.theft}
                          </span>
                          <span className={`badge ${data.rating === "Excellent" ? "b-green" : data.rating === "Good" ? "b-blue" : "b-gold"}`}>
                            Safety: {data.rating}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: "var(--red)", fontFamily: "'Space Mono',monospace" }}>
                          {fmtC(country === "CA" ? data.ca : data.us)}/mo
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text3)" }}>~{fmtC((country === "CA" ? data.ca : data.us) * 12)}/yr</div>
                      </div>
                    </div>
                    {selectedVehicle === name && (
                      <div className="fade-in" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border2)", fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
                        {data.notes}
                        <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
                          <div><span style={{ color: "var(--text3)" }}>🇨🇦 Canada: </span><strong className="mono">{fmtC(data.ca)}/mo</strong></div>
                          <div><span style={{ color: "var(--text3)" }}>🇺🇸 US: </span><strong className="mono">{fmtC(data.us)}/mo</strong></div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Cheapest vs most expensive */}
                <div className="card" style={{ border: "1px solid rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.04)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--green)", marginBottom: 10 }}>✅ Cheapest to insure</div>
                  {Object.entries(VEHICLE_COSTS).sort((a, b) => (country === "CA" ? a[1].ca - b[1].ca : a[1].us - b[1].us)).slice(0, 5).map(([name, data], i) => (
                    <div key={name} className="br-row">
                      <span style={{ color: "var(--text2)", fontSize: 13 }}>{i + 1}. {name}</span>
                      <span style={{ color: "var(--green)", fontWeight: 800, fontFamily: "'Space Mono',monospace" }}>{fmtC(country === "CA" ? data.ca : data.us)}/mo</span>
                    </div>
                  ))}
                </div>

                <div className="card" style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.04)" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--red)", marginBottom: 10 }}>⚠️ Most expensive to insure</div>
                  {Object.entries(VEHICLE_COSTS).sort((a, b) => (country === "CA" ? b[1].ca - a[1].ca : b[1].us - a[1].us)).slice(0, 5).map(([name, data], i) => (
                    <div key={name} className="br-row">
                      <span style={{ color: "var(--text2)", fontSize: 13 }}>{i + 1}. {name}</span>
                      <span style={{ color: "var(--red)", fontWeight: 800, fontFamily: "'Space Mono',monospace" }}>{fmtC(country === "CA" ? data.ca : data.us)}/mo</span>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>🇨🇦 Canada stolen vehicle alert</div>
                  <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.65 }}>
                    Honda Civic, Toyota RAV4, and Ford F-150 have consistently topped Canada's most-stolen vehicle lists. If you own one, expect comprehensive premiums to reflect this, and ensure your insurer knows about any anti-theft devices or tracker subscriptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COVERAGE EXPLAINER TAB ── */}
        {tab === "coverage" && (
          <div className="fade-in">
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: "var(--text)" }}>Coverage Explainer</div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>Every type of car insurance explained in plain English, what it covers, when you need it, and what happens if you skip it.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {COVERAGE_TYPES.map((cov, i) => (
                <div key={cov.name} className="card" style={{ cursor: "pointer", border: openCoverage === i ? "1px solid var(--border)" : "1px solid var(--border2)" }} onClick={() => setOpenCoverage(openCoverage === i ? null : i)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        {cov.required && <span className="badge b-red">Required</span>}
                        {cov.ca && <span className="badge b-blue">🇨🇦 CA</span>}
                        {cov.us && <span className="badge b-blue">🇺🇸 US</span>}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{cov.name}</span>
                    </div>
                    <span style={{ color: "var(--red)", fontSize: 18, transform: openCoverage === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}>{cov.what}</div>
                  {openCoverage === i && (
                    <div className="fade-in" style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      {cov.caMin && (
                        <div style={{ padding: "8px 12px", background: "rgba(59,130,246,0.06)", borderRadius: 8, fontSize: 12, color: "var(--text2)" }}>
                          <strong style={{ color: "#60a5fa" }}>🇨🇦 Canada:</strong> {cov.caMin}
                        </div>
                      )}
                      {cov.usMin && (
                        <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.05)", borderRadius: 8, fontSize: 12, color: "var(--text2)" }}>
                          <strong style={{ color: "var(--red)" }}>🇺🇸 US:</strong> {cov.usMin}
                        </div>
                      )}
                      <div style={{ padding: "8px 12px", background: "rgba(239,68,68,0.06)", borderRadius: 8, fontSize: 12, color: "var(--text2)", borderLeft: "3px solid var(--red)" }}>
                        <strong style={{ color: "var(--red)" }}>Risk of skipping:</strong> {cov.riskOfSkipping}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── DISCOUNTS TAB ── */}
        {tab === "discounts" && (
          <div className="fade-in">
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: "var(--text)" }}>Discounts Finder</div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>Most drivers qualify for discounts they don't know about. Here's every discount available and how much each one saves.</p>
            <div className="grid2">
              {DISCOUNTS.map((d, i) => (
                <div key={i} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>{d.desc}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: "var(--green)", fontFamily: "'Space Mono',monospace", flexShrink: 0, textAlign: "right" }}>
                    {d.savings}
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ marginTop: 14, border: "1px solid rgba(74,222,128,0.25)", background: "rgba(74,222,128,0.04)" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--green)", marginBottom: 8 }}>💡 Maximum discount stacking example</div>
              <p style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>
                A driver who bundles home and auto (15%), installs winter tires (8%), and signs up for telematics (15%) could reduce their premium by up to 38%. On a $1,920 Ontario average premium, that's <strong style={{ color: "var(--green)" }}>$730/year saved</strong>, without switching insurers.
              </p>
              <p style={{ fontSize: 12, color: "var(--text3)", marginTop: 8 }}>Note: Discounts don't always stack additively, insurers may cap total discounts. Ask your broker for the exact calculation.</p>
            </div>
          </div>
        )}

        {/* ── RATING FACTORS TAB ── */}
        {tab === "factors" && (
          <div className="fade-in">
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: "var(--text)" }}>Rating Factors</div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>Understanding how insurers calculate your rate gives you power to reduce it. Here's every factor explained.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RATING_FACTORS.map((f, i) => (
                <div key={i} className="card" style={{ cursor: "pointer" }} onClick={() => setOpenFactor(openFactor === i ? null : i)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className={`badge ${f.impact === "Very High" ? "b-red" : f.impact === "High" ? "b-gold" : "b-blue"}`}>{f.impact} impact</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{f.factor}</span>
                    </div>
                    <span style={{ color: "var(--red)", fontSize: 18, transform: openFactor === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                  </div>
                  {openFactor === i && (
                    <div className="fade-in" style={{ marginTop: 10, fontSize: 13, color: "var(--text2)", lineHeight: 1.7, paddingTop: 10, borderTop: "1px solid var(--border2)" }}>
                      {f.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SWITCHING GUIDE TAB ── */}
        {tab === "switching" && (
          <div className="fade-in">
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: "var(--text)" }}>Switching Guide</div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>
              <cite index="87-1">Comparing quotes from at least 3 companies saves drivers $709 on average, and some find differences of more than $8,500 a year.</cite> Here's how to switch safely.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {SWITCHING_TIPS.map((t, i) => (
                <div key={i} className="card" style={{ display: "flex", gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--red)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{t.tip}</div>
                    <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.65 }}>{t.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 18px", background: "var(--red-dim)", border: "1px solid var(--border)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text)", marginBottom: 3 }}>Ready to compare real quotes?</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>Get 3+ quotes in under 5 minutes. No obligation, no spam.</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {country === "CA" ? (
                  <>
                    <a href="https://www.ratehub.ca/car-insurance" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 18px", borderRadius: 9, background: "var(--red)", color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Ratehub.ca →</a>
                    <a href="https://www.kanetix.ca" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 14px", borderRadius: 9, background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Kanetix →</a>
                  </>
                ) : (
                  <>
                    <a href="https://www.insurify.com" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 18px", borderRadius: 9, background: "var(--red)", color: "#fff", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Insurify →</a>
                    <a href="https://www.thezebra.com" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 14px", borderRadius: 9, background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>The Zebra →</a>
                    <a href="https://www.jerrysapp.com" target="_blank" rel="noopener noreferrer sponsored" style={{ padding: "9px 14px", borderRadius: 9, background: "var(--bg3)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Jerry →</a>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── GLOSSARY TAB ── */}
        {tab === "glossary" && (
          <div className="fade-in">
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4, color: "var(--text)" }}>Car Insurance Glossary</div>
            <p style={{ fontSize: 14, color: "var(--text2)", marginBottom: 20 }}>Every insurance term explained in plain English. No jargon.</p>
            <div className="card">
              {[
                { term: "Premium", def: "The amount you pay for insurance, usually monthly or annually. Your premium is calculated based on your risk profile." },
                { term: "Deductible", def: "The amount you pay out of pocket before insurance kicks in. A $1,000 deductible means if your repair costs $4,000, you pay $1,000 and your insurer pays $3,000." },
                { term: "Liability coverage", def: "Pays for damage you cause to others, their vehicle, property, and medical bills. Required everywhere. The minimum is rarely enough; experts recommend $1M+ in Canada." },
                { term: "No-fault insurance", def: "A system where you claim from your own insurer regardless of who caused the accident. Speeds up claims but limits your right to sue. Used in BC, MB, SK, QC, and some US states." },
                { term: "Tort system", def: "A system where you can sue the at-fault driver for damages. Used in Ontario, Alberta, Atlantic provinces, and most US states. Allows full compensation for injuries." },
                { term: "Collision coverage", def: "Pays to repair your car after you collide with another vehicle or object, regardless of who was at fault. Required if you finance or lease your vehicle." },
                { term: "Comprehensive coverage", def: "Covers damage not caused by a collision, theft, vandalism, fire, flood, hail, hitting an animal. Essential in Canada given high theft rates and extreme weather." },
                { term: "Accident benefits (CA)", def: "Mandatory coverage that pays your medical expenses, income replacement, and rehabilitation costs after an accident, regardless of fault." },
                { term: "PIP (Personal Injury Protection)", def: "The US equivalent of accident benefits. Required in no-fault states. Covers your medical expenses and lost wages after an accident." },
                { term: "Uninsured/underinsured motorist", def: "Protects you if you're hit by a driver with no insurance or not enough insurance. About 12% of US drivers are uninsured." },
                { term: "Accident forgiveness", def: "An add-on that prevents your premium from increasing after your first at-fault accident. Very worthwhile for drivers with clean records." },
                { term: "Replacement cost coverage", def: "Pays to replace your vehicle with a brand-new equivalent, rather than the depreciated value. Usually only available for vehicles under 2 years old." },
                { term: "ICBC", def: "Insurance Corporation of British Columbia. The government-run insurer providing mandatory basic auto insurance in BC. Optional coverages can be added through ICBC or private insurers." },
                { term: "MPI / Autopac", def: "Manitoba Public Insurance. The government-run insurer providing mandatory auto insurance in Manitoba." },
                { term: "SGI", def: "Saskatchewan Government Insurance. The government-run insurer providing mandatory auto insurance in Saskatchewan." },
                { term: "FSRA", def: "Financial Services Regulatory Authority of Ontario. Regulates auto insurance rates and insurer conduct in Ontario." },
                { term: "Telematics / Usage-based insurance", def: "A program where an app or device tracks your driving habits (speed, braking, time of day) and offers discounts for safe driving. Can save 10-30%." },
                { term: "No-claims discount", def: "A reduction in your premium for maintaining a claims-free record. Also called 'claims-free discount' in Canada." },
                { term: "SEF Endorsements (Canada)", def: "Standard Endorsement Forms, add-ons to your policy. SEF 43 (loss of use), SEF 27 (legal liability for physical damage), and others customize your coverage." },
                { term: "SR-22 / FR-44 (US)", def: "A certificate of financial responsibility required by some states for high-risk drivers (DUI, multiple violations). Significantly increases premiums." },
                { term: "30/60/25 (US liability)", def: "A liability coverage notation meaning $30,000 per person/$60,000 per accident for bodily injury, and $25,000 for property damage." },
              ].map((item, i) => (
                <div key={item.term} className="faq-item">
                  <div className="faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{item.term}</span>
                    <span style={{ color: "var(--red)", fontSize: 18, flexShrink: 0, transform: openFaq === i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                  </div>
                  {openFaq === i && <div className="faq-a fade-in">{item.def}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        <div style={{ marginTop: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 18, color: "var(--text)" }}>
            Frequently Asked <span style={{ color: "var(--red)" }}>Questions</span>
          </h2>
          <div className="card">
            {FAQ.map((item, i) => (
              <div key={i} className="faq-item">
                <div className="faq-q" onClick={() => setOpenFaq(100 + i === openFaq ? null : 100 + i)}>
                  <span>{item.q}</span>
                  <span style={{ color: "var(--red)", fontSize: 18, flexShrink: 0, transform: openFaq === 100 + i ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
                </div>
                {openFaq === 100 + i && <div className="faq-a fade-in">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* About + SEO */}
        <div style={{ marginTop: 32, padding: 22, background: "var(--bg2)", border: "1px solid var(--border2)", borderRadius: "var(--radius)" }}>
          <div style={{ fontSize: 17, fontWeight: 900, marginBottom: 10, color: "var(--text)" }}>About <span style={{ color: "var(--red)" }}>CarInsureGuide</span></div>
          <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8, marginBottom: 10 }}>
            CarInsureGuide is the most complete free car insurance resource for Canada and the United States. We explain the difference between Ontario's private insurance market, BC's public ICBC system, Quebec's hybrid model, and every US state's requirements, in plain English, without trying to sell you anything.
          </p>
          <p style={{ fontSize: 14, color: "var(--text2)", lineHeight: 1.8 }}>
            Our tools include a rate estimator, insurance cost by vehicle lookup, coverage explainer, discounts finder, rating factors guide, and switching guide. No signup required. No personal data collected.
          </p>
          <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {[
              { label: "Ontario Car Insurance", url: "?country=CA&province=ON" },
              { label: "BC Car Insurance (ICBC)", url: "?country=CA&province=BC" },
              { label: "Alberta Car Insurance", url: "?country=CA&province=AB" },
              { label: "Quebec Car Insurance", url: "?country=CA&province=QC" },
              { label: "Manitoba Car Insurance", url: "?country=CA&province=MB" },
              { label: "California Car Insurance", url: "?country=US&state=CA" },
              { label: "Texas Car Insurance", url: "?country=US&state=TX" },
              { label: "Florida Car Insurance", url: "?country=US&state=FL" },
              { label: "ICBC BC Insurance Guide", url: "?country=CA&province=BC" },
              { label: "Canada Car Insurance Guide", url: "?country=CA" },
            ].map(tag => (
              <a key={tag.label} href={tag.url} style={{ fontSize: 10, padding: "3px 9px", borderRadius: 20, background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border2)", textDecoration: "none" }}>{tag.label}</a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--border2)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, fontSize: 11, color: "var(--text3)" }}>
          <span>CarInsureGuide.com · Canada & US Car Insurance Guide · Free</span>
          <span>Not insurance advice · Affiliate links may earn us a commission</span>
        </div>
        <div style={{ paddingTop: 6, fontSize: 10, color: "var(--text3)", lineHeight: 1.6 }}>
          Rate estimates are approximate and for informational purposes only. Actual premiums depend on individual factors including vehicle, address, driving record, and insurer. Always get quotes from licensed insurance professionals. Some links on this page are affiliate links.
        </div>
      </div>
    </div>
  );
}
