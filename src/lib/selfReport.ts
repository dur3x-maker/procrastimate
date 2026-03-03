export interface SelfReportInput {
  totalFocusMinutes: number;
  totalBreakMinutes: number;
  sessions: number;
  skippedBreaks: number;
  funengineOpens: number;
  resistedDistractions: number;
  overheatMinutes: number;
}

export interface SelfReportOutput {
  summaryBlock: string;
  disciplineBlock: string;
  overheatingBlock: string;
  toneComment: string;
}

function getToneComment(focusMinutes: number, skippedBreaks: number): string {
  if (focusMinutes > 240 && skippedBreaks > 5) {
    return "You're a machine. Or maybe you just forgot to log breaks. Either way, impressive denial.";
  }
  
  if (focusMinutes > 180 && skippedBreaks > 3) {
    return "Solid work ethic. Questionable self-care. Balance is overrated anyway.";
  }
  
  if (focusMinutes > 120 && skippedBreaks <= 2) {
    return "Reasonable productivity with actual breaks. Who are you and what did you do with the real procrastinator?";
  }
  
  if (focusMinutes > 60 && skippedBreaks === 0) {
    return "You took all your breaks. Congratulations on being a functional human.";
  }
  
  if (focusMinutes < 30) {
    return "Well, at least you showed up. That's something.";
  }
  
  return "You did... something. The bar was low, and you met it.";
}

export function generateSelfReport(input: SelfReportInput): SelfReportOutput {
  const {
    totalFocusMinutes,
    totalBreakMinutes,
    sessions,
    skippedBreaks,
    funengineOpens,
    resistedDistractions,
    overheatMinutes,
  } = input;

  const focusHours = Math.floor(totalFocusMinutes / 60);
  const focusMinutes = totalFocusMinutes % 60;
  const breakHours = Math.floor(totalBreakMinutes / 60);
  const breakMinutes = totalBreakMinutes % 60;

  const summaryBlock = `You completed ${sessions} session${sessions !== 1 ? 's' : ''} today, totaling ${focusHours}h ${focusMinutes}m of focus time. You took ${totalBreakMinutes > 0 ? `${breakHours}h ${breakMinutes}m` : '0m'} of breaks.`;

  const disciplineBlock = `You opened FunEngine ${funengineOpens} time${funengineOpens !== 1 ? 's' : ''}. You resisted distractions ${resistedDistractions} time${resistedDistractions !== 1 ? 's' : ''}. ${skippedBreaks > 0 ? `You skipped ${skippedBreaks} break${skippedBreaks !== 1 ? 's' : ''}.` : 'You took all recommended breaks.'}`;

  const overheatingBlock = overheatMinutes > 0
    ? `You spent ${overheatMinutes} minute${overheatMinutes !== 1 ? 's' : ''} in overheating mode. Your brain probably needs a vacation.`
    : 'No overheating detected. You managed to stay within reasonable limits.';

  const toneComment = getToneComment(totalFocusMinutes, skippedBreaks);

  return {
    summaryBlock,
    disciplineBlock,
    overheatingBlock,
    toneComment,
  };
}
