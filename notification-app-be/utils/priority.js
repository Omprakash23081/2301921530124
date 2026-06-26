const priorityMap = {
  "Placement": 3,
  "Result": 2,
  "Event": 1
};

export function getTopTenPriorityNotifications(notifications) {
  if (!Array.isArray(notifications)) return [];
  
  return [...notifications]
    .sort((a, b) => {
      const pA = priorityMap[a.Type] || 0;
      const pB = priorityMap[b.Type] || 0;
      
      if (pA !== pB) {
        return pB - pA; // Descending priority: Placement > Result > Event
      }
      
      // Secondary: Sort by recent first
      return new Date(b.Timestamp) - new Date(a.Timestamp);
    })
    .slice(0, 10);
}
