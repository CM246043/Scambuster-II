export interface ScamIndicator {
  label: string;
  status: 'PASS' | 'FAIL';
}

export interface ReputationLink {
  label: string;
  url: string;
}

export interface ReputationTarget {
  kind: 'NAME' | 'WEBSITE' | 'PHONE' | 'EMAIL';
  value: string;
  links: ReputationLink[];
}

export interface ScamAnalysis {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  scamType: string;
  verdict: string;
  indicators: ScamIndicator[];
  explanation: string;
  recommendations: string[];
  supervisorThought: string;
  reputationFindings?: string;
  reputationTargets: ReputationTarget[];
  signalCount: number;
}

interface Rule {
  id: string;
  scamType: string;
  failLabel: string;
  passLabel: string;
  weight: number;
  patterns: RegExp[];
  requires?: RegExp;
  advice: string;
}

const RULES: Rule[] = [
  {
    id: 'payment',
    scamType: 'Untraceable Payment Demand',
    failLabel: 'Demands an untraceable payment method',
    passLabel: 'No untraceable payment method requested',
    weight: 30,
    patterns: [
      /\b(gift ?cards?|itunes cards?|google play cards?|steam cards?|apple cards?|ebay cards?|amazon cards?)\b/i,
      /\b(wire (transfer|the money|it|funds)|western union|moneygram|money ?order)\b/i,
      /\b(bitcoin|btc|crypto(currency)?|usdt|tether|ethereum|bitcoin atm|crypto atm)\b/i,
      /\b(zelle|cash ?app|venmo|paypal friends|apple pay cash)\b/i,
      /\b(cash only|send cash|courier (will )?(pick ?up|collect)|mail (the )?cash)\b/i,
    ],
    advice: 'Legitimate businesses and agencies never demand gift cards, wire transfers, crypto, or payment apps like Zelle/Cash App. Payments made this way are almost impossible to recover.',
  },
  {
    id: 'upfront_fee',
    scamType: 'Advance-Fee Fraud',
    failLabel: 'Asks for a fee before you receive anything',
    passLabel: 'No upfront fee requested',
    weight: 25,
    patterns: [
      /\b(processing|release|handling|customs|clearance|transfer|activation|unlock|administrative|insurance) fees?\b/i,
      /\b(pay|send|deposit)\b[^.!?\n]{0,40}\b(to (receive|claim|release|unlock|get) (your|the))\b/i,
      /\btaxes? (must be|need to be|to be) paid (first|before|upfront|up front)\b/i,
      /\bsend \$\s?\d[\d,]*\b/i,
    ],
    advice: 'Never pay a fee to receive a prize, loan, refund, or inheritance. Real winnings never require upfront payment.',
  },
  {
    id: 'sensitive_info',
    scamType: 'Identity Theft / Phishing',
    failLabel: 'Requests sensitive personal or account information',
    passLabel: 'No sensitive information requested',
    weight: 25,
    patterns: [
      /\b(social security( number)?|ssn|tax id)\b/i,
      /\b(password|passcode|pin( number)?|one[- ]time (code|password)|otp|verification code|security code|2fa code)\b/i,
      /\b(bank account( number)?|routing number|card number|credit card (number|details|info)|cvv|debit card (number|details))\b/i,
      /\b(verify|confirm|update|validate) (your )?(identity|account|information|details|login|credentials|payment)\b/i,
      /\b(date of birth|mother'?s maiden name|driver'?s licen[cs]e (number|photo)|photo of your id)\b/i,
    ],
    advice: 'Never share passwords, one-time codes, your SSN, or account numbers with anyone who contacted you first. Contact the company directly using the number on its official website or the back of your card.',
  },
  {
    id: 'threats',
    scamType: 'Intimidation / Threat Scam',
    failLabel: 'Uses threats or fear (arrest, lockout, legal action)',
    passLabel: 'No threats or intimidation',
    weight: 20,
    patterns: [
      /\b(account|card|service)s? (has been |have been |will be |is |are )?(suspended|locked|compromised|frozen|closed|deactivated|disabled|hacked)\b/i,
      /\b(arrest(ed)?|warrant|lawsuit|legal action|sued|prosecut\w*|jail|deport\w*|criminal charges?)\b/i,
      /\b(penalt(y|ies)|fined|seized|confiscat\w*|repossess\w*)\b/i,
      /\b(unauthori[sz]ed (activity|access|transaction|login|charge)|suspicious (activity|login|transaction))\b/i,
    ],
    advice: 'Scammers create fear so you act before thinking. Government agencies and banks do not threaten immediate arrest or demand payment by phone, text, or email.',
  },
  {
    id: 'urgency',
    scamType: 'Pressure Tactics',
    failLabel: 'Creates false urgency or pressure to act now',
    passLabel: 'No artificial urgency detected',
    weight: 12,
    requires: /\b(mechanic|repair|car|truck|vehicle|engine|transmission|shop|garage|tech(nician)?|contractor|handyman|tow(ing)?|install(er)?|plumber|electrician|roofer)s?\b/i,
    patterns: [
      /\b(urgent(ly)?|immediately|right away|right now|act now|asap|as soon as possible|don'?t delay|hurry)\b/i,
      /\b(within (the next )?\d+ (hours?|minutes?|days?)|expires? (today|tonight|soon|in)|final (notice|warning|reminder)|last chance|limited time|today only)\b/i,
    ],
    advice: 'Slow down. Any real deal or real problem will still be there after you take time to verify it with someone you trust.',
  },
  {
    id: 'impersonation',
    scamType: 'Impersonation Scam',
    failLabel: 'Claims to be a government agency, bank, or big company',
    passLabel: 'No authority impersonation detected',
    weight: 15,
    patterns: [
      /\b(irs|internal revenue|social security administration|ssa|fbi|dea|homeland security|dhs|ice|medicare|medicaid|u\.?s\.? marshals?|sheriff|police department|federal agent|government grant|customs and border|treasury department|dmv)\b/i,
      /\b(microsoft|apple|amazon|paypal|netflix|geek squad|norton|mcafee|wells fargo|chase|bank of america|citibank|usps|ups|fedex|dhl|coinbase|walmart|best buy) (support|security|team|department|account|billing|refund|customer service|fraud department|help ?desk)\b/i,
      /\b(your bank|the bank|fraud department|security team|tech(nical)? support)\b/i,
    ],
    advice: 'Hang up or stop replying, then contact the organization yourself using contact details from its official website. Caller ID and email names are easy to fake.',
  },
  {
    id: 'remote_access',
    scamType: 'Tech Support Scam',
    failLabel: 'Asks you to install software or give remote access',
    passLabel: 'No remote-access or download request',
    weight: 25,
    patterns: [
      /\b(anydesk|teamviewer|ultraviewer|logmein|screenconnect|supremo|remote (access|desktop|control|session))\b/i,
      /\b(download|install|open) (this |the |our |a |an )?(file|app|application|software|attachment|program|tool)\b/i,
      /\b(virus|malware|trojan|spyware) (detected|found|infected)|your (computer|device|phone) (is|has been) (infected|hacked|compromised)\b/i,
    ],
    advice: 'Never let someone who contacted you remote into your computer or phone, and never install apps or open files they send you.',
  },
  {
    id: 'prize',
    scamType: 'Prize / Lottery Scam',
    failLabel: 'Too-good-to-be-true prize, winnings, or free money',
    passLabel: 'No too-good-to-be-true offer',
    weight: 25,
    patterns: [
      /\b(you('ve| have)? (won|been selected)|congratulations|winner|lottery|sweepstakes|jackpot|prize|inheritance|unclaimed (funds|money)|beneficiary)\b/i,
      /\b(free (money|gift|iphone|vacation|cruise)|claim your (reward|prize|gift|refund))\b/i,
    ],
    advice: "You can't win a lottery or sweepstakes you never entered. Free money that requires a payment or your details is a scam.",
  },
  {
    id: 'investment',
    scamType: 'Investment / Crypto Scam',
    failLabel: 'Promises guaranteed or unrealistic returns',
    passLabel: 'No unrealistic investment promises',
    weight: 25,
    patterns: [
      /\b(guaranteed (returns?|profits?|income|income)|risk[- ]free (investment|returns?|profit)|double your (money|investment|bitcoin))\b/i,
      /\b(\d{2,4}% (returns?|profit|roi)|passive income|trading (platform|signals|mentor|account manager)|forex|investment opportunity|mining pool)\b/i,
    ],
    advice: 'Guaranteed high returns do not exist. Be extremely wary of anyone, especially an online friend or romantic interest, steering you toward a trading app or crypto platform.',
  },
  {
    id: 'family_emergency',
    scamType: 'Family Emergency / Grandparent Scam',
    failLabel: 'Urgent plea from a "family member" or new number',
    passLabel: 'No family-emergency pattern',
    weight: 25,
    patterns: [
      /\b(hi|hey|hello) (mom|mum|dad|grandma|grandpa|nana|papa)\b/i,
      /\b(lost my phone|new (phone )?number|broke my phone|using (a )?friend'?s phone)\b/i,
      /\b(bail|in jail|in the hospital|car accident|i'?m in trouble|need (money|help) (fast|now|urgently))\b/i,
    ],
    advice: "Call your family member back on the number you already have for them, or ask a question only they would know. Agree on a family code word.",
  },
  {
    id: 'secrecy',
    scamType: 'Isolation Tactic',
    failLabel: 'Asks you to keep it secret or not tell anyone',
    passLabel: 'No secrecy request',
    weight: 15,
    patterns: [
      /\b(don'?t|do not) (tell|inform|mention (this )?to|talk to) (anyone|anybody|your (family|bank|kids|spouse|wife|husband))\b/i,
      /\b(keep (this|it) (confidential|secret|between us|private)|top secret|confidential matter)\b/i,
    ],
    advice: 'Scammers isolate victims so nobody can warn them. Always talk it over with a trusted friend, family member, or your bank before sending money.',
  },
  {
    id: 'job',
    scamType: 'Employment / Overpayment Scam',
    failLabel: 'Job, check, or overpayment red flags',
    passLabel: 'No job or overpayment red flags',
    weight: 20,
    patterns: [
      /\b(work from home|easy money|no experience (needed|required)|mystery shopper|reshipping|package (forwarding|reshipper)|personal assistant job)\b/i,
      /\b(deposit (this|the) check|overpa(id|yment)|send (back|the difference|the rest)|refund the (difference|excess))\b/i,
    ],
    advice: 'No real employer sends you a check and asks you to send part of it back. The check will bounce after you have already sent your money.',
  },
  {
    id: 'recovery',
    scamType: 'Recovery Scam',
    failLabel: 'Offers to recover lost money (targets prior victims)',
    passLabel: 'No "fund recovery" offer',
    weight: 25,
    patterns: [
      /\b(asset recovery|fund(s)? recovery|recover (your )?(lost |stolen )?(funds|money|crypto|bitcoin)|recovery (service|agent|specialist|firm))\b/i,
    ],
    advice: 'People who have been scammed are often targeted a second time by fake "recovery" services. Real law enforcement does not charge fees to get your money back.',
  },
  {
    id: 'auto_contractor',
    scamType: 'Auto Repair / Contractor Scam',
    failLabel: 'Mobile mechanic / contractor red flags',
    passLabel: 'No mechanic or contractor red flags',
    weight: 25,
    patterns: [
      /\b(cash|money|payment|pay|paid)\b[^.!?\n]{0,25}\b(up ?front|in advance|before (he|she|they|we) (start|begin)s?)\b/i,
      /\b(cash only|cash (is )?preferred|(full|entire|whole) (payment|amount) (up ?front|in advance|before))\b/i,
      /\b(deposit|pay(ment)?|money) (for|on) (the )?parts( up ?front| first| before)?\b/i,
      /\bparts deposit\b/i,
      /\b(no|without( a)?|won'?t (give|provide)( a| you a)?|can'?t (give|provide)( a| you a)?) (written )?(estimate|quote|invoice|receipt|contract|warranty|guarantee)\b/i,
      /\b(verbal|handshake) (agreement|deal|quote|estimate)\b/i,
      /\b(not|no|isn'?t|aren'?t|without( a)?) (licen[cs]ed|insured|bonded|business licen[cs]e)\b/i,
      /\b(found|discovered|uncovered) (more|another|other|additional|bigger) (problems?|issues?|damage)\b/i,
      /\b(price|cost|quote|bill|estimate) (went up|increased|doubled|tripled|changed)\b/i,
      /\b(won'?t|will not|refuse[sd]? to) (release|return|give back) (my|your|the) (car|vehicle|truck|keys)\b/i,
      /\b(mobile mechanic|mechanic|repair ?(shop|man)|contractor|handyman|tow(ing)?)\b[^.!?\n]{0,60}\b(cash|zelle|cash ?app|venmo|up ?front|deposit)\b/i,
    ],
    advice: 'Get a written estimate before any work starts, verify licensing and insurance with your state, never pay in full upfront, pay by credit card (it gives you chargeback rights), and keep every receipt and text message.',
  },
  {
    id: 'overconfident_diagnosis',
    scamType: 'Auto Repair / Contractor Scam',
    failLabel: 'Promises a 100% sure or "simple" fix for a complex problem',
    passLabel: 'No overconfident "guaranteed" diagnosis',
    weight: 18,
    patterns: [
      /\b(100 ?%|a hundred percent|one hundred percent|absolutely|definitely|positively) (guarantee[sd]?|sure|certain|positive)\b/i,
      /\bguarantee[sd]? (it'?s|it is|it'?ll|it will|this (will|is)|to fix|the fix|that'?s|that will|you)\b/i,
      /\b(simple|easy|quick|cheap|straightforward) (fix|repair|job|swap)\b/i,
      /\bno (programming|coding|initiali[sz]ation|calibration|relearn|pairing) (is )?(needed|required|necessary)\b/i,
      /\b(just|only) (need(s)? to |have to )?(swap|replace|change|throw) (in )?(the|a|your|out)\b/i,
    ],
    advice: 'Modern cars are complex systems, and almost any part that gets changed needs programming, initialization, or pairing. A mechanic who "guarantees 100%" a simple fix for a complex problem is incompetent, a fraud, or both. Ask for written diagnostic results and whether they have the scan tools to program the part.',
  },
  {
    id: 'appearance',
    scamType: 'Auto Repair / Contractor Scam',
    failLabel: 'Unprofessional appearance for a mechanic (not proof, but a warning sign)',
    passLabel: 'No appearance red flags mentioned',
    weight: 12,
    patterns: [
      /\b(white )?(t-?shirt|tee ?shirt|tank top|wife ?beater)\b/i,
      /\b(gym|basketball|athletic|board) shorts\b/i,
      /\b(flip[- ]?flops|slippers|slides|sandals|crocs)\b/i,
      /\b(no|without( any)?|didn'?t (have|bring)) (tools|toolbox|uniform|scan ?tool|diagnostic (tool|equipment)|work (truck|van))\b/i,
      /\b(unmarked|personal|no company|no business) (car|truck|van|vehicle|name|logo|sign(age)?)\b/i,
    ],
    advice: "A professional mechanic shows up dressed for work, with tools, a diagnostic scanner, and usually a marked vehicle. Someone in a t-shirt, gym shorts, and flip flops isn't there to fix anything but your wallet. Appearance alone isn't proof, so verify their business and license too.",
  },
];

const BRANDS: Record<string, string[]> = {
  paypal: ['paypal.com'],
  apple: ['apple.com', 'icloud.com'],
  icloud: ['icloud.com', 'apple.com'],
  microsoft: ['microsoft.com', 'live.com', 'outlook.com', 'office.com'],
  amazon: ['amazon.com', 'amazon.co.uk', 'amazon.ca'],
  google: ['google.com', 'gmail.com'],
  netflix: ['netflix.com'],
  wellsfargo: ['wellsfargo.com'],
  chase: ['chase.com'],
  bankofamerica: ['bankofamerica.com', 'bofa.com'],
  citi: ['citi.com', 'citibank.com'],
  usps: ['usps.com'],
  fedex: ['fedex.com'],
  dhl: ['dhl.com'],
  irs: ['irs.gov'],
  venmo: ['venmo.com'],
  cashapp: ['cash.app', 'cashapp.com'],
  coinbase: ['coinbase.com'],
  facebook: ['facebook.com', 'fb.com'],
  instagram: ['instagram.com'],
  whatsapp: ['whatsapp.com'],
  walmart: ['walmart.com'],
  netbank: [],
};

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly', 'cutt.ly', 'shorturl.at', 'rb.gy', 't.ly', 'tiny.cc'];
const RISKY_TLDS = ['xyz', 'top', 'click', 'zip', 'mov', 'icu', 'buzz', 'live', 'rest', 'cam', 'quest', 'cfd', 'sbs', 'monster', 'gq', 'ml', 'tk', 'cf', 'ga', 'work', 'support', 'country', 'loan', 'win', 'bid'];
const COMMON_TLDS = ['com', 'net', 'org', 'gov', 'edu', 'us', 'io', 'co', 'info', 'biz', 'me', 'app', 'site', 'online', 'store', 'shop', 'uk', 'ca', 'au', 'de', 'ru', 'cn', 'in', 'ly', 'gl', 'at', 'cc', 'gd', 'tv', ...RISKY_TLDS];
const PHISH_WORDS = ['login', 'log-in', 'signin', 'sign-in', 'verify', 'verification', 'secure', 'security', 'account', 'update', 'auth', 'confirm', 'billing', 'support', 'unlock', 'wallet', 'refund', 'claim'];

const URL_RE = new RegExp(
  String.raw`\b((?:https?:\/\/)?(?:www\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:${COMMON_TLDS.join('|')}|xn--[a-z0-9-]+)(?::\d+)?(?:\/[^\s'"<>)\]]*)?|https?:\/\/\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?(?:\/[^\s'"<>)\]]*)?)(?![a-z0-9-])`,
  'gi',
);
const EMAIL_RE = /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi;
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const QUOTED_RE = /(?:^|[\s(:])["“'‘]([^"“”'‘’\n]{2,60}?)["”'’](?=[\s.,;:!?)]|$)/g;
const BUSINESS_RE = /\b([A-Z][\w&'.-]*(?:\s+[A-Z&][\w&'.-]*){0,4}\s+(?:LLC|L\.L\.C\.|Inc\.?|Corp\.?|Corporation|Co\.|Company|Ltd\.?|Services|Solutions|Group|Motors|Automotive|Auto Repair|Auto|Mobile Mechanics?|Mechanics?|Towing|Recovery|Construction|Roofing|Plumbing))(?![\w])/g;

interface LinkFinding {
  url: string;
  host: string;
  issues: string[];
}

function hostOf(raw: string): string {
  const withProto = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  try {
    return new URL(withProto).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return raw.toLowerCase();
  }
}

function registrableDomain(host: string): string {
  const parts = host.split('.');
  if (parts.length >= 3 && parts[parts.length - 2].length <= 3 && parts[parts.length - 1].length === 2) {
    return parts.slice(-3).join('.');
  }
  return parts.slice(-2).join('.');
}

function analyzeLink(raw: string): LinkFinding {
  const host = hostOf(raw);
  const issues: string[] = [];
  const domain = registrableDomain(host);
  const flat = host.replace(/[^a-z0-9]/g, '');

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) issues.push('uses a raw IP address instead of a name');
  if (host.includes('xn--')) issues.push('uses look-alike international characters (punycode)');
  if (SHORTENERS.includes(domain) || SHORTENERS.includes(host)) issues.push('is a link shortener that hides the real destination');
  const tld = host.split('.').pop() || '';
  if (RISKY_TLDS.includes(tld)) issues.push(`uses a high-abuse domain ending (.${tld})`);
  if (/^http:\/\//i.test(raw)) issues.push('is not secure (http, not https)');
  if (raw.includes('@')) issues.push('contains an "@" which can disguise the real site');
  if ((domain.match(/-/g) || []).length >= 2) issues.push('has multiple hyphens, common in fake sites');

  for (const [brand, official] of Object.entries(BRANDS)) {
    if (flat.includes(brand) && official.length && !official.some((o) => host === o || host.endsWith(`.${o}`))) {
      issues.push(`mentions "${brand}" but is not ${brand}'s official site`);
      break;
    }
  }
  const phishWord = PHISH_WORDS.find((w) => domain.includes(w));
  if (phishWord) issues.push(`has "${phishWord}" in the domain name, a common phishing trick`);

  return { url: raw, host, issues };
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function google(q: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

function linksFor(kind: ReputationTarget['kind'], value: string): ReputationLink[] {
  const q = `"${value}"`;
  switch (kind) {
    case 'WEBSITE':
      return [
        { label: 'Google Safe Browsing', url: `https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(value)}` },
        { label: 'ScamAdviser', url: `https://www.scamadviser.com/check-website/${encodeURIComponent(value)}` },
        { label: 'VirusTotal', url: `https://www.virustotal.com/gui/search/${encodeURIComponent(value)}` },
        { label: 'Domain age (WHOIS)', url: `https://who.is/whois/${encodeURIComponent(value)}` },
        { label: 'Scam reports', url: google(`${q} scam OR fraud OR complaints`) },
      ];
    case 'PHONE':
      return [
        { label: 'Scam reports', url: google(`${q} scam OR spam OR fraud`) },
        { label: 'Reddit reports', url: google(`${q} site:reddit.com`) },
      ];
    case 'EMAIL':
      return [
        { label: 'Scam reports', url: google(`${q} scam OR fraud OR phishing`) },
        { label: 'Reddit reports', url: google(`${q} site:reddit.com`) },
      ];
    default:
      return [
        { label: 'Reviews & complaints', url: google(`${q} reviews OR complaints OR scam`) },
        { label: 'BBB', url: `https://www.bbb.org/search?find_text=${encodeURIComponent(value)}` },
        { label: 'Ripoff Report', url: google(`${q} site:ripoffreport.com`) },
        { label: 'Reddit', url: google(`${q} site:reddit.com`) },
        { label: 'Court & news records', url: google(`${q} lawsuit OR arrested OR charged OR "attorney general"`) },
      ];
  }
}

function extractTargets(text: string, links: LinkFinding[]): ReputationTarget[] {
  const targets: ReputationTarget[] = [];
  const seen = new Set<string>();
  const add = (kind: ReputationTarget['kind'], value: string) => {
    const v = value.trim().replace(/[.,;:!?]+$/, '');
    const key = v.toLowerCase();
    if (!v || seen.has(key) || targets.length >= 6) return;
    seen.add(key);
    targets.push({ kind, value: v, links: linksFor(kind, v) });
  };

  const emails = text.match(EMAIL_RE) || [];
  emails.forEach((e) => add('EMAIL', e));
  uniq(links.map((l) => l.host)).forEach((h) => add('WEBSITE', h));
  (text.match(PHONE_RE) || []).forEach((p) => add('PHONE', p));

  const hosts = new Set(links.map((l) => l.host));
  for (const m of text.matchAll(QUOTED_RE)) {
    const v = m[1].trim();
    if (!/[A-Z0-9]/.test(v)) continue;
    if (hosts.has(hostOf(v)) || URL_RE.test(v)) {
      URL_RE.lastIndex = 0;
      continue;
    }
    URL_RE.lastIndex = 0;
    add('NAME', v);
  }
  for (const m of text.matchAll(BUSINESS_RE)) add('NAME', m[1]);

  const trimmed = text.trim();
  if (!targets.length && trimmed.length <= 80 && !/[.!?].+[.!?]/.test(trimmed)) {
    add('NAME', trimmed.replace(/^(is|check|verify|who is|what is)\s+/i, '').replace(/\?$/, ''));
  }
  return targets;
}

function snippet(text: string, re: RegExp): string | null {
  const m = text.match(re);
  if (!m) return null;
  const s = m[0].trim();
  return s.length > 40 ? `${s.slice(0, 37)}...` : s;
}

export function analyzeScamSync(content: string): ScamAnalysis {
  const text = content.normalize('NFKC');
  const failed: { rule: Rule; hits: string[] }[] = [];
  const passed: Rule[] = [];

  for (const rule of RULES) {
    if (rule.requires && !rule.requires.test(text)) {
      passed.push(rule);
      continue;
    }
    const hits = uniq(rule.patterns.map((p) => snippet(text, p)).filter((s): s is string => !!s));
    if (hits.length) failed.push({ rule, hits });
    else passed.push(rule);
  }

  const textWithoutEmails = text.replace(EMAIL_RE, ' ');
  const rawLinks = uniq(textWithoutEmails.match(URL_RE) || []);
  const links = rawLinks.map(analyzeLink);
  const badLinks = links.filter((l) => l.issues.length);

  const contribution = (f: { rule: Rule; hits: string[] }) => f.rule.weight + Math.min(f.hits.length - 1, 3) * 4;
  let score = 0;
  for (const f of failed) score += contribution(f);
  if (badLinks.length) {
    const linkIssueCount = badLinks.reduce((n, l) => n + l.issues.length, 0);
    score += Math.min(15 + linkIssueCount * 6, 45);
  }

  const has = (id: string) => failed.some((f) => f.rule.id === id);
  if (has('auto_contractor') && (has('overconfident_diagnosis') || has('appearance'))) score += 10;
  if (has('payment') && (has('urgency') || has('threats') || has('impersonation') || has('family_emergency') || has('auto_contractor'))) score += 15;
  if (has('sensitive_info') && badLinks.length) score += 10;
  if (has('impersonation') && has('remote_access')) score += 10;

  const signalCount = failed.length + (badLinks.length ? 1 : 0);
  score = signalCount === 0 ? 2 : Math.min(99, Math.max(score, 8));

  const riskLevel: ScamAnalysis['riskLevel'] = score >= 70 ? 'CRITICAL' : score >= 45 ? 'HIGH' : score >= 20 ? 'MEDIUM' : 'LOW';

  const topRule = [...failed].sort((a, b) => contribution(b) - contribution(a))[0]?.rule;
  const scamType = topRule
    ? topRule.scamType
    : badLinks.length
      ? 'Phishing Link'
      : 'No Known Scam Pattern';

  const verdicts: Record<ScamAnalysis['riskLevel'], string> = {
    CRITICAL: 'Almost certainly a scam. Do not respond or pay.',
    HIGH: 'Strong scam warning signs. Stop and verify.',
    MEDIUM: 'Some red flags. Proceed with caution.',
    LOW: signalCount ? 'Minor concerns. Verify before trusting.' : 'No common scam patterns found.',
  };

  const indicators: ScamIndicator[] = [
    ...failed.map(({ rule, hits }) => ({ label: `${rule.failLabel}: "${hits.slice(0, 2).join('", "')}"`, status: 'FAIL' as const })),
    ...badLinks.map((l) => ({ label: `Suspicious link ${l.host}: ${l.issues.join('; ')}`, status: 'FAIL' as const })),
    ...passed.map((rule) => ({ label: rule.passLabel, status: 'PASS' as const })),
  ];
  if (links.length && !badLinks.length) indicators.push({ label: `Links checked (${links.map((l) => l.host).join(', ')}): no obvious red flags`, status: 'PASS' });

  const targets = extractTargets(text, links);

  const explanation = signalCount
    ? `Found ${signalCount} warning sign${signalCount === 1 ? '' : 's'}: ${[
        ...failed.map((f) => f.rule.failLabel.toLowerCase()),
        ...(badLinks.length ? [`${badLinks.length} suspicious link${badLinks.length === 1 ? '' : 's'}`] : []),
      ].join('; ')}. ${riskLevel === 'CRITICAL' || riskLevel === 'HIGH' ? 'This combination matches well-known scam scripts.' : 'Verify independently before you trust it.'}`
    : `No common scam phrases or risky links were found. That does not guarantee it is safe: scammers change their wording, and a plain name or business can't be judged from text alone.${targets.length ? ' Use the reputation links above to check reviews and complaints.' : ''}`;

  const recommendations = uniq([
    ...failed.map((f) => f.rule.advice),
    ...(badLinks.length ? ["Don't click the link. Type the company's official web address yourself, or use its official app."] : []),
    ...(targets.length ? ['Look up every name, business, phone number, and website using the reputation links. No online footprint, or a pile of complaints, are both warning signs.'] : []),
    ...(riskLevel === 'HIGH' || riskLevel === 'CRITICAL'
      ? ['Stop all contact. Save screenshots, texts, receipts, and phone numbers as evidence.', 'If you already paid, call your bank or card issuer right away and report it to the FTC (ReportFraud.ftc.gov) and IC3.gov.']
      : ['When in doubt, ask someone you trust before sending money or information.']),
  ]).slice(0, 7);

  const supervisorThought = `Scanned ${text.length} characters against ${RULES.length} scam-pattern groups and ${links.length} link${links.length === 1 ? '' : 's'}. ${failed.length} pattern group${failed.length === 1 ? '' : 's'} matched${failed.length ? ` (${failed.map((f) => f.rule.id).join(', ')})` : ''}${badLinks.length ? `, ${badLinks.length} link${badLinks.length === 1 ? '' : 's'} flagged` : ''}. ${targets.length} item${targets.length === 1 ? '' : 's'} extracted for reputation lookup. All analysis ran on this device; nothing was uploaded.`;

  const reputationFindings = targets.length
    ? `ScamBuster can't search the web without a paid API, so it found ${targets.length} item${targets.length === 1 ? '' : 's'} for you to check. Tap a link to see reviews, complaints, and scam reports. A brand-new website, no reviews at all, or many complaints are all red flags.`
    : undefined;

  return {
    riskLevel,
    score,
    scamType,
    verdict: verdicts[riskLevel],
    indicators,
    explanation,
    recommendations,
    supervisorThought,
    reputationFindings,
    reputationTargets: targets,
    signalCount,
  };
}

export async function analyzeScam(content: string): Promise<ScamAnalysis> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return analyzeScamSync(content);
}
