var a,t;a=this,t=function(a){"use strict";const t=a=>typeof a,e="tinybase",s=",",n=t(""),i=(a,t)=>a.repeat(t),c=(a,t="")=>a.join(t),o=(a,t)=>a.map(t),r=a=>a.length,l=a=>0==r(a),y=(a,t)=>a.filter(t),w=(a,t,e)=>a.slice(t,e),E=(a,...t)=>a.push(...t),u=Promise,d=(a,t)=>a instanceof t,f=a=>null==a,p=(a,t,e)=>f(a)?e?.():t(a),T=a=>t(a)==n,m=async a=>u.all(a),v=(a,t)=>a?.has(t)??!1,A=a=>[...a?.values()??[]],L=(a,t)=>a?.delete(t),h=Object,N=h.keys,O=h.freeze,R=(a=[])=>h.fromEntries(a),C=(...a)=>h.assign({},...a),S=(a,t)=>o(h.entries(a),(([a,e])=>t(e,a))),b=a=>h.values(a),g=a=>r(N(a)),D=a=>(a=>d(a,h)&&a.constructor==h)(a)&&0==g(a),I=a=>new Map(a),F=a=>[...a?.keys()??[]],M=(a,t)=>a?.get(t),$=(a,t)=>o([...a?.entries()??[]],(([a,e])=>t(e,a))),P=(a,t,e)=>f(e)?(L(a,t),a):a?.set(t,e),_=(a,t,e)=>(v(a,t)||P(a,t,e()),M(a,t)),B=(a,t,e,s=P)=>(S(t,((t,s)=>e(a,s,t))),((a,t)=>{((a,t)=>{a?.forEach(t)})(a,((a,e)=>t(e)))})(a,(e=>((a,t)=>!f(((a,t)=>p(a,(a=>a[t])))(a,t)))(t,e)?0:s(a,e))),a),W=a=>new Set(Array.isArray(a)||f(a)?a:[a]),x=(a,t)=>a?.add(t),j="_",H="_id",U=a=>`"${a.replace(/"/g,'""')}"`,k="FROM pragma_table_",q="WHERE",J=(a,t,e)=>{const n=I();return[async()=>B(n,R(await m(o(await a("SELECT name "+k+"list WHERE schema='main'AND type='table'AND name IN("+z(t)+")",t),(async({name:t})=>[t,R(o(await a("SELECT name,type "+k+"info(?)",[t]),(({name:a,type:t})=>[a,t])))])))),((a,t,e)=>P(n,t,B(_(n,t,I),e,((a,t,e)=>{e!=M(a,t)&&P(a,t,e)}),((a,t)=>P(a,t))))),((a,t)=>P(n,t))),async(t,e)=>((a,t)=>!f(M(M(n,a),t)))(t,e)?R(y(o(await a("SELECT*FROM"+U(t)),(a=>{return[a[e],(t={...a},s=e,delete t[s],t)];var t,s})),(([a,t])=>!f(a)&&!D(t)))):{},async(t,e,i,r,w,u=!1)=>{const d=W();S(i??{},(a=>o(N(a??{}),(a=>x(d,a)))));const p=A(d);if(!u&&w&&l(p)&&v(n,t))return await a("DROP TABLE"+U(t)),void P(n,t);if(l(p)||v(n,t)){const s=M(n,t),i=W(F(s));await m([...o(p,(async e=>{L(i,e)||(await a(`ALTER TABLE${U(t)}ADD${U(e)}`),P(s,e,""))})),...!u&&r?o(A(i),(async n=>{n!=e&&(await a(`ALTER TABLE${U(t)}DROP${U(n)}`),P(s,n))})):[]])}else await a(`CREATE TABLE${U(t)}(${U(e)} PRIMARY KEY ON CONFLICT REPLACE${c(o(p,(a=>s+U(a))))});`),P(n,t,I([[e,""],...o(p,(a=>[a,""]))]));if(u)f(i)?await a("DELETE FROM"+U(t)+"WHERE 1"):await m(S(i,(async(s,n)=>{f(s)?await a("DELETE FROM"+U(t)+q+U(e)+"=?",[n]):l(p)||await Y(a,t,e,N(s),[n,...b(s)])})));else if(l(p))v(n,t)&&await a("DELETE FROM"+U(t)+"WHERE 1");else{const s=y(F(M(n,t)),(a=>a!=e)),c=[],r=[];S(i??{},((a,t)=>{E(c,t,...o(s,(t=>a?.[t]))),E(r,t)})),await Y(a,t,e,s,c),await a("DELETE FROM"+U(t)+q+U(e)+"NOT IN("+z(r)+")",r)}},async t=>{let s;await a("BEGIN");try{s=await t()}catch(a){e?.(a)}return await a("END"),s}]},Y=async(a,t,e,n,l)=>await a("INSERT INTO"+U(t)+"("+U(e)+c(o(n,(a=>s+U(a))))+")VALUES"+i(`,(?${i(",?",r(n))})`,r(l)/(r(n)+1)).substring(1)+"ON CONFLICT("+U(e)+")DO UPDATE SET"+c(o(n,(a=>U(a)+"=excluded."+U(a))),s),l),z=a=>c(o(a,(()=>"?")),s),G=JSON.parse,K=I(),V=I(),Q=(a,t,e,s,n,i,c=[])=>{let o,r,l,y=0,w=0;_(K,c,(()=>0)),_(V,c,(()=>[]));const u=async a=>(2!=y&&(y=1,await d.schedule((async()=>{await a(),y=0}))),d),d={load:async(e,s)=>await u((async()=>{try{a.setContent(await t())}catch{a.setContent([e,s])}})),startAutoLoad:async(e={},n={})=>(d.stopAutoLoad(),await d.load(e,n),w=1,l=s((async(e,s)=>{if(s){const t=s();await u((async()=>a.setTransactionChanges(t)))}else await u((async()=>{try{a.setContent(e?.()??await t())}catch(a){i?.(a)}}))})),d),stopAutoLoad:()=>(w&&(n(l),l=void 0,w=0),d),save:async t=>(1!=y&&(y=2,await d.schedule((async()=>{try{await e(a.getContent,t)}catch(a){i?.(a)}y=0}))),d),startAutoSave:async()=>(await d.stopAutoSave().save(),o=a.addDidFinishTransactionListener(((a,t)=>{const[e,s]=t();D(e)&&D(s)||d.save((()=>[e,s]))})),d),stopAutoSave:()=>(p(o,a.delListener),d),schedule:async(...a)=>(E(M(V,c),...a),await(async()=>{if(!M(K,c)){for(P(K,c,1);!f((a=M(V,c),r=a.shift()));)try{await r()}catch(a){i?.(a)}P(K,c,0)}var a})(),d),getStore:()=>a,destroy:()=>d.stopAutoLoad().stopAutoSave(),getStats:()=>({})};return O(d)},X="store",Z=(a,t,e,s,n,[i],c,o)=>{const[r,l,y,w]=J(t,c,n);return Q(a,(async()=>await w((async()=>(await r(),G((await l(i,H))[j]?.[X]??"null"))))),(async a=>await w((async()=>{var t;await r(),await y(i,H,{[j]:{[X]:(t=a()??null,JSON.stringify(t,((a,t)=>d(t,Map)?h.fromEntries([...t]):t)))}},!0,!0)}))),e,s,n,o)},aa=(a,t,e,s,n,[i,c,[o,r,l]],w,E)=>{const[u,d,p,T]=J(t,w,n),v=async(a,t)=>await m($(c,(async([e,s,n,i],c)=>{const o=a[c];t&&void 0===o||await p(e,s,o,n,i,t)}))),A=async(a,t)=>r?await p(l,H,{[j]:a},!0,!0,t):null;return Q(a,(async()=>await T((async()=>{await u();const a=await(async()=>R(y(await m($(i,(async([a,t],e)=>[a,await d(e,t)]))),(a=>!D(a[1])))))(),t=await(async()=>o?(await d(l,H))[j]:{})();return D(a)&&f(t)?void 0:[a,t]}))),(async(a,t)=>await T((async()=>{if(await u(),f(t)){const[t,e]=a();await v(t),await A(e)}else{const[a,e]=t();await v(a,!0),await A(e,!0)}}))),e,s,n,E)},ta="json",ea="autoLoadIntervalSeconds",sa="rowIdColumnName",na="tableId",ia="tableName",ca={mode:ta,[ea]:1},oa={load:0,save:0,[ia]:e+"_values"},ra=(a,t,e,s)=>{const n=I();return S(a,((a,i)=>{const c=w(b(C(t,T(a)?{[e]:a}:a)),0,g(t));f(c[0])||s(i,c[0])||P(n,i,c)})),n},la="pragma ",ya="data_version",wa="schema_version",Ea=(a,t,s,n,i,c,o,r)=>{let l,y;const[E,u,d,f]=(a=>{const t=(a=>C(ca,T(a)?{storeTableName:a}:a??{}))(a),s=t[ea];if(t.mode==ta){const{storeTableName:a=e}=t;return[1,s,[a],W(a)]}const{tables:{load:n={},save:i={}}={},values:c={}}=t,o=w(b(C(oa,c)),0,g(oa)),r=o[2],l=W(r);return[0,s,[ra(n,{[na]:null,[sa]:H},na,(a=>x(l,a)&&a==r)),ra(i,{[ia]:null,[sa]:H,deleteEmptyColumns:0,deleteEmptyTable:0},ia,((a,t)=>x(l,t)&&t==r)),o],l]})(t);return(E?Z:aa)(a,c?async(a,t)=>(c(a,t),await s(a,t)):s,(a=>[setInterval((async()=>{try{const t=(await s(la+ya))[0][ya],e=(await s(la+wa))[0][wa];t==(l??=t)&&e==(y??=e)||(a(),l=t,y=e)}catch{}}),1e3*u),n((t=>f.has(t)?a():0))]),(([a,t])=>{clearInterval(a),l=y=null,i(t)}),o,d,A(f),r)};a.createCrSqliteWasmPersister=(a,t,e,s,n)=>Ea(a,e,(async(a,e=[])=>await t.execO(a,e)),(a=>t.onUpdate(((t,e,s)=>a(s)))),(a=>a()),s,n,t)},"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((a="undefined"!=typeof globalThis?globalThis:a||self).TinyBasePersisterCrSqliteWasm={});