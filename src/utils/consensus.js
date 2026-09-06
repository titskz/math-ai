export function getConsensus(results) {
 const completed=results.filter(r=>r.status==='completed');
 const counts=new Map();completed.forEach(r=>counts.set(r.answer,(counts.get(r.answer)||0)+1));
 const sorted=[...counts.entries()].sort((a,b)=>b[1]-a[1]);const [answer,count]=sorted[0]||['',0];
 return {answer,count,total:results.length,completed:completed.length,percentage:results.length?Math.round(count/results.length*100):0,differ:counts.size>1,tied:sorted.length>1&&sorted[1][1]===count};
}
