'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/card';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { CheckSquare, Square, Clock, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface DailyTask {
  task_id: string;
  title: string;
  description: string;
  why_now: string;
  estimated_minutes: number;
  priority: number;
  completed?: boolean;
}

interface DailyTasksListProps {
  userId: string;
  onExplainClick?: (taskId: string) => void;
}

export function DailyTasksList({ userId, onExplainClick }: DailyTasksListProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusArea, setFocusArea] = useState<string>('');
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    fetchDailyTasks();
  }, [userId]);

  const fetchDailyTasks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/plan/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to load daily tasks');
      }
      
      const data = await res.json();
      if (data.success && data.plan) {
        setTasks(data.plan.tasks.map((task: DailyTask) => ({ ...task, completed: false })));
        setFocusArea(data.plan.focus_area || '');
        setTotalTime(data.plan.total_time_minutes || 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.task_id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const completedCount = tasks.filter(t => t.completed).length;

  const getPriorityBadge = (priority: number) => {
    if (priority <= 2) return <Badge variant="high">High Priority</Badge>;
    if (priority <= 4) return <Badge variant="medium">Medium</Badge>;
    return <Badge variant="low">Low</Badge>;
  };

  if (loading) {
    return (
      <Card className="!bg-white">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="!bg-red-50 !border-red-200">
        <div className="text-center py-4">
          <p className="text-red-700">{error}</p>
          <Button onClick={fetchDailyTasks} className="mt-2">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="!bg-white hover:!shadow-xl transition-all duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Today&apos;s Tasks</h3>
            {focusArea && (
              <p className="text-sm text-gray-500">Focus: {focusArea}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{completedCount}/{tasks.length}</p>
            <p className="text-xs text-gray-500">completed</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
          />
        </div>

        {/* Time Estimate */}
        {totalTime > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>~{totalTime} min total</span>
          </div>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-8">
            <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tasks for today</p>
            <p className="text-sm text-gray-400">Check back tomorrow!</p>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskItem 
              key={task.task_id} 
              task={task} 
              onToggle={() => toggleTaskComplete(task.task_id)}
              onExplain={() => onExplainClick?.(task.task_id)}
              priorityBadge={getPriorityBadge(task.priority)}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

interface TaskItemProps {
  task: DailyTask;
  onToggle: () => void;
  onExplain?: () => void;
  priorityBadge: React.ReactNode;
}

function TaskItem({ task, onToggle, onExplain, priorityBadge }: TaskItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`p-4 rounded-lg border transition-all duration-300 ${
      task.completed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
    }`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button 
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5"
        >
          {task.completed ? (
            <CheckSquare className="w-5 h-5 text-green-500" />
          ) : (
            <Square className="w-5 h-5 text-gray-400 hover:text-blue-500" />
          )}
        </button>

        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
              {task.title}
            </h4>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.estimated_minutes}m
              </span>
              {priorityBadge}
            </div>
          </div>
          
          <p className={`text-sm mt-1 ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.description}
          </p>

          {/* Expand/Collapse for Why */}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Why this task?
            </button>
            {onExplain && (
              <button
                onClick={onExplain}
                className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1"
              >
                <HelpCircle className="w-3 h-3" />
                Get more info
              </button>
            )}
          </div>

          {/* Expanded Why Section */}
          {expanded && (
            <div className="mt-2 p-3 bg-white rounded border border-gray-200 text-sm text-gray-600">
              <strong>Why now:</strong> {task.why_now}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
