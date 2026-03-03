"use client";

interface DestroyDayModalProps {
  open: boolean;
  onClose: () => void;
  focusMinutes: number;
  breakMinutes: number;
  completedTasks: number;
}

function generateAnalysis(focusMin: number, breakMin: number, tasks: number): string {
  // All zeros
  if (focusMin === 0 && breakMin === 0 && tasks === 0) {
    return "Ноль активности. Ты пока существуешь в теории.";
  }

  // More focus than breaks
  if (focusMin > breakMin && focusMin > 0) {
    const hours = Math.floor(focusMin / 60);
    const mins = focusMin % 60;
    const timeStr = hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;
    return `Ты работал ${timeStr}. Это выглядит подозрительно. Срочно восстановить баланс.`;
  }

  // More breaks than focus
  if (breakMin > focusMin && breakMin > 0) {
    return `${breakMin} минут отдыха. Наконец-то разумный человек.`;
  }

  // Equal or other cases
  if (focusMin > 0 && breakMin > 0) {
    return `${focusMin}м работы, ${breakMin}м отдыха. Баланс сомнительный, но интересный.`;
  }

  // Only tasks completed
  if (tasks > 0) {
    return `${tasks} ${tasks === 1 ? "задача завершена" : "задачи завершены"}. Кто-то явно переоценил свои силы.`;
  }

  return "Данных недостаточно для анализа. Или ты слишком хорош для метрик.";
}

export function DestroyDayModal({
  open,
  onClose,
  focusMinutes,
  breakMinutes,
  completedTasks,
}: DestroyDayModalProps) {
  if (!open) return null;

  const analysis = generateAnalysis(focusMinutes, breakMinutes, completedTasks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8">
        <h2 className="text-xl font-bold mb-4 text-center">Анализ дня</h2>
        
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted">Фокус:</span>
            <span className="font-semibold">{focusMinutes}м</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Отдых:</span>
            <span className="font-semibold">{breakMinutes}м</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Задач:</span>
            <span className="font-semibold">{completedTasks}</span>
          </div>
        </div>

        <div className="bg-purple-start/10 border border-purple-start/20 rounded-lg p-4 mb-6">
          <p className="text-sm leading-relaxed text-center">
            {analysis}
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full bg-gradient-to-r from-purple-start to-purple-end text-white font-semibold hover:opacity-90 transition-opacity"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
