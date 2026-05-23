"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  School,
  ClipboardCheck,
  Compass,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Plus,
} from "lucide-react";

const PLATFORMS = [
  {
    num: "01",
    badge: "LMS — Demo",
    title: "Learning Management System",
    desc: "Course delivery, student progress tracking, and AI-assisted learning paths in one place.",
    url: "demo.eduaitutors.com",
    href: "https://demo.eduaitutors.com",
    icon: GraduationCap,
    theme: {
      card: "bg-playful-card-blue hover:border-[#4D96FF]/60 hover:shadow-lg hover:shadow-[#4D96FF]/5",
      iconBubble: "icon-bubble-blue",
      badge: "bg-blue-100 text-blue-700 border-blue-200",
      accent: "#4D96FF",
    },
  },
  {
    num: "02",
    badge: "SMS",
    title: "School Management System",
    desc: "Admissions, attendance, fees, and staff management — all streamlined in one dashboard.",
    url: "sms.eduaitutors.com",
    href: "https://sms.eduaitutors.com",
    icon: School,
    theme: {
      card: "bg-playful-card-purple hover:border-[#9B59B6]/60 hover:shadow-lg hover:shadow-[#9B59B6]/5",
      iconBubble: "icon-bubble-purple",
      badge: "bg-purple-100 text-purple-700 border-purple-200",
      accent: "#9B59B6",
    },
  },
  {
    num: "03",
    badge: "Assessment",
    title: "Assessment Platform",
    desc: "Smart quizzes, online exams, and instant auto-graded results with detailed analytics.",
    url: "assessment.eduaitutors.com",
    href: "https://assessment.eduaitutors.com",
    icon: ClipboardCheck,
    theme: {
      card: "bg-playful-card-green hover:border-[#6BCB77]/60 hover:shadow-lg hover:shadow-[#6BCB77]/5",
      iconBubble: "icon-bubble-green",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      accent: "#6BCB77",
    },
  },
  {
    num: "04",
    badge: "AI Counsellor",
    title: "Career Counsellor AI",
    desc: "Personalized AI-driven career guidance, aptitude analysis, and path recommendations for students.",
    url: "challa.space-z.ai",
    href: "https://challa.space-z.ai/",
    icon: Compass,
    theme: {
      card: "bg-playful-card-yellow hover:border-[#FEC163]/60 hover:shadow-lg hover:shadow-[#FEC163]/5",
      iconBubble: "icon-bubble-yellow",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      accent: "#FEC163",
    },
  },
  {
    num: "05",
    badge: "AI Calendar",
    title: "AI School Calendar",
    desc: "Intelligent scheduling, substitution planning, and timetable management powered by AI.",
    url: "aisubstitution.space-z.ai",
    href: "https://aisubstitution.space-z.ai",
    icon: Calendar,
    theme: {
      card: "bg-playful-card-coral hover:border-[#FF6B6B]/60 hover:shadow-lg hover:shadow-[#FF6B6B]/5",
      iconBubble: "icon-bubble-coral",
      badge: "bg-rose-100 text-rose-700 border-rose-200",
      accent: "#FF6B6B",
    },
  },
  {
    num: "06",
    badge: "Kids Assessment",
    title: "Kids Assessment",
    desc: "Fun and interactive assessments designed for young learners with age-appropriate evaluation tools.",
    url: "kids-assessment.eduaitutors.com",
    href: "https://kids-assessment.eduaitutors.com",
    icon: Sparkles,
    theme: {
      card: "bg-playful-card-blue hover:border-[#4D96FF]/60 hover:shadow-lg hover:shadow-[#4D96FF]/5",
      iconBubble: "icon-bubble-blue",
      badge: "bg-sky-100 text-sky-700 border-sky-200",
      accent: "#4D96FF",
    },
  },
];

const PLACEHOLDERS = [
  { num: "07" },
  { num: "08" },
  { num: "09" },
];

export default function AdminPlatforms() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-coral-500/10 p-6 sm:p-8 border border-purple-100/50">
        {/* Floating Bubble Backgrounds for Premium Vibe */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 w-32 h-32 bg-purple-300 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute left-1/3 top-2 w-20 h-20 bg-pink-300 rounded-full blur-2xl opacity-15 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-3d bg-purple-100 text-purple-700 border-purple-200 text-xs px-2.5 py-0.5">
              Platform Hub
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Our Platforms
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-xl">
            A complete AI-powered ecosystem built for modern schools, administrators, and students.
          </p>
          <div className="divider-rainbow mt-4 max-w-sm" />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PLATFORMS.map((platform) => {
          const IconComponent = platform.icon;
          return (
            <a
              key={platform.num}
              href={platform.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block focus:outline-none"
            >
              <Card
                className={`card-3d h-full flex flex-col justify-between p-6 transition-all duration-300 border-2 cursor-pointer ${platform.theme.card}`}
              >
                <CardContent className="p-0 flex flex-col h-full justify-between">
                  <div>
                    {/* Card Top */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={`icon-bubble ${platform.theme.iconBubble} h-11 w-11 shrink-0`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground/50 tracking-wider font-mono">
                        {platform.num}
                      </span>
                    </div>

                    {/* Badge & Title */}
                    <div className="space-y-2">
                      <div>
                        <Badge
                          variant="outline"
                          className={`badge-3d text-[10px] uppercase font-bold tracking-wider py-0.5 px-2.5 ${platform.theme.badge}`}
                        >
                          {platform.badge}
                        </Badge>
                      </div>
                      <h3 className="font-extrabold text-lg text-foreground leading-tight group-hover:text-purple-900 transition-colors">
                        {platform.title}
                      </h3>
                      <p className="text-muted-foreground text-xs leading-relaxed mt-2 line-clamp-3">
                        {platform.desc}
                      </p>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-6 pt-4 border-t border-purple-100/50 flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground/60 overflow-hidden text-overflow-ellipsis whitespace-nowrap max-w-[80%] font-mono">
                      {platform.url}
                    </span>
                    <div className="h-7 w-7 rounded-xl border border-purple-100 flex items-center justify-center text-muted-foreground group-hover:text-purple-600 group-hover:border-purple-200 group-hover:bg-purple-50 transition-all duration-200 shrink-0">
                      <ArrowUpRight className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          );
        })}

        {/* Coming Soon Placeholders */}
        {PLACEHOLDERS.map((ph) => (
          <Card
            key={ph.num}
            className="border-2 border-dashed border-purple-200/60 bg-white/40 rounded-[1.25rem] flex flex-col items-center justify-center p-6 min-h-[220px] text-center"
          >
            <div className="icon-bubble border border-dashed border-purple-200 bg-purple-50/20 text-purple-300 h-10 w-10 mb-3">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold text-purple-200 font-mono tracking-wider mb-1">
              {ph.num}
            </span>
            <span className="text-sm font-extrabold text-purple-300">
              Coming Soon
            </span>
          </Card>
        ))}
      </div>

      {/* Footer info inside hub */}
      <div className="text-center py-6 text-xs text-muted-foreground border-t border-purple-100/40">
        &copy; 2026 <a href="https://eduaitutors.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-purple-600 hover:text-purple-800 transition-colors">EduAI Tutors</a> &mdash; All rights reserved.
      </div>
    </div>
  );
}
