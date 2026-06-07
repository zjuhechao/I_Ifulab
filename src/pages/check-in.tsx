import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/supabase/client";
import {
  Droplets, Sun, Moon, Utensils, Dumbbell, Sparkles,
  CheckCircle2, CalendarDays, Loader2, Flame, Trophy,
  TrendingUp, Target, Plus, X, Edit2, Save, History, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface Task {
  id: string;
  name: string;
  completed: boolean;
  category: "cleansing" | "skincare" | "diet" | "sleep" | "exercise";
  icon: React.ReactNode;
}

const MOODS = [
  { emoji: "✨", label: "超棒", value: "great", score: 5 },
  { emoji: "😊", label: "不错", value: "good", score: 4 },
  { emoji: "😐", label: "一般", value: "neutral", score: 3 },
  { emoji: "😴", label: "疲惫", value: "tired", score: 2 },
  { emoji: "😔", label: "不好", value: "bad", score: 1 },
];

const DEFAULT_TASKS: Task[] = [
  { id: "1", name: "晨间清洁", completed: false, category: "cleansing", icon: <Droplets className="w-4 h-4" /> },
  { id: "2", name: "涂抹精华", completed: false, category: "skincare", icon: <Sparkles className="w-4 h-4" /> },
  { id: "3", name: "防晒护理", completed: false, category: "skincare", icon: <Sun className="w-4 h-4" /> },
  { id: "4", name: "健康饮食", completed: false, category: "diet", icon: <Utensils className="w-4 h-4" /> },
  { id: "5", name: "充足睡眠", completed: false, category: "sleep", icon: <Moon className="w-4 h-4" /> },
  { id: "6", name: "适量运动", completed: false, category: "exercise", icon: <Dumbbell className="w-4 h-4" /> },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "cleansing": return <Droplets className="w-4 h-4" />;
    case "skincare": return <Sparkles className="w-4 h-4" />;
    case "diet": return <Utensils className="w-4 h-4" />;
    case "sleep": return <Moon className="w-4 h-4" />;
    case "exercise": return <Dumbbell className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    cleansing: "bg-sky-100 text-sky-600 border-sky-200",
    skincare: "bg-rose-100 text-rose-600 border-rose-200",
    diet: "bg-emerald-100 text-emerald-600 border-emerald-200",
    sleep: "bg-violet-100 text-violet-600 border-violet-200",
    exercise: "bg-amber-100 text-amber-600 border-amber-200",
  };
  return colors[category] || "bg-gray-100 text-gray-600 border-gray-200";
};

interface CheckInRecord {
  date: string;
  mood: string | null;
  tasks: { id: string; completed: boolean }[] | null;
  progress: number;
  completed: boolean;
}

export function CheckInPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAppStore();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<Task["category"]>("skincare");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [streakDays, setStreakDays] = useState(0);
  const [monthDays, setMonthDays] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [weekRecords, setWeekRecords] = useState<CheckInRecord[]>([]);
  const [moodHistory, setMoodHistory] = useState<{day: string; score: number}[]>([]);
  const [badges, setBadges] = useState<{id: string; name: string; icon: string; unlocked: boolean}[]>([]);

  const today = new Date().toISOString().split('T')[0];
  const userId = user?.id || 'guest';

  useEffect(() => { if (!isLoggedIn) navigate({ to: '/login' }); }, [isLoggedIn, navigate]);

  useEffect(() => {
    loadCheckInData();
  }, []);

  async function loadCheckInData() {
    setIsLoading(true);
    const { data: records } = await supabase
      .from('check_in_records')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (records) {
      calculateStats(records as CheckInRecord[]);
      loadTodayTasks(records as CheckInRecord[]);
      loadWeekData(records as CheckInRecord[]);
      loadMoodHistory(records as CheckInRecord[]);
      calculateBadges(records as CheckInRecord[]);
    }
    setIsLoading(false);
  }

  function calculateStats(records: CheckInRecord[]) {
    let streak = 0;
    const todayDate = new Date();
    for (let i = 0; i < records.length; i++) {
      const expectedDate = new Date(todayDate);
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedStr = expectedDate.toISOString().split('T')[0];
      if (records[i]?.date === expectedStr && records[i]?.completed) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    setStreakDays(streak);

    const currentMonth = todayDate.getMonth();
    const currentYear = todayDate.getFullYear();
    const monthCount = records.filter(r => {
      const d = new Date(r.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && r.completed;
    }).length;
    setMonthDays(monthCount);

    if (records.length > 0) {
      const avgProgress = records.reduce((sum, r) => sum + (r.progress || 0), 0) / records.length;
      setCompletionRate(Math.round(avgProgress));
    }
  }

  function loadTodayTasks(records: CheckInRecord[]) {
    const todayRecord = records.find(r => r.date === today);
    if (todayRecord?.tasks && todayRecord.tasks.length > 0) {
      const savedTasks = todayRecord.tasks.map((t: {id: string; completed: boolean}) => {
        const defaultTask = DEFAULT_TASKS.find(dt => dt.id === t.id);
        return {
          id: t.id,
          name: defaultTask?.name || t.id,
          completed: t.completed,
          category: defaultTask?.category || "skincare",
          icon: defaultTask?.icon || <Sparkles className="w-4 h-4" />,
        };
      });
      setTasks(savedTasks.length > 0 ? savedTasks : DEFAULT_TASKS);
      setSelectedMood(todayRecord.mood);
    } else {
      setTasks(DEFAULT_TASKS);
    }
  }

  function loadWeekData(records: CheckInRecord[]) {
    const weekData: CheckInRecord[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const record = records.find(r => r.date === dateStr);
      weekData.push(record || { date: dateStr, mood: null, tasks: null, progress: 0, completed: false });
    }
    setWeekRecords(weekData);
  }

  function loadMoodHistory(records: CheckInRecord[]) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const history = records.slice(0, 7).reverse().map(r => {
      const d = new Date(r.date);
      const mood = MOODS.find(m => m.value === r.mood);
      return { day: days[d.getDay()], score: mood?.score || 3 };
    });
    setMoodHistory(history);
  }

  function calculateBadges(records: CheckInRecord[]) {
    const completedRecords = records.filter(r => r.completed);
    const badgeList = [
      { id: "streak_7", name: "连续7天", icon: "🔥", unlocked: streakDays >= 7 },
      { id: "perfect_week", name: "完美周", icon: "⭐", unlocked: weekRecords.filter(r => r.completed).length >= 7 },
      { id: "master", name: "护肤达人", icon: "👑", unlocked: completedRecords.length >= 30 },
      { id: "early_bird", name: "早起鸟", icon: "🌅", unlocked: false },
    ];
    setBadges(badgeList);
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    if (!tasks.find(t => t.id === id)?.completed) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1000);
    }
  };

  const addTask = () => {
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName.trim(),
      completed: false,
      category: newTaskCategory,
      icon: getCategoryIcon(newTaskCategory),
    };
    setTasks([...tasks, newTask]);
    setNewTaskName("");
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditName(task.name);
  };

  const saveEditTask = () => {
    if (!editName.trim() || !editingTaskId) return;
    setTasks(tasks.map(t => t.id === editingTaskId ? { ...t, name: editName.trim() } : t));
    setEditingTaskId(null);
    setEditName("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    await supabase.from('check_in_records').upsert({
      user_id: userId,
      date: today,
      mood: selectedMood,
      tasks: tasks.map(t => ({ id: t.id, completed: t.completed })),
      progress,
      completed: progress === 100,
    }, { onConflict: 'user_id,date' });
    await loadCheckInData();
    setIsSaving(false);
    setIsEditing(false);
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-sky-50/30 pb-24">
      <div className="sticky top-0 z-10 glass border-b border-border/50 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold">每日打卡</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>{new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-soft border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-orange-400 to-amber-500 h-1" />
            <CardContent className="p-3 text-center">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{streakDays}</p>
              <p className="text-xs text-muted-foreground">连续打卡</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-sky-400 to-cyan-500 h-1" />
            <CardContent className="p-3 text-center">
              <CalendarDays className="w-5 h-5 text-sky-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{monthDays}</p>
              <p className="text-xs text-muted-foreground">本月天数</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 h-1" />
            <CardContent className="p-3 text-center">
              <Target className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">完成率</p>
            </CardContent>
          </Card>
        </div>

        {/* 周视图 */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />本周打卡
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between gap-2">
              {weekRecords.map((record, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    record.completed
                      ? "bg-emerald-500 text-white shadow-lg"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {record.completed ? <CheckCircle2 className="w-5 h-5" /> : weekDays[new Date(record.date).getDay()]}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 今日任务 */}
        <Card className="shadow-soft border-0 relative overflow-hidden">
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl animate-bounce">✨</div>
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">今日任务</CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{completedCount}/{tasks.length}</span>
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  {isEditing ? "完成" : <Edit2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <Progress value={progress} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all",
                  task.completed ? "bg-emerald-50/50" : "bg-secondary/50"
                )}>
                  <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} className="data-[state=checked]:bg-emerald-500" />
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", getCategoryColor(task.category))}>
                    {task.icon}
                  </div>
                  {editingTaskId === task.id ? (
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 h-8" />
                  ) : (
                    <span className={cn("flex-1 text-sm", task.completed && "text-muted-foreground line-through")}>{task.name}</span>
                  )}
                  {isEditing && (
                    <div className="flex gap-1">
                      {editingTaskId === task.id ? (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={saveEditTask}>
                          <Save className="w-4 h-4 text-emerald-500" />
                        </Button>
                      ) : (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditTask(task)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteTask(task.id)}>
                        <X className="w-4 h-4 text-rose-500" />
                      </Button>
                    </div>
                  )}
                  {!isEditing && task.completed && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                </div>
              ))}
            </div>

            {/* 添加新任务 */}
            {isEditing && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="添加新任务..."
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as Task["category"])}
                    className="px-3 py-2 rounded-lg border bg-background text-sm"
                  >
                    <option value="cleansing">清洁</option>
                    <option value="skincare">护肤</option>
                    <option value="diet">饮食</option>
                    <option value="sleep">睡眠</option>
                    <option value="exercise">运动</option>
                  </select>
                  <Button size="sm" onClick={addTask}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 今日心情 */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-3"><CardTitle className="text-base font-medium">今日心情</CardTitle></CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-between gap-2">
              {MOODS.map((mood) => (
                <button key={mood.value} onClick={() => setSelectedMood(mood.value)} className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-xl transition-all flex-1",
                  selectedMood === mood.value ? "bg-primary/10 ring-2 ring-primary" : "bg-secondary/50"
                )}>
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs text-muted-foreground">{mood.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 心情趋势 */}
        {moodHistory.length > 0 && (
          <Card className="shadow-soft border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />心情趋势
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodHistory}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis hide domain={[1, 5]} />
                    <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 成就徽章 */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Trophy className="w-4 h-4" />成就徽章
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-3">
              {badges.map((badge) => (
                <div key={badge.id} className="text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-xl mx-auto mb-1",
                    badge.unlocked ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-secondary grayscale opacity-50"
                  )}>{badge.icon}</div>
                  <p className="text-xs font-medium">{badge.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full h-12 rounded-xl shadow-soft-lg gradient-fresh text-white" size="lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (progress === 100 ? "今日打卡完成 ✨" : "保存打卡记录")}
        </Button>
      </div>
    </div>
  );
}
