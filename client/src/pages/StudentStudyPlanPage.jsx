import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AIPlanningAssistant } from '../components/ui/AIPlanningAssistant';
import { FeedbackBanner } from '../components/ui/FeedbackBanner';
import { ConfirmModal as ConfirmModalDialog } from '../components/ui/ConfirmModal';
import {
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Plus,
  Target,
  Sparkles,
  Flame,
  Filter,
  Trash2,
  Edit2,
  RefreshCw,
  BookOpen,
  Zap,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  ListTodo,
  X,
} from 'lucide-react';
import { studyPlanService } from '../services/studyPlanService';

export const StudentStudyPlanPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [data, setData] = useState(null);

  // Task View Filter Tab: 'TODAY', 'UPCOMING', 'COMPLETED', 'ALL'
  const [activeTaskView, setActiveTaskView] = useState('TODAY');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Modals state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [showAIRoadmapModal, setShowAIRoadmapModal] = useState(false);
  const [showRevisionPlanModal, setShowRevisionPlanModal] = useState(false);

  // Add Task Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCourseId, setTaskCourseId] = useState('');
  const [taskTopic, setTaskTopic] = useState('');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskDueTime, setTaskDueTime] = useState('19:00');
  const [taskDuration, setTaskDuration] = useState(45);
  const [taskPriority, setTaskPriority] = useState('MEDIUM');

  // Add Goal Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCourseId, setGoalCourseId] = useState('');
  const [goalTopics, setGoalTopics] = useState('');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalDailyMinutes, setGoalDailyMinutes] = useState(120);

  // AI Roadmap Form State
  const [roadmapTitle, setRoadmapTitle] = useState('');
  const [roadmapCourseId, setRoadmapCourseId] = useState('');
  const [roadmapTopics, setRoadmapTopics] = useState('');
  const [roadmapTargetDate, setRoadmapTargetDate] = useState('');

  // Revision Plan Form State
  const [revisionTitle, setRevisionTitle] = useState('');
  const [revisionCourseId, setRevisionCourseId] = useState('');
  const [revisionExamDate, setRevisionExamDate] = useState('');
  const [revisionTopics, setRevisionTopics] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await studyPlanService.getDashboard();
      if (res.success && res.data) {
        setData(res.data);
        if (res.data.enrolledCourses?.length > 0) {
          const defaultCId = res.data.enrolledCourses[0]._id;
          setTaskCourseId(defaultCId);
          setGoalCourseId(defaultCId);
          setRoadmapCourseId(defaultCId);
          setRevisionCourseId(defaultCId);
        }
      }
    } catch (err) {
      console.error('Failed to load Study Plan dashboard:', err);
      setError(err?.response?.data?.message || 'Failed to load study plan data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleTask = async (taskId) => {
    try {
      const res = await studyPlanService.toggleTask(taskId);
      if (res.success) {
        fetchDashboard();
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDeleteTask = (taskId) => {
    setConfirmModal({
      message: 'Delete this task?',
      onConfirm: async () => {
        setConfirmModal(null);
        try {
          await studyPlanService.deleteTask(taskId);
          setSuccess('Task deleted successfully.');
          fetchDashboard();
        } catch (err) {
          console.error('Failed to delete task:', err);
          setError('Failed to delete task.');
        }
      }
    });
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      setError('Please enter a task title.');
      return;
    }
    try {
      setIsSubmitting(true);
      await studyPlanService.createTask({
        title: taskTitle.trim(),
        courseId: taskCourseId || null,
        topic: taskTopic.trim(),
        dueDate: taskDueDate,
        dueTime: taskDueTime,
        estimatedDurationMinutes: Number(taskDuration),
        priority: taskPriority,
      });
      setShowAddTaskModal(false);
      setTaskTitle('');
      setSuccess('Task created successfully!');
      fetchDashboard();
    } catch (err) {
      setError('Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim() || !goalCourseId || !goalTargetDate) {
      setError('Goal title, course, and target date are required.');
      return;
    }
    try {
      setIsSubmitting(true);
      const topicsArr = goalTopics.split(',').map((t) => t.trim()).filter(Boolean);
      await studyPlanService.createGoal({
        title: goalTitle.trim(),
        courseId: goalCourseId,
        topics: topicsArr,
        targetDate: goalTargetDate,
        dailyStudyTimeMinutes: Number(goalDailyMinutes),
      });
      setShowAddGoalModal(false);
      setGoalTitle('');
      setSuccess('Goal created successfully!');
      fetchDashboard();
    } catch (err) {
      setError('Failed to create goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateAIRoadmap = async (e) => {
    e.preventDefault();
    if (!roadmapTitle.trim() || !roadmapCourseId || !roadmapTargetDate) {
      setError('Roadmap title, course, and target date are required.');
      return;
    }
    try {
      setIsSubmitting(true);
      const topicsArr = roadmapTopics.split(',').map((t) => t.trim()).filter(Boolean);
      await studyPlanService.generateAIRoadmap({
        title: roadmapTitle.trim(),
        courseId: roadmapCourseId,
        topics: topicsArr,
        targetDate: roadmapTargetDate,
      });
      setShowAIRoadmapModal(false);
      setRoadmapTitle('');
      setSuccess('AI Roadmap generated successfully!');
      fetchDashboard();
    } catch (err) {
      setError('Failed to generate AI roadmap.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertRoadmapToTasks = async (roadmapId) => {
    try {
      setIsSubmitting(true);
      const res = await studyPlanService.convertRoadmapToTasks(roadmapId);
      if (res.success) {
        setSuccess(`Successfully created ${res.data.convertedCount} study tasks from AI Roadmap!`);
        fetchDashboard();
      }
    } catch (err) {
      setError('Failed to convert roadmap to tasks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRevisionPlan = async (e) => {
    e.preventDefault();
    if (!revisionTitle.trim() || !revisionCourseId || !revisionExamDate) {
      setError('Revision title, course, and exam date are required.');
      return;
    }
    try {
      setIsSubmitting(true);
      const topicsArr = revisionTopics.split(',').map((t) => t.trim()).filter(Boolean);
      await studyPlanService.createRevisionPlan({
        title: revisionTitle.trim(),
        courseId: revisionCourseId,
        examDate: revisionExamDate,
        topics: topicsArr,
      });
      setShowRevisionPlanModal(false);
      setRevisionTitle('');
      setSuccess('Exam revision plan created successfully!');
      fetchDashboard();
    } catch (err) {
      setError('Failed to create exam revision plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Study Plan">
        <div className="p-12 text-center text-xs text-[var(--text-secondary)]">
          <RefreshCw className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
          Loading your study planner and productivity workspace...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Study Plan">
        <div className="p-12 text-center text-xs text-red-500 bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-xl mx-auto my-8">
          <AlertCircle className="w-8 h-8 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">Error Loading Planner</h3>
          <p className="mb-4">{error}</p>
          <Button variant="primary" onClick={fetchDashboard}>
            Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  const {
    stats = {},
    tasksToday = [],
    upcomingTasks = [],
    activeGoals = [],
    activeRoadmaps = [],
    activeRevisionPlans = [],
    enrolledCourses = [],
  } = data || {};

  // Filter tasks based on view tab & filters
  let displayedTasks = [];
  if (activeTaskView === 'TODAY') displayedTasks = tasksToday;
  else if (activeTaskView === 'UPCOMING') displayedTasks = upcomingTasks;
  else if (activeTaskView === 'COMPLETED') displayedTasks = (data?.allTasks || []).filter((t) => t.status === 'COMPLETED');
  else displayedTasks = tasksToday.concat(upcomingTasks);

  if (filterCourseId) displayedTasks = displayedTasks.filter((t) => (t.courseId?._id || t.courseId) === filterCourseId);
  if (filterPriority) displayedTasks = displayedTasks.filter((t) => t.priority === filterPriority);

  return (
    <AppShell title="Study Plan">
      <div className="space-y-8 max-w-6xl mx-auto pb-16">
        <ConfirmModalDialog 
          isOpen={!!confirmModal} 
          message={confirmModal?.message}
          onConfirm={confirmModal?.onConfirm}
          onCancel={() => setConfirmModal(null)}
          isDestructive={true}
        />

        {/* Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <ListTodo className="w-6 h-6 text-[var(--primary)]" />
              My Study Plan
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Personal student productivity roadmap, goal tracker & exam revision planner.
            </p>
          </div>
        </div>

        <FeedbackBanner type="success" message={success} onClose={() => setSuccess(null)} />
        <FeedbackBanner type="error" message={error} onClose={() => setError(null)} />

        <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-2 border-b border-[var(--border)] pb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowAddTaskModal(true)}>
              Add Task
            </Button>
            <Button variant="outline" size="sm" icon={Target} onClick={() => setShowAddGoalModal(true)}>
              Create Goal
            </Button>
            <Button variant="outline" size="sm" icon={Sparkles} onClick={() => setShowAIRoadmapModal(true)}>
              Create AI Study Plan
            </Button>
            <Button variant="outline" size="sm" icon={Flame} onClick={() => setShowRevisionPlanModal(true)}>
              Create Exam Revision Plan
            </Button>
          </div>
        </div>

        {/* Real Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Tasks Today</span>
            <span className="text-2xl font-extrabold text-[var(--primary)] block mt-1">{stats.tasksTodayCount || 0}</span>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Completed</span>
            <span className="text-2xl font-extrabold text-emerald-500 block mt-1">{stats.completedTasksCount || 0}</span>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending</span>
            <span className="text-2xl font-extrabold text-amber-500 block mt-1">{stats.pendingTasksCount || 0}</span>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Active Goals</span>
            <span className="text-2xl font-extrabold text-indigo-500 block mt-1">{stats.activeGoalsCount || 0}</span>
          </Card>

          <Card>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Overall Progress</span>
            <span className="text-2xl font-extrabold text-[var(--primary)] block mt-1">{stats.overallProgressPercentage || 0}%</span>
          </Card>
        </div>

        {/* Task Views & Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-3">
            <div className="flex gap-4 text-xs font-semibold text-[var(--text-secondary)]">
              {['TODAY', 'UPCOMING', 'COMPLETED', 'ALL'].map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveTaskView(view)}
                  className={`pb-2 transition-all cursor-pointer ${
                    activeTaskView === view
                      ? 'border-b-2 border-[var(--primary)] text-[var(--primary)] font-bold'
                      : 'hover:text-[var(--text-primary)]'
                  }`}
                >
                  {view} TASKS
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterCourseId}
                onChange={(e) => setFilterCourseId(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="">All Courses</option>
                {enrolledCourses.map((c) => (
                  <option key={c._id} value={c._id}>{c.code}</option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2.5 py-1 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="">All Priorities</option>
                <option value="HIGH">High Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
          </div>

          {/* Task List */}
          {displayedTasks.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-xs text-[var(--text-secondary)]">
                <CheckCircle className="w-10 h-10 text-[var(--text-secondary)] opacity-40 mx-auto mb-2" />
                <p className="font-bold text-[var(--text-primary)] mb-1">
                  {activeTaskView === 'TODAY' ? "You don't have any tasks for today." : 'No tasks match your selection.'}
                </p>
                <p className="max-w-md mx-auto mb-4">Click "+ Add Task" to create your personal study task.</p>
                <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowAddTaskModal(true)}>
                  Add Task
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {displayedTasks.map((task) => {
                const isDone = task.status === 'COMPLETED';
                return (
                  <div
                    key={task._id}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isDone
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-[var(--text-secondary)]'
                        : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--primary-border)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleTask(task._id)}
                        className="text-[var(--primary)] hover:scale-110 transition-transform cursor-pointer"
                      >
                        {isDone ? (
                          <CheckSquare className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Square className="w-5 h-5 text-[var(--text-secondary)]" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold ${isDone ? 'line-through text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
                            {task.title}
                          </h4>
                          {task.courseId && (
                            <span className="text-[10px] font-bold text-[var(--primary)] uppercase bg-[var(--primary-light)] px-2 py-0.5 rounded">
                              {task.courseId.code || task.courseId.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] mt-1 font-medium">
                          {task.topic && <span>Topic: {task.topic}</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimatedDurationMinutes} mins
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()} {task.dueTime}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority === 'HIGH' ? 'error' : task.priority === 'MEDIUM' ? 'warning' : 'secondary'}>
                        {task.priority}
                      </Badge>
                      <button
                        onClick={() => handleDeleteTask(task._id)}
                        className="p-1 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Goals & Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Active Study Goals ({activeGoals.length})
            </h2>

            <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowAddGoalModal(true)}>
              Create Goal
            </Button>
          </div>

          {activeGoals.length === 0 ? (
            <Card>
              <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                <Target className="w-8 h-8 text-[var(--text-secondary)] opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-[var(--text-primary)] mb-1">Create your first study goal.</p>
                <p className="max-w-md mx-auto">Set clear target dates and daily study time for your subjects.</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeGoals.map((goal) => (
                <Card key={goal.id}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase">{goal.courseId?.code}</span>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">{goal.title}</h3>
                      </div>
                      <span className="text-sm font-extrabold text-[var(--primary)]">{goal.progressPercentage}%</span>
                    </div>

                    <div className="w-full bg-[var(--surface-muted)] h-2 rounded-full overflow-hidden">
                      <div className="bg-[var(--primary)] h-full" style={{ width: `${goal.progressPercentage}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-medium pt-1">
                      <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                      <span>{goal.completedTasks} / {goal.totalTasks} Tasks Completed</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* AI Study Roadmaps */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Study Roadmaps ({activeRoadmaps.length})
            </h2>

            <Button variant="outline" size="sm" icon={Sparkles} onClick={() => setShowAIRoadmapModal(true)}>
              Create AI Study Plan
            </Button>
          </div>

          {activeRoadmaps.length === 0 ? (
            <Card>
              <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                <Sparkles className="w-8 h-8 text-amber-500 opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-[var(--text-primary)] mb-1">No AI Roadmaps Generated Yet</p>
                <p className="max-w-md mx-auto">Generate a day-by-day roadmap using Gemini and convert it into tasks.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeRoadmaps.map((roadmap) => (
                <div key={roadmap._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">AI ROADMAP</span>
                      <h3 className="text-base font-bold text-[var(--text-primary)]">{roadmap.title}</h3>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={() => handleConvertRoadmapToTasks(roadmap._id)}
                      loading={isSubmitting}
                    >
                      Create Tasks in Planner
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                    {roadmap.dailySchedule?.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[var(--primary)] text-[11px]">{item.dayLabel}</span>
                          <Badge variant="secondary">{item.activityType}</Badge>
                        </div>
                        <h5 className="font-bold text-[var(--text-primary)] line-clamp-1">{item.topic}</h5>
                        <span className="text-[10px] text-[var(--text-secondary)] block">{item.durationMinutes} mins</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Exam Revision Plans */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-500" />
              Student Exam Revision Plans ({activeRevisionPlans.length})
            </h2>

            <Button variant="outline" size="sm" icon={Flame} onClick={() => setShowRevisionPlanModal(true)}>
              Create Exam Revision Plan
            </Button>
          </div>

          {activeRevisionPlans.length === 0 ? (
            <Card>
              <div className="p-6 text-center text-xs text-[var(--text-secondary)]">
                <Flame className="w-8 h-8 text-red-500 opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-[var(--text-primary)] mb-1">Create an exam revision plan when you're ready.</p>
                <p className="max-w-md mx-auto">Explicitly select an upcoming exam date to generate an intensive revision plan.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeRevisionPlans.map((rev) => (
                <div key={rev._id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="error">EXAM REVISION</Badge>
                        <span className="text-xs font-bold text-[var(--text-secondary)]">{rev.courseId?.code}</span>
                      </div>
                      <h3 className="text-base font-bold text-[var(--text-primary)] mt-0.5">{rev.title}</h3>
                    </div>

                    <span className="text-xs font-bold text-red-500">
                      Exam Date: {new Date(rev.examDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                    {rev.schedule?.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-[var(--surface-muted)] rounded-xl border border-[var(--border)] text-xs space-y-1">
                        <span className="font-extrabold text-red-500 text-[11px] block">{item.dayLabel}</span>
                        <h5 className="font-bold text-[var(--text-primary)] line-clamp-1">{item.title}</h5>
                        <span className="text-[10px] text-[var(--text-secondary)] block">{item.durationMinutes} mins</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compact AI Planning Assistant */}
        <AIPlanningAssistant />

        {/* Modals for Add Task, Add Goal, AI Roadmap, Revision Plan */}
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Add Study Task</h3>
              <form onSubmit={handleCreateTask} className="space-y-3">
                <input
                  type="text"
                  placeholder="Task Title (e.g. Read BFS Notes)"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <select
                  value={taskCourseId}
                  onChange={(e) => setTaskCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                >
                  <option value="">Select Course (Optional)</option>
                  {enrolledCourses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                  />
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Duration (mins)"
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                  />
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="w-1/2" onClick={() => setShowAddTaskModal(false)}>Cancel</Button>
                  <Button variant="primary" className="w-1/2" type="submit" loading={isSubmitting}>Create Task</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAddGoalModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Create Study Goal</h3>
              <form onSubmit={handleCreateGoal} className="space-y-3">
                <input
                  type="text"
                  placeholder="Goal Title (e.g. Master DSA Graphs)"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <select
                  value={goalCourseId}
                  onChange={(e) => setGoalCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                >
                  <option value="">Select Course</option>
                  {enrolledCourses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Topics (comma separated: BFS, DFS, Cycle Detection)"
                  value={goalTopics}
                  onChange={(e) => setGoalTopics(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <input
                  type="date"
                  value={goalTargetDate}
                  onChange={(e) => setGoalTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="w-1/2" onClick={() => setShowAddGoalModal(false)}>Cancel</Button>
                  <Button variant="primary" className="w-1/2" type="submit" loading={isSubmitting}>Save Goal</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAIRoadmapModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Generate AI Study Plan Roadmap
              </h3>
              <form onSubmit={handleGenerateAIRoadmap} className="space-y-3">
                <input
                  type="text"
                  placeholder="Roadmap Title (e.g. 7-Day Graph Mastery)"
                  value={roadmapTitle}
                  onChange={(e) => setRoadmapTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <select
                  value={roadmapCourseId}
                  onChange={(e) => setRoadmapCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                >
                  <option value="">Select Course</option>
                  {enrolledCourses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Topics (BFS, DFS, Trees)"
                  value={roadmapTopics}
                  onChange={(e) => setRoadmapTopics(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <input
                  type="date"
                  value={roadmapTargetDate}
                  onChange={(e) => setRoadmapTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="w-1/2" onClick={() => setShowAIRoadmapModal(false)}>Cancel</Button>
                  <Button variant="primary" className="w-1/2" type="submit" loading={isSubmitting} icon={Sparkles}>Generate</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showRevisionPlanModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Flame className="w-5 h-5 text-red-500" />
                Create Exam Revision Plan
              </h3>
              <form onSubmit={handleCreateRevisionPlan} className="space-y-3">
                <input
                  type="text"
                  placeholder="Revision Plan Title (e.g. Mid-Term Revision)"
                  value={revisionTitle}
                  onChange={(e) => setRevisionTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <select
                  value={revisionCourseId}
                  onChange={(e) => setRevisionCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                >
                  <option value="">Select Course</option>
                  {enrolledCourses.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.code})</option>)}
                </select>
                <input
                  type="date"
                  value={revisionExamDate}
                  onChange={(e) => setRevisionExamDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <input
                  type="text"
                  placeholder="Units/Topics (comma separated)"
                  value={revisionTopics}
                  onChange={(e) => setRevisionTopics(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[var(--surface-muted)] border border-[var(--border)] rounded-xl text-[var(--text-primary)]"
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="w-1/2" onClick={() => setShowRevisionPlanModal(false)}>Cancel</Button>
                  <Button variant="primary" className="w-1/2" type="submit" loading={isSubmitting} icon={Flame}>Create Plan</Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default StudentStudyPlanPage;
