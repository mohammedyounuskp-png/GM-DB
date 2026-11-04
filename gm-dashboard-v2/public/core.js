/* ===== core: data model + pivot maths (pure, no DOM) ===== */
const MN=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FISCAL=[3,4,5,6,7,8,9,10,11,0,1,2];
const SF={fy:0,mon:1,per:2,dlr:3,gm:4,ch:5,club:6,model:7,nexa:8};     // sales row layout (dims) then 9..16 = sums
const SM={ret:9,pc:10,mga:11,vas:12,ew:13,ccp:14,exc:15,ar:16};
const TF={fy:0,mon:1,dlr:2,ch:3,branch:4,gm:5};                         // target row layout (dims) then 6..10
const TM={tgt:6,ach:7,ret:8,dse:9,n:10};
const DIMS=['fy','mon','per','dlr','gm','ch','club','model','nexa','branch'];

const norm=h=>String(h==null?'':h).replace(/\s+/g,' ').trim().toLowerCase();
const num=v=>{if(typeof v==='number')return isFinite(v)?v:0;if(v==null||v==='')return 0;const x=parseFloat(String(v).replace(/,/g,''));return isFinite(x)?x:0;};
const txt=v=>{const s=v==null?'':String(v).replace(/\s+/g,' ').trim();return s===''?'(blank)':s;};
function ymKey(v){ // Excel serial | Date | 'Apr-24' | '2024-04-01' -> 'YYYY-MM'
  if(v==null||v==='')return null;
  if(typeof v==='number'){const d=new Date(Math.round((v-25569)*864e5));return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0');}
  if(v instanceof Date){return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0');}
  const s=String(v).trim();let m=s.match(/^(\d{4})-(\d{2})/);if(m)return m[1]+'-'+m[2];
  m=s.match(/^([A-Za-z]{3})[a-z]*[- ](\d{2,4})$/);
  if(m){const mi=MN.findIndex(x=>x.toLowerCase()===m[1].toLowerCase());if(mi>=0){let y=+m[2];if(y<100)y+=2000;return y+'-'+String(mi+1).padStart(2,'0');}}
  return null;
}
const monLabel=k=>{const[y,m]=k.split('-');return MN[+m-1]+'-'+y.slice(2);};

/* rows: arrays of objects keyed by normalised header */
function buildDataset(sr,tg){
  const dims={};DIMS.forEach(d=>dims[d]=[]);const maps={};DIMS.forEach(d=>maps[d]=new Map());
  const id=(d,v)=>{const m=maps[d];let i=m.get(v);if(i===undefined){i=dims[d].length;dims[d].push(v);m.set(v,i);}return i;};
  const sAgg=new Map();let sCount=0;
  for(const r of sr){
    const fy=txt(r['fy']),mk=ymKey(r['mmm-yy']);if(fy==='(blank)'||!mk)continue;
    const key=[id('fy',fy),id('mon',mk),id('per',txt(r['period'])),id('dlr',txt(r['dlr'])),id('gm',txt(r['gm name'])),id('ch',txt(r['chanel']).toUpperCase()),
      id('club',txt(r['branch club'])),id('model',txt(r['actual model'])),id('nexa',txt(r['nexa model']).toUpperCase())];
    const k=key.join('|');let a=sAgg.get(k);if(!a){a={key,v:[0,0,0,0,0,0,0,0]};sAgg.set(k,a);}
    const v=a.v;v[0]+=num(r['retail count']);v[1]+=num(r['per car']);v[2]+=num(r['mga ddl']);v[3]+=num(r['vas']);
    v[4]+=num(r['ew']);v[5]+=num(r['ccp']);v[6]+=num(r['exchange']);v[7]+=num(r['arena %']);sCount++;
  }
  const s=[...sAgg.values()].map(a=>a.key.concat(a.v.map(x=>Math.round(x*1000)/1000)));
  // dealer -> GM (majority) so Target rows can be filtered by GM
  const cnt={};for(const row of s){const k=row[SF.dlr]+'|'+row[SF.gm];cnt[k]=(cnt[k]||0)+row[SM.ret];}
  const dlrGm={};for(const k in cnt){const[d,g]=k.split('|').map(Number);if(!(d in dlrGm)||cnt[k]>cnt[d+'|'+dlrGm[d]])dlrGm[d]=g;}
  const tAgg=new Map();let tCount=0;const unk=id('gm','(unassigned)');
  for(const r of tg){
    const fy=txt(r['fy']),mk=ymKey(r['mmm-yy']);if(fy==='(blank)'||!mk)continue;
    const dl=id('dlr',txt(r['dlr']));
    const key=[id('fy',fy),id('mon',mk),dl,id('ch',txt(r['chanel']).toUpperCase()),id('branch',txt(r['branch'])),dl in dlrGm?dlrGm[dl]:unk];
    const k=key.join('|');let a=tAgg.get(k);if(!a){a={key,v:[0,0,0,0,0]};tAgg.set(k,a);}
    a.v[0]+=num(r['target']);a.v[1]+=num(r['achieved']);a.v[2]+=num(r['total retail']);a.v[3]+=num(r['dse count']);a.v[4]+=1;tCount++;
  }
  const t=[...tAgg.values()].map(a=>a.key.concat(a.v));
  return{v:2,dims,s,t,counts:{sales:sCount,target:tCount}};
}
/* sheet matrix (array of arrays) -> array of objects, auto-detect header row */
function matrixToRows(mx,must){
  let h=-1;for(let i=0;i<Math.min(mx.length,15);i++){const set=new Set((mx[i]||[]).map(norm));if(must.every(m=>set.has(m))){h=i;break;}}
  if(h<0)return null;const hd=mx[h].map(norm);const out=[];
  for(let i=h+1;i<mx.length;i++){const r=mx[i];if(!r)continue;const o={};let any=false;for(let c=0;c<hd.length;c++){if(hd[c]&&r[c]!=null&&r[c]!==''){if(!(hd[c] in o))o[hd[c]]=r[c];any=true;}}if(any)out.push(o);}
  return out;
}
const SALES_MUST=['fy','mmm-yy','branch club','retail count','per car'];
const TARGET_MUST=['branch','target','achieved','mmm-yy','fy'];

/* ---- aggregation ---- */
function makePass(sets,fmap,row0){ // sets: {dimKey:Set(indices)}
  const checks=[];for(const k in sets){const s=sets[k];if(s&&s.size&&k in fmap)checks.push([fmap[k],s]);}
  return r=>{for(let i=0;i<checks.length;i++){if(!checks[i][1].has(r[checks[i][0]]))return false;}return true;};
}
const zeroS=()=>[0,0,0,0,0,0,0,0];
function addS(a,r){for(let i=0;i<8;i++)a[i]+=r[9+i];}
const div=(a,b)=>b?a/b:0;
function deriveS(a){const[ret,pc,mga,vas,ew,ccp,exc,ar]=a;return{ret,mga,mgaCar:div(mga,pc),vas,vasCar:div(vas,pc),ew,ewP:div(ew,pc),ccp,ccpP:div(ccp,pc),exc,excP:div(exc,pc),arena:div(ar,pc),has:pc>0||ret>0};}
function groupS(rows,pass,keyFn){const m=new Map();for(const r of rows){if(!pass(r))continue;const k=keyFn(r);let a=m.get(k);if(!a){a=zeroS();m.set(k,a);}addS(a,r);}return m;}
const zeroT=()=>[0,0,0,0,0];
function addT(a,r){for(let i=0;i<5;i++)a[i]+=r[6+i];}
function deriveT(a){const[tgt,ach,ret,dse,n]=a;return{tgt,ach,pct:div(ach,tgt),dse,avgDse:div(dse,n),prod:div(ret,dse)};}
function groupT(rows,pass,keyFn){const m=new Map();for(const r of rows){if(!pass(r))continue;const k=keyFn(r);let a=m.get(k);if(!a){a=zeroT();m.set(k,a);}addT(a,r);}return m;}

if(typeof module!=='undefined')module.exports={buildDataset,matrixToRows,SALES_MUST,TARGET_MUST,makePass,groupS,groupT,deriveS,deriveT,zeroS,zeroT,addS,addT,SF,SM,TF,TM,ymKey,monLabel,MN,FISCAL,norm};
