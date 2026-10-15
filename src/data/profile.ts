// Single source of truth for all site content (from the LinkedIn profile export).
// Edit this file to update the site — components only render what is here.

export type YearMonth = `${number}-${string}`; // "YYYY-MM"

export interface Quest {
  title: string;
  org: string;
  location?: string;
  start: YearMonth;
  end: YearMonth | 'present';
  kind: 'main' | 'job' | 'class' | 'side';
  bullets: string[];
}

export interface Expansion {
  numeral: string;
  name: string;
  tagline: string;
  span: string;
  hue: string; // accent colour for the banner
  quests: Quest[];
}

export interface Job {
  name: string; // RPG job name
  real: string; // plain-language skill
  role: 'tank' | 'healer' | 'dps' | 'crafter';
  icon: IconName;
  ranges: [YearMonth, YearMonth | 'present'][]; // periods this skill was used
  note: string;
}

export interface Achievement {
  title: string;
  detail: string;
  year: string;
  points: number;
  icon: IconName;
}

export type IconName =
  | 'shield' | 'gear' | 'crystal' | 'flag' | 'flask' | 'code' | 'sword' | 'chart'
  | 'scroll' | 'book' | 'key' | 'star' | 'globe' | 'crown' | 'mail' | 'link' | 'github';

export const profile = {
  name: 'Mirko Zlatunic',
  initials: 'MZ',
  headline:
    'Supply Chain Digital Transformation Leader · SAP / SCM Systems · Program & Project Management · Software Engineering Background',
  shortTitle: 'Supply Chain Digital Transformation Leader',
  location: 'United States',
  careerStart: '2005-08' as YearMonth,
  email: 'm.zlatunic@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mirkozlatunic',
  github: 'https://github.com/mirkozlatunic',
  currentExpansion: 'The Digital Frontier',

  bio: [
    'I am a supply chain and digital transformation professional with deep experience in regulated manufacturing, production planning, SAP-enabled processes, and cross-functional project execution. My career has evolved from operational and functional leadership into broader SCM program management.',
    'After several years leading production planning, I moved into Project Management SCM to expand my impact across the full supply chain lifecycle — including material onboarding, sourcing readiness, SAP master data and process alignment, GMP requirements, production coordination, procurement, QA, and customer-facing project execution.',
    'What differentiates me is the combination of business process ownership and digital capability. I completed a software engineering bootcamp and have built digital product prototypes using React, TypeScript, and AI-assisted development workflows — so I understand how business requirements become scalable digital tools, automation, analytics, and system improvements.',
  ],

  strengths: [
    'Supply Chain Management & Production Planning',
    'SAP / SCM process understanding',
    'Program and Project Management',
    'Material onboarding & operational readiness',
    'Cross-functional leadership across SCM, QA, procurement, production & technical teams',
    'Process improvement, automation & digital transformation',
    'Software engineering: React, TypeScript, JavaScript, Git/GitHub, AI-assisted development',
    'GMP-regulated manufacturing environments',
  ],

  seeking:
    'Roles at the intersection of supply chain, SAP/business systems, digital transformation, and operational excellence — helping organizations modernize supply chain execution by connecting process, people, systems, data, and digital tools.',

  languages: [
    { name: 'German', level: 'Native or Bilingual', stars: 5 },
    { name: 'Croatian', level: 'Native or Bilingual', stars: 5 },
    { name: 'English', level: 'Full Professional', stars: 4 },
    { name: 'French', level: 'Elementary', stars: 2 },
  ],
};

export const jobs: Job[] = [
  {
    name: 'Supply Chain Paladin',
    real: 'Supply Chain Management',
    role: 'tank',
    icon: 'shield',
    ranges: [['2015-12', 'present']],
    note: 'Holding the line between supply, procurement and production since joining Bachem.',
  },
  {
    name: 'Production Planner',
    real: 'Production & Material Planning, S&OP',
    role: 'crafter',
    icon: 'gear',
    ranges: [['2015-12', '2024-06']],
    note: 'From planning specialist to Senior Manager leading the S&OP cycle.',
  },
  {
    name: 'SAP Arcanist',
    real: 'SAP / ERP Systems',
    role: 'dps',
    icon: 'crystal',
    ranges: [['2015-12', 'present']],
    note: 'Movex→SAP migration, five years as SAP Key User, functional specs and master data.',
  },
  {
    name: 'Party Leader',
    real: 'Program & Project Management',
    role: 'tank',
    icon: 'flag',
    ranges: [['2020-01', '2021-02'], ['2024-07', 'present']],
    note: 'Leading cross-functional teams through new product introductions.',
  },
  {
    name: 'Commander',
    real: 'People Leadership',
    role: 'healer',
    icon: 'crown',
    ranges: [['2008-03', '2009-04'], ['2021-02', 'present']],
    note: 'Platoon leader in the Swiss Armed Forces, then department and project leadership.',
  },
  {
    name: 'GMP Alchemist',
    real: 'GMP-Regulated Manufacturing',
    role: 'crafter',
    icon: 'flask',
    ranges: [['2005-08', '2014-10'], ['2015-12', 'present']],
    note: 'Pharmaceutical and biochemical syntheses, audits and GMP compliance.',
  },
  {
    name: 'Chemist',
    real: 'Chemical Technology',
    role: 'healer',
    icon: 'scroll',
    ranges: [['2002-08', '2015-11']],
    note: 'Diploma, then a decade running complex multi-purpose production systems.',
  },
  {
    name: 'Code Machinist',
    real: 'Software Engineering (React, TypeScript)',
    role: 'dps',
    icon: 'code',
    ranges: [['2023-01', 'present']],
    note: 'TripleTen bootcamp and digital product prototypes with AI-assisted workflows.',
  },
];

export const expansions: Expansion[] = [
  {
    numeral: 'I',
    name: "The Alchemist's Path",
    tagline: 'Where the journey began — in the labs and production halls of Swiss chemistry.',
    span: '2002 – 2014',
    hue: '#4fb3a9',
    quests: [
      {
        title: 'Chemical Technician',
        org: 'PharmaZell GmbH',
        start: '2013-10',
        end: '2014-10',
        kind: 'main',
        bullets: [
          'Manufactured pharmaceutical and biochemical syntheses',
          'Prepared, implemented, and controlled production processes on complex multi-purpose systems',
          'Introduced and supported new employees',
        ],
      },
      {
        title: 'First Lieutenant',
        org: 'Swiss Armed Forces',
        location: 'Switzerland',
        start: '2008-03',
        end: '2009-04',
        kind: 'job',
        bullets: [
          'Led a platoon of 30 soldiers and supervised 4 group leaders',
          'Ensured operational readiness and kept subordinates informed on security policy and national defense',
          'Assessed squad and team performance, planned cadre succession, and examined candidates for higher functions',
        ],
      },
      {
        title: 'Chemical Technician',
        org: 'Siegfried Ltd',
        start: '2005-08',
        end: '2012-08',
        kind: 'main',
        bullets: [
          'Manufactured pharmaceutical and biochemical syntheses',
          'Prepared, implemented, and controlled production processes on complex multi-purpose systems',
          'Introduced and supported new employees',
        ],
      },
      {
        title: 'Diploma, Chemical Technology / Technician',
        org: 'Vocational School Aarau',
        start: '2002-08',
        end: '2005-07',
        kind: 'class',
        bullets: ['Completed vocational training as a chemical technician'],
      },
    ],
  },
  {
    numeral: 'II',
    name: "The Merchant's Ledger",
    tagline: 'Trading the lab coat for business processes, back offices and customer trials.',
    span: '2011 – 2015',
    hue: '#c98b3a',
    quests: [
      {
        title: 'Laboratory Technician',
        org: 'Willy A. Bachofen AG',
        location: 'Muttenz',
        start: '2014-11',
        end: '2015-11',
        kind: 'main',
        bullets: [
          'Carried out customer trials on internal resources',
          'Managed warehousing and inventory at the technical center',
          'Handled administrative activities, including writing customer trial reports',
        ],
      },
      {
        title: 'Internship Back Office',
        org: 'OfferTube AG',
        location: 'Däniken',
        start: '2014-03',
        end: '2014-10',
        kind: 'side',
        bullets: [
          'Managed administrative tasks such as letters and Excel reports',
          'Supported the heads of marketing and product management',
          'Handled customer calls',
        ],
      },
      {
        title: 'Graduate Technician in Business Processes HF',
        org: 'TEKO Olten',
        start: '2011-01',
        end: '2014-12',
        kind: 'class',
        bullets: ['Entrepreneurship / Entrepreneurial Studies'],
      },
    ],
  },
  {
    numeral: 'III',
    name: 'Rise of the Planner',
    tagline: 'Joining Bachem and mastering planning, master data and the ways of SAP.',
    span: '2015 – 2021',
    hue: '#5b8ed6',
    quests: [
      {
        title: 'Project Manager Supply Chain Management',
        org: 'Bachem',
        location: 'California, United States',
        start: '2020-01',
        end: '2021-02',
        kind: 'main',
        bullets: [
          'Analyzed business processes and worked in cross-functional teams to match designs to business requirements',
          'Created and issued new SAP-related procedures, prepared documentation and organized staff training',
          'Coordinated all activities between the Key Users and the SAP competence center',
          'Wrote functional specifications with SAP functional and development teams for complex solutions',
          'Developed innovative concepts and implemented consulting solutions in the field of SAP',
        ],
      },
      {
        title: 'SAP Key User',
        org: 'Bachem',
        location: 'California, United States',
        start: '2017-08',
        end: '2022-07',
        kind: 'job',
        bullets: [
          'Supported the analysis of business information processes and evaluated the impact of ERP changes',
          'Troubleshot material variance discrepancies, reporting anomalies, and accounting/financial variances',
          'Helped end users solve ERP and procedural problems, data extraction, and analysis',
          'Created functional specification documents with SAP functional and development teams',
        ],
      },
      {
        title: 'Production and Material Planner',
        org: 'Bachem',
        location: 'Torrance, California, United States',
        start: '2018-01',
        end: '2019-12',
        kind: 'main',
        bullets: [
          'Created and maintained planning master data in SAP — recipes (BOMs/resources), MRP views and more',
          'Built and assessed RCCP (Rough Cut Capacity Planning) scenarios with production units',
          'Converted the supply plan into process orders and led hand-over meetings with scheduling',
          'Monitored process orders and reported on past-due production and planning',
          'Ensured availability of raw materials, intermediates, and technical materials',
          'Supported the Planning Manager during the S&OP cycle and built tools to track supply chain metrics',
        ],
      },
      {
        title: 'Specialist Production Planning',
        org: 'Bachem',
        location: 'Bubendorf',
        start: '2015-12',
        end: '2017-12',
        kind: 'main',
        bullets: [
          'Maintained item master data and production orders in the supply chain area',
          'Monitored material planning, production orders, and calculations',
          'Supported the migration of existing Movex (ERP) processes to SAP',
        ],
      },
    ],
  },
  {
    numeral: 'IV',
    name: 'Lord of S&OP',
    tagline: 'Taking command of the production planning department and the S&OP council.',
    span: '2021 – 2024',
    hue: '#a46bd6',
    quests: [
      {
        title: 'Senior Manager Production Planning',
        org: 'Bachem',
        location: 'California, United States',
        start: '2021-02',
        end: '2024-06',
        kind: 'main',
        bullets: [
          'Oversaw the production planning department to fulfil manufacturing schedules',
          'Partnered with Sales, Global Supply Chain, and Finance on consistent production planning procedures',
          'Designed and implemented KPIs, metrics, and dashboard tools for the planning department',
          'Led monthly pre-S&OP and executive S&OP meetings',
        ],
      },
    ],
  },
  {
    numeral: 'V',
    name: 'The Digital Frontier',
    tagline: 'Where supply chain meets software — the current expansion.',
    span: '2023 – Present',
    hue: '#e0b450',
    quests: [
      {
        title: 'Project Manager SCM',
        org: 'Bachem',
        location: 'United States',
        start: '2024-07',
        end: 'present',
        kind: 'main',
        bullets: [
          'Lead cross-functional teams introducing new products, coordinating supply chain, procurement, and production',
          'Implemented process improvements that reduced lead times and increased supply chain efficiency',
          'Represent the supply chain in customer meetings and audits, ensuring compliance with GMP processes',
        ],
      },
      {
        title: 'Certificate, Software Engineering',
        org: 'TripleTen',
        start: '2023-01',
        end: '2024-02',
        kind: 'class',
        bullets: ['Full-stack software engineering bootcamp — React, TypeScript, JavaScript, Git/GitHub'],
      },
    ],
  },
];

export const achievements: Achievement[] = [
  { title: 'Platoon Leader', detail: 'Led 30 soldiers as First Lieutenant, Swiss Armed Forces', year: '2009', points: 20, icon: 'sword' },
  { title: "Alchemist's Diploma", detail: 'Diploma in Chemical Technology, Vocational School Aarau', year: '2005', points: 10, icon: 'flask' },
  { title: 'Scholar of Commerce', detail: 'Graduate Technician in Business Processes HF, TEKO Olten', year: '2014', points: 20, icon: 'book' },
  { title: 'Migration Master', detail: 'Supported the Movex → SAP ERP migration at Bachem', year: '2017', points: 20, icon: 'crystal' },
  { title: 'Keeper of the Key', detail: 'Five years as SAP Key User', year: '2022', points: 30, icon: 'key' },
  { title: 'Council of S&OP', detail: 'Led monthly pre-S&OP and executive S&OP meetings', year: '2024', points: 30, icon: 'crown' },
  { title: 'Metrics of the Realm', detail: 'Designed KPIs and dashboards for production planning', year: '2024', points: 20, icon: 'chart' },
  { title: 'Path of the Coder', detail: 'Software Engineering certificate, TripleTen', year: '2024', points: 30, icon: 'code' },
  { title: 'Fundamentals of Command', detail: 'Project Management Fundamentals certification', year: '—', points: 10, icon: 'scroll' },
  { title: 'A Decade of Devotion', detail: '10+ years with Bachem across five roles', year: '2025', points: 50, icon: 'star' },
  { title: 'Polyglot', detail: 'Speaks German, Croatian, English and French', year: '—', points: 10, icon: 'globe' },
];
