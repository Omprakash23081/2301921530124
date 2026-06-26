/**
 * Solves the 0/1 Knapsack problem for vehicle task scheduling.
 * Maximize Total Impact such that Total Duration <= MechanicHours.
 * 
 * @param {Array} tasks - Array of task objects: { TaskID, Duration, Impact }
 * @param {number} capacity - MechanicHours limit
 * @returns {Object} { selectedTasks, totalDuration, totalImpact }
 */
export function solveKnapsack(tasks, capacity) {
  if (!Array.isArray(tasks) || tasks.length === 0 || capacity <= 0) {
    return {
      selectedTasks: [],
      totalDuration: 0,
      totalImpact: 0
    };
  }

  const n = tasks.length;
  const W = capacity;
  
  // dp[i][w] will store the maximum impact using the first i tasks with weight limit w
  const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    const task = tasks[i - 1];
    const duration = task.Duration;
    const impact = task.Impact;
    
    for (let w = 0; w <= W; w++) {
      if (duration <= w) {
        dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - duration] + impact);
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  
  // Traceback to find the selected tasks
  let w = W;
  const selectedTasks = [];
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      const task = tasks[i - 1];
      selectedTasks.push(task);
      w -= task.Duration;
    }
  }
  
  // Reverse to maintain relative order
  selectedTasks.reverse();
  
  const totalDuration = selectedTasks.reduce((sum, t) => sum + t.Duration, 0);
  const totalImpact = selectedTasks.reduce((sum, t) => sum + t.Impact, 0);
  
  return {
    selectedTasks,
    totalDuration,
    totalImpact
  };
}
