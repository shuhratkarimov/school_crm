import{c as C,r as c,K as F,j as e,y as P,N as l,o as I,O as E,Q as A,A as D,n as M}from"./index-DaaX8xnv.js";import{L as $}from"./LoginLoading-fDLIVM9f.js";import{L as q}from"./lock-CQHbu_bQ.js";import{L as O}from"./log-in-C5nYuI4Q.js";/**
 * @license lucide-react v0.454.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=C("BookOpenCheck",[["path",{d:"M12 21V7",key:"gj6g52"}],["path",{d:"m16 12 2 2 4-4",key:"mdajum"}],["path",{d:"M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3",key:"8arnkb"}]]);function B(){const k=c.useRef(null);return c.useEffect(()=>{const t=k.current;if(!t)return;const d=t.getContext("2d"),s=48,h=[["#c7d2fe","#ddd6fe","#bfdbfe","#e0e7ff","#fce7f3"],["#a5f3fc","#a7f3d0","#bbf7d0","#d1fae5","#e0f2fe"],["#fde68a","#fca5a5","#fdba74","#fcd34d","#f9a8d4"],["#c4b5fd","#a5b4fc","#93c5fd","#6ee7b7","#fca5a5"]];let f=0,u=1,x=0;const b=.0025;function g(y,o,i){const n=parseInt(y.slice(1),16),a=parseInt(o.slice(1),16),r=n>>16&255,j=n>>8&255,N=n&255,L=a>>16&255,z=a>>8&255,S=a&255;return`rgb(${Math.round(r+(L-r)*i)},${Math.round(j+(z-j)*i)},${Math.round(N+(S-N)*i)})`}function m(){t.width=window.innerWidth,t.height=window.innerHeight}m(),window.addEventListener("resize",m);let v=0,w;function p(){v++,x+=b,x>=1&&(x=0,f=u,u=(u+1)%h.length),d.clearRect(0,0,t.width,t.height);const y=Math.ceil(t.width/s)+1,o=Math.ceil(t.height/s)+1,i=h[f],n=h[u];for(let a=0;a<o;a++)for(let r=0;r<y;r++){const j=(a+r)%i.length,N=(a+r)%n.length,z=.15+(Math.sin(v*.01+(a+r)*.55)*.5+.5)*.18,S=g(i[j],n[N],x);d.globalAlpha=z,d.fillStyle=S,d.fillRect(r*s,a*s,s-1,s-1)}d.globalAlpha=1,w=requestAnimationFrame(p)}return p(),()=>{cancelAnimationFrame(w),window.removeEventListener("resize",m)}},[]),e.jsx("canvas",{ref:k,style:{position:"absolute",inset:0,width:"100%",height:"100%",zIndex:0,display:"block"}})}function V({setTeacherAuthenticated:k}){const[t,d]=c.useState(""),[s,h]=c.useState(""),[f,u]=c.useState(!1),x=F(),[b,g]=c.useState(!1),[m,v]=c.useState(!1),[w,p]=c.useState(null),y=async o=>{o.preventDefault();try{g(!0);const n=await(await fetch(`${D}/teacher_login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:t,password:s}),credentials:"include"})).json();n.status==="success"?(k(!0),v(!0),setTimeout(()=>x("/teacher/dashboard"),1500)):(M.error(n.message||"Login xatolik"),g(!1))}catch(i){M.error(`Server bilan aloqa xatolik: ${i}`),g(!1)}};return e.jsxs("div",{className:"tl-root",children:[e.jsx(B,{}),e.jsx("div",{className:"blob blob-tr"}),e.jsx("div",{className:"blob blob-bl"}),e.jsx(P,{children:m&&e.jsx(l.div,{className:"success-overlay",initial:{opacity:0},animate:{opacity:1},exit:{opacity:0},children:e.jsxs(l.div,{className:"success-inner",initial:{scale:.5,opacity:0,y:30},animate:{scale:1,opacity:1,y:0},transition:{duration:.4,ease:[.34,1.56,.64,1]},children:[e.jsx("div",{className:"s-check",children:e.jsxs("svg",{viewBox:"0 0 52 52",style:{width:"100%",height:"100%"},children:[e.jsx("circle",{cx:"26",cy:"26",r:"25",fill:"none",className:"s-circle"}),e.jsx("path",{d:"M14.1 27.2l7.1 7.2 16.7-16.8",fill:"none",className:"s-path"})]})}),e.jsx("p",{className:"s-title",children:"Muvaffaqiyatli kirildi!"}),e.jsx("p",{className:"s-sub",children:"Dashboardga o'tkazilmoqda…"})]})})}),e.jsxs(l.div,{className:"tl-card",initial:{opacity:0,y:40,scale:.97},animate:{opacity:1,y:0,scale:1},transition:{duration:.55,ease:[.22,1,.36,1]},children:[e.jsx(l.div,{className:"logo-wrap",initial:{opacity:0,y:-10},animate:{opacity:1,y:0},transition:{delay:.15,duration:.4},children:e.jsx("img",{src:"/logo.png",alt:"Progress Logo",className:"logo-img"})}),e.jsx(l.div,{className:"badge-wrap",initial:{opacity:0},animate:{opacity:1},transition:{delay:.22},children:e.jsxs("span",{className:"badge",children:[e.jsx(R,{size:15,strokeWidth:2.2}),"Ustozlar platformasi"]})}),e.jsxs("form",{onSubmit:y,className:"tl-form",autoComplete:"on",children:[e.jsxs(l.div,{className:"field",initial:{opacity:0,x:-16},animate:{opacity:1,x:0},transition:{delay:.3},children:[e.jsx("label",{htmlFor:"username",className:"f-label",children:"Foydalanuvchi nomingiz"}),e.jsxs("div",{className:`f-wrap ${w==="username"?"focused":""}`,children:[e.jsx(I,{size:16,className:"f-icon"}),e.jsx("input",{id:"username",name:"username",type:"text",value:t,onChange:o=>d(o.target.value),onFocus:()=>p("username"),onBlur:()=>p(null),className:"f-input",placeholder:"username",autoComplete:"username",required:!0})]})]}),e.jsxs(l.div,{className:"field",initial:{opacity:0,x:-16},animate:{opacity:1,x:0},transition:{delay:.38},children:[e.jsx("label",{htmlFor:"password",className:"f-label",children:"Parolingiz"}),e.jsxs("div",{className:`f-wrap ${w==="password"?"focused":""}`,children:[e.jsx(q,{size:16,className:"f-icon"}),e.jsx("input",{id:"password",name:"password",type:f?"text":"password",value:s,onChange:o=>h(o.target.value),onFocus:()=>p("password"),onBlur:()=>p(null),className:"f-input",placeholder:"••••••••",autoComplete:"current-password",required:!0}),e.jsx("button",{type:"button",className:"pw-toggle",onClick:()=>u(!f),tabIndex:-1,children:f?e.jsx(E,{size:17}):e.jsx(A,{size:17})})]})]}),e.jsx(l.button,{type:"submit",disabled:b,className:"tl-btn",whileHover:{scale:b?1:1.015},whileTap:{scale:b?1:.975},initial:{opacity:0,y:14},animate:{opacity:1,y:0},transition:{delay:.46},children:b?e.jsx($,{className:"w-5 h-5"}):e.jsxs(e.Fragment,{children:[e.jsx(O,{size:18}),e.jsx("span",{children:"Kirish"})]})})]}),e.jsxs(l.p,{className:"tl-footer",initial:{opacity:0},animate:{opacity:1},transition:{delay:.55},children:["© ",new Date().getFullYear(),' "Intellectual Progress Star". Ustozlar platformasi']})]}),e.jsx("style",{children:`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .tl-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow: hidden;
          padding: 24px 16px;
          background: #f0f2ff;
        }

        /* blobs */
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
          z-index: 1;
          pointer-events: none;
        }
        .blob-tr { width: 280px; height: 280px; background: #c7d2fe; top: -70px; right: -50px; }
        .blob-bl { width: 240px; height: 240px; background: #ddd6fe; bottom: -60px; left: -40px; }

        /* card */
        .tl-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 430px;
          background: rgba(255,255,255,0.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border: 1px solid rgba(255,255,255,0.95);
          border-radius: 28px;
          padding: 32px 32px 26px;
          box-shadow: 0 8px 40px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06);
        }

        /* logo */
        .logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }
        .logo-img {
          height: 230px;
          width: auto;
          object-fit: contain;
          display: block;
          position: absolute;
          top: 12%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        /* badge */
        .badge-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 26px;
          margin-top: 60px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #6366f1;
          font-size: 15px;
          font-weight: 600;
        }

        /* form */
        .tl-form { display: flex; flex-direction: column; gap: 16px; }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .f-label { font-size: 13.5px; font-weight: 500; color: #374151; }

        /* input */
        .f-wrap {
          position: relative;
          display: flex;
          align-items: center;
          background: #eef0fb;
          border: 1.5px solid #e0e7ff;
          border-radius: 14px;
          transition: all 0.2s;
          overflow: hidden;
        }
        .f-wrap:hover { border-color: #a5b4fc; }
        .f-wrap.focused {
          border-color: #6366f1;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.13);
        }
        .f-icon {
          position: absolute;
          left: 14px;
          color: #a5b4fc;
          pointer-events: none;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .f-wrap.focused .f-icon { color: #6366f1; }
        .f-input {
          width: 100%;
          padding: 13px 14px 13px 40px;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          color: #111827;
          caret-color: #6366f1;
        }
        .f-input::placeholder { color: #c4caed; }

        /* autocomplete fix */
        .f-input:-webkit-autofill,
        .f-input:-webkit-autofill:hover,
        .f-input:-webkit-autofill:focus,
        .f-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 40px #eef0fb inset !important;
          -webkit-text-fill-color: #111827 !important;
          caret-color: #6366f1;
          transition: background-color 9999s ease-in-out 0s;
        }
        .f-wrap.focused .f-input:-webkit-autofill,
        .f-wrap.focused .f-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 40px #ffffff inset !important;
        }

        .pw-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #a5b4fc;
          display: flex;
          align-items: center;
          padding: 5px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .pw-toggle:hover { color: #6366f1; background: rgba(99,102,241,0.07); }

        /* button */
        .tl-btn {
          margin-top: 4px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 15px 20px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(130deg, #6366f1 0%, #8b5cf6 55%, #a855f7 100%);
          box-shadow: 0 4px 22px rgba(99,102,241,0.38);
          transition: box-shadow 0.25s;
          position: relative;
          overflow: hidden;
        }
        .tl-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.13) 0%, transparent 55%);
          pointer-events: none;
        }
        .tl-btn:hover:not(:disabled) { box-shadow: 0 6px 30px rgba(99,102,241,0.48); }
        .tl-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* footer */
        .tl-footer {
          text-align: center;
          font-size: 11.5px;
          color: #9ca3af;
          margin-top: 20px;
        }

        /* success */
        .success-overlay {
          position: fixed; inset: 0; z-index: 100;
          display: flex; align-items: center; justify-content: center;
          background: rgba(240,242,255,0.82);
          backdrop-filter: blur(8px);
        }
        .success-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .s-check { width: 80px; height: 80px; }
        .s-circle {
          stroke: #22c55e; stroke-width: 2;
          stroke-dasharray: 166; stroke-dashoffset: 166;
          animation: sdash 0.4s ease forwards;
        }
        .s-path {
          stroke: #22c55e; stroke-width: 3;
          stroke-linecap: round; stroke-linejoin: round;
          stroke-dasharray: 48; stroke-dashoffset: 48;
          animation: sdash 0.35s 0.35s ease forwards;
        }
        .s-title { color: #1e1b4b; font-weight: 700; font-size: 20px; }
        .s-sub   { color: #818cf8; font-size: 13px; }
        @keyframes sdash { to { stroke-dashoffset: 0; } }
      `})]})}export{V as default};
