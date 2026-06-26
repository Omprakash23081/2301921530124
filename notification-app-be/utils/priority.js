const priorityMap = {
  "Placement": 3,
  "Result": 2,
  "Event": 1
};

export function getTopTenPriorityNotifications(notifications) {
  if (!Array.isArray(notifications)) return [];
  
  return [...notifications]
    .sort((a, b) => {
      const dateA = new Date(a.Timestamp);
      const dateB = new Date(b.Timestamp);
      
      // Primary Sort: Recency (Recent first)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateB - dateA;
      }
      
      // Secondary Sort (Tie-breaker): Priority (Placement > Result > Event)
      const pA = priorityMap[a.Type] || 0;
      const pB = priorityMap[b.Type] || 0;
      
      return pB - pA;
    })
    .slice(0, 10);
}
