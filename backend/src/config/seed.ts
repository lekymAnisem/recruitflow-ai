import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './index';
import { connectDatabase } from './database';
import { Organization } from '../modules/organizations/organizations.model';
import { User } from '../modules/users/users.model';
import { Tag } from '../modules/tags/tags.model';
import { Job } from '../modules/jobs/jobs.model';
import { Candidate } from '../modules/candidates/candidates.model';
import { Application } from '../modules/applications/applications.model';
import { AIAnalysis } from '../modules/ai/ai.model';
import { Note } from '../modules/notes/notes.model';
import { Resume } from '../modules/resumes/resumes.model';

async function seed() {
  try {
    console.log('Connecting to database...');
    await connectDatabase();

    console.log('Dropping existing collections...');
    const collections = [
      'organizations',
      'users',
      'tags',
      'jobs',
      'candidates',
      'applications',
      'aianalyses',
      'notes',
      'resumes',
    ];
    for (const col of collections) {
      await mongoose.connection.db?.dropCollection(col).catch(() => {});
    }
    console.log('All collections dropped.');

    console.log('Hashing passwords...');
    const [ownerPasswordHash, recruiterPasswordHash] = await Promise.all([
      bcrypt.hash('password123', 12),
      bcrypt.hash('password123', 12),
    ]);

    // ── Organization ──────────────────────────────────────────────
    console.log('Creating organization...');
    const organization = await Organization.create({
      name: 'TechRecruit Agency',
      slug: 'techrecruit',
      settings: {
        subscriptionPlan: 'pro',
        maxUsers: 25,
        features: ['ai-analysis', 'resume-parsing', 'advanced-reporting'],
      },
      isActive: true,
    });

    // ── Users ────────────────────────────────────────────────────
    console.log('Creating users...');
    const [johnUser, sarahUser] = await User.create([
      {
        organizationId: organization._id,
        name: 'John Recruiter',
        email: 'john@techrecruit.com',
        passwordHash: ownerPasswordHash,
        role: 'owner',
        isActive: true,
      },
      {
        organizationId: organization._id,
        name: 'Sarah Miller',
        email: 'sarah@techrecruit.com',
        passwordHash: recruiterPasswordHash,
        role: 'recruiter',
        isActive: true,
      },
    ]);

    organization.createdBy = johnUser._id;
    await organization.save();

    // ── Tags ─────────────────────────────────────────────────────
    console.log('Creating tags...');
    const tagNames = [
      'React',
      'Node.js',
      'TypeScript',
      'Python',
      'DevOps',
      'Senior',
      'Frontend',
      'Backend',
      'Remote',
      'AWS',
      'Docker',
      'Kubernetes',
      'Machine Learning',
      'Full Stack',
      'Lead',
    ];
    const tagColors = [
      '#61dafb', '#68a063', '#3178c6', '#3776ab', '#f05c2e',
      '#ff6b35', '#e44d26', '#5a9fd4', '#22c55e', '#ff9900',
      '#0db7ed', '#326ce5', '#ff6f00', '#7c3aed', '#f59e0b',
    ];
    const tags = await Tag.create(
      tagNames.map((name, i) => ({
        organizationId: organization._id,
        name,
        color: tagColors[i],
      })),
    );

    // ── Jobs ────────────────────────────────────────────────────
    console.log('Creating jobs...');
    const jobs = await Job.create([
      {
        organizationId: organization._id,
        title: 'Senior React Developer',
        companyName: 'TechRecruit Agency',
        description:
          'We are looking for an experienced React developer to lead our frontend team. You will architect and build complex user interfaces using React, TypeScript, and modern frontend tooling. You will mentor junior developers and establish best practices for the team.',
        requiredSkills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Redux', 'GraphQL', 'Testing'],
        experienceLevel: 'senior',
        employmentType: 'full-time',
        location: 'Remote',
        salaryRange: { min: 120000, max: 160000, currency: 'USD' },
        status: 'open',
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        title: 'Node.js Backend Engineer',
        companyName: 'TechRecruit Agency',
        description:
          'Join our backend team to build scalable APIs and microservices using Node.js and TypeScript. You will work on high-traffic systems, design database schemas, and collaborate with frontend engineers to deliver seamless features.',
        requiredSkills: ['Node.js', 'TypeScript', 'Express', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'REST APIs'],
        experienceLevel: 'mid',
        employmentType: 'full-time',
        location: 'Remote',
        status: 'open',
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        title: 'Full Stack TypeScript Developer',
        companyName: 'TechRecruit Agency',
        description:
          'We need a versatile full stack developer proficient in TypeScript across the entire stack. You will build features end-to-end using React, Node.js, and cloud services. This role requires strong product sense and the ability to work autonomously.',
        requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS', 'GraphQL', 'Tailwind CSS'],
        experienceLevel: 'senior',
        employmentType: 'contract',
        location: 'Hybrid - San Francisco, CA',
        salaryRange: { min: 100, max: 150, currency: 'USD' },
        status: 'open',
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        title: 'DevOps Engineer',
        companyName: 'TechRecruit Agency',
        description:
          'We are seeking a DevOps engineer to own our cloud infrastructure and CI/CD pipelines. You will implement Kubernetes clusters, manage AWS resources, and ensure high availability and security across all environments.',
        requiredSkills: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Monitoring'],
        experienceLevel: 'senior',
        employmentType: 'full-time',
        location: 'Remote',
        salaryRange: { min: 140000, max: 180000, currency: 'USD' },
        status: 'open',
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        title: 'Junior Python Developer',
        companyName: 'TechRecruit Agency',
        description:
          'Great opportunity for a junior developer to grow their skills in Python development. You will work on data processing pipelines, write automated tests, and contribute to internal tools under the guidance of senior engineers.',
        requiredSkills: ['Python', 'SQL', 'Git', 'Linux', 'Flask', 'Problem Solving'],
        experienceLevel: 'entry',
        employmentType: 'full-time',
        location: 'On-site - New York, NY',
        salaryRange: { min: 65000, max: 85000, currency: 'USD' },
        status: 'open',
        createdBy: sarahUser._id,
      },
    ]);

    // ── Candidates ──────────────────────────────────────────────
    console.log('Creating candidates...');
    const candidates = await Candidate.create([
      {
        organizationId: organization._id,
        fullName: 'Alex Chen',
        email: 'alex.chen@example.com',
        phone: '+1 (415) 555-0101',
        location: 'San Francisco, CA',
        linkedinUrl: 'https://linkedin.com/in/alexchen',
        githubUrl: 'https://github.com/alexchen',
        yearsOfExperience: 7,
        summary:
          'Senior frontend engineer with 7 years of experience building complex React applications at scale. Passionate about developer experience, performance optimization, and accessible UI design. Led the migration of a legacy Angular app to React at my previous company.',
        skills: ['React', 'TypeScript', 'JavaScript', 'Redux', 'GraphQL', 'CSS-in-JS', 'Storybook', 'Jest', 'Webpack'],
        workHistory: [
          {
            company: 'DataStream Inc.',
            title: 'Senior Frontend Engineer',
            startDate: '2021-03',
            endDate: undefined,
            description:
              'Lead frontend architect for the core product. Migrated legacy codebase to React 18 with TypeScript. Reduced bundle size by 40% and improved Lighthouse scores from 65 to 95.',
            isCurrent: true,
          },
          {
            company: 'WebCraft Agency',
            title: 'Frontend Developer',
            startDate: '2018-06',
            endDate: '2021-02',
            description:
              'Built responsive web applications for enterprise clients using React and Vue.js. Introduced component library that was adopted across 5 projects.',
            isCurrent: false,
          },
          {
            company: 'StartupLab',
            title: 'Junior Developer',
            startDate: '2016-09',
            endDate: '2018-05',
            description:
              'Developed and maintained client websites using HTML, CSS, JavaScript, and jQuery. Collaborated with designers to implement pixel-perfect mockups.',
            isCurrent: false,
          },
        ],
        education: [
          { institution: 'UC Berkeley', degree: 'B.S.', field: 'Computer Science', startYear: '2012', endYear: '2016' },
        ],
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        fullName: 'Maria Garcia',
        email: 'maria.garcia@example.com',
        phone: '+1 (512) 555-0102',
        location: 'Austin, TX',
        linkedinUrl: 'https://linkedin.com/in/mariagarcia',
        githubUrl: 'https://github.com/mariagarcia',
        yearsOfExperience: 5,
        summary:
          'Full stack TypeScript developer with experience building cloud-native applications. Comfortable working across the entire stack from React frontends to Node.js microservices. Strong advocate for type safety and automated testing.',
        skills: ['TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'AWS Lambda', 'Docker', 'GraphQL', 'Tailwind CSS'],
        workHistory: [
          {
            company: 'CloudScale Solutions',
            title: 'Full Stack Developer',
            startDate: '2021-01',
            endDate: undefined,
            description:
              'Build and maintain microservices architecture using Node.js and TypeScript. Implemented GraphQL federation layer serving 10+ services.',
            isCurrent: true,
          },
          {
            company: 'TechVentures',
            title: 'Software Engineer',
            startDate: '2019-03',
            endDate: '2020-12',
            description:
              'Developed REST APIs and React-based dashboards for a SaaS analytics platform. Reduced API response times by 60% through query optimization.',
            isCurrent: false,
          },
          {
            company: 'CodeBridge Academy',
            title: 'Junior Developer',
            startDate: '2018-01',
            endDate: '2019-02',
            description:
              'Built internal tools and contributed to the main product using React and Node.js. Wrote comprehensive unit and integration tests.',
            isCurrent: false,
          },
        ],
        education: [
          { institution: 'University of Texas', degree: 'B.S.', field: 'Computer Engineering', startYear: '2013', endYear: '2017' },
        ],
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        fullName: 'James Wilson',
        email: 'james.wilson@example.com',
        phone: '+1 (206) 555-0103',
        location: 'Seattle, WA',
        linkedinUrl: 'https://linkedin.com/in/jameswilson',
        githubUrl: 'https://github.com/jameswilson',
        yearsOfExperience: 8,
        summary:
          'Seasoned DevOps engineer with deep expertise in AWS infrastructure, Kubernetes orchestration, and CI/CD automation. Experienced in building zero-downtime deployment pipelines and implementing comprehensive monitoring solutions.',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'CI/CD', 'Linux', 'Prometheus', 'Grafana', 'Python'],
        workHistory: [
          {
            company: 'ScaleOps Inc.',
            title: 'Senior DevOps Engineer',
            startDate: '2020-06',
            endDate: undefined,
            description:
              'Designed and managed multi-region Kubernetes clusters serving 1M+ daily active users. Implemented GitOps workflow with ArgoCD reducing deployment time by 80%.',
            isCurrent: true,
          },
          {
            company: 'CloudNative Co.',
            title: 'DevOps Engineer',
            startDate: '2017-04',
            endDate: '2020-05',
            description:
              'Managed AWS infrastructure supporting 200+ microservices. Built CI/CD pipelines using Jenkins and GitHub Actions.',
            isCurrent: false,
          },
          {
            company: 'IT Solutions Group',
            title: 'Systems Administrator',
            startDate: '2015-02',
            endDate: '2017-03',
            description:
              'Managed Linux servers and automated routine maintenance tasks with Bash and Python scripts.',
            isCurrent: false,
          },
        ],
        education: [
          { institution: 'Washington State University', degree: 'B.S.', field: 'Information Technology', startYear: '2010', endYear: '2014' },
        ],
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        fullName: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+1 (312) 555-0104',
        location: 'Chicago, IL',
        linkedinUrl: 'https://linkedin.com/in/priyapatel',
        githubUrl: 'https://github.com/priyapatel',
        yearsOfExperience: 4,
        summary:
          'Backend engineer specializing in Node.js and TypeScript with a strong foundation in database design and API architecture. Experienced in building event-driven systems and RESTful services.',
        skills: ['Node.js', 'TypeScript', 'Express', 'MongoDB', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Docker', 'Jest'],
        workHistory: [
          {
            company: 'FinTech Innovations',
            title: 'Backend Engineer',
            startDate: '2022-01',
            endDate: undefined,
            description:
              'Design and implement RESTful APIs for a trading platform handling 10k+ requests per second. Optimized database queries reducing average latency by 45%.',
            isCurrent: true,
          },
          {
            company: 'Digital Services Ltd.',
            title: 'Software Developer',
            startDate: '2020-03',
            endDate: '2021-12',
            description:
              'Built backend services using Node.js and MongoDB for an e-commerce platform. Implemented caching layer with Redis reducing database load by 60%.',
            isCurrent: false,
          },
          {
            company: 'TechStart Inc.',
            title: 'Junior Backend Developer',
            startDate: '2019-01',
            endDate: '2020-02',
            description:
              'Assisted in developing and maintaining backend APIs. Wrote automated tests and documentation.',
            isCurrent: false,
          },
        ],
        education: [
          { institution: 'University of Illinois', degree: 'M.S.', field: 'Computer Science', startYear: '2017', endYear: '2019' },
          { institution: 'University of Mumbai', degree: 'B.E.', field: 'Computer Engineering', startYear: '2013', endYear: '2017' },
        ],
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        fullName: 'Omar Hassan',
        email: 'omar.hassan@example.com',
        phone: '+1 (718) 555-0105',
        location: 'New York, NY',
        linkedinUrl: 'https://linkedin.com/in/omarhassan',
        githubUrl: 'https://github.com/omarhassan',
        yearsOfExperience: 3,
        summary:
          'Python developer with experience in data processing, automation, and web development. Quick learner with a strong foundation in algorithms and data structures. Passionate about writing clean, maintainable code.',
        skills: ['Python', 'Flask', 'Django', 'SQL', 'PostgreSQL', 'Git', 'Linux', 'REST APIs', 'Pandas'],
        workHistory: [
          {
            company: 'DataPulse Analytics',
            title: 'Python Developer',
            startDate: '2022-06',
            endDate: undefined,
            description:
              'Develop data processing pipelines handling 500GB+ of daily data. Built REST APIs with Flask and maintained ETL jobs.',
            isCurrent: true,
          },
          {
            company: 'WebDev Studio',
            title: 'Junior Developer',
            startDate: '2021-01',
            endDate: '2022-05',
            description:
              'Built and maintained web applications using Django. Collaborated on API design and database schema planning.',
            isCurrent: false,
          },
        ],
        education: [
          { institution: 'NYU', degree: 'B.S.', field: 'Computer Science', startYear: '2016', endYear: '2020' },
        ],
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        fullName: 'Lisa Thompson',
        email: 'lisa.thompson@example.com',
        phone: '+1 (503) 555-0106',
        location: 'Portland, OR',
        linkedinUrl: 'https://linkedin.com/in/lisathompson',
        githubUrl: 'https://github.com/lisathompson',
        yearsOfExperience: 6,
        summary:
          'Senior frontend developer with a keen eye for design and usability. Expert in React and modern CSS with experience building design systems and component libraries from scratch.',
        skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'Figma', 'Storybook', 'Cypress', 'Accessibility'],
        workHistory: [
          {
            company: 'DesignCraft Inc.',
            title: 'Senior Frontend Developer',
            startDate: '2021-08',
            endDate: undefined,
            description:
              'Lead development of a comprehensive design system used across 4 product teams. Implemented accessible components achieving WCAG 2.1 AA compliance.',
            isCurrent: true,
          },
          {
            company: 'Pixel Perfect Agency',
            title: 'Frontend Developer',
            startDate: '2019-02',
            endDate: '2021-07',
            description:
              'Built responsive web applications for clients in healthcare and finance. Developed reusable React components and integration tests.',
            isCurrent: false,
          },
          {
            company: 'WebFoundry',
            title: 'Junior Frontend Developer',
            startDate: '2017-04',
            endDate: '2019-01',
            description:
              'Created marketing websites and landing pages. Transitioned legacy jQuery code to React.',
            isCurrent: false,
          },
        ],
        education: [
          { institution: 'Oregon State University', degree: 'B.S.', field: 'Computer Science', startYear: '2012', endYear: '2016' },
        ],
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        fullName: 'David Kim',
        email: 'david.kim@example.com',
        phone: '+1 (425) 555-0107',
        location: 'Redmond, WA',
        linkedinUrl: 'https://linkedin.com/in/davidkim',
        githubUrl: 'https://github.com/davidkim',
        yearsOfExperience: 10,
        summary:
          'Experienced full stack engineer with a decade of experience delivering production systems at scale. Strong technical leader with expertise in TypeScript, cloud architecture, and distributed systems. Led multiple cross-functional teams.',
        skills: ['TypeScript', 'React', 'Node.js', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'GraphQL', 'System Design', 'Leadership'],
        workHistory: [
          {
            company: 'Enterprise Solutions Co.',
            title: 'Lead Full Stack Engineer',
            startDate: '2019-03',
            endDate: undefined,
            description:
              'Architect and lead development of a multi-tenant SaaS platform serving 500+ enterprise clients. Manage a team of 8 engineers across frontend and backend.',
            isCurrent: true,
          },
          {
            company: 'TechGrowth Inc.',
            title: 'Senior Software Engineer',
            startDate: '2015-06',
            endDate: '2019-02',
            description:
              'Built and maintained customer-facing web applications. Led migration from monolith to microservices architecture.',
            isCurrent: false,
          },
          {
            company: 'StartupHub',
            title: 'Software Engineer',
            startDate: '2013-01',
            endDate: '2015-05',
            description:
              'Full stack development for early-stage startup. Built MVP that secured series A funding.',
            isCurrent: false,
          },
        ],
        education: [
          { institution: 'University of Washington', degree: 'B.S.', field: 'Computer Science', startYear: '2009', endYear: '2013' },
          { institution: 'Stanford University', degree: 'M.S.', field: 'Computer Science', startYear: '2014', endYear: '2015' },
        ],
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        fullName: 'Emma Rodriguez',
        email: 'emma.rodriguez@example.com',
        phone: '+1 (646) 555-0108',
        location: 'New York, NY',
        linkedinUrl: 'https://linkedin.com/in/emmarodriguez',
        githubUrl: 'https://github.com/emmarodriguez',
        yearsOfExperience: 1,
        summary:
          'Recent computer science graduate with a strong academic record and internship experience. Proficient in Python and JavaScript with a passion for building software that makes a difference. Eager to learn and grow in a collaborative team environment.',
        skills: ['Python', 'JavaScript', 'React', 'SQL', 'Git', 'HTML', 'CSS', 'Java', 'Data Structures'],
        workHistory: [
          {
            company: 'TechStart Inc.',
            title: 'Software Engineering Intern',
            startDate: '2025-06',
            endDate: '2025-08',
            description:
              'Contributed to internal tooling using React and Python. Fixed bugs and wrote unit tests under guidance of senior engineers.',
            isCurrent: false,
          },
        ],
        education: [
          { institution: 'Columbia University', degree: 'B.S.', field: 'Computer Science', startYear: '2021', endYear: '2025' },
        ],
        createdBy: sarahUser._id,
      },
    ]);

    // ── Applications ────────────────────────────────────────────
    console.log('Creating applications...');
    const applications = await Application.create([
      {
        organizationId: organization._id,
        candidateId: candidates[0]._id, // Alex Chen
        jobId: jobs[0]._id, // Senior React Developer
        stage: 'Interview',
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[1]._id, // Maria Garcia
        jobId: jobs[2]._id, // Full Stack TypeScript Developer
        stage: 'Screening',
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[2]._id, // James Wilson
        jobId: jobs[3]._id, // DevOps Engineer
        stage: 'Offer',
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[3]._id, // Priya Patel
        jobId: jobs[1]._id, // Node.js Backend Engineer
        stage: 'Interview',
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[4]._id, // Omar Hassan
        jobId: jobs[4]._id, // Junior Python Developer
        stage: 'Applied',
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[5]._id, // Lisa Thompson
        jobId: jobs[0]._id, // Senior React Developer
        stage: 'Screening',
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[6]._id, // David Kim
        jobId: jobs[2]._id, // Full Stack TypeScript Developer
        stage: 'Applied',
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[7]._id, // Emma Rodriguez
        jobId: jobs[4]._id, // Junior Python Developer
        stage: 'Hired',
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[0]._id, // Alex Chen
        jobId: jobs[2]._id, // Full Stack TypeScript Developer
        stage: 'Applied',
        createdBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[1]._id, // Maria Garcia
        jobId: jobs[1]._id, // Node.js Backend Engineer
        stage: 'Rejected',
        createdBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[6]._id, // David Kim
        jobId: jobs[3]._id, // DevOps Engineer
        stage: 'Applied',
        createdBy: johnUser._id,
      },
    ]);

    // ── AI Analyses ─────────────────────────────────────────────
    console.log('Creating AI analyses...');
    const aiAnalyses = await AIAnalysis.create([
      {
        organizationId: organization._id,
        candidateId: candidates[0]._id, // Alex Chen
        jobId: jobs[0]._id, // Senior React Developer
        matchScore: 92,
        strengths: [
          '7 years of React experience with a focus on performance optimization',
          'Led migration from Angular to React, demonstrating technical leadership',
          'Strong understanding of modern frontend tooling (Webpack, Storybook, CSS-in-JS)',
          'Reduced bundle size by 40% and improved Lighthouse scores significantly',
        ],
        missingSkills: ['GraphQL experience listed as nice-to-have but candidate has it'],
        possibleConcerns: [
          'No direct experience with Redux in the most recent role (may use alternatives)',
          'All experience is at startups/agencies, no enterprise experience',
        ],
        recruiterSummary:
          'Alex is an excellent fit for the Senior React Developer role. His experience leading frontend architecture, performance optimization, and modern React patterns aligns perfectly with our requirements. Strong hire.',
        suggestedInterviewQuestions: [
          'Walk me through how you approached the Angular to React migration. What were the biggest challenges?',
          'How do you approach performance optimization in a React application?',
          'Describe your experience with state management. When would you choose Redux vs other solutions?',
          'How do you ensure accessibility in your components?',
        ],
        rawModelResponse: 'Mock AI analysis response for development purposes.',
        modelVersion: 'gpt-4o-mini',
        processingTime: 2345,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[2]._id, // James Wilson
        jobId: jobs[3]._id, // DevOps Engineer
        matchScore: 96,
        strengths: [
          '8 years of DevOps experience with deep AWS and Kubernetes expertise',
          'Implemented GitOps workflow with ArgoCD, demonstrating modern DevOps practices',
          'Managed multi-region Kubernetes clusters at scale (1M+ DAU)',
          'Strong infrastructure-as-code skills (Terraform, Ansible)',
        ],
        missingSkills: [],
        possibleConcerns: [
          'No experience with the specific monitoring stack mentioned (Prometheus/Grafana is listed)',
          'May be overqualified for this role — could get bored',
        ],
        recruiterSummary:
          'James is an outstanding candidate for this role. His experience is a near-perfect match for our requirements. He brings everything from Kubernetes orchestration to CI/CD automation. Make an offer.',
        suggestedInterviewQuestions: [
          'Describe how you designed the multi-region Kubernetes architecture. What were the trade-offs?',
          'How do you approach incident response and on-call rotations?',
          'Walk me through your ideal CI/CD pipeline for a microservices architecture.',
        ],
        rawModelResponse: 'Mock AI analysis response for development purposes.',
        modelVersion: 'gpt-4o-mini',
        processingTime: 1892,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[3]._id, // Priya Patel
        jobId: jobs[1]._id, // Node.js Backend Engineer
        matchScore: 88,
        strengths: [
          'Strong Node.js and TypeScript backend experience with a focus on performance',
          'Experience with high-throughput systems (10k+ req/s trading platform)',
          'Database optimization skills — reduced query latency by 45%',
          'Knowledge of message queues (RabbitMQ) and caching (Redis)',
        ],
        missingSkills: [
          'No mention of GraphQL experience',
        ],
        possibleConcerns: [
          '4 years of experience — might need more senior mentorship initially',
          'No experience with PostgreSQL specifically in most recent role (MongoDB focused)',
        ],
        recruiterSummary:
          'Priya is a strong mid-level backend engineer. Her Node.js and TypeScript skills are exactly what we need. She has experience building high-performance systems which will be valuable. Recommend moving to interview stage.',
        suggestedInterviewQuestions: [
          'How did you design the caching strategy for the trading platform?',
          'Tell me about a time you debugged a production issue under pressure.',
          'How do you approach API versioning and backward compatibility?',
        ],
        rawModelResponse: 'Mock AI analysis response for development purposes.',
        modelVersion: 'gpt-4o-mini',
        processingTime: 2103,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[5]._id, // Lisa Thompson
        jobId: jobs[0]._id, // Senior React Developer
        matchScore: 85,
        strengths: [
          'Deep React expertise with experience building design systems from scratch',
          'Strong focus on accessibility (WCAG 2.1 AA compliance)',
          'Experience with Storybook and component libraries',
          'Good eye for design and usability (works with Figma)',
        ],
        missingSkills: [
          'No mention of GraphQL or Redux in recent experience',
        ],
        possibleConcerns: [
          'Less experience with state management libraries',
          'Recent role focuses more on design systems than application features',
        ],
        recruiterSummary:
          'Lisa is a strong frontend developer with a specialization in design systems and accessibility. While she may lack some experience with application-level state management, her component expertise and accessibility knowledge would be valuable to the team.',
        suggestedInterviewQuestions: [
          'How did you ensure WCAG 2.1 AA compliance across the design system components?',
          'Describe how you would architect a complex form with dynamic fields in React.',
          'How do you balance developer experience with user experience in component design?',
        ],
        rawModelResponse: 'Mock AI analysis response for development purposes.',
        modelVersion: 'gpt-4o-mini',
        processingTime: 1987,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[4]._id, // Omar Hassan
        jobId: jobs[4]._id, // Junior Python Developer
        matchScore: 78,
        strengths: [
          'Solid Python foundation with Flask and Django experience',
          'Experience building data processing pipelines at scale',
          'Strong database skills with PostgreSQL',
          'Good understanding of REST API design',
        ],
        missingSkills: [
          'No mention of Flask in the job requirements (candidate has it though)',
        ],
        possibleConcerns: [
          'Only 3 years of experience — may need mentorship initially',
          'No experience with automated testing frameworks mentioned prominently',
        ],
        recruiterSummary:
          'Omar is a solid candidate for the Junior Python Developer role. He has hands-on experience with Python web frameworks and data processing, which goes beyond what we typically see at this level. Recommend proceeding to screening.',
        suggestedInterviewQuestions: [
          'Describe the data processing pipeline you built. What were the throughput requirements?',
          'How do you approach testing in your Python applications?',
          'Tell me about a challenging bug you had to debug and how you solved it.',
        ],
        rawModelResponse: 'Mock AI analysis response for development purposes.',
        modelVersion: 'gpt-4o-mini',
        processingTime: 1756,
      },
    ]);

    // Link AI analyses to applications
    await Promise.all([
      Application.findByIdAndUpdate(applications[0]._id, { aiAnalysisId: aiAnalyses[0]._id }), // Alex -> Senior React
      Application.findByIdAndUpdate(applications[2]._id, { aiAnalysisId: aiAnalyses[1]._id }), // James -> DevOps
      Application.findByIdAndUpdate(applications[3]._id, { aiAnalysisId: aiAnalyses[2]._id }), // Priya -> Node.js
      Application.findByIdAndUpdate(applications[5]._id, { aiAnalysisId: aiAnalyses[3]._id }), // Lisa -> Senior React
      Application.findByIdAndUpdate(applications[4]._id, { aiAnalysisId: aiAnalyses[4]._id }), // Omar -> Jr Python
    ]);

    // ── Notes ──────────────────────────────────────────────────
    console.log('Creating notes...');
    await Note.create([
      {
        organizationId: organization._id,
        candidateId: candidates[0]._id, // Alex Chen
        authorId: johnUser._id,
        content:
          'Alex had a great first interview. Strong technical skills and communicated well. Need to check on salary expectations before proceeding to the next round.',
      },
      {
        organizationId: organization._id,
        candidateId: candidates[0]._id, // Alex Chen
        authorId: sarahUser._id,
        content:
          'Reviewed Alex\'s portfolio — impressive work on the Angular to React migration. Would like to see a live coding session focused on React performance.',
      },
      {
        organizationId: organization._id,
        candidateId: candidates[2]._id, // James Wilson
        authorId: johnUser._id,
        content:
          'James accepted the offer! Start date is April 1st. Sent onboarding paperwork.',
      },
      {
        organizationId: organization._id,
        candidateId: candidates[7]._id, // Emma Rodriguez
        authorId: sarahUser._id,
        content:
          'Emma started today. Great energy and enthusiasm. Shadowing the senior Python developer for the first week.',
      },
      {
        organizationId: organization._id,
        candidateId: candidates[1]._id, // Maria Garcia
        authorId: sarahUser._id,
        content:
          'Maria declined the Node.js role — she accepted another offer. Sent a polite follow-up for future opportunities.',
      },
      {
        organizationId: organization._id,
        candidateId: candidates[6]._id, // David Kim
        authorId: johnUser._id,
        content:
          'David\'s resume is very impressive — 10 years of experience with leadership background. He applied for two positions. Let\'s prioritize the Full Stack role.',
      },
    ]);

    // ── Resumes (placeholder records) ──────────────────────────
    console.log('Creating placeholder resume records...');
    const resumeRecords = await Resume.create([
      {
        organizationId: organization._id,
        candidateId: candidates[0]._id, // Alex Chen
        fileName: 'alex_chen_resume.pdf',
        filePath: '/uploads/resumes/alex_chen_resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 245760,
        uploadedBy: johnUser._id,
        parsedData: {
          fullName: 'Alex Chen',
          email: 'alex.chen@example.com',
          phone: '+1 (415) 555-0101',
          skills: ['React', 'TypeScript', 'JavaScript', 'Redux', 'GraphQL', 'CSS-in-JS', 'Storybook', 'Jest', 'Webpack'],
          summary: 'Senior frontend engineer with 7 years of experience...',
        },
      },
      {
        organizationId: organization._id,
        candidateId: candidates[1]._id, // Maria Garcia
        fileName: 'maria_garcia_resume.pdf',
        filePath: '/uploads/resumes/maria_garcia_resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 198656,
        uploadedBy: sarahUser._id,
        parsedData: {
          fullName: 'Maria Garcia',
          email: 'maria.garcia@example.com',
          phone: '+1 (512) 555-0102',
          skills: ['TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'AWS Lambda', 'Docker', 'GraphQL', 'Tailwind CSS'],
          summary: 'Full stack TypeScript developer with experience building cloud-native applications...',
        },
      },
      {
        organizationId: organization._id,
        candidateId: candidates[2]._id, // James Wilson
        fileName: 'james_wilson_resume.pdf',
        filePath: '/uploads/resumes/james_wilson_resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 212992,
        uploadedBy: johnUser._id,
        parsedData: {
          fullName: 'James Wilson',
          email: 'james.wilson@example.com',
          phone: '+1 (206) 555-0103',
          skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'CI/CD', 'Linux', 'Prometheus', 'Grafana', 'Python'],
          summary: 'Seasoned DevOps engineer with deep expertise in AWS infrastructure...',
        },
      },
      {
        organizationId: organization._id,
        candidateId: candidates[3]._id, // Priya Patel
        fileName: 'priya_patel_resume.pdf',
        filePath: '/uploads/resumes/priya_patel_resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 180224,
        uploadedBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[4]._id, // Omar Hassan
        fileName: 'omar_hassan_resume.pdf',
        filePath: '/uploads/resumes/omar_hassan_resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 163840,
        uploadedBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[5]._id, // Lisa Thompson
        fileName: 'lisa_thompson_resume.pdf',
        filePath: '/uploads/resumes/lisa_thompson_resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 172032,
        uploadedBy: sarahUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[6]._id, // David Kim
        fileName: 'david_kim_resume.pdf',
        filePath: '/uploads/resumes/david_kim_resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 270336,
        uploadedBy: johnUser._id,
      },
      {
        organizationId: organization._id,
        candidateId: candidates[7]._id, // Emma Rodriguez
        fileName: 'emma_rodriguez_resume.pdf',
        filePath: '/uploads/resumes/emma_rodriguez_resume.pdf',
        mimeType: 'application/pdf',
        fileSize: 139264,
        uploadedBy: sarahUser._id,
      },
    ]);

    // Link resume IDs back to candidates
    const candidateResumeMap: Record<string, mongoose.Types.ObjectId[]> = {};
    for (const resume of resumeRecords) {
      const cid = resume.candidateId!.toString();
      if (!candidateResumeMap[cid]) candidateResumeMap[cid] = [];
      candidateResumeMap[cid].push(resume._id);
    }
    for (const candidate of candidates) {
      const resumeIds = candidateResumeMap[candidate._id.toString()];
      if (resumeIds) {
        await Candidate.findByIdAndUpdate(candidate._id, { resumeIds });
      }
    }

    // ── Summary ────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════');
    console.log('  Seed completed successfully!');
    console.log('══════════════════════════════════════════');
    console.log(`  Organization:  1`);
    console.log(`  Users:         2  (1 owner, 1 recruiter)`);
    console.log(`  Tags:          ${tags.length}`);
    console.log(`  Jobs:          ${jobs.length}`);
    console.log(`  Candidates:    ${candidates.length}`);
    console.log(`  Applications:  ${applications.length}`);
    console.log(`  AI Analyses:   ${aiAnalyses.length}`);
    console.log(`  Notes:         6`);
    console.log(`  Resumes:       ${resumeRecords.length}`);
    console.log('══════════════════════════════════════════\n');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

seed();
