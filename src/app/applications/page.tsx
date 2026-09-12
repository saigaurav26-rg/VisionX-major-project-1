"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BackgroundParticles } from "@/components/ui/background-particles";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, ChevronRight, CloudRain, Car, Cpu, Camera, Building2, Drone, Wrench, AlertTriangle, Satellite, Bot, GitBranch, Sparkles, Zap, Search, Shield, Eye, Microscope, ExternalLink, BookOpen } from "lucide-react";
import Link from "next/link";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

function ScrollReveal({ children, className, delay = 0, threshold = 0.1, rootMargin = "0px" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay, threshold, rootMargin, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-1000 ease-out",
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}

const APPLICATIONS = [
  {
    id: "autonomous",
    label: "AUTONOMOUS VEHICLES",
    icon: Car,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    problem: "Rain-affected vehicle cameras suffer from reduced visibility, streak artifacts, and occluded scene content. This directly impacts object detection, lane keeping, and scene understanding.",
    whyItMatters: "Autonomous driving systems require consistent visual input across all weather conditions. Rain degradation causes false negatives in pedestrian detection, missed lane markers, and reduced confidence in perception stacks.",
    howVisionXHelps: "VisionX can serve as a preprocessing restoration stage, recovering visual information from rain-degraded frames before they enter the perception pipeline. This improves downstream detection accuracy and system robustness.",
    downstreamTasks: ["Object Detection", "Lane Detection", "Scene Segmentation", "Depth Estimation", "Tracking"],
    practicalImpact: "Potential for improved safety margins in adverse weather. Restoration as a pre-processing module in the perception stack.",
    status: "POTENTIAL APPLICATION",
    pipeline: [
      { stage: "CAPTURE", detail: "Vehicle camera sensors", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "Rain streaks, occlusion, noise", color: "text-red-400" },
      { stage: "VISIONX", detail: "VisionX real-time restoration", color: "text-yellow-400" },
      { stage: "RECOVERY", detail: "Clean visual input", color: "text-emerald-400" },
      { stage: "PERCEPTION", detail: "Detection, segmentation, tracking", color: "text-cyan-400" },
      { stage: "DECISION", detail: "Planning & control", color: "text-white" },
    ],
  },
  {
    id: "traffic",
    label: "TRAFFIC MONITORING",
    icon: Search,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    problem: "Roadside and overhead traffic cameras operate 24/7 in all weather. Rain causes streaking, glare, and reduced contrast, degrading vehicle counting, classification, and license-plate recognition.",
    whyItMatters: "Traffic management systems depend on reliable video analytics. Degraded footage reduces accuracy of automated incident detection, congestion monitoring, and enforcement systems.",
    howVisionXHelps: "Restoration preprocessing can recover license-plate legibility, vehicle contours, and scene contrast from rainy footage, improving accuracy of downstream analytics.",
    downstreamTasks: ["Vehicle Counting", "Classification", "License-Plate Recognition", "Incident Detection", "Flow Analysis"],
    practicalImpact: "Potential for more reliable all-weather traffic intelligence. Reduced manual review of degraded footage.",
    status: "POTENTIAL APPLICATION",
    pipeline: [
      { stage: "CAPTURE", detail: "Roadside / overhead cameras", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "Rain streaks, glare, low contrast", color: "text-red-400" },
      { stage: "VISIONX", detail: "Frame-by-frame restoration", color: "text-yellow-400" },
      { stage: "RECOVERY", detail: "Clean frames for analytics", color: "text-emerald-400" },
      { stage: "ANALYSIS", detail: "Counting, classification, LPR", color: "text-blue-400" },
      { stage: "DECISION", detail: "Traffic management", color: "text-white" },
    ],
  },
  {
    id: "surveillance",
    label: "SURVEILLANCE & SECURITY",
    icon: Shield,
    color: "text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/20",
    problem: "Outdoor CCTV and perimeter cameras face rain, fog, and low light. Degraded footage reduces effectiveness of intrusion detection, facial recognition, and object tracking.",
    whyItMatters: "Security operations require consistent monitoring. Rainy conditions are often when security incidents increase, yet visual quality is at its worst.",
    howVisionXHelps: "As a preprocessing stage, VisionX can restore perimeter camera feeds, improving person/vehicle detection and reducing false alarms from rain artifacts.",
    downstreamTasks: ["Person Detection", "Vehicle Detection", "Intrusion Detection", "Tracking", "Behavior Analysis"],
    practicalImpact: "Potential for more reliable all-weather perimeter monitoring. Reduced operator fatigue from reviewing degraded footage.",
    status: "POTENTIAL APPLICATION",
    pipeline: [
      { stage: "CAPTURE", detail: "CCTV / perimeter cameras", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "Rain, fog, low-light noise", color: "text-red-400" },
      { stage: "VISIONX", detail: "Real-time feed restoration", color: "text-yellow-400" },
      { stage: "RECOVERY", detail: "Enhanced visual clarity", color: "text-emerald-400" },
      { stage: "ANALYSIS", detail: "Detection, tracking, alerts", color: "text-rose-400" },
      { stage: "RESPONSE", detail: "Security operations", color: "text-white" },
    ],
  },
  {
    id: "smart-cities",
    label: "SMART CITIES",
    icon: Building2,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    problem: "City-wide camera networks for traffic, safety, and infrastructure monitoring operate in all weather. Rain degrades visual analytics across multiple city systems simultaneously.",
    whyItMatters: "Smart city platforms aggregate video from hundreds of cameras. Weather-related degradation cascades across traffic, safety, and environmental monitoring systems.",
    howVisionXHelps: "Centralized or edge-deployed restoration can provide consistent visual quality across the camera network, enabling reliable cross-system analytics.",
    downstreamTasks: ["Multi-Camera Tracking", "Crowd Analysis", "Infrastructure Monitoring", "Environmental Sensing", "Urban Analytics"],
    practicalImpact: "Potential for unified all-weather visual intelligence platform. Reduced infrastructure cost from weather-hardened cameras.",
    status: "POTENTIAL APPLICATION",
    pipeline: [
      { stage: "CAPTURE", detail: "City camera network", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "City-wide rain degradation", color: "text-red-400" },
      { stage: "VISIONX", detail: "Edge/cloud restoration pipeline", color: "text-yellow-400" },
      { stage: "RECOVERY", detail: "Consistent visual quality", color: "text-emerald-400" },
      { stage: "PLATFORM", detail: "Cross-system analytics", color: "text-violet-400" },
      { stage: "DECISION", detail: "City operations", color: "text-white" },
    ],
  },
  {
    id: "drones",
    label: "DRONES & AERIAL IMAGING",
    icon: Drone,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    problem: "Aerial platforms (drones, UAVs) capture imagery in variable weather. Rain on lenses and atmospheric scattering degrade inspection, mapping, and monitoring imagery.",
    whyItMatters: "Drone operations are often time-critical (inspection, disaster response). Weather delays are costly. Degraded imagery reduces defect detection and measurement accuracy.",
    howVisionXHelps: "Onboard or post-flight restoration can recover detail from weather-affected aerial imagery, enabling inspection and analysis without weather delays.",
    downstreamTasks: ["Infrastructure Inspection", "Precision Agriculture", "Environmental Monitoring", "Disaster Assessment", "Mapping & Surveying"],
    practicalImpact: "Potential for extended operational weather envelope. Reduced re-flight requirements.",
    status: "POTENTIAL APPLICATION",
    pipeline: [
      { stage: "CAPTURE", detail: "Drone / UAV cameras", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "Rain on lens, atmospheric scatter", color: "text-red-400" },
      { stage: "VISIONX", detail: "Onboard / post-processing", color: "text-yellow-400" },
      { stage: "RECOVERY", detail: "Restored aerial imagery", color: "text-emerald-400" },
      { stage: "ANALYSIS", detail: "Inspection, measurement, mapping", color: "text-amber-400" },
      { stage: "REPORT", detail: "Actionable intelligence", color: "text-white" },
    ],
  },
  {
    id: "inspection",
    label: "INFRASTRUCTURE INSPECTION",
    icon: Wrench,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    problem: "Bridges, roads, buildings, transmission towers, and industrial equipment are inspected visually. Outdoor structures are often imaged in rain, obscuring cracks, corrosion, and defects.",
    whyItMatters: "Structural defects can be subtle. Rain streaks and reduced contrast can mask early-stage corrosion, cracking, and material degradation, leading to missed maintenance.",
    howVisionXHelps: "Restoration preprocessing enhances contrast and recovers fine details from rain-affected inspection imagery, improving defect detectability for human reviewers and automated analysis.",
    downstreamTasks: ["Crack Detection", "Corrosion Assessment", "Defect Classification", "Measurement", "Condition Monitoring"],
    practicalImpact: "Potential for more reliable all-weather inspection. Earlier defect detection. Reduced inspection delays.",
    status: "POTENTIAL APPLICATION",
    pipeline: [
      { stage: "CAPTURE", detail: "Inspection cameras / drones", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "Rain on structure & lens", color: "text-red-400" },
      { stage: "VISIONX", detail: "Detail-preserving restoration", color: "text-yellow-400" },
      { stage: "RECOVERY", detail: "Enhanced defect visibility", color: "text-emerald-400" },
      { stage: "ANALYSIS", detail: "Automated / human review", color: "text-orange-400" },
      { stage: "MAINTENANCE", detail: "Targeted intervention", color: "text-white" },
    ],
  },
  {
    id: "disaster",
    label: "DISASTER MANAGEMENT",
    icon: AlertTriangle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    problem: "Emergency response often occurs during or immediately after severe weather. Drone, satellite, and ground imagery is degraded by rain, limiting situational awareness.",
    whyItMatters: "Time-critical decisions (evacuation, resource allocation, damage assessment) require clear visual information. Weather is often worst when decisions are most urgent.",
    howVisionXHelps: "Rapid restoration of emergency imagery can provide clearer situational awareness for responders. Note: restoration does not replace human judgment or domain-specific analysis.",
    downstreamTasks: ["Damage Assessment", "Road Accessibility", "Flood Extent Mapping", "Infrastructure Integrity", "Search & Rescue Support"],
    practicalImpact: "Potential for improved visual intelligence during weather emergencies. Clearer imagery for coordination.",
    status: "POTENTIAL APPLICATION",
    pipeline: [
      { stage: "CAPTURE", detail: "Emergency imaging assets", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "Severe rain, flooding, debris", color: "text-red-400" },
      { stage: "VISIONX", detail: "Rapid restoration pipeline", color: "text-yellow-400" },
      { stage: "RECOVERY", detail: "Actionable visual data", color: "text-emerald-400" },
      { stage: "ANALYSIS", detail: "Assessment & prioritization", color: "text-red-400" },
      { stage: "RESPONSE", detail: "Emergency operations", color: "text-white" },
    ],
  },
  {
    id: "remote-sensing",
    label: "REMOTE SENSING",
    icon: Satellite,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/20",
    problem: "Aerial and satellite platforms capture earth observation data through atmosphere. Clouds, rain, and atmospheric moisture degrade optical imagery used for environmental monitoring.",
    whyItMatters: "Environmental monitoring (deforestation, agriculture, water quality, urban growth) requires consistent time-series imagery. Weather gaps reduce temporal resolution and analysis quality.",
    howVisionXHelps: "While VisionX is designed for ground-level rain streaks, the underlying restoration principles could potentially be adapted for atmospheric degradation in specific remote sensing contexts.",
    downstreamTasks: ["Land Cover Classification", "Change Detection", "Vegetation Monitoring", "Water Quality", "Urban Expansion"],
    practicalImpact: "Research direction: adapting restoration for atmospheric optics. Not a current capability.",
    status: "FUTURE SCOPE",
    pipeline: [
      { stage: "CAPTURE", detail: "Satellite / aerial sensors", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "Atmospheric / cloud effects", color: "text-red-400" },
      { stage: "RESEARCH", detail: "Adaptation required", color: "text-yellow-400" },
      { stage: "DEVELOPMENT", detail: "Domain-specific models", color: "text-indigo-400" },
      { stage: "VALIDATION", detail: "Ground truth comparison", color: "text-emerald-400" },
      { stage: "DEPLOYMENT", detail: "Operational monitoring", color: "text-white" },
    ],
  },
  {
    id: "robotics",
    label: "ROBOTICS",
    icon: Bot,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-400/20",
    problem: "Mobile robots (delivery, inspection, service) rely on visual navigation and perception. Rain on onboard cameras degrades SLAM, obstacle detection, and visual localization.",
    whyItMatters: "Robots operating outdoors must function in rain. Visual degradation causes localization drift, missed obstacles, and navigation failures.",
    howVisionXHelps: "Onboard real-time restoration can provide cleaner visual input to the robot perception stack, improving navigation robustness in wet conditions.",
    downstreamTasks: ["Visual SLAM", "Obstacle Detection", "Object Recognition", "Visual Localization", "Navigation"],
    practicalImpact: "Potential for all-weather robot autonomy. Reduced sensor suite cost (camera vs. LiDAR).",
    status: "POTENTIAL APPLICATION",
    pipeline: [
      { stage: "CAPTURE", detail: "Robot onboard cameras", color: "text-white/50" },
      { stage: "DEGRADATION", detail: "Rain on lens, wet surfaces", color: "text-red-400" },
      { stage: "VISIONX", detail: "Low-latency restoration", color: "text-yellow-400" },
      { stage: "RECOVERY", detail: "Clean perception input", color: "text-emerald-400" },
      { stage: "PERCEPTION", detail: "SLAM, detection, planning", color: "text-cyan-400" },
      { stage: "ACTION", detail: "Robot navigation", color: "text-white" },
    ],
  },
];

function ApplicationCard({ app, index }: { app: typeof APPLICATIONS[0]; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = app.icon;

  return (
    <div
      className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-500",
        expanded
          ? "border-yellow-400/40 bg-gradient-to-br from-yellow-500/5 to-transparent ring-2 ring-yellow-400/20"
          : "border-white/10 bg-white/5 hover:border-white/20"
      )}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 text-left"
        aria-expanded={expanded}
      >
        <div className={cn("flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center", app.bgColor, app.borderColor)}>
          <Icon className={cn("h-7 w-7", app.color)} strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className={cn("text-xl font-semibold tracking-tight", app.color)}>{app.label}</h3>
            <span className={cn("px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded", 
              app.status === "POTENTIAL APPLICATION" 
                ? "bg-yellow-500/15 text-yellow-400 border-yellow-400/30 border"
                : "bg-blue-500/15 text-blue-400 border-blue-400/30 border"
            )}>
              {app.status}
            </span>
          </div>
          <p className="text-white/60 text-sm leading-relaxed line-clamp-2 lg:line-clamp-none pr-12">
            {app.problem}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <ChevronRight className={cn("h-5 w-5 text-white/40 transition-transform", expanded && "rotate-90")} />
        </div>
      </button>

      <div className={cn("overflow-hidden transition-all duration-500", expanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0")}>
        <div className="px-6 lg:px-8 pb-8 border-t border-white/5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
            <div className="space-y-6">
              <ApplicationDetailSection title="THE PROBLEM" icon={<CloudRain className="h-4 w-4" />} color="text-red-400">
                <p className="text-white/70 leading-relaxed">{app.problem}</p>
              </ApplicationDetailSection>

              <ApplicationDetailSection title="WHY IT MATTERS" icon={<Shield className="h-4 w-4" />} color="text-yellow-400">
                <p className="text-white/70 leading-relaxed">{app.whyItMatters}</p>
              </ApplicationDetailSection>

              <ApplicationDetailSection title="HOW VISIONX CAN HELP" icon={<Sparkles className="h-4 w-4" />} color="text-yellow-400">
                <p className="text-white/70 leading-relaxed">{app.howVisionXHelps}</p>
              </ApplicationDetailSection>
            </div>

            <div className="space-y-6">
              <ApplicationDetailSection title="DOWNSTREAM TASKS" icon={<Search className="h-4 w-4" />} color="text-cyan-400">
                <div className="flex flex-wrap gap-2">
                  {app.downstreamTasks.map((task) => (
                    <span key={task} className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-yellow-400/50 hover:bg-yellow-400/10 transition-all">
                      {task}
                    </span>
                  ))}
                </div>
              </ApplicationDetailSection>

              <ApplicationDetailSection title="PRACTICAL IMPACT" icon={<GitBranch className="h-4 w-4" />} color="text-emerald-400">
                <p className="text-white/70 leading-relaxed">{app.practicalImpact}</p>
              </ApplicationDetailSection>

              <ApplicationDetailSection title="PIPELINE" icon={<Zap className="h-4 w-4" />} color="text-yellow-400">
                <div className="flex flex-col gap-3">
                  {app.pipeline.map((step, i) => (
                    <div key={step.stage} className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold flex-shrink-0", step.color, `${step.color.replace("text-", "bg-")}/20`, `${step.color.replace("text-", "border-")}/30`)}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{step.stage}</p>
                        <p className="text-white/50 text-xs font-mono">{step.detail}</p>
                      </div>
                      {i < app.pipeline.length - 1 && (
                        <div className="w-px h-6 bg-white/10 mx-auto hidden lg:block" />
                      )}
                    </div>
                  ))}
                </div>
              </ApplicationDetailSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationDetailSection({ title, icon, color, children }: { title: string; icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("text-[10px] font-mono uppercase tracking-[0.2em]", color)}>
          {title}
        </span>
      </div>
      <div className="pl-6 border-l border-white/5">{children}</div>
    </div>
  );
}

function PipelineVisualization() {
  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-yellow-400/30 to-transparent -translate-x-1/2 hidden lg:block" />
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 flex-wrap relative z-10">
        {[
          { label: "CAPTURE", detail: "Camera / Sensor", color: "text-white/50" },
          { label: "DEGRADATION", detail: "Rain / Weather", color: "text-red-400" },
          { label: "VISIONX", detail: "VisionX Restore", color: "text-yellow-400" },
          { label: "RECOVERY", detail: "Clean Visual Input", color: "text-emerald-400" },
          { label: "CV TASKS", detail: "Detect / Analyze", color: "text-cyan-400" },
          { label: "DECISION", detail: "Action / Insight", color: "text-white" },
        ].map((step, index) => (
          <div key={step.label} className="flex flex-col items-center gap-1.5" style={{ transitionDelay: `${index * 100}ms` }}>
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold", step.color, `${step.color.replace("text-", "bg-")}/20`, `${step.color.replace("text-", "border-")}/30 border`)}>
              {index + 1}
            </div>
            <p className="text-white font-medium text-sm whitespace-nowrap">{step.label}</p>
            <p className="text-white/50 text-xs font-mono text-center">{step.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LimitationsSection() {
  const limitations = [
    "Information that was never captured cannot be perfectly recovered",
    "Difficult images can produce restoration artifacts",
    "Performance depends on training data distribution and domain",
    "Unseen weather conditions (heavy storms, hail, snow) affect generalization",
    "Safety-critical deployment requires extensive validation and robustness testing",
    "Latency requirements vary by application — real-time may need optimization",
    "Restoration does not replace domain-specific analysis or human decisions",
  ];

  return (
    <section id="limitations" className="relative py-16 lg:py-24 px-4 lg:px-8 scroll-mt-20" aria-labelledby="limitations-heading">
      <div className="relative z-10 mx-auto max-w-[1400px]">
        <ScrollReveal delay={100}>
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              LIMITATIONS
            </span>
            <h2 id="limitations-heading" className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6">
              Where restoration
              <br />
              <span className="text-red-400">has limits.</span>
            </h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {limitations.map((limitation, index) => (
              <div key={index} className="flex items-start gap-4 p-5 rounded-xl border border-white/10 bg-white/5" style={{ transitionDelay: `${index * 50}ms` }}>
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-red-500/20 text-red-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <p className="text-white/70 leading-relaxed mt-0.5">{limitation}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={300}>
          <div className="mt-12 lg:mt-16 rounded-xl border border-yellow-400/20 bg-yellow-500/5 p-6 lg:p-8 text-center max-w-3xl mx-auto">
            <p className="text-white/70 font-mono text-sm">
              Safety-critical deployment requires: domain-specific datasets, robustness testing, latency evaluation, real-world validation, and safety testing.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function FutureScopeSection() {
  const futureItems = [
    { title: "VIDEO DERAINING", detail: "Temporal consistency across frames for video restoration", icon: <Camera className="h-4 w-4" /> },
    { title: "REAL-TIME RESTORATION", detail: "Optimized inference for edge deployment and low latency", icon: <Zap className="h-4 w-4" /> },
    { title: "EDGE DEVICE DEPLOYMENT", detail: "Quantized models for mobile, embedded, and edge platforms", icon: <Cpu className="h-4 w-4" /> },
    { title: "MULTI-WEATHER RESTORATION", detail: "Unified model for rain, snow, fog, haze, and low-light", icon: <CloudRain className="h-4 w-4" /> },
    { title: "LOW-LIGHT RESTORATION", detail: "Joint denoising and restoration for night-time imagery", icon: <Sparkles className="h-4 w-4" /> },
    { title: "OBJECT-DETECTION INTEGRATION", detail: "End-to-end restoration + detection pipeline", icon: <Search className="h-4 w-4" /> },
    { title: "MULTIMODAL VISION SYSTEMS", detail: "Fusion with LiDAR, radar, thermal for robust perception", icon: <Bot className="h-4 w-4" /> },
    { title: "DOMAIN ADAPTATION", detail: "Self-supervised adaptation to unseen environments", icon: <Microscope className="h-4 w-4" /> },
  ];

  return (
    <section id="future" className="relative py-16 lg:py-24 px-4 lg:px-8 scroll-mt-20" aria-labelledby="future-heading">
      <div className="relative z-10 mx-auto max-w-[1400px]">
        <ScrollReveal delay={100}>
          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              FUTURE SCOPE
            </span>
            <h2 id="future-heading" className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6">
              Where VisionX
              <br />
              <span className="text-yellow-400">can go next.</span>
            </h2>
            <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
              Research directions and potential evolution of the VisionX framework.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {futureItems.map((item, index) => (
              <div key={item.title} className="rounded-xl border border-white/10 bg-white/5 p-6 transition-all duration-300 hover:border-yellow-400/50 hover:bg-yellow-400/5" style={{ transitionDelay: `${index * 50}ms` }}>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-400/20 flex items-center justify-center mb-4 text-yellow-400">
                  {item.icon}
                </div>
                <h4 className="text-white font-medium text-sm mb-2">{item.title}</h4>
                <p className="text-white/50 text-xs font-mono leading-relaxed">{item.detail}</p>
                <span className="inline-block mt-3 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-400/30 rounded">
                  FUTURE SCOPE
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section id="get-started" className="relative py-24 lg:py-32 px-4 lg:px-8 scroll-mt-20" aria-labelledby="cta-heading">
      <div className="relative z-10 mx-auto max-w-[1400px] text-center">
        <ScrollReveal delay={100}>
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            GET STARTED
          </span>
          <h2 id="cta-heading" className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6">
            See VisionX
            <br />
            <span className="text-yellow-400">in action.</span>
          </h2>
          <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-10">
            Explore the actual VisionX restoration engine and analyze your own degraded images.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <Button asChild size="lg" className="w-full sm:w-auto group">
            <Link href="/app">
              Open VisionX Engine
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default function RealWorldApplications() {
  return (
    <div className="min-h-screen bg-black">
      <BackgroundParticles particleCount={14} speed={0.05} enableConnections={false} className="fixed inset-0 z-0" />

      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/90 border-b border-white/10">
        <div className="mx-auto max-w-[1400px] px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="VisionX Home">
            <div className="relative h-8 w-8 rounded-md bg-gradient-to-br from-yellow-500/90 to-yellow-600/60 flex items-center justify-center ring-1 ring-yellow-400/30">
              <CloudRain className="h-4.5 w-4.5 text-black" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white hidden sm:block">VISIONX</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#applications" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Applications</Link>
            <Link href="#limitations" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Limitations</Link>
            <Link href="#future" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Future Scope</Link>
            <Button asChild variant="default" size="sm" className="group">
              <Link href="/app">
                Open VisionX Engine
                <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="pt-16">
        <section id="applications-hero" className="relative min-h-[80vh] flex items-center justify-center px-4 lg:px-8">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
          <RainBackground
            dropCount={22}
            color="rgba(255,255,255,0.08)"
            intensity="light"
            enableLightning={false}
          />
          <div className="relative z-10 w-full max-w-[1400px] mx-auto text-center py-20">
            <ScrollReveal delay={100}>
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-yellow-400/90 mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                REAL-WORLD APPLICATIONS
              </span>
              <h1 className="text-5xl lg:text-7xl xl:text-8xl font-semibold tracking-tight leading-[1.05] text-white mb-8">
                From image restoration
                <br />
                <span className="text-yellow-400">to real-world vision.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed mb-12">
                VisionX addresses the problem of recovering visual information from degraded imagery.
                This capability can potentially support computer-vision systems operating under rain
                and other challenging visual conditions.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <PipelineVisualization />
            </ScrollReveal>

            <ScrollReveal delay={500}>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/5 group">
                <a href="#applications">
                  Explore Applications
                  <ChevronDown className="h-4 w-4 ml-2 transition-transform group-hover:translate-y-1" />
                </a>
              </Button>
            </ScrollReveal>
          </div>
        </section>

        <section id="applications" className="relative py-16 lg:py-24 px-4 lg:px-8 scroll-mt-20">
          <div className="relative z-10 mx-auto max-w-[1400px]">
            <ScrollReveal delay={100}>
              <div className="text-center mb-16 lg:mb-20">
                <h2 className="text-4xl lg:text-6xl font-semibold tracking-tight leading-tight text-white mb-6">
                  Application
                  <br />
                  <span className="text-yellow-400">Areas</span>
                </h2>
                <p className="text-lg lg:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
                  Each application represents a domain where image restoration can potentially
                  improve downstream computer-vision tasks. Status indicates current capability level.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="space-y-6">
                {APPLICATIONS.map((app, index) => (
                  <ApplicationCard key={app.id} app={app} index={index} />
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        <LimitationsSection />
        <FutureScopeSection />
        <FinalCTA />
      </main>

      <footer className="relative py-12 px-4 lg:px-8 border-t border-white/10">
        <div className="mx-auto max-w-[1400px] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>© 2026 VisionX. Image restoration engine for rain-degraded vision.</p>
          <div className="flex items-center gap-4">
            <a href="https://huggingface.co/NSG04/visionx-model" target="_blank" rel="noreferrer" className="hover:text-white transition-colors flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              Model Weights
            </a>
            <a href="/docs" className="hover:text-white transition-colors">Documentation</a>
          </div>
        </div>
      </footer>

      <CustomCursor />
    </div>
  );
}

import { RainBackground } from "@/components/ui/rain";
import { CustomCursor } from "@/components/ui/custom-cursor";