// Centralized Mock Data Layer for ExamForge UI Foundation

export const studentMockData = {
  name: "Amar Kumar",
  role: "Student",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150",
  date: "Mon, Oct 6, 2026",
  stats: {
    upcomingExamsCount: 3,
    completedExamsCount: 5,
    averageScore: 78,
    practiceTestsCount: 12,
  },
  upcomingExams: [
    {
      id: "ex-1",
      title: "Data Structures Midterm",
      courseCode: "CSE301",
      duration: "60 mins",
      totalMarks: 50,
      date: "Oct 10, 2026",
      time: "10:00 AM",
      status: "Scheduled",
    },
    {
      id: "ex-2",
      title: "Operating Systems Quiz",
      courseCode: "CSE302",
      duration: "45 mins",
      totalMarks: 30,
      date: "Oct 12, 2026",
      time: "02:00 PM",
      status: "Scheduled",
    },
    {
      id: "ex-3",
      title: "Computer Networks Final",
      courseCode: "CSE303",
      duration: "90 mins",
      totalMarks: 100,
      date: "Oct 20, 2026",
      time: "10:00 AM",
      status: "Upcoming",
    },
  ],
  completedExams: [
    {
      id: "ex-101",
      title: "DBMS Midterm Exam",
      courseCode: "CSE204",
      score: 64,
      totalMarks: 100,
      date: "Oct 2, 2026",
      status: "Graded",
    },
    {
      id: "ex-102",
      title: "Software Engineering Quiz",
      courseCode: "CSE305",
      score: 88,
      totalMarks: 50,
      date: "Sep 28, 2026",
      status: "Graded",
    },
  ],
  aiPreparation: {
    lastExamTitle: "DBMS Midterm Exam",
    lastExamScore: 64,
    targetScore: 80,
    overallReadiness: 78,
    areasNeedingAttentionCount: 3,
    recommendationSummary: "Focus on Normalization and CPU Scheduling before your next official assessment.",
    weakAreas: [
      { topic: "DBMS — Normalization", accuracy: 42, status: "Weak" },
      { topic: "Operating Systems — CPU Scheduling", accuracy: 48, status: "Needs Practice" },
      { topic: "Computer Networks — TCP/IP", accuracy: 55, status: "Needs Practice" },
    ],
  },
  subjectPerformance: [
    { subject: "Data Structures", score: 85, color: "#1b4332" },
    { subject: "Database Systems", score: 64, color: "#e07a5f" },
    { subject: "Operating Systems", score: 72, color: "#2d6a4f" },
    { subject: "Computer Networks", score: 68, color: "#d97706" },
  ],
};

export const instructorMockData = {
  name: "Dr. Priya Sharma",
  role: "Instructor",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150",
  stats: {
    coursesCount: 5,
    questionsCount: 284,
    examsCreatedCount: 12,
    studentsCount: 1248,
  },
  recentActivity: [
    {
      id: "act-1",
      title: "Generated 20 questions for Operating Systems",
      time: "2 hours ago",
      type: "ai-gen",
    },
    {
      id: "act-2",
      title: "Midterm exam published for CSE301",
      time: "5 hours ago",
      type: "exam",
    },
    {
      id: "act-3",
      title: "Results released for DBMS Quiz",
      time: "1 day ago",
      type: "results",
    },
    {
      id: "act-4",
      title: "New student enrollment (45 students)",
      time: "1 day ago",
      type: "enrollment",
    },
  ],
};

export const adminMockData = {
  name: "System Administrator",
  role: "Super Admin",
  stats: {
    totalUsers: 1248,
    institutionsCount: 56,
    activeExamsCount: 1192,
    systemAlertsCount: 24,
  },
  systemHealth: {
    apiServer: "Healthy",
    database: "Healthy",
    redis: "Healthy",
    storage: "Warning (82% full)",
  },
  recentUsers: [
    { name: "Aman Verma", role: "Student", email: "aman@example.com", joined: "2 mins ago" },
    { name: "Neha Patel", role: "Instructor", email: "neha@college.edu", joined: "1 hour ago" },
    { name: "IT Admin", role: "Admin", email: "admin@edutp.org", joined: "3 hours ago" },
  ]
};

export const aiQuestionStudioMockData = {
  uploadedFiles: [
    { id: "f-1", name: "OS_Chapter_2.pdf", size: "2.4 MB", status: "Uploaded", date: "Today" },
    { id: "f-2", name: "Process_Scheduling.docx", size: "1.1 MB", status: "Uploaded", date: "Today" },
    { id: "f-3", name: "Deadlock_Notes.pdf", size: "3.7 MB", status: "Uploaded", date: "Yesterday" },
  ],
  configDefaults: {
    subject: "Operating Systems",
    topic: "Process Scheduling",
    questionCount: 10,
    difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
    questionTypes: ["MCQ", "Short Answer", "Descriptive"],
  },
  generatedQuestions: [
    {
      id: "q-101",
      type: "MCQ",
      text: "Which scheduling algorithm uses a fixed time quantum for each process?",
      options: [
        "A. FCFS (First-Come, First-Served)",
        "B. SJF (Shortest Job First)",
        "C. Round Robin",
        "D. Priority Scheduling",
      ],
      correctAnswer: "C",
      difficulty: "Easy",
      topic: "CPU Scheduling",
      source: "OS_Chapter_1.pdf (Page 14)",
    },
    {
      id: "q-102",
      type: "Short Answer",
      text: "Explain the difference between preemptive and non-preemptive scheduling algorithms.",
      difficulty: "Medium",
      topic: "CPU Scheduling",
      source: "Process_Scheduling.docx (Page 3)",
    },
  ],
};

export const liveExamMockData = {
  examTitle: "Operating Systems Midterm",
  courseCode: "CSE300",
  remainingTime: "00:42:17",
  currentQuestionIndex: 12,
  totalQuestions: 20,
  question: {
    id: "q-12",
    number: 12,
    text: "Which of the following is NOT a necessary condition for deadlock?",
    options: [
      "A. Mutual Exclusion",
      "B. Hold and Wait",
      "C. No Preemption",
      "D. Circular Wait",
    ],
    selectedOption: "D",
    status: "Answered",
  },
  palette: Array.from({ length: 20 }, (_, i) => ({
    number: i + 1,
    status: i + 1 === 12 ? 'Current' : i + 1 < 10 ? 'Answered' : i + 1 === 11 ? 'Marked' : 'Not Answered',
  })),
};

export const proctoringMockData = {
  activeStudents: 98,
  totalEnrolled: 120,
  students: [
    { id: "101", name: "Aman Verma", progress: "12/20", timeElapsed: "12:31", riskLevel: "Low", events: 1 },
    { id: "102", name: "Rohan Das", progress: "18/42", timeElapsed: "18:42", riskLevel: "Medium", events: 3 },
    { id: "103", name: "Suresh Rao", progress: "08/31", timeElapsed: "08:31", riskLevel: "Low", events: 0 },
    { id: "104", name: "Priya Malik", progress: "25/10", timeElapsed: "25:10", riskLevel: "High", events: 6 },
  ]
};

export const practiceHistoryMockData = [
  { id: "ph-1", title: "DBMS Practice 1", topic: "Normalization", score: 72, previousScore: 42, improvement: "+30%", status: "Improving", date: "Oct 6, 2026" },
  { id: "ph-2", title: "OS Practice 1", topic: "CPU Scheduling", score: 68, previousScore: 48, improvement: "+20%", status: "Improving", date: "Oct 4, 2026" },
  { id: "ph-3", title: "CN Practice 1", topic: "TCP/IP", score: 45, previousScore: 50, improvement: "-5%", status: "Needs Practice", date: "Oct 2, 2026" },
  { id: "ph-4", title: "DS Practice 1", topic: "Trees", score: 82, previousScore: 72, improvement: "+10%", status: "Strong", date: "Sep 28, 2026" },
];

export const practiceHistoryMock = practiceHistoryMockData;

export const examAnalyticsMockData = {
  totalStudents: 128,
  submittedCount: 124,
  averageScore: 68,
  highestScore: 96,
  lowestScore: 31,
  questionAnalysis: [
    { id: 1, type: "MCQ", correctPct: 90, avgTime: "12s" },
    { id: 2, type: "MCQ", correctPct: 80, avgTime: "16s" },
    { id: 3, type: "MCQ", correctPct: 40, avgTime: "28s" },
    { id: 4, type: "True/False", correctPct: 70, avgTime: "10s" },
    { id: 5, type: "MCQ", correctPct: 60, avgTime: "22s" },
  ]
};

export const featureCardsMockData = [
  {
    id: "feat-1",
    title: "AI Question Generation",
    description: "Generate high-quality questions from your course material using Gemini & RAG.",
    icon: "Sparkles",
  },
  {
    id: "feat-2",
    title: "Question Bank",
    description: "Organize and manage questions with topics, difficulty and tags.",
    icon: "FolderKanban",
  },
  {
    id: "feat-3",
    title: "Secure Online Exams",
    description: "Timed exams, question randomization and anti-cheating measures.",
    icon: "ShieldCheck",
  },
  {
    id: "feat-4",
    title: "AI Grading & Evaluation",
    description: "Automated grading with AI assistance for subjective answers.",
    icon: "GraduationCap",
  },
  {
    id: "feat-5",
    title: "Analytics & Insights",
    description: "Detailed performance analytics and learning gap analysis.",
    icon: "BarChart3",
  },
  {
    id: "feat-6",
    title: "Proctoring & Integrity",
    description: "Behavior analysis, face detection and plagiarism analysis.",
    icon: "ScanFace",
  },
  {
    id: "feat-7",
    title: "Adaptive AI Preparation",
    description: "Personalized study recommendations and practice assessments based on exam gaps.",
    icon: "BrainCircuit",
  },
];
