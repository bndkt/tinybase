var a,t;a=this,t=function(a){"use strict";const t=a=>typeof a,e="tinybase",s=",",n=t(""),i=(a,t)=>a.repeat(t),o=Promise,c=clearInterval,r=a=>null==a,l=(a,t,e)=>r(a)?e?.():t(a),y=a=>t(a)==n,w=(a,t,e)=>a.slice(t,e),u=a=>a.length,E=async a=>o.all(a),d="_",f="_id",p=a=>`"${a.replace(/"/g,'""')}"`,T="SELECT",v=(a,t="")=>a.join(t),m=(a,t)=>a.map(t),A=a=>0==u(a),L=(a,t)=>a.filter(t),h=(a,...t)=>a.push(...t),O=(a,t)=>a?.has(t)??!1,R=a=>[...a?.values()??[]],N=(a,t)=>a?.delete(t),S=Object,g=a=>S.getPrototypeOf(a),C=S.keys,D=S.freeze,b=(a=[])=>S.fromEntries(a),I=(...a)=>S.assign({},...a),F=(a,t)=>m(S.entries(a),(([a,e])=>t(e,a))),M=a=>S.values(a),P=a=>u(C(a)),$=a=>(a=>!r(a)&&l(g(a),(a=>a==S.prototype||r(g(a))),(()=>!0)))(a)&&0==P(a),_=a=>new Map(a),B=a=>[...a?.keys()??[]],H=(a,t)=>a?.get(t),j=(a,t)=>m([...a?.entries()??[]],(([a,e])=>t(e,a))),x=(a,t,e)=>r(e)?(N(a,t),a):a?.set(t,e),W=(a,t,e)=>(O(a,t)||x(a,t,e()),H(a,t)),Y=(a,t,e,s=x)=>(F(t,((t,s)=>e(a,s,t))),((a,t)=>{((a,t)=>{a?.forEach(t)})(a,((a,e)=>t(e)))})(a,(e=>((a,t)=>!r(((a,t)=>l(a,(a=>a[t])))(a,t)))(t,e)?0:s(a,e))),a),k=a=>new Set(Array.isArray(a)||r(a)?a:[a]),q=(a,t)=>a?.add(t),G=T+"*FROM",J="FROM pragma_table_",U="WHERE",z=(a,t,e)=>{const n=_();return[async()=>Y(n,b(await E(m(await a("SELECT name "+J+"list WHERE schema='main'AND type='table'AND name IN("+V(t)+")ORDER BY name",t),(async({name:t})=>[t,b(m(await a(T+" name,type "+J+"info(?)",[t]),(({name:a,type:t})=>[a,t])))])))),((a,t,e)=>x(n,t,Y(W(n,t,_),e,((a,t,e)=>{e!=H(a,t)&&x(a,t,e)}),((a,t)=>x(a,t))))),((a,t)=>x(n,t))),async(t,e)=>((a,t)=>!r(H(H(n,a),t)))(t,e)?b(L(m(await a(G+p(t)),(a=>{return[a[e],(t={...a},s=e,delete t[s],t)];var t,s})),(([a,t])=>!r(a)&&!$(t)))):{},async(t,e,i,o,c,l=!1)=>{const y=k();F(i??{},(a=>m(C(a??{}),(a=>q(y,a)))));const w=R(y);if(!l&&c&&A(w)&&O(n,t))return await a("DROP TABLE"+p(t)),void x(n,t);if(A(w)||O(n,t)){const s=H(n,t),i=k(B(s));await E([...m(w,(async e=>{N(i,e)||(await a(`ALTER TABLE${p(t)}ADD${p(e)}`),x(s,e,""))})),...!l&&o?m(R(i),(async n=>{n!=e&&(await a(`ALTER TABLE${p(t)}DROP${p(n)}`),x(s,n))})):[]])}else await a(`CREATE TABLE${p(t)}(${p(e)} PRIMARY KEY ON CONFLICT REPLACE${v(m(w,(a=>s+p(a))))});`),x(n,t,_([[e,""],...m(w,(a=>[a,""]))]));if(l)r(i)?await a("DELETE FROM"+p(t)+"WHERE 1"):await E(F(i,(async(s,n)=>{r(s)?await a("DELETE FROM"+p(t)+U+p(e)+"=?",[n]):A(w)||await K(a,t,e,C(s),[n,...M(s)])})));else if(A(w))O(n,t)&&await a("DELETE FROM"+p(t)+"WHERE 1");else{const s=L(B(H(n,t)),(a=>a!=e)),o=[],c=[];F(i??{},((a,t)=>{h(o,t,...m(s,(t=>a?.[t]))),h(c,t)})),await K(a,t,e,s,o),await a("DELETE FROM"+p(t)+U+p(e)+"NOT IN("+V(c)+")",c)}},async t=>{let s;await a("BEGIN");try{s=await t()}catch(a){e?.(a)}return await a("END"),s}]},K=async(a,t,e,n,o)=>await a("INSERT INTO"+p(t)+"("+p(e)+v(m(n,(a=>s+p(a))))+")VALUES"+w(i(`,(?${i(",?",u(n))})`,u(o)/(u(n)+1)),1)+"ON CONFLICT("+p(e)+")DO UPDATE SET"+v(m(n,(a=>p(a)+"=excluded."+p(a))),s),o),V=a=>v(m(a,(()=>"?")),s),Q=JSON.parse,X=_(),Z=_(),aa=(a,t,e,s,n,i,[o,c]=[],y=[])=>{let w,u,E,d=0,f=0;W(X,y,(()=>0)),W(Z,y,(()=>[]));const p=async a=>(2!=d&&(d=1,await T.schedule((async()=>{await a(),d=0}))),T),T={load:async(e,s)=>await p((async()=>{try{a.setContent(await t())}catch{a.setContent([e,s])}})),startAutoLoad:async(e={},n={})=>(T.stopAutoLoad(),await T.load(e,n),f=1,E=s((async(e,s)=>{if(s){const t=s();await p((async()=>a.setTransactionChanges(t)))}else await p((async()=>{try{a.setContent(e?.()??await t())}catch(a){i?.(a)}}))})),T),stopAutoLoad:()=>(f&&(n(E),E=void 0,f=0),T),save:async t=>(1!=d&&(d=2,await T.schedule((async()=>{try{await e(a.getContent,t)}catch(a){i?.(a)}d=0}))),T),startAutoSave:async()=>(await T.stopAutoSave().save(),w=a.addDidFinishTransactionListener(((a,t)=>{const[e,s]=t();$(e)&&$(s)||T.save((()=>[e,s]))})),T),stopAutoSave:()=>(l(w,a.delListener),w=void 0,T),schedule:async(...a)=>(h(H(Z,y),...a),await(async()=>{if(!H(X,y)){for(x(X,y,1);!r((a=H(Z,y),u=a.shift()));)try{await u()}catch(a){i?.(a)}x(X,y,0)}var a})(),T),getStore:()=>a,destroy:()=>T.stopAutoLoad().stopAutoSave(),getStats:()=>({})};return o&&(T[o]=()=>c),D(T)},ta="store",ea=(a,t,e,s,n,[i],o,c,r)=>{const[l,y,w,u]=z(t,o,n);return aa(a,(async()=>await u((async()=>(await l(),Q((await y(i,f))[d]?.[ta]??"null"))))),(async a=>await u((async()=>{var t;await l(),await w(i,f,{[d]:{[ta]:(t=a()??null,JSON.stringify(t,((a,t)=>t instanceof Map?S.fromEntries([...t]):t)))}},!0,!0)}))),e,s,n,[r,c],c)},sa=(a,t,e,s,n,[i,o,[c,l,y]],w,u,p)=>{const[T,v,m,A]=z(t,w,n),h=async(a,t)=>await E(j(o,(async([e,s,n,i],o)=>{const c=a[o];t&&void 0===c||await m(e,s,c,n,i,t)}))),O=async(a,t)=>l?await m(y,f,{[d]:a},!0,!0,t):null;return aa(a,(async()=>await A((async()=>{await T();const a=await(async()=>b(L(await E(j(i,(async([a,t],e)=>[a,await v(e,t)]))),(a=>!$(a[1])))))(),t=await(async()=>c?(await v(y,f))[d]:{})();return $(a)&&r(t)?void 0:[a,t]}))),(async(a,t)=>await A((async()=>{if(await T(),r(t)){const[t,e]=a();await h(t),await O(e)}else{const[a,e]=t();await h(a,!0),await O(e,!0)}}))),e,s,n,[p,u],u)},na="json",ia="autoLoadIntervalSeconds",oa="rowIdColumnName",ca="tableId",ra="tableName",la={mode:na,[ia]:1},ya={load:0,save:0,[ra]:e+"_values"},wa=(a,t,e,s)=>{const n=_();return F(a,((a,i)=>{const o=w(M(I(t,y(a)?{[e]:a}:a)),0,P(t));r(o[0])||s(i,o[0])||x(n,i,o)})),n},ua="pragma ",Ea="data_version",da="schema_version",fa=(a,t,s,n,i,o,r,l,u="getDb")=>{let E,d,p;const[v,m,A,L]=(a=>{const t=(a=>I(la,y(a)?{storeTableName:a}:a??{}))(a),s=t[ia];if(t.mode==na){const{storeTableName:a=e}=t;return[1,s,[a],k(a)]}const{tables:{load:n={},save:i={}}={},values:o={}}=t,c=w(M(I(ya,o)),0,P(ya)),r=c[2],l=k(r);return[0,s,[wa(n,{[ca]:null,[oa]:f},ca,(a=>q(l,a)&&a==r)),wa(i,{[ra]:null,[oa]:f,deleteEmptyColumns:0,deleteEmptyTable:0},ra,((a,t)=>q(l,t)&&t==r)),c],l]})(t);return(v?ea:sa)(a,o?async(a,t)=>(o(a,t),await s(a,t)):s,(a=>{return[(t=async()=>{try{const t=(await s(ua+Ea))[0][Ea],e=(await s(ua+da))[0][da],n=(await s(T+" TOTAL_CHANGES() c"))[0].c;t==(E??=t)&&e==(d??=e)&&n==(p??=n)||(a(),E=t,d=e)}catch{}},e=m,t(),setInterval(t,1e3*e)),n((t=>L.has(t)?a():0))];var t,e}),(([a,t])=>{c(a),E=d=null,i(t)}),r,A,R(L),l,u)},pa="change";a.createSqlite3Persister=(a,t,e,s,n)=>fa(a,e,(async(a,e=[])=>{return await(s=(s,n)=>t.all(a,e,((a,t)=>a?n(a):s(t))),new o(s));var s}),(a=>{const e=(t,e,s)=>a(s);return t.on(pa,e),e}),(a=>t.off(pa,a)),s,n,t)},"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((a="undefined"!=typeof globalThis?globalThis:a||self).TinyBasePersisterSqlite3={});
