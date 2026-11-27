import React, { useEffect, useMemo, useState } from 'react';

type IssueStatus = 'Pending' | 'In Progress' | 'Resolved';
type IssueCategory = 'Electricity' | 'Water' | 'Cleaning' | 'Wi-Fi' | 'Other';
type UserRole = 'STUDENT' | 'WARDEN';
type StudentSection = 'dashboard' | 'notices' | 'report' | 'track' | 'contact';
type WardenSection = 'dashboard' | 'manage-notices' | 'manage-issues';
type AuthMode = 'login' | 'signup';
type StatusFilter = 'All' | IssueStatus;

interface StudentAccount {
  fullName: string;
  rollNumber: string;
  roomNumber: string;
  password: string;
}

interface StudentSession {
  fullName: string;
  rollNumber: string;
  roomNumber: string;
}

interface Notice {
  id: number;
  title: string;
  description: string;
  createdDate: string;
}

interface HostelIssue {
  id: number;
  issueCode: string;
  studentName: string;
  rollNumber: string;
  category: IssueCategory;
  roomNumber: string;
  description: string;
  status: IssueStatus;
  createdDate: string;
}

const WARDEN_NAME = 'Mr. Rajesh Sharma';
const WARDEN_PHONE = '+919876543210';
const WARDEN_LOGIN_ID = '32410321000';
const WARDEN_LOGIN_PASSWORD = 'warden@2566';

const STUDENTS_STORAGE_KEY = 'stayon_students_v1';
const ROLE_STORAGE_KEY = 'stayon_role_v1';
const SESSION_STORAGE_KEY = 'stayon_student_session_v1';
const NOTICES_STORAGE_KEY = 'stayon_notices_v1';
const ISSUES_STORAGE_KEY = 'stayon_issues_v1';

const CATEGORIES: IssueCategory[] = ['Electricity', 'Water', 'Cleaning', 'Wi-Fi', 'Other'];
const STATUSES: IssueStatus[] = ['Pending', 'In Progress', 'Resolved'];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function StatusLabel({ status }: { status: IssueStatus }) {
  const colorClass =
    status === 'Resolved'
      ? 'text-emerald-700'
      : status === 'In Progress'
        ? 'text-blue-700'
        : 'text-amber-700';

  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] font-semibold whitespace-nowrap ${colorClass}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    try {
      const raw = localStorage.getItem(ROLE_STORAGE_KEY);
      return raw === 'STUDENT' || raw === 'WARDEN' ? raw : null;
    } catch {
      return null;
    }
  });

  const [studentSection, setStudentSection] = useState<StudentSection>('dashboard');
  const [wardenSection, setWardenSection] = useState<WardenSection>('dashboard');

  const [students, setStudents] = useState<StudentAccount[]>(() => {
    try {
      const raw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StudentAccount[]) : [];
    } catch {
      return [];
    }
  });

  const [studentUser, setStudentUser] = useState<StudentSession | null>(() => {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StudentSession) : null;
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authError, setAuthError] = useState('');
  const [loginRoll, setLoginRoll] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRoll, setSignupRoll] = useState('');
  const [signupRoom, setSignupRoom] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [notices, setNotices] = useState<Notice[]>(() => {
    try {
      const raw = localStorage.getItem(NOTICES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Notice[]) : [];
    } catch {
      return [];
    }
  });

  const [issues, setIssues] = useState<HostelIssue[]>(() => {
    try {
      const raw = localStorage.getItem(ISSUES_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as HostelIssue[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    if (userRole) {
      localStorage.setItem(ROLE_STORAGE_KEY, userRole);
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  }, [userRole]);

  useEffect(() => {
    if (studentUser) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(studentUser));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [studentUser]);

  useEffect(() => {
    localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(notices));
  }, [notices]);

  useEffect(() => {
    localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
  }, [issues]);

  // Student Report Issue state
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Electricity');
  const [roomNumber, setRoomNumber] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSuccess, setIssueSuccess] = useState<{ code: string; roll: string } | null>(null);
  const [issueError, setIssueError] = useState('');

  // Student Track Issue state
  const [searchRoll, setSearchRoll] = useState('');
  const [searchedRoll, setSearchedRoll] = useState<string | null>(null);

  useEffect(() => {
    if (studentUser) {
      setStudentName(studentUser.fullName);
      setRollNumber(studentUser.rollNumber);
      setRoomNumber(studentUser.roomNumber);
      setSearchRoll(studentUser.rollNumber);
      setSearchedRoll(studentUser.rollNumber);
    }
  }, [studentUser]);

  // Warden operations state
  const [wardenFlash, setWardenFlash] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeDesc, setNoticeDesc] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [draftStatuses, setDraftStatuses] = useState<Record<number, IssueStatus>>({});

  const pendingCount = useMemo(() => issues.filter((i) => i.status === 'Pending').length, [issues]);
  const inProgressCount = useMemo(() => issues.filter((i) => i.status === 'In Progress').length, [issues]);
  const resolvedCount = useMemo(() => issues.filter((i) => i.status === 'Resolved').length, [issues]);

  const trackedIssues = useMemo(() => {
    if (!searchedRoll) return [];
    const normalized = searchedRoll.trim().toLowerCase();
    return issues.filter((i) => i.rollNumber.toLowerCase() === normalized);
  }, [issues, searchedRoll]);

  const filteredWardenIssues = useMemo(() => {
    if (statusFilter === 'All') return issues;
    return issues.filter((i) => i.status === statusFilter);
  }, [issues, statusFilter]);

  function handleStudentSignup(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');

    if (!signupName.trim() || !signupRoll.trim() || !signupRoom.trim() || !signupPassword.trim()) {
      setAuthError('All signup fields are required.');
      return;
    }

    const normalizedRoll = signupRoll.trim().toUpperCase();
    if (normalizedRoll === WARDEN_LOGIN_ID) {
      setAuthError('This ID is reserved. Please use your student roll number.');
      return;
    }

    if (signupPassword.trim().length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return;
    }

    const exists = students.some((s) => s.rollNumber.toLowerCase() === normalizedRoll.toLowerCase());
    if (exists) {
      setAuthError(`An account with roll number ${normalizedRoll} already exists.`);
      return;
    }

    const account: StudentAccount = {
      fullName: signupName.trim(),
      rollNumber: normalizedRoll,
      roomNumber: signupRoom.trim().toUpperCase(),
      password: signupPassword.trim(),
    };

    setStudents((prev) => [...prev, account]);
    setStudentUser({
      fullName: account.fullName,
      rollNumber: account.rollNumber,
      roomNumber: account.roomNumber,
    });
    setUserRole('STUDENT');
    setStudentSection('dashboard');
    setSignupName('');
    setSignupRoll('');
    setSignupRoom('');
    setSignupPassword('');
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');

    const trimmedId = loginRoll.trim();
    const trimmedPassword = loginPassword.trim();

    if (trimmedId === WARDEN_LOGIN_ID && trimmedPassword === WARDEN_LOGIN_PASSWORD) {
      setStudentUser(null);
      setUserRole('WARDEN');
      setWardenSection('dashboard');
      setWardenFlash(null);
      setLoginRoll('');
      setLoginPassword('');
      return;
    }

    const matched = students.find(
      (s) =>
        s.rollNumber.toLowerCase() === trimmedId.toLowerCase() &&
        s.password === trimmedPassword
    );

    if (!matched) {
      setAuthError('Invalid roll number or password.');
      return;
    }

    setStudentUser({
      fullName: matched.fullName,
      rollNumber: matched.rollNumber,
      roomNumber: matched.roomNumber,
    });
    setUserRole('STUDENT');
    setStudentSection('dashboard');
    setLoginRoll('');
    setLoginPassword('');
  }

  function handleLogout() {
    setUserRole(null);
    setStudentUser(null);
    setSidebarOpen(false);
    setStudentSection('dashboard');
    setWardenSection('dashboard');
    setAuthMode('login');
    setAuthError('');
    setWardenFlash(null);
  }

  function handleSubmitIssue(e: React.FormEvent) {
    e.preventDefault();
    setIssueError('');
    setIssueSuccess(null);

    if (!studentName.trim() || !rollNumber.trim() || !roomNumber.trim() || !issueDescription.trim()) {
      setIssueError('Please complete all fields before submitting an issue.');
      return;
    }

    const nextId = issues.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const issueCode = `STY-${String(nextId).padStart(4, '0')}`;
    const normalizedRoll = rollNumber.trim().toUpperCase();

    const created: HostelIssue = {
      id: nextId,
      issueCode,
      studentName: studentName.trim(),
      rollNumber: normalizedRoll,
      category,
      roomNumber: roomNumber.trim().toUpperCase(),
      description: issueDescription.trim(),
      status: 'Pending',
      createdDate: todayIso(),
    };

    setIssues((prev) => [created, ...prev]);
    setIssueSuccess({ code: issueCode, roll: normalizedRoll });
    setIssueDescription('');
  }

  function handleTrackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchRoll.trim()) return;
    setSearchedRoll(searchRoll.trim().toUpperCase());
  }

  function handleAddNotice(e: React.FormEvent) {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeDesc.trim()) {
      setWardenFlash({ type: 'error', text: 'Notice title and description are required.' });
      return;
    }

    const nextId = notices.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const created: Notice = {
      id: nextId,
      title: noticeTitle.trim(),
      description: noticeDesc.trim(),
      createdDate: todayIso(),
    };

    setNotices((prev) => [created, ...prev]);
    setNoticeTitle('');
    setNoticeDesc('');
    setWardenFlash({ type: 'success', text: 'Notice published to the student board.' });
  }

  function handleDeleteNotice(id: number) {
    setNotices((prev) => prev.filter((n) => n.id !== id));
    setWardenFlash({ type: 'success', text: 'Notice deleted successfully.' });
  }

  function handleUpdateIssueStatus(id: number) {
    const existing = issues.find((i) => i.id === id);
    if (!existing) return;
    const nextStatus = draftStatuses[id] ?? existing.status;

    setIssues((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
    );
    setWardenFlash({ type: 'success', text: `Issue ${existing.issueCode} updated to ${nextStatus}.` });
  }

  return (
    <div className="min-h-screen bg-[#fff8f1] text-stone-900">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-[62px] bg-white/95 backdrop-blur border-b border-[#f2dec9] px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {userRole && (
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-[#f2dec9] hover:bg-[#fffaf5] hover:border-[#e4c3a3] text-stone-900 cursor-pointer transition-colors"
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (userRole === 'STUDENT') setStudentSection('dashboard');
              if (userRole === 'WARDEN') setWardenSection('dashboard');
            }}
            className="inline-flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-orange-400 to-orange-600 shadow-xs flex items-center justify-center text-white shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-[17px] h-[17px]">
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.5V20h14V9.5" />
                <path d="M9.5 20v-6h5v6" />
              </svg>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-stone-900 whitespace-nowrap">
              STAYON
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {userRole === 'STUDENT' && studentUser && (
            <span className="hidden sm:inline text-[13px] text-stone-600 whitespace-nowrap">
              {studentUser.fullName} · <span className="font-mono">{studentUser.rollNumber}</span>
            </span>
          )}
          {userRole === 'WARDEN' && (
            <span className="hidden sm:inline text-[13px] text-stone-600 whitespace-nowrap">
              {WARDEN_NAME} · Warden
            </span>
          )}
          {userRole && (
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold bg-white border border-[#f2dec9] hover:bg-[#fff8f1] text-stone-900 whitespace-nowrap cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Collapsible Sidebar Backdrop */}
      {userRole && sidebarOpen && (
        <div
          className="fixed inset-0 top-[62px] z-38 bg-stone-900/25"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Collapsible Sidebar Drawer */}
      {userRole && (
        <aside
          className={`fixed top-[62px] left-0 bottom-0 z-39 w-[272px] bg-[#fffdfb] border-r border-[#f2dec9] px-4 py-5 flex flex-col justify-between overflow-y-auto shadow-xl transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Feature navigation"
        >
          {userRole === 'STUDENT' ? (
            <div>
              <div className="text-xs font-semibold text-stone-500 px-2.5 pb-2">
                Student Features
              </div>
              <nav className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setStudentSection('dashboard');
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left cursor-pointer transition-colors ${
                    studentSection === 'dashboard'
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : 'text-stone-600 hover:bg-[#fff1e6] hover:text-stone-900 font-medium'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                  Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentSection('notices');
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left cursor-pointer transition-colors ${
                    studentSection === 'notices'
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : 'text-stone-600 hover:bg-[#fff1e6] hover:text-stone-900 font-medium'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Notices
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentSection('report');
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left cursor-pointer transition-colors ${
                    studentSection === 'report'
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : 'text-stone-600 hover:bg-[#fff1e6] hover:text-stone-900 font-medium'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Report Issue
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentSection('track');
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left cursor-pointer transition-colors ${
                    studentSection === 'track'
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : 'text-stone-600 hover:bg-[#fff1e6] hover:text-stone-900 font-medium'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                    <circle cx="11" cy="11" r="7" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  Track Issue
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentSection('contact');
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left cursor-pointer transition-colors ${
                    studentSection === 'contact'
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : 'text-stone-600 hover:bg-[#fff1e6] hover:text-stone-900 font-medium'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  Warden Contact
                </button>
              </nav>
            </div>
          ) : (
            <div>
              <div className="text-xs font-semibold text-stone-500 px-2.5 pb-2">
                Warden Features
              </div>
              <nav className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setWardenSection('dashboard');
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left cursor-pointer transition-colors ${
                    wardenSection === 'dashboard'
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : 'text-stone-600 hover:bg-[#fff1e6] hover:text-stone-900 font-medium'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" />
                    <rect x="14" y="3" width="7" height="7" rx="1.5" />
                    <rect x="3" y="14" width="7" height="7" rx="1.5" />
                    <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  </svg>
                  Warden Dashboard
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWardenSection('manage-notices');
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left cursor-pointer transition-colors ${
                    wardenSection === 'manage-notices'
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : 'text-stone-600 hover:bg-[#fff1e6] hover:text-stone-900 font-medium'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  Manage Notices
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWardenSection('manage-issues');
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap text-left cursor-pointer transition-colors ${
                    wardenSection === 'manage-issues'
                      ? 'bg-orange-100 text-orange-800 font-semibold'
                      : 'text-stone-600 hover:bg-[#fff1e6] hover:text-stone-900 font-medium'
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px] shrink-0">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Manage Issues
                </button>
              </nav>
            </div>
          )}

          {userRole === 'STUDENT' && (
            <div className="pt-4 mt-6 border-t border-[#f2dec9]">
              <div className="text-xs text-stone-500 mb-0.5">Hostel Warden</div>
              <div className="text-sm font-semibold text-stone-900">{WARDEN_NAME}</div>
              <div className="text-[13px] font-mono text-stone-600 mb-3">{WARDEN_PHONE}</div>
              <a
                href={`tel:${WARDEN_PHONE}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors whitespace-nowrap"
              >
                Call Warden
              </a>
            </div>
          )}
        </aside>
      )}

      {/* Main Content */}
      <main className="px-4 py-8 sm:px-6 pb-14">
        <div className="max-w-[1040px] mx-auto flex flex-col gap-6">
          {!userRole ? (
            /* Unified Sign In / Student Sign Up */
            <section className="max-w-[460px] w-full mx-auto mt-8 rounded-[14px] bg-white border border-[#f2dec9] p-6 shadow-xs">
              <div className="pb-4 mb-4 border-b border-[#f2dec9]">
                <p className="text-[13px] font-semibold text-orange-600 mb-1">Your Hostel. One Smart Space.</p>
                <h1 className="text-lg font-semibold text-stone-900 m-0">
                  {authMode === 'signup' ? 'Create Student Account' : 'Sign In to STAYON'}
                </h1>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#fff1e6] border border-[#f2dec9] mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError('');
                  }}
                  className={`py-2 px-3 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                    authMode === 'login' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                  }}
                  className={`py-2 px-3 rounded-md text-[13px] font-semibold transition-colors cursor-pointer ${
                    authMode === 'signup' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {authError && (
                <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                  {authError}
                </div>
              )}

              {authMode === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="loginRoll" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                      Roll Number
                    </label>
                    <input
                      id="loginRoll"
                      type="text"
                      value={loginRoll}
                      onChange={(e) => setLoginRoll(e.target.value)}
                      placeholder="Enter Roll Number"
                      required
                      className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="loginPassword" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                      Password
                    </label>
                    <input
                      id="loginPassword"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer"
                  >
                    Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleStudentSignup} className="space-y-4">
                  <div>
                    <label htmlFor="signupName" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="signupName"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Aarav Patel"
                      required
                      className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="signupRoll" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                        Roll Number
                      </label>
                      <input
                        id="signupRoll"
                        type="text"
                        value={signupRoll}
                        onChange={(e) => setSignupRoll(e.target.value)}
                        placeholder="e.g. CS21B042"
                        required
                        className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                      />
                    </div>
                    <div>
                      <label htmlFor="signupRoom" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                        Room Number
                      </label>
                      <input
                        id="signupRoom"
                        type="text"
                        value={signupRoom}
                        onChange={(e) => setSignupRoom(e.target.value)}
                        placeholder="e.g. B-204"
                        required
                        className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="signupPassword" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                      Password
                    </label>
                    <input
                      id="signupPassword"
                      type="password"
                      minLength={4}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      required
                      className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer"
                  >
                    Create Account
                  </button>
                </form>
              )}
            </section>
          ) : userRole === 'WARDEN' ? (
            /* Warden Dashboard */
            <>
              {wardenFlash && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm border ${
                    wardenFlash.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}
                >
                  {wardenFlash.text}
                </div>
              )}

              {wardenSection === 'dashboard' && (
                <>
                  <section className="rounded-[14px] border border-[#f2dec9] bg-gradient-to-br from-white to-[#fff5eb] p-6 md:px-8 md:py-7 flex flex-wrap items-center justify-between gap-6 shadow-xs">
                    <div>
                      <p className="text-[13px] font-semibold text-orange-600 mb-1.5">Warden Operations</p>
                      <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-stone-900 leading-tight mb-1.5">
                        Warden Dashboard
                      </h1>
                      <p className="text-stone-600 text-[15px] max-w-[560px] m-0">
                        Signed in as {WARDEN_NAME}. Use the menu icon in the top bar to manage hostel notices or review and update student issues.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Open Menu
                    </button>
                  </section>

                  <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-[10px] bg-white border border-[#f2dec9] px-5 py-4.5">
                      <div className="text-[13px] text-stone-600 mb-1.5">Active Notices</div>
                      <div className="text-[26px] font-bold text-stone-900 tabular-nums">{notices.length}</div>
                    </div>
                    <div className="rounded-[10px] bg-white border border-[#f2dec9] px-5 py-4.5">
                      <div className="text-[13px] text-stone-600 mb-1.5">Pending Issues</div>
                      <div className="text-[26px] font-bold text-stone-900 tabular-nums">{pendingCount}</div>
                    </div>
                    <div className="rounded-[10px] bg-white border border-[#f2dec9] px-5 py-4.5">
                      <div className="text-[13px] text-stone-600 mb-1.5">In Progress</div>
                      <div className="text-[26px] font-bold text-stone-900 tabular-nums">{inProgressCount}</div>
                    </div>
                    <div className="rounded-[10px] bg-white border border-[#f2dec9] px-5 py-4.5">
                      <div className="text-[13px] text-stone-600 mb-1.5">Resolved Issues</div>
                      <div className="text-[26px] font-bold text-stone-900 tabular-nums">{resolvedCount}</div>
                    </div>
                  </section>
                </>
              )}

              {wardenSection === 'manage-notices' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  <section className="rounded-[14px] bg-white border border-[#f2dec9] p-6 shadow-xs">
                    <div className="flex items-baseline justify-between gap-3 pb-4 mb-5 border-b border-[#f2dec9]">
                      <h1 className="text-lg font-semibold text-stone-900 m-0">Publish New Notice</h1>
                      <span className="text-[13px] text-stone-500">Visible to all students</span>
                    </div>
                    <form onSubmit={handleAddNotice} className="space-y-3.5">
                      <div>
                        <label htmlFor="noticeTitle" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                          Notice Title
                        </label>
                        <input
                          id="noticeTitle"
                          type="text"
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          placeholder="e.g. Water Tank Maintenance"
                          required
                          className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                        />
                      </div>
                      <div>
                        <label htmlFor="noticeDesc" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                          Notice Description
                        </label>
                        <textarea
                          id="noticeDesc"
                          rows={3}
                          value={noticeDesc}
                          onChange={(e) => setNoticeDesc(e.target.value)}
                          placeholder="Provide clear timings, instructions, or contact details..."
                          required
                          className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer"
                      >
                        Publish Notice
                      </button>
                    </form>
                  </section>

                  <section className="rounded-[14px] bg-white border border-[#f2dec9] p-6 shadow-xs">
                    <div className="flex items-baseline justify-between gap-3 pb-4 mb-5 border-b border-[#f2dec9]">
                      <h2 className="text-lg font-semibold text-stone-900 m-0">Published Notices</h2>
                      <span className="text-[13px] text-stone-500 tabular-nums">{notices.length} total</span>
                    </div>
                    {notices.length === 0 ? (
                      <div className="py-3 text-sm text-stone-500">No notices published yet.</div>
                    ) : (
                      <div className="divide-y divide-[#f2dec9]">
                        {notices.map((notice) => (
                          <article key={notice.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-[15px] font-semibold text-stone-900 mb-1">{notice.title}</h3>
                              <p className="text-sm text-stone-600 mb-1.5">{notice.description}</p>
                              <span className="text-xs font-mono text-stone-500">{notice.createdDate}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotice(notice.id)}
                              className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
                            >
                              Delete
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              )}

              {wardenSection === 'manage-issues' && (
                <section className="rounded-[14px] bg-white border border-[#f2dec9] p-6 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-[#f2dec9]">
                    <h1 className="text-lg font-semibold text-stone-900 m-0">Submitted Hostel Issues</h1>
                    <div className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-[#fff1e6] border border-[#f2dec9]">
                      {(['All', ...STATUSES] as StatusFilter[]).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setStatusFilter(tab)}
                          className={`px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                            statusFilter === tab
                              ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-xs text-white'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredWardenIssues.length === 0 ? (
                    <div className="py-3 text-sm text-stone-500">No issues match the selected filter.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-[#f2dec9] text-left text-xs font-semibold text-stone-500">
                            <th className="py-2.5 px-3 whitespace-nowrap">Issue ID</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Student</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Room / Category</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Description</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                            <th className="py-2.5 px-3 whitespace-nowrap">Update</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f2dec9]">
                          {filteredWardenIssues.map((issue) => (
                            <tr key={issue.id} className="hover:bg-[#fffaf5]">
                              <td className="py-3.5 px-3 font-mono font-semibold text-orange-700 whitespace-nowrap align-top">
                                {issue.issueCode}
                              </td>
                              <td className="py-3.5 px-3 align-top">
                                <div className="font-medium text-stone-900">{issue.studentName}</div>
                                <div className="text-xs font-mono text-stone-500">{issue.rollNumber}</div>
                              </td>
                              <td className="py-3.5 px-3 text-stone-700 whitespace-nowrap align-top">
                                <span className="font-mono">{issue.roomNumber}</span>
                                <span className="text-stone-400"> · </span>
                                <span>{issue.category}</span>
                              </td>
                              <td className="py-3.5 px-3 text-stone-600 max-w-[260px] align-top">
                                {issue.description}
                              </td>
                              <td className="py-3.5 px-3 font-mono text-stone-500 whitespace-nowrap align-top">
                                {issue.createdDate}
                              </td>
                              <td className="py-3.5 px-3 align-top">
                                <StatusLabel status={issue.status} />
                              </td>
                              <td className="py-3.5 px-3 align-top">
                                <div className="flex items-center gap-2">
                                  <select
                                    aria-label={`Status for ${issue.issueCode}`}
                                    value={draftStatuses[issue.id] ?? issue.status}
                                    onChange={(e) =>
                                      setDraftStatuses((prev) => ({
                                        ...prev,
                                        [issue.id]: e.target.value as IssueStatus,
                                      }))
                                    }
                                    className="rounded-md bg-white border border-[#e4c3a3] px-2.5 py-1.5 text-[13px] text-stone-900"
                                  >
                                    {STATUSES.map((st) => (
                                      <option key={st} value={st}>
                                        {st}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateIssueStatus(issue.id)}
                                    className="px-3 py-1.5 rounded-md bg-white border border-[#e4c3a3] hover:bg-orange-600 hover:border-orange-600 text-[13px] font-semibold text-stone-900 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    Save
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              )}
            </>
          ) : (
            /* Student Portal */
            studentUser && (
              <>
                {studentSection === 'dashboard' && (
                  <>
                    <section className="rounded-[14px] border border-[#f2dec9] bg-gradient-to-br from-white to-[#fff5eb] p-6 md:px-8 md:py-7 flex flex-wrap items-center justify-between gap-6 shadow-xs">
                      <div>
                        <p className="text-[13px] font-semibold text-orange-600 mb-1.5">
                          Your Hostel. One Smart Space.
                        </p>
                        <h1 className="text-2xl md:text-[32px] font-bold tracking-tight text-stone-900 leading-tight mb-1.5">
                          Welcome, {studentUser.fullName}
                        </h1>
                        <p className="text-stone-600 text-[15px] max-w-[560px] m-0">
                          Room <span className="font-mono">{studentUser.roomNumber}</span> · Roll{' '}
                          <span className="font-mono">{studentUser.rollNumber}</span>. Use the menu icon in the top bar to view Notices, Report Issue, Track Issue, and Warden Contact.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSidebarOpen(true)}
                        className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Open Menu
                      </button>
                    </section>

                    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Hostel summary">
                      <div className="rounded-[10px] bg-white border border-[#f2dec9] px-5 py-4.5">
                        <div className="text-[13px] text-stone-600 mb-1.5">Active Notices</div>
                        <div className="text-[26px] font-bold text-stone-900 tabular-nums leading-tight">
                          {notices.length}
                        </div>
                      </div>
                      <div className="rounded-[10px] bg-white border border-[#f2dec9] px-5 py-4.5">
                        <div className="text-[13px] text-stone-600 mb-1.5">Total Logged Issues</div>
                        <div className="text-[26px] font-bold text-stone-900 tabular-nums leading-tight">
                          {issues.length}
                        </div>
                      </div>
                      <div className="rounded-[10px] bg-white border border-[#f2dec9] px-5 py-4.5">
                        <div className="text-[13px] text-stone-600 mb-1.5">Pending Issues</div>
                        <div className="text-[26px] font-bold text-stone-900 tabular-nums leading-tight">
                          {pendingCount}
                        </div>
                      </div>
                      <div className="rounded-[10px] bg-white border border-[#f2dec9] px-5 py-4.5">
                        <div className="text-[13px] text-stone-600 mb-1.5">Resolved Issues</div>
                        <div className="text-[26px] font-bold text-stone-900 tabular-nums leading-tight">
                          {resolvedCount}
                        </div>
                      </div>
                    </section>
                  </>
                )}

                {studentSection === 'notices' && (
                  <section className="rounded-[14px] bg-white border border-[#f2dec9] p-6 shadow-xs">
                    <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4 mb-5 border-b border-[#f2dec9]">
                      <h1 className="text-lg font-semibold text-stone-900 tracking-tight m-0">
                        Hostel Notice Board
                      </h1>
                      <span className="text-[13px] text-stone-500 tabular-nums">
                        {notices.length} {notices.length === 1 ? 'announcement' : 'announcements'}
                      </span>
                    </div>

                    {notices.length === 0 ? (
                      <div className="py-3 text-sm text-stone-500">
                        No notices have been posted yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#f2dec9]">
                        {notices.map((notice) => (
                          <article key={notice.id} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                            <div>
                              <h2 className="text-[15px] font-semibold text-stone-900 mb-1">{notice.title}</h2>
                              <p className="text-sm text-stone-600 m-0">{notice.description}</p>
                            </div>
                            <span className="text-xs font-mono text-stone-500 shrink-0">{notice.createdDate}</span>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {studentSection === 'report' && (
                  <section className="rounded-[14px] bg-white border border-[#f2dec9] p-6 shadow-xs">
                    <div className="flex items-baseline justify-between gap-3 pb-4 mb-5 border-b border-[#f2dec9]">
                      <h1 className="text-lg font-semibold text-stone-900 tracking-tight m-0">
                        Report Hostel Issue
                      </h1>
                      <span className="text-[13px] text-stone-500">Instant Issue ID</span>
                    </div>

                    {issueSuccess && (
                      <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                        <div>
                          Issue submitted successfully. Generated ID:{' '}
                          <strong className="font-mono text-emerald-900">{issueSuccess.code}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchRoll(issueSuccess.roll);
                            setSearchedRoll(issueSuccess.roll);
                            setStudentSection('track');
                          }}
                          className="mt-1.5 text-xs font-semibold text-emerald-700 underline cursor-pointer"
                        >
                          Track status for {issueSuccess.roll}
                        </button>
                      </div>
                    )}

                    {issueError && (
                      <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                        {issueError}
                      </div>
                    )}

                    <form onSubmit={handleSubmitIssue} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="studentName" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                            Student Name
                          </label>
                          <input
                            id="studentName"
                            type="text"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            required
                            className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-orange-600"
                          />
                        </div>
                        <div>
                          <label htmlFor="rollNumber" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                            Roll Number
                          </label>
                          <input
                            id="rollNumber"
                            type="text"
                            value={rollNumber}
                            onChange={(e) => setRollNumber(e.target.value)}
                            required
                            className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:border-orange-600"
                          />
                        </div>
                        <div>
                          <label htmlFor="category" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                            Issue Category
                          </label>
                          <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value as IssueCategory)}
                            className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm text-stone-900 focus:outline-none focus:border-orange-600"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="roomNumber" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                            Room Number
                          </label>
                          <input
                            id="roomNumber"
                            type="text"
                            value={roomNumber}
                            onChange={(e) => setRoomNumber(e.target.value)}
                            required
                            className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm font-mono text-stone-900 focus:outline-none focus:border-orange-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="issueDescription" className="block text-[13px] font-medium text-stone-600 mb-1.5">
                          Issue Description
                        </label>
                        <textarea
                          id="issueDescription"
                          rows={3}
                          value={issueDescription}
                          onChange={(e) => setIssueDescription(e.target.value)}
                          placeholder="Describe the problem clearly so maintenance can resolve it quickly..."
                          required
                          className="w-full rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                        />
                      </div>

                      <button
                        type="submit"
                        className="py-2.5 px-5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors cursor-pointer"
                      >
                        Submit Issue
                      </button>
                    </form>
                  </section>
                )}

                {studentSection === 'track' && (
                  <section className="rounded-[14px] bg-white border border-[#f2dec9] p-6 shadow-xs">
                    <div className="flex items-baseline justify-between gap-3 pb-4 mb-5 border-b border-[#f2dec9]">
                      <h1 className="text-lg font-semibold text-stone-900 tracking-tight m-0">
                        Track Issue Status
                      </h1>
                      <span className="text-[13px] text-stone-500">Lookup by roll number</span>
                    </div>

                    <form onSubmit={handleTrackSubmit} className="flex gap-2.5 mb-5">
                      <input
                        type="text"
                        value={searchRoll}
                        onChange={(e) => setSearchRoll(e.target.value)}
                        placeholder="Enter Roll Number (e.g. CS21B042)"
                        required
                        className="flex-1 rounded-lg bg-white border border-[#e4c3a3] px-3 py-2.5 text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-orange-600"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Track
                      </button>
                    </form>

                    {trackedIssues.length === 0 ? (
                      <div className="py-3 text-sm text-stone-500">
                        No issues found for roll number <span className="font-mono text-stone-700">{searchedRoll}</span>.
                      </div>
                    ) : (
                      <div className="divide-y divide-[#f2dec9]">
                        {trackedIssues.map((issue) => (
                          <article key={issue.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-[13px] font-semibold text-orange-700">
                                {issue.issueCode}
                              </span>
                              <span className="text-[13px] text-stone-500">
                                {issue.category} · Room <span className="font-mono">{issue.roomNumber}</span> ·{' '}
                                <span className="font-mono">{issue.createdDate}</span>
                              </span>
                              <StatusLabel status={issue.status} />
                            </div>
                            <p className="text-sm text-stone-600 m-0">{issue.description}</p>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {studentSection === 'contact' && (
                  <section className="rounded-[14px] bg-white border border-[#f2dec9] p-6 shadow-xs">
                    <div className="flex items-baseline justify-between gap-3 pb-4 mb-5 border-b border-[#f2dec9]">
                      <h1 className="text-lg font-semibold text-stone-900 tracking-tight m-0">
                        Warden Emergency &amp; Support Contact
                      </h1>
                      <span className="text-[13px] text-stone-500">Direct Hostel Desk</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-5">
                      <div>
                        <p className="text-lg font-semibold text-stone-900 mb-1">{WARDEN_NAME}</p>
                        <p className="text-[15px] text-stone-600 m-0">
                          Hostel Warden · <span className="font-mono">{WARDEN_PHONE}</span>
                        </p>
                      </div>
                      <a
                        href={`tel:${WARDEN_PHONE}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-600 hover:bg-orange-700 text-white transition-colors whitespace-nowrap"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 shrink-0">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Call Warden
                      </a>
                    </div>
                  </section>
                )}
              </>
            )
          )}
        </div>
      </main>
    </div>
  );
}
