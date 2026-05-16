import React from 'react';
import { Crown, Lock, Mail, MapPin, Phone } from 'lucide-react';

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    jobTitle: string;
  };
  education: Array<{ school: string; degree: string; year: string }>;
  experience: Array<{ company: string; role: string; duration: string; description: string }>;
  projects: Array<{ title: string; tech: string; description: string }>;
  skills: string[];
}

type UserPlan = 'FREE' | 'PRO';
type PersonalField = keyof ResumeData['personalInfo'];
type TextField = 'summary' | 'objective' | 'achievements' | 'certifications' | 'extracurricular' | 'linkedinText' | 'githubText';
type EducationField = keyof ResumeData['education'][number];
type ExperienceField = keyof ResumeData['experience'][number];
type ProjectField = keyof ResumeData['projects'][number];

export type TemplateEditor = {
  updatePersonal?: (field: PersonalField, value: string) => void;
  updateText?: (field: TextField, value: string) => void;
  updateSkill?: (index: number, value: string) => void;
  updateEducation?: (index: number, field: EducationField, value: string) => void;
  updateExperience?: (index: number, field: ExperienceField, value: string) => void;
  updateProject?: (index: number, field: ProjectField, value: string) => void;
};

type ExtendedResumeData = ResumeData & {
  summary?: string;
  objective?: string;
  achievements?: string | string[];
  certifications?: string | string[];
  extracurricular?: string | string[];
  linkedinText?: string;
  githubText?: string;
};

interface TemplateProps {
  data: ExtendedResumeData;
  editor?: TemplateEditor;
}

interface TemplateManagerProps {
  data: ResumeData | Record<string, unknown>;
  templateId: number;
  userPlan?: UserPlan | string | null;
  editor?: TemplateEditor;
}

export const PREMIUM_TEMPLATES = new Set<number>([2, 3, 4, 6, 7, 8]);
export const FREE_TEMPLATES = new Set<number>([1, 5, 9]);
const UNLOCKED_TEMPLATE_STORAGE_KEY = 'resumepilot_unlocked_template_ids';

export const getUnlockedTemplateIds = (): number[] => {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(UNLOCKED_TEMPLATE_STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id))
      : [];
  } catch {
    return [];
  }
};

export const unlockTemplate = (templateId: number): number[] => {
  const next = Array.from(new Set([...getUnlockedTemplateIds(), Number(templateId)]));
  localStorage.setItem(UNLOCKED_TEMPLATE_STORAGE_KEY, JSON.stringify(next));
  return next;
};

export const isTemplateAccessible = (
  templateId: number,
  userPlan?: UserPlan | string | null,
  unlockedTemplateIds: number[] = getUnlockedTemplateIds(),
): boolean => {
  if (String(userPlan).toUpperCase() === 'ADMIN') return true;
  if (!PREMIUM_TEMPLATES.has(templateId)) return true;
  return unlockedTemplateIds.includes(templateId);
};

const fallbackData: ExtendedResumeData = {
  personalInfo: {
    fullName: 'Your Name',
    email: 'you@example.com',
    phone: '+91-0000000000',
    location: 'City, Country',
    jobTitle: 'Professional Title',
  },
  summary: 'Results-driven professional with strong execution, communication, and problem-solving skills.',
  education: [{ school: 'University Name', degree: 'Degree or Certification', year: '2022 - 2026' }],
  experience: [
    {
      company: 'Company Name',
      role: 'Role / Position',
      duration: '2024 - Present',
      description: 'Delivered measurable business impact through reliable execution, teamwork, and ownership.',
    },
  ],
  projects: [
    {
      title: 'Project Name',
      tech: 'Tech stack',
      description: 'Built a practical solution focused on usability, performance, and maintainability.',
    },
  ],
  skills: ['Communication', 'Problem Solving', 'Leadership', 'Project Management'],
};

const asString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return fallback;
};

const linesFrom = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => asString(item)).filter(Boolean);
  return asString(value)
    .split(/\r?\n|,/)
    .map((line) => line.replace(/^(?:\s|[*. -]|\u2022)+/, '').trim())
    .filter(Boolean);
};

const normalizeResumeData = (input: ResumeData | Record<string, unknown>): ExtendedResumeData => {
  const raw = (input || {}) as Record<string, unknown>;
  const personal = (raw.personalInfo || {}) as Record<string, unknown>;
  const oldEducations = Array.isArray(raw.educations) ? (raw.educations as Array<Record<string, unknown>>) : [];
  const oldExperiences = Array.isArray(raw.experiences) ? (raw.experiences as Array<Record<string, unknown>>) : [];
  const oldProjects = Array.isArray(raw.projects) ? (raw.projects as Array<Record<string, unknown>>) : [];

  const education = Array.isArray(raw.education)
    ? (raw.education as Array<Record<string, unknown>>).map((item) => ({
        school: asString(item.school),
        degree: asString(item.degree),
        year: asString(item.year),
      }))
    : oldEducations.map((item) => ({
        school: asString(item.inst),
        degree: [asString(item.degree), asString(item.grade)].filter(Boolean).join(' - '),
        year: asString(item.duration),
      }));

  const experience = Array.isArray(raw.experience)
    ? (raw.experience as Array<Record<string, unknown>>).map((item) => ({
        company: asString(item.company),
        role: asString(item.role),
        duration: asString(item.duration),
        description: asString(item.description),
      }))
    : oldExperiences.map((item) => ({
        company: asString(item.company),
        role: asString(item.role),
        duration: asString(item.duration),
        description: asString(item.desc),
      }));

  const projects = oldProjects.length
    ? oldProjects.map((item) => ({
        title: asString(item.name),
        tech: asString(item.duration),
        description: asString(item.desc),
      }))
    : Array.isArray(raw.projects)
      ? (raw.projects as Array<Record<string, unknown>>).map((item) => ({
          title: asString(item.title),
          tech: asString(item.tech),
          description: asString(item.description),
        }))
      : [];

  const parsedSkills = linesFrom(raw.skills);

  return {
    personalInfo: {
      fullName: asString(personal.fullName || raw.fullName, fallbackData.personalInfo.fullName),
      email: asString(personal.email || raw.email, fallbackData.personalInfo.email),
      phone: asString(personal.phone || raw.phone, fallbackData.personalInfo.phone),
      location: asString(personal.location || raw.location, fallbackData.personalInfo.location),
      jobTitle: asString(personal.jobTitle || raw.jobTitle || raw.title, fallbackData.personalInfo.jobTitle),
    },
    summary: asString(raw.summary || raw.objective, fallbackData.summary),
    objective: asString(raw.objective || raw.summary, fallbackData.summary),
    education: education.length ? education : fallbackData.education,
    experience: experience.length ? experience : fallbackData.experience,
    projects: projects.length ? projects : fallbackData.projects,
    skills: parsedSkills.length ? parsedSkills : fallbackData.skills,
    achievements: raw.achievements as string | string[] | undefined,
    certifications: raw.certifications as string | string[] | undefined,
    extracurricular: raw.extracurricular as string | string[] | undefined,
    linkedinText: asString(raw.linkedinText),
    githubText: asString(raw.githubText),
  };
};

const getSummary = (data: ExtendedResumeData) => data.summary || data.objective || fallbackData.summary || '';
const getAchievements = (data: ExtendedResumeData) => linesFrom(data.achievements);
const getCertifications = (data: ExtendedResumeData) => linesFrom(data.certifications);
const getExtracurricular = (data: ExtendedResumeData) => linesFrom(data.extracurricular);
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'RP';

const editableClass = 'rounded-sm outline-none transition focus:bg-blue-50 focus:ring-1 focus:ring-blue-300 print:focus:bg-transparent print:focus:ring-0';

type EditableProps = {
  value: string;
  onCommit?: (value: string) => void;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3';
  className?: string;
};

const EditableText = ({ value, onCommit, as = 'span', className = '' }: EditableProps) => {
  const Tag = as;
  return (
    <Tag
      contentEditable={!!onCommit}
      suppressContentEditableWarning
      className={`${onCommit ? editableClass : ''} ${className}`}
      onBlur={(event) => onCommit?.(event.currentTarget.textContent || '')}
    >
      {value}
    </Tag>
  );
};

const A4Shell: React.FC<React.PropsWithChildren<{ className?: string; locked?: boolean }>> = ({
  children,
  className = '',
  locked = false,
}) => (
  <div
    className={`relative mx-auto w-full max-w-[210mm] overflow-hidden bg-white font-sans text-slate-900 shadow-2xl print:shadow-none ${className}`}
    style={{ aspectRatio: '1 / 1.414' }}
  >
    {children}
    {locked && <UpgradeOverlay />}
  </div>
);

const UpgradeOverlay = () => (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/25 p-8 backdrop-blur-md print:hidden">
    <div className="max-w-sm rounded-2xl border border-white/45 bg-white/85 p-7 text-center shadow-2xl backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-lg">
        <Crown className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-2xl font-black text-slate-950">Upgrade to Pro</h3>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-700">This premium resume template is locked on the FREE plan.</p>
      <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white">
        <Lock className="h-4 w-4" />
        Pro Template Locked
      </div>
    </div>
  </div>
);

const Avatar = ({ data, dark = false }: { data: ExtendedResumeData; dark?: boolean }) => (
  <div
    className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full border text-[22px] font-black tracking-tight ${
      dark ? 'border-white/50 bg-white/15 text-white' : 'border-slate-200 bg-slate-50 text-slate-700'
    }`}
  >
    {initials(data.personalInfo.fullName)}
  </div>
);

const SectionTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`mb-2 border-b border-slate-200 pb-1.5 text-[9.5px] font-black uppercase tracking-[0.17em] text-slate-800 ${className}`}>
    {children}
  </h2>
);

const BlueTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <SectionTitle className={`border-blue-200 text-blue-700 ${className}`}>{children}</SectionTitle>
);

const ContactLine = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <div className="flex min-w-0 items-center gap-1.5">
    <Icon className="h-3.5 w-3.5 shrink-0" />
    <span className="truncate">{children}</span>
  </div>
);

const BulletList = ({ items, className = '', onCommit }: { items: string[]; className?: string; onCommit?: (index: number, value: string) => void }) => (
  <ul className={`space-y-1 ${className}`}>
    {items.map((item, index) => (
      <li key={`${item}-${index}`} className="flex gap-1.5">
        <span className="mt-[0.48em] h-1 w-1 shrink-0 rounded-full bg-current" />
        <EditableText value={item} onCommit={onCommit ? (value) => onCommit(index, value) : undefined} />
      </li>
    ))}
  </ul>
);

const ExperienceBlock = ({
  item,
  index,
  editor,
  accent = 'text-blue-700',
}: {
  item: ExtendedResumeData['experience'][number];
  index: number;
  editor?: TemplateEditor;
  accent?: string;
}) => (
  <div className="break-inside-avoid">
    <div className="flex items-baseline justify-between gap-4">
      <EditableText value={item.role} onCommit={(value) => editor?.updateExperience?.(index, 'role', value)} as="h3" className="text-[11px] font-black leading-snug text-slate-950" />
      <EditableText value={item.duration} onCommit={(value) => editor?.updateExperience?.(index, 'duration', value)} className="shrink-0 text-[9px] font-bold text-slate-500" />
    </div>
    <EditableText value={item.company} onCommit={(value) => editor?.updateExperience?.(index, 'company', value)} as="div" className={`mt-0.5 text-[10px] font-bold ${accent}`} />
    <EditableText value={item.description} onCommit={(value) => editor?.updateExperience?.(index, 'description', value)} as="p" className="mt-1 whitespace-pre-wrap text-[9.5px] leading-relaxed text-slate-700" />
  </div>
);

const EducationBlock = ({ item, index, editor }: { item: ExtendedResumeData['education'][number]; index: number; editor?: TemplateEditor }) => (
  <div className="break-inside-avoid">
    <div className="flex items-baseline justify-between gap-3">
      <EditableText value={item.school} onCommit={(value) => editor?.updateEducation?.(index, 'school', value)} as="h3" className="text-[10px] font-black leading-snug text-slate-950" />
      <EditableText value={item.year} onCommit={(value) => editor?.updateEducation?.(index, 'year', value)} className="shrink-0 text-[9px] font-bold text-slate-500" />
    </div>
    <EditableText value={item.degree} onCommit={(value) => editor?.updateEducation?.(index, 'degree', value)} as="p" className="mt-0.5 text-[9.5px] leading-snug text-slate-700" />
  </div>
);

const ProjectBlock = ({
  item,
  index,
  editor,
  accent = 'text-blue-700',
}: {
  item: ExtendedResumeData['projects'][number];
  index: number;
  editor?: TemplateEditor;
  accent?: string;
}) => (
  <div className="break-inside-avoid">
    <div className="flex items-baseline justify-between gap-3">
      <EditableText value={item.title} onCommit={(value) => editor?.updateProject?.(index, 'title', value)} as="h3" className="text-[10px] font-black leading-snug text-slate-950" />
      <EditableText value={item.tech} onCommit={(value) => editor?.updateProject?.(index, 'tech', value)} className={`shrink-0 text-[9px] font-bold ${accent}`} />
    </div>
    <EditableText value={item.description} onCommit={(value) => editor?.updateProject?.(index, 'description', value)} as="p" className="mt-1 whitespace-pre-wrap text-[9.5px] leading-relaxed text-slate-700" />
  </div>
);

const ContactStrip = ({ data, editor, centered = true }: { data: ExtendedResumeData; editor?: TemplateEditor; centered?: boolean }) => (
  <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-semibold text-slate-600 ${centered ? 'justify-center' : 'justify-start'}`}>
    <EditableText value={data.personalInfo.phone} onCommit={(value) => editor?.updatePersonal?.('phone', value)} />
    <EditableText value={data.personalInfo.location} onCommit={(value) => editor?.updatePersonal?.('location', value)} />
    <EditableText value={data.personalInfo.email} onCommit={(value) => editor?.updatePersonal?.('email', value)} />
    {data.linkedinText && <EditableText value={data.linkedinText} onCommit={(value) => editor?.updateText?.('linkedinText', value)} />}
    {data.githubText && <EditableText value={data.githubText} onCommit={(value) => editor?.updateText?.('githubText', value)} />}
  </div>
);

const ProfileSection = ({ data, editor, title = 'Profile' }: { data: ExtendedResumeData; editor?: TemplateEditor; title?: string }) => (
  <section>
    <BlueTitle>{title}</BlueTitle>
    <EditableText value={getSummary(data)} onCommit={(value) => editor?.updateText?.('objective', value)} as="p" className="text-[10px] leading-relaxed text-slate-700" />
  </section>
);

const EducationSection = ({ data, editor, className = '' }: { data: ExtendedResumeData; editor?: TemplateEditor; className?: string }) => (
  <section className={className}>
    <BlueTitle>Education</BlueTitle>
    <div className="space-y-2">{data.education.map((item, index) => <EducationBlock key={index} item={item} index={index} editor={editor} />)}</div>
  </section>
);

const ExperienceSection = ({ data, editor, className = '', title = 'Experience' }: { data: ExtendedResumeData; editor?: TemplateEditor; className?: string; title?: string }) => (
  <section className={className}>
    <BlueTitle>{title}</BlueTitle>
    <div className="space-y-3">{data.experience.map((item, index) => <ExperienceBlock key={index} item={item} index={index} editor={editor} />)}</div>
  </section>
);

const ProjectsSection = ({ data, editor, className = '' }: { data: ExtendedResumeData; editor?: TemplateEditor; className?: string }) => (
  <section className={className}>
    <BlueTitle>Projects</BlueTitle>
    <div className="space-y-2.5">{data.projects.map((item, index) => <ProjectBlock key={index} item={item} index={index} editor={editor} />)}</div>
  </section>
);

const SkillsSection = ({ data, editor, className = '', grid = false }: { data: ExtendedResumeData; editor?: TemplateEditor; className?: string; grid?: boolean }) => (
  <section className={className}>
    <BlueTitle>Skills</BlueTitle>
    <BulletList items={data.skills} onCommit={editor?.updateSkill} className={`${grid ? 'grid grid-cols-2 gap-x-5' : ''} text-[9.5px] text-slate-700`} />
  </section>
);

const ListTextSection = ({
  title,
  items,
  field,
  editor,
  className = '',
}: {
  title: string;
  items: string[];
  field: TextField;
  editor?: TemplateEditor;
  className?: string;
}) => {
  if (items.length === 0) return null;
  return (
    <section className={className}>
      <BlueTitle>{title}</BlueTitle>
      <BulletList
        items={items}
        className="text-[9.5px] text-slate-700"
        onCommit={(index, value) => {
          const next = [...items];
          next[index] = value;
          editor?.updateText?.(field, next.map((item) => `- ${item}`).join('\n'));
        }}
      />
    </section>
  );
};

const ExtraSections = ({ data, editor, compact = false }: { data: ExtendedResumeData; editor?: TemplateEditor; compact?: boolean }) => (
  <div className={compact ? 'space-y-3' : 'space-y-3.5'}>
    <ListTextSection title="Achievements" items={getAchievements(data)} field="achievements" editor={editor} />
    <ListTextSection title="Certifications" items={getCertifications(data)} field="certifications" editor={editor} />
    <ListTextSection title="Extracurricular" items={getExtracurricular(data)} field="extracurricular" editor={editor} />
  </div>
);

const SidebarContact = ({ data, editor }: { data: ExtendedResumeData; editor?: TemplateEditor }) => (
  <div className="space-y-2 text-[9px]">
    <ContactLine icon={Phone}>
      <EditableText value={data.personalInfo.phone} onCommit={(value) => editor?.updatePersonal?.('phone', value)} />
    </ContactLine>
    <ContactLine icon={Mail}>
      <EditableText value={data.personalInfo.email} onCommit={(value) => editor?.updatePersonal?.('email', value)} />
    </ContactLine>
    <ContactLine icon={MapPin}>
      <EditableText value={data.personalInfo.location} onCommit={(value) => editor?.updatePersonal?.('location', value)} />
    </ContactLine>
  </div>
);

export const Template1: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell className="p-8">
    <header className="text-center">
      <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="text-[25px] font-black leading-tight tracking-tight text-slate-950" />
      <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="mt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-700" />
      <ContactStrip data={data} editor={editor} />
    </header>
    <main className="mt-5 space-y-3">
      <ProfileSection data={data} editor={editor} />
      <EducationSection data={data} editor={editor} />
      <ExperienceSection data={data} editor={editor} title="Experience & Training" />
      <ProjectsSection data={data} editor={editor} />
      <SkillsSection data={data} editor={editor} grid />
      <ExtraSections data={data} editor={editor} compact />
    </main>
  </A4Shell>
);

export const Template2: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell>
    <div className="grid h-full grid-cols-[33%_67%]">
      <aside className="bg-[#0f1b2d] px-6 py-7 text-white">
        <div className="flex justify-center"><Avatar data={data} dark /></div>
        <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="mt-5 text-center text-[18px] font-black leading-tight" />
        <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="mt-1 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-blue-200" />
        <div className="mt-6 border-y border-white/15 py-4 text-slate-200"><SidebarContact data={data} editor={editor} /></div>
        <SectionTitle className="mt-6 border-white/20 text-blue-100">Skills</SectionTitle>
        <BulletList items={data.skills.slice(0, 10)} onCommit={editor?.updateSkill} className="text-[9px] text-slate-100" />
        <SectionTitle className="mt-6 border-white/20 text-blue-100">Education</SectionTitle>
        <div className="space-y-2 [&_h3]:text-white [&_p]:text-slate-200 [&_span]:text-slate-300">
          {data.education.map((item, index) => <EducationBlock key={index} item={item} index={index} editor={editor} />)}
        </div>
        <div className="mt-5 text-slate-100 [&_h2]:border-white/20 [&_h2]:text-blue-100 [&_li]:text-slate-100">
          <ListTextSection title="Certifications" items={getCertifications(data)} field="certifications" editor={editor} />
        </div>
      </aside>
      <main className="space-y-3.5 p-7">
        <ProfileSection data={data} editor={editor} />
        <ExperienceSection data={data} editor={editor} title="Work Experience" />
        <ProjectsSection data={data} editor={editor} />
        <ListTextSection title="Achievements" items={getAchievements(data)} field="achievements" editor={editor} />
        <ListTextSection title="Extracurricular" items={getExtracurricular(data)} field="extracurricular" editor={editor} />
      </main>
    </div>
  </A4Shell>
);

export const Template3: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell>
    <header className="grid grid-cols-[28%_72%] items-center bg-slate-700 px-8 py-7 text-white">
      <div className="flex justify-center"><Avatar data={data} dark /></div>
      <div>
        <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="text-[30px] font-light leading-none tracking-tight" />
        <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="mt-2 text-[11px] font-medium uppercase tracking-[0.18em] text-blue-100" />
      </div>
    </header>
    <main className="grid grid-cols-[36%_64%] gap-7 p-7">
      <aside className="space-y-4">
        <section><BlueTitle>Contact</BlueTitle><div className="text-slate-700"><SidebarContact data={data} editor={editor} /></div></section>
        <SkillsSection data={data} editor={editor} />
        <ProjectsSection data={data} editor={editor} />
        <ListTextSection title="Certifications" items={getCertifications(data)} field="certifications" editor={editor} />
      </aside>
      <section className="space-y-4">
        <ProfileSection data={data} editor={editor} title="About Me" />
        <EducationSection data={data} editor={editor} />
        <ExperienceSection data={data} editor={editor} />
        <ListTextSection title="Achievements" items={getAchievements(data)} field="achievements" editor={editor} />
        <ListTextSection title="Extracurricular" items={getExtracurricular(data)} field="extracurricular" editor={editor} />
      </section>
    </main>
  </A4Shell>
);

export const Template4: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell>
    <div className="grid h-full grid-cols-[66%_34%]">
      <main className="space-y-3.5 p-7">
        <div className="flex items-center gap-5 border-b border-blue-200 pb-4">
          <Avatar data={data} />
          <div>
            <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="text-[25px] font-black leading-tight tracking-tight text-slate-950" />
            <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700" />
          </div>
        </div>
        <ProfileSection data={data} editor={editor} />
        <ExperienceSection data={data} editor={editor} title="Work Experience" />
        <ProjectsSection data={data} editor={editor} />
        <ListTextSection title="Extracurricular" items={getExtracurricular(data)} field="extracurricular" editor={editor} />
      </main>
      <aside className="bg-[#101827] p-6 text-white">
        <SectionTitle className="border-white/20 text-blue-100">Contact</SectionTitle>
        <div className="text-slate-200"><SidebarContact data={data} editor={editor} /></div>
        <SectionTitle className="mt-6 border-white/20 text-blue-100">Education</SectionTitle>
        <div className="space-y-2 [&_h3]:text-white [&_p]:text-slate-200 [&_span]:text-slate-300">
          {data.education.map((item, index) => <EducationBlock key={index} item={item} index={index} editor={editor} />)}
        </div>
        <SectionTitle className="mt-6 border-white/20 text-blue-100">Skills</SectionTitle>
        <BulletList items={data.skills.slice(0, 10)} onCommit={editor?.updateSkill} className="text-[9px] text-slate-100" />
        <div className="mt-5 [&_h2]:border-white/20 [&_h2]:text-blue-100 [&_li]:text-slate-100">
          <ListTextSection title="Achievements" items={getAchievements(data)} field="achievements" editor={editor} />
          <ListTextSection title="Certifications" items={getCertifications(data)} field="certifications" editor={editor} className="mt-4" />
        </div>
      </aside>
    </div>
  </A4Shell>
);

export const Template5: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell className="p-8">
    <header className="border-b-2 border-slate-800 pb-3 text-center">
      <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="text-[24px] font-black leading-tight tracking-tight text-slate-950" />
      <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-700" />
      <ContactStrip data={data} editor={editor} />
    </header>
    <main className="mt-4 space-y-3">
      <ProfileSection data={data} editor={editor} />
      <SkillsSection data={data} editor={editor} grid />
      <ListTextSection title="Key Achievements" items={getAchievements(data)} field="achievements" editor={editor} />
      <ExperienceSection data={data} editor={editor} title="Professional Experience" />
      <ProjectsSection data={data} editor={editor} />
      <EducationSection data={data} editor={editor} />
      <div className="grid grid-cols-2 gap-6">
        <ListTextSection title="Certifications" items={getCertifications(data)} field="certifications" editor={editor} />
        <ListTextSection title="Extracurricular" items={getExtracurricular(data)} field="extracurricular" editor={editor} />
      </div>
    </main>
  </A4Shell>
);

export const Template6: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell className="p-7">
    <header className="mb-5 border-b border-blue-200 pb-4">
      <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="text-[30px] font-light leading-tight tracking-tight text-slate-800" />
      <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700" />
      <ContactStrip data={data} editor={editor} centered={false} />
    </header>
    <main className="grid grid-cols-[58%_42%] gap-7">
      <section className="space-y-4">
        <ProfileSection data={data} editor={editor} title="Summary" />
        <ExperienceSection data={data} editor={editor} title="Work Experience" />
        <ProjectsSection data={data} editor={editor} />
        <ListTextSection title="Achievements" items={getAchievements(data)} field="achievements" editor={editor} />
      </section>
      <aside className="space-y-4">
        <EducationSection data={data} editor={editor} />
        <SkillsSection data={data} editor={editor} />
        <ListTextSection title="Certifications" items={getCertifications(data)} field="certifications" editor={editor} />
        <ListTextSection title="Extracurricular" items={getExtracurricular(data)} field="extracurricular" editor={editor} />
      </aside>
    </main>
  </A4Shell>
);

export const Template7: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell>
    <header className="bg-slate-50 p-8">
      <div className="grid grid-cols-[68%_32%] gap-8">
        <div>
          <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="text-[28px] font-black leading-tight tracking-tight text-slate-950" />
          <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="mt-1 text-[10px] font-black uppercase tracking-[0.22em] text-blue-700" />
        </div>
        <div className="text-[9px] font-medium text-slate-600"><ContactStrip data={data} editor={editor} centered={false} /></div>
      </div>
      <div className="mt-5"><ProfileSection data={data} editor={editor} /></div>
    </header>
    <main className="space-y-4 p-8">
      <ExperienceSection data={data} editor={editor} title="Professional Experience" />
      <div className="grid grid-cols-3 gap-6">
        <EducationSection data={data} editor={editor} />
        <ProjectsSection data={data} editor={editor} />
        <SkillsSection data={data} editor={editor} />
      </div>
      <div className="grid grid-cols-3 gap-6">
        <ListTextSection title="Achievements" items={getAchievements(data)} field="achievements" editor={editor} />
        <ListTextSection title="Certifications" items={getCertifications(data)} field="certifications" editor={editor} />
        <ListTextSection title="Extracurricular" items={getExtracurricular(data)} field="extracurricular" editor={editor} />
      </div>
    </main>
  </A4Shell>
);

export const Template8: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell>
    <header className="bg-[#111827] px-9 py-9 text-white">
      <div className="flex items-start justify-between gap-8">
        <div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-[0.24em] text-blue-200">Executive Resume</p>
          <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="max-w-[440px] text-[31px] font-black leading-tight tracking-tight" />
          <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-200" />
        </div>
        <div className="text-right text-slate-300"><SidebarContact data={data} editor={editor} /></div>
      </div>
    </header>
    <main className="grid grid-cols-[64%_36%] gap-7 p-8">
      <section className="space-y-4">
        <ProfileSection data={data} editor={editor} title="Leadership Profile" />
        <ExperienceSection data={data} editor={editor} title="Executive Experience" />
        <ProjectsSection data={data} editor={editor} />
        <ListTextSection title="Achievements" items={getAchievements(data)} field="achievements" editor={editor} />
      </section>
      <aside className="space-y-4 border-l border-slate-200 pl-6">
        <SkillsSection data={data} editor={editor} />
        <EducationSection data={data} editor={editor} />
        <ListTextSection title="Credentials" items={getCertifications(data)} field="certifications" editor={editor} />
        <ListTextSection title="Extracurricular" items={getExtracurricular(data)} field="extracurricular" editor={editor} />
      </aside>
    </main>
  </A4Shell>
);

export const Template9: React.FC<TemplateProps> = ({ data, editor }) => (
  <A4Shell className="p-8">
    <header className="border-b-2 border-slate-900 pb-3 text-center">
      <EditableText value={data.personalInfo.fullName} onCommit={(value) => editor?.updatePersonal?.('fullName', value)} as="h1" className="text-[27px] font-black leading-none tracking-tight text-slate-950" />
      <EditableText value={data.personalInfo.jobTitle} onCommit={(value) => editor?.updatePersonal?.('jobTitle', value)} as="p" className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-700" />
      <ContactStrip data={data} editor={editor} />
    </header>
    <main className="mt-4 space-y-3">
      <ProfileSection data={data} editor={editor} title="Objective" />
      <EducationSection data={data} editor={editor} />
      <ExperienceSection data={data} editor={editor} title="Experience & Training" />
      <ProjectsSection data={data} editor={editor} />
      <SkillsSection data={data} editor={editor} grid />
      <ExtraSections data={data} editor={editor} compact />
    </main>
  </A4Shell>
);

const templates: Record<number, React.FC<TemplateProps>> = {
  1: Template1,
  2: Template2,
  3: Template3,
  4: Template4,
  5: Template5,
  6: Template6,
  7: Template7,
  8: Template8,
  9: Template9,
};

export const TemplateManager: React.FC<TemplateManagerProps> = ({ data, templateId, userPlan = 'FREE', editor }) => {
  const normalized = normalizeResumeData(data);
  const safeTemplateId = templates[templateId] ? templateId : 1;
  const Template = templates[safeTemplateId];
  const isLocked = !isTemplateAccessible(safeTemplateId, userPlan);

  return (
    <div className="relative w-full max-w-[210mm]">
      <Template data={normalized} editor={isLocked ? undefined : editor} />
      {isLocked && (
        <div className="absolute inset-0">
          <A4Shell locked className="bg-transparent shadow-none" />
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
