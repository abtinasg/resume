'use client';

import { useEffect, useState } from 'react';

interface WeeklyPlan {
  plan_id: string;
  strategy_mode: string;
  target_applications: number;
  focus_mix: {
    resume: number;
    applications: number;
    followups: number;
    strategy: number;
  };
  tasks: Task[];
}

interface Task {
  task_id: string;
  title: string;
  description: string;
  why_now: string;
  estimated_minutes: number;
  priority: number;
}

export function WeeklyPlanSection({ userId }: { userId: string }) {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadPlan() {
      try {
        const res = await fetch('/api/plan/weekly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
        const data = await res.json();
        setPlan(data.plan);
      } catch (error) {
        console.error('Failed to load plan:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPlan();
  }, [userId]);
  
  if (loading) return <div>Loading plan...</div>;
  if (!plan) return null;
  
  return (
    <div className="space-y-6">
      {/* Strategy Mode */}
      <div className="p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Current Strategy</h3>
        <p className="text-2xl font-bold text-blue-600">
          {plan.strategy_mode.replace(/_/g, ' ')}
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Target: {plan.target_applications} applications this week
        </p>
      </div>
      
      {/* Focus Mix */}
      <div>
        <h3 className="text-lg font-semibold mb-4">This Week&apos;s Focus</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(plan.focus_mix).map(([key, value]) => (
            <div key={key} className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 capitalize">{key}</div>
              <div className="text-2xl font-bold">{Math.round(value * 100)}%</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tasks */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Your Tasks</h3>
        <div className="space-y-3">
          {plan.tasks.slice(0, 5).map((task) => (
            <TaskCard key={task.task_id} task={task} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const [showWhy, setShowWhy] = useState(false);
  
  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between">
        <div className="flex-1">
          <h4 className="font-semibold">{task.title}</h4>
          <p className="text-sm text-gray-600">{task.description}</p>
        </div>
        <div className="text-sm text-gray-500">
          ⏱️ {task.estimated_minutes} min
        </div>
      </div>
      
      <button
        onClick={() => setShowWhy(!showWhy)}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        {showWhy ? 'Hide' : 'Show'} reasoning
      </button>
      
      {showWhy && (
        <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
          <strong>Why now:</strong> {task.why_now}
        </div>
      )}
    </div>
  );
}
