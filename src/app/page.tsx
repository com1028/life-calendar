"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const THEMES = [
  { name: "スカイ",       primary: "#3B82F6", light: "#EFF6FF", dark: "#1D4ED8" },
  { name: "ローズ",       primary: "#F43F5E", light: "#FFF1F2", dark: "#BE123C" },
  { name: "エメラルド",   primary: "#10B981", light: "#ECFDF5", dark: "#047857" },
  { name: "バイオレット", primary: "#8B5CF6", light: "#F5F3FF", dark: "#6D28D9" },
  { name: "アンバー",     primary: "#F59E0B", light: "#FFFBEB", dark: "#B45309" },
];
const EV_COLORS = ["#3B82F6","#F43F5E","#10B981","#8B5CF6","#F59E0B","#06B6D4","#EC4899","#84CC16"];
const MOODS     = [{v:"great",e:"😄",l:"最高"},{v:"good",e:"😊",l:"良い"},{v:"neutral",e:"😐",l:"普通"},{v:"bad",e:"😔",l:"イマイチ"},{v:"tired",e:"😴",l:"疲れた"}];
const STAMPS    = ["🌸","⭐","🎯","💪","🎉","❤️","☕","🌙","✈️","🏃","🍀","🔥"];
const DAYS      = ["日","月","火","水","木","金","土"];
const MONTHS    = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];
const REC_OPTS  = [{v:"none",l:"繰り返しなし"},{v:"daily",l:"毎日"},{v:"weekly",l:"毎週"},{v:"monthly",l:"毎月"},{v:"yearly",l:"毎年"}];
const CATS      = ["仕事","プライベート","自己成長","その他"];
const LC: Record<string,string> = {"仕事":"#3B82F6","プライベート":"#10B981","自己成長":"#8B5CF6"};
const REM_OPTS  = [{v:5,l:"5分前"},{v:10,l:"10分前"},{v:30,l:"30分前"},{v:60,l:"1時間前"},{v:1440,l:"1日前"}];
const RL: Record<string,string> = {daily:"毎日",weekly:"毎週",monthly:"毎月",yearly:"毎年"};
const HH = 54, HS = 6, HE = 23;

// ═══════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════
const gid    = () => `${Date.now()}-${Math.random().toString(36).slice(2,5)}`;
const fk     = (y: number, m: number, d: number) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const getDays  = (y: number, m: number) => new Date(y, m+1, 0).getDate();
const getFirst = (y: number, m: number) => new Date(y, m, 1).getDay();
const nowKey   = () => { const n = new Date(); return fk(n.getFullYear(), n.getMonth(), n.getDate()); };
const t2y      = (t: string) => { const [h,m] = t.split(":").map(Number); return ((h-HS)+m/60)*HH; };

// ─── SEED ────────────────────────────────────────────────
const TODAY = nowKey();
const [TY,TM,TD] = TODAY.split("-").map(Number);
const mdate = (n: number) => { const d = new Date(TY, TM-1, TD+n); return fk(d.getFullYear(), d.getMonth(), d.getDate()); };

const SEED_EVENTS = [
  {id:"e1",title:"チームMTG",         date:mdate(0), isAllDay:false,startTime:"10:00",endTime:"11:00",color:"#3B82F6",category:"仕事",        recurrence:"weekly", reminderMin:10,  note:"週次定例"},
  {id:"e2",title:"歯医者",            date:mdate(1), isAllDay:false,startTime:"14:00",endTime:"15:00",color:"#F43F5E",category:"プライベート",recurrence:"none",   reminderMin:60,  note:""},
  {id:"e3",title:"プロジェクト締切",  date:mdate(2), isAllDay:true,                                   color:"#F59E0B",category:"仕事",        recurrence:"none",   reminderMin:null,note:"Q2レポート"},
  {id:"e4",title:"英会話",            date:mdate(0), isAllDay:false,startTime:"19:00",endTime:"20:00",color:"#8B5CF6",category:"自己成長",    recurrence:"weekly", reminderMin:null,note:""},
  {id:"e5",title:"ランチ 田中さん",   date:mdate(3), isAllDay:false,startTime:"12:00",endTime:"13:00",color:"#10B981",category:"仕事",        recurrence:"none",   reminderMin:null,note:"赤坂イタリアン"},
  {id:"e6",title:"誕生日パーティー",  date:mdate(5), isAllDay:true,                                   color:"#F43F5E",category:"プライベート",recurrence:"none",   reminderMin:null,note:""},
];
const SEED_TODOS = [
  {id:"t1",text:"企画書を送る",    done:true, list:"仕事",        priority:"high",dueDate:TODAY},
  {id:"t2",text:"スーパーへ行く",  done:false,list:"プライベート",priority:"none",dueDate:""},
  {id:"t3",text:"請求書を確認",    done:false,list:"仕事",        priority:"high",dueDate:mdate(1)},
  {id:"t4",text:"ジムの予約",      done:false,list:"プライベート",priority:"none",dueDate:mdate(2)},
  {id:"t5",text:"読書：1章",       done:false,list:"自己成長",    priority:"none",dueDate:""},
];
const SEED_DIARY = [
  {date:mdate(-2), mood:"good",  body:"チームランチ会。新メンバーとも打ち解けた。"},
  {date:mdate(-4), mood:"great", body:"発表が成功！みんな喜んでくれた。"},
];

// ─── TYPES ───────────────────────────────────────────────
type Theme    = typeof THEMES[number];
type Event    = {id:string;title:string;date:string;isAllDay:boolean;startTime?:string;endTime?:string;color:string;category:string;recurrence:string;reminderMin:number|null;note:string};
type Todo     = {id:string;text:string;done:boolean;list:string;priority:string;dueDate:string};
type Diary    = {date:string;mood:string;body:string};
type User     = {name:string;email:string;avatar:string};
type Modal    = {type:"add";dk:string} | {type:"edit";ev:Event};

const IS: React.CSSProperties = {width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #e5e7eb",fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};

// ═══════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════
function useStore() {
  const [theme,  setTheme]  = useState<Theme>(THEMES[0]);
  const [events, setEvents] = useState<Event[]>(SEED_EVENTS as Event[]);
  const [todos,  setTodos]  = useState<Todo[]>(SEED_TODOS);
  const [diary,  setDiary]  = useState<Diary[]>(SEED_DIARY as Diary[]);
  const [stamps, setStamps] = useState<Record<string,string>>({});
  const [sel,    setSel]    = useState(TODAY);
  const [yr,     setYr]     = useState(TY);
  const [mo,     setMo]     = useState(TM-1);
  const [user,   setUser]   = useState<User|null>(null);

  const pick = (d: string) => { const [y,m] = d.split("-").map(Number); setSel(d); setYr(y); setMo(m-1); };
  const prev = () => { if(mo===0){setYr(y=>y-1);setMo(11);}else setMo(m=>m-1); };
  const next = () => { if(mo===11){setYr(y=>y+1);setMo(0);}else setMo(m=>m+1); };

  const addEv  = (ev: Event)              => setEvents(es => [...es, ev]);
  const updEv  = (id: string, p: Partial<Event>) => setEvents(es => es.map(e => e.id===id ? {...e,...p} : e));
  const delEv  = (id: string)             => setEvents(es => es.filter(e => e.id!==id));
  const addTd  = (t: Todo)               => setTodos(ts => [...ts, t]);
  const togTd  = (id: string)            => setTodos(ts => ts.map(t => t.id===id ? {...t,done:!t.done} : t));
  const togPr  = (id: string)            => setTodos(ts => ts.map(t => t.id===id ? {...t,priority:t.priority==="high"?"none":"high"} : t));
  const delTd  = (id: string)            => setTodos(ts => ts.filter(t => t.id!==id));
  const saveD  = (e: Diary)              => setDiary(ds => [...ds.filter(d => d.date!==e.date), e]);
  const stamp  = (k: string, s: string)  => setStamps(ss => ({...ss,[k]:s}));

  return { theme,setTheme, events,addEv,updEv,delEv, todos,addTd,togTd,togPr,delTd, diary,saveD, stamps,stamp, sel,pick, yr,mo,prev,next, user,setUser };
}

// ═══════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════
function B({ children, onClick, style, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & {style?: React.CSSProperties}) {
  return <button onClick={onClick} style={{border:"none",cursor:"pointer",fontFamily:"inherit",background:"none",...style}} {...p}>{children}</button>;
}
function Tog({ on, onToggle, color }: {on:boolean;onToggle:()=>void;color:string}) {
  return (
    <div onClick={onToggle} style={{width:44,height:26,borderRadius:13,background:on?color:"#e5e7eb",cursor:"pointer",position:"relative",transition:"background .2s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:on?21:3,width:20,height:20,borderRadius:"50%",background:"white",boxShadow:"0 1px 3px #0002",transition:"left .2s cubic-bezier(.22,1,.36,1)"}}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// LOGIN — メールのみ
// ═══════════════════════════════════════════════════════════
function Login({ theme, onLogin, onGuest }: {theme:Theme;onLogin:(u:User)=>void;onGuest:()=>void}) {
  const [step,  setStep]  = useState<"idle"|"loading"|"done">("idle");
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [mode,  setMode]  = useState<"login"|"signup">("login");
  const [name,  setName]  = useState("");
  const [err,   setErr]   = useState("");

  const validate = () => {
    if(!email.trim()) return "メールアドレスを入力してください";
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "正しいメールアドレスを入力してください";
    if(!pw.trim()) return "パスワードを入力してください";
    if(pw.length < 6) return "パスワードは6文字以上にしてください";
    if(mode==="signup" && !name.trim()) return "お名前を入力してください";
    return "";
  };

  const submit = () => {
    const e = validate();
    if(e) { setErr(e); return; }
    setErr("");
    setStep("loading");
    setTimeout(() => {
      setStep("done");
      setTimeout(() => onLogin({
        name:   mode==="signup" ? name.trim() : email.split("@")[0],
        email,
        avatar: (mode==="signup" ? name.trim() : email.split("@")[0])[0].toUpperCase(),
      }), 600);
    }, 1000);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20,fontFamily:"'Hiragino Sans','Yu Gothic UI',Meiryo,sans-serif",background:"#f8fafc"}}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes chk{from{stroke-dashoffset:30}to{stroke-dashoffset:0}}
        .lcard{animation:fadeUp .4s cubic-bezier(.22,1,.36,1)}
        .inp:focus{border-color:${theme.primary}!important;box-shadow:0 0 0 3px ${theme.light}!important}
      `}</style>

      <div className="lcard" style={{background:"white",borderRadius:24,padding:"36px 32px",width:"100%",maxWidth:380,boxShadow:"0 4px 32px #0001,0 0 0 1px #f1f5f9"}}>

        {/* ロゴ */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:48,marginBottom:8,lineHeight:1}}>📅</div>
          <h1 style={{margin:"0 0 4px",fontSize:24,fontWeight:800,letterSpacing:-1,color:"#0f172a"}}>Life Calendar</h1>
          <p style={{margin:0,fontSize:13,color:"#94a3b8"}}>カレンダー・ToDo・日記をひとつに</p>
        </div>

        {/* ローディング */}
        {step==="loading" && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"20px 0"}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{animation:"spin .7s linear infinite"}}>
              <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke={theme.primary} strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <span style={{fontSize:13,color:"#64748b"}}>{mode==="signup"?"アカウントを作成中...":"ログイン中..."}</span>
          </div>
        )}

        {/* 完了 */}
        {step==="done" && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"20px 0"}}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" fill="#10B981"/>
              <polyline points="11,20 18,27 29,13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset="30" style={{animation:"chk .3s ease forwards"}}/>
            </svg>
            <span style={{fontSize:14,color:"#10B981",fontWeight:700}}>{mode==="signup"?"登録完了！":"ログイン完了！"}</span>
          </div>
        )}

        {step==="idle" && <>
          {/* モード切替タブ */}
          <div style={{display:"flex",background:"#f8fafc",borderRadius:12,padding:4,marginBottom:24,gap:4}}>
            {(["login","signup"] as const).map(m => (
              <button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"8px 0",borderRadius:9,border:"none",fontSize:13,fontWeight:700,cursor:"pointer",transition:"all .18s",background:mode===m?"white":  "transparent",color:mode===m?theme.primary:"#94a3b8",boxShadow:mode===m?"0 1px 4px #0001":"none",fontFamily:"inherit"}}>
                {m==="login"?"ログイン":"新規登録"}
              </button>
            ))}
          </div>

          {/* フォーム */}
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {mode==="signup" && (
              <div>
                <label style={{fontSize:12,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>お名前</label>
                <input className="inp" value={name} onChange={e=>setName(e.target.value)} placeholder="山田 太郎" style={{...IS,transition:"border-color .2s,box-shadow .2s"}}/>
              </div>
            )}
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>メールアドレス</label>
              <input className="inp" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="example@email.com" type="email" autoComplete="email" style={{...IS,transition:"border-color .2s,box-shadow .2s"}}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:"#64748b",display:"block",marginBottom:5}}>パスワード{mode==="signup"&&<span style={{color:"#94a3b8",fontWeight:400}}> （6文字以上）</span>}</label>
              <input className="inp" value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder={mode==="signup"?"6文字以上で入力":"パスワード"} type="password" autoComplete={mode==="signup"?"new-password":"current-password"} onKeyDown={e=>e.key==="Enter"&&submit()} style={{...IS,transition:"border-color .2s,box-shadow .2s"}}/>
            </div>

            {/* エラー */}
            {err && (
              <div style={{background:"#fff5f5",border:"1px solid #fecdd3",borderRadius:10,padding:"9px 12px",fontSize:13,color:"#e11d48",display:"flex",alignItems:"center",gap:8}}>
                <span>⚠️</span>{err}
              </div>
            )}

            <B onClick={submit} style={{padding:"13px",borderRadius:12,background:theme.primary,color:"white",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4,transition:"opacity .2s"}}
              onMouseEnter={e=>(e.currentTarget.style.opacity="0.9")} onMouseLeave={e=>(e.currentTarget.style.opacity="1")}>
              {mode==="login"?"ログイン":"アカウントを作成"}
            </B>

            {mode==="login" && (
              <B style={{fontSize:12,color:"#94a3b8",padding:"2px 0",cursor:"pointer",textAlign:"center"}}>
                パスワードを忘れた方はこちら
              </B>
            )}
          </div>

          {/* 区切り */}
          <div style={{display:"flex",alignItems:"center",gap:12,margin:"20px 0"}}>
            <div style={{flex:1,height:1,background:"#f1f5f9"}}/><span style={{fontSize:11,color:"#cbd5e1"}}>または</span><div style={{flex:1,height:1,background:"#f1f5f9"}}/>
          </div>

          <B onClick={onGuest} style={{width:"100%",padding:"11px",borderRadius:12,background:"#f8fafc",border:"1.5px solid #e5e7eb",fontSize:13,fontWeight:600,color:"#64748b",cursor:"pointer"}}>
            ゲストとして使う（データは保存されません）
          </B>
        </>}

        <p style={{textAlign:"center",fontSize:11,color:"#e2e8f0",marginTop:20,marginBottom:0}}>
          ログインすることで<a href="#" style={{color:"#94a3b8"}}>利用規約</a>と<a href="#" style={{color:"#94a3b8"}}>プライバシーポリシー</a>に同意したことになります
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// EVENT MODAL
// ═══════════════════════════════════════════════════════════
function EvModal({ theme, dateKey, edit, onClose, onSave, onDel }: {theme:Theme;dateKey:string;edit?:Event;onClose:()=>void;onSave:(ev:Event)=>void;onDel:(id:string)=>void}) {
  const isEd = !!edit;
  const [title,  setTitle]  = useState(edit?.title ?? "");
  const [allDay, setAllDay] = useState(edit?.isAllDay ?? false);
  const [st,     setSt]     = useState(edit?.startTime ?? "09:00");
  const [et,     setEt]     = useState(edit?.endTime ?? "10:00");
  const [color,  setColor]  = useState(edit?.color ?? EV_COLORS[0]);
  const [cat,    setCat]    = useState(edit?.category ?? "仕事");
  const [rec,    setRec]    = useState(edit?.recurrence ?? "none");
  const [rem,    setRem]    = useState<number|null>(edit?.reminderMin ?? null);
  const [note,   setNote]   = useState(edit?.note ?? "");

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const submit = () => {
    if(!title.trim()) return;
    const ev: Event = {id:edit?.id??gid(), title:title.trim(), date:dateKey, isAllDay:allDay, color, category:cat, recurrence:rec, reminderMin:rem, note:note.trim()};
    if(!allDay) { ev.startTime = st; ev.endTime = et; }
    onSave(ev); onClose();
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <style>{`@keyframes su{from{transform:translateY(40px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
      <div onClick={e=>e.stopPropagation()} style={{background:"white",borderRadius:"22px 22px 0 0",width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",animation:"su .26s cubic-bezier(.22,1,.36,1)"}}>
        <div style={{display:"flex",justifyContent:"center",padding:"10px 0 4px"}}><div style={{width:36,height:4,borderRadius:2,background:"#e5e7eb"}}/></div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 20px 12px",borderBottom:"1px solid #f8fafc"}}>
          <B onClick={onClose} style={{color:"#94a3b8",fontSize:14,padding:0}}>キャンセル</B>
          <span style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>{isEd?"編集":"予定を追加"}</span>
          <B onClick={submit} style={{background:title.trim()?theme.primary:"#e5e7eb",borderRadius:10,padding:"6px 18px",fontSize:14,fontWeight:700,color:"white",transition:"background .2s"}}>{isEd?"保存":"追加"}</B>
        </div>
        <div style={{padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:11,color:"#94a3b8",fontWeight:700}}>📅 {dateKey}</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="タイトル" autoFocus
            style={{...IS,fontSize:16,fontWeight:500}} onFocus={e=>(e.target.style.borderColor=theme.primary)} onBlur={e=>(e.target.style.borderColor="#e5e7eb")}/>

          {/* 終日トグル */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f8fafc",borderRadius:12,padding:"12px 16px"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:"#0f172a"}}>終日</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:1}}>{allDay?"時刻なし・終日登録":"時刻を指定して登録"}</div>
            </div>
            <Tog on={allDay} onToggle={()=>setAllDay(v=>!v)} color={theme.primary}/>
          </div>

          {/* 時刻 */}
          {!allDay && (
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#94a3b8",display:"block",marginBottom:5}}>開始</label>
                <input type="time" value={st} onChange={e=>setSt(e.target.value)} style={IS} onFocus={e=>(e.target.style.borderColor=theme.primary)} onBlur={e=>(e.target.style.borderColor="#e5e7eb")}/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#94a3b8",display:"block",marginBottom:5}}>終了</label>
                <input type="time" value={et} onChange={e=>setEt(e.target.value)} style={IS} onFocus={e=>(e.target.style.borderColor=theme.primary)} onBlur={e=>(e.target.style.borderColor="#e5e7eb")}/></div>
            </div>
          )}

          {/* カラー */}
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",display:"block",marginBottom:8}}>カラー</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {EV_COLORS.map(c => <div key={c} onClick={()=>setColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",outline:color===c?`3px solid ${c}`:"none",outlineOffset:2,transform:color===c?"scale(1.15)":"scale(1)",transition:"transform .15s"}}/>)}
            </div>
          </div>

          {/* カテゴリ */}
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",display:"block",marginBottom:8}}>カテゴリ</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {CATS.map(c => <B key={c} onClick={()=>setCat(c)} style={{padding:"5px 13px",borderRadius:20,border:`1.5px solid ${cat===c?theme.primary:"#e5e7eb"}`,background:cat===c?theme.light:"transparent",color:cat===c?theme.primary:"#6b7280",fontSize:13,fontWeight:600,transition:"all .15s"}}>{c}</B>)}
            </div>
          </div>

          {/* 繰り返し */}
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",display:"block",marginBottom:6}}>繰り返し</label>
            <select value={rec} onChange={e=>setRec(e.target.value)} style={{...IS,background:"white",color:"#374151",cursor:"pointer"}}>
              {REC_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>

          {/* リマインダー */}
          {!allDay && (
            <div>
              <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",display:"block",marginBottom:8}}>🔔 リマインダー</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <B onClick={()=>setRem(null)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${rem===null?theme.primary:"#e5e7eb"}`,background:rem===null?theme.light:"transparent",color:rem===null?theme.primary:"#6b7280",fontSize:12,fontWeight:600}}>なし</B>
                {REM_OPTS.map(o => <B key={o.v} onClick={()=>setRem(o.v)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${rem===o.v?theme.primary:"#e5e7eb"}`,background:rem===o.v?theme.light:"transparent",color:rem===o.v?theme.primary:"#6b7280",fontSize:12,fontWeight:600}}>{o.l}</B>)}
              </div>
              {rem && <p style={{fontSize:11,color:"#94a3b8",margin:"6px 0 0"}}>✉️ 設定した時刻にメール通知します</p>}
            </div>
          )}

          {/* メモ */}
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#94a3b8",display:"block",marginBottom:6}}>メモ</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="場所・備考など" rows={3}
              style={{...IS,resize:"none",lineHeight:1.6}} onFocus={e=>(e.target.style.borderColor=theme.primary)} onBlur={e=>(e.target.style.borderColor="#e5e7eb")}/>
          </div>

          {isEd && <B onClick={()=>{onDel(edit!.id);onClose();}} style={{padding:12,borderRadius:12,border:"1.5px solid #fecdd3",color:"#f43f5e",fontSize:14,fontWeight:600}}>この予定を削除</B>}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MONTH CAL
// ═══════════════════════════════════════════════════════════
function MonthCal({ theme, yr, mo, sel, pick, events, stamps }: {theme:Theme;yr:number;mo:number;sel:string;pick:(d:string)=>void;events:Event[];stamps:Record<string,string>}) {
  const num = getDays(yr, mo), first = getFirst(yr, mo), today = nowKey();
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"2px 8px"}}>
        {DAYS.map((d,i) => <div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,padding:"4px 0",color:i===0?"#F43F5E":i===6?theme.primary:"#cbd5e1"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 8px 8px",gap:2}}>
        {Array.from({length:first}).map((_,i) => <div key={`e${i}`}/>)}
        {Array.from({length:num}, (_,i) => {
          const day = i+1, key = fk(yr,mo,day);
          const evs = events.filter(e => e.date===key);
          const stmp = stamps[key];
          const isSel = key===sel, isT = key===today;
          const col = (first+i) % 7;
          return (
            <B key={day} onClick={()=>pick(key)} style={{background:isSel?theme.primary:"transparent",borderRadius:10,padding:"5px 2px",minHeight:46,display:"flex",flexDirection:"column",alignItems:"center",transition:"all .15s"}}>
              <span style={{fontSize:13,fontWeight:isSel?800:isT?700:400,color:isSel?"white":isT?theme.primary:col===0?"#F43F5E":col===6?theme.primary:"#374151"}}>{day}</span>
              {stmp ? <span style={{fontSize:10,lineHeight:1}}>{stmp}</span> :
               evs.length > 0 && <div style={{display:"flex",justifyContent:"center",gap:2,marginTop:2}}>
                {evs.slice(0,2).map((e,ei) => <div key={ei} style={{width:5,height:e.isAllDay?3:5,borderRadius:e.isAllDay?1:"50%",background:isSel?"rgba(255,255,255,.75)":e.color}}/>)}
              </div>}
            </B>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WEEK VIEW
// ═══════════════════════════════════════════════════════════
function WeekView({ theme, sel, pick, events, onEvClick }: {theme:Theme;sel:string;pick:(d:string)=>void;events:Event[];onEvClick:(ev:Event)=>void}) {
  const ref = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  const today = nowKey();
  const [sy,sm,sd] = sel.split("-").map(Number);
  const base = new Date(sy, sm-1, sd);
  const wd = Array.from({length:7}, (_,i) => { const d = new Date(sy,sm-1,sd-base.getDay()+i); return fk(d.getFullYear(),d.getMonth(),d.getDate()); });
  const nowY = useMemo(() => { const h=now.getHours(),m=now.getMinutes(); if(h<HS||h>=HE) return null; return ((h-HS)+m/60)*HH; }, [now]);
  useEffect(() => { if(ref.current && nowY!==null) ref.current.scrollTop = Math.max(0, nowY-80); }, [nowY]);
  const hrs = Array.from({length:HE-HS}, (_,i) => HS+i);

  const layout = (dk: string) => {
    const evs = events.filter(e=>e.date===dk&&!e.isAllDay&&e.startTime).sort((a,b)=>(a.startTime??"").localeCompare(b.startTime??""));
    const res: (Event&{col:number;cols:number})[] = [], groups: Event[][] = [];
    for(const ev of evs) {
      const sy2=t2y(ev.startTime??"00:00"), ey=t2y(ev.endTime??ev.startTime??"01:00")||sy2+HH;
      let placed=false;
      for(const g of groups) { const last=g[g.length-1]; const le=t2y(last.endTime??last.startTime??"01:00")||t2y(last.startTime??"00:00")+HH; if(sy2<le){g.push(ev);placed=true;break;} }
      if(!placed) groups.push([ev]);
    }
    for(const g of groups) g.forEach((ev,col) => res.push({...ev,col,cols:g.length}));
    return res;
  };

  return (
    <div style={{display:"flex",flexDirection:"column",height:480}}>
      <div style={{display:"flex",padding:"8px 0 5px",flexShrink:0}}>
        <div style={{width:40,flexShrink:0}}/>
        {wd.map((dk,i) => { const d=dk.split("-")[2], isSel=dk===sel, isT=dk===today; return (
          <B key={dk} onClick={()=>pick(dk)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,padding:"4px 0",borderRadius:8}}>
            <span style={{fontSize:10,fontWeight:700,color:i===0?"#F43F5E":i===6?theme.primary:"#94a3b8"}}>{DAYS[i]}</span>
            <span style={{fontSize:13,fontWeight:800,width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:isSel?theme.primary:isT?theme.light:"transparent",color:isSel?"white":isT?theme.primary:i===0?"#F43F5E":"#374151"}}>{Number(d)}</span>
          </B>
        );})}
      </div>
      {wd.some(dk=>events.some(e=>e.date===dk&&e.isAllDay)) && (
        <div style={{display:"flex",borderTop:"1px solid #f1f5f9",borderBottom:"1px solid #f1f5f9",padding:"3px 0",flexShrink:0}}>
          <div style={{width:40}}/>
          {wd.map(dk => { const al=events.filter(e=>e.date===dk&&e.isAllDay); return (
            <div key={dk} style={{flex:1,padding:"0 1px"}}>
              {al.map(ev => <div key={ev.id} onClick={()=>onEvClick(ev)} style={{background:ev.color,borderRadius:3,fontSize:9,fontWeight:700,color:"white",padding:"2px 4px",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",cursor:"pointer",marginBottom:1}}>{ev.title}</div>)}
            </div>
          );})}
        </div>
      )}
      <div ref={ref} style={{flex:1,overflowY:"auto",position:"relative"}}>
        <div style={{display:"flex",minHeight:HH*(HE-HS)}}>
          <div style={{width:40,flexShrink:0,position:"sticky",left:0,background:"white",zIndex:3}}>
            {hrs.map(h => <div key={h} style={{height:HH,display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingRight:6,paddingTop:2,borderBottom:"1px solid #f8fafc"}}>
              <span style={{fontSize:10,color:"#d1d5db",fontWeight:600}}>{String(h).padStart(2,"0")}</span>
            </div>)}
          </div>
          {wd.map(dk => { const laid=layout(dk), isT=dk===today; return (
            <div key={dk} onClick={()=>pick(dk)} style={{flex:1,position:"relative",borderLeft:"1px solid #f8fafc",background:dk===sel?`${theme.primary}06`:"transparent",cursor:"pointer"}}>
              {hrs.map(h => <div key={h} style={{position:"absolute",left:0,right:0,top:(h-HS)*HH,height:HH,borderBottom:"1px solid #f8fafc"}}><div style={{position:"absolute",left:0,right:0,top:HH/2,borderBottom:"1px dashed #fafafa"}}/></div>)}
              {isT && nowY!==null && <div style={{position:"absolute",left:0,right:0,top:nowY,height:2,background:theme.primary,zIndex:2}}><div style={{position:"absolute",left:-4,top:-4,width:10,height:10,borderRadius:"50%",background:theme.primary}}/></div>}
              {laid.map(ev => { const top=Math.max(0,t2y(ev.startTime??"00:00")); const bot=Math.min(HH*(HE-HS),t2y(ev.endTime??ev.startTime??"01:00")||top+HH); const h2=Math.max(bot-top,18),cw=100/ev.cols; return (
                <div key={ev.id} onClick={e=>{e.stopPropagation();onEvClick(ev);}} style={{position:"absolute",top:top+1,height:h2-2,left:`${cw*ev.col+0.5}%`,width:`${cw-1}%`,background:`${ev.color}E0`,borderLeft:`3px solid ${ev.color}`,borderRadius:5,padding:"2px 4px",overflow:"hidden",cursor:"pointer",zIndex:1,boxSizing:"border-box"}}>
                  <div style={{fontSize:9,fontWeight:800,color:"white",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{ev.title}</div>
                  {h2>28 && <div style={{fontSize:8,color:"rgba(255,255,255,.8)"}}>{ev.startTime}–{ev.endTime}</div>}
                </div>
              );})}
            </div>
          );})}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DAY PANEL
// ═══════════════════════════════════════════════════════════
function DayPanel({ theme, sel, events, stamps, stamp, todos, togTd, onAdd, onEd }: {theme:Theme;sel:string;events:Event[];stamps:Record<string,string>;stamp:(k:string,s:string)=>void;todos:Todo[];togTd:(id:string)=>void;onAdd:()=>void;onEd:(ev:Event)=>void}) {
  const [showStamp, setShowStamp] = useState(false);
  const all = events.filter(e=>e.date===sel&&e.isAllDay);
  const timed = events.filter(e=>e.date===sel&&!e.isAllDay).sort((a,b)=>(a.startTime??"").localeCompare(b.startTime??""));
  const st = stamps[sel];
  const pending = todos.filter(t=>!t.done).slice(0,3);
  return (
    <div style={{borderTop:"1px solid #f1f5f9",padding:"12px 14px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{sel.slice(5).replace("-","/")}</span>
          {st && <span style={{fontSize:16}}>{st}</span>}
        </div>
        <div style={{display:"flex",gap:6}}>
          <B onClick={()=>setShowStamp(v=>!v)} style={{background:"#f8fafc",borderRadius:8,padding:"5px 11px",fontSize:12,color:"#64748b"}}>スタンプ</B>
          <B onClick={onAdd} style={{background:theme.primary,borderRadius:8,padding:"5px 13px",fontSize:12,color:"white",fontWeight:700}}>+ 追加</B>
        </div>
      </div>
      {showStamp && (
        <div style={{display:"flex",gap:8,flexWrap:"wrap",padding:"6px 0 10px",borderBottom:"1px solid #f8fafc",marginBottom:8}}>
          {STAMPS.map(s => <B key={s} onClick={()=>{stamp(sel,s);setShowStamp(false);}} style={{fontSize:20,padding:2,transition:"transform .12s"}} onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.3)")} onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>{s}</B>)}
        </div>
      )}
      {all.length>0 && <div style={{marginBottom:6}}>
        <div style={{fontSize:10,fontWeight:700,color:"#d1d5db",marginBottom:4}}>終日</div>
        {all.map(ev => (
          <B key={ev.id} onClick={()=>onEd(ev)} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"8px 12px",background:`${ev.color}10`,borderRadius:10,borderLeft:`3px solid ${ev.color}`,marginBottom:5,textAlign:"left"}}>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{ev.title}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>終日·{ev.category}{ev.recurrence!=="none"?` 🔁 ${RL[ev.recurrence]}`:""}</div></div>
            <span style={{fontSize:10,color:"#d1d5db"}}>›</span>
          </B>
        ))}
      </div>}
      {timed.map(ev => (
        <B key={ev.id} onClick={()=>onEd(ev)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"8px 12px",background:`${ev.color}10`,borderRadius:10,borderLeft:`3px solid ${ev.color}`,marginBottom:5,textAlign:"left"}}>
          <div style={{minWidth:42,textAlign:"right"}}><div style={{fontSize:12,fontWeight:700,color:ev.color}}>{ev.startTime}</div>{ev.endTime&&<div style={{fontSize:10,color:"#d1d5db"}}>{ev.endTime}</div>}</div>
          <div style={{width:1,alignSelf:"stretch",background:`${ev.color}30`}}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{ev.title}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{ev.category}{ev.recurrence!=="none"?` 🔁 ${RL[ev.recurrence]}`:""}{ev.reminderMin?` 🔔 ${REM_OPTS.find(o=>o.v===ev.reminderMin)?.l||""}`:""}</div></div>
          <span style={{fontSize:10,color:"#d1d5db"}}>›</span>
        </B>
      ))}
      {all.length===0 && timed.length===0 && <div style={{textAlign:"center",padding:"14px 0",color:"#e2e8f0",fontSize:13}}>予定なし</div>}
      {pending.length>0 && (
        <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #f8fafc"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#d1d5db",marginBottom:5}}>今日のToDo</div>
          {pending.map(t => (
            <div key={t.id} onClick={()=>togTd(t.id)} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 2px",cursor:"pointer"}}>
              <div style={{width:15,height:15,borderRadius:4,border:`2px solid ${LC[t.list]??theme.primary}`,flexShrink:0}}/>
              {t.priority==="high"&&<span style={{color:"#F59E0B",fontSize:10}}>★</span>}
              <span style={{fontSize:12,color:"#475569"}}>{t.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TODO PANEL
// ═══════════════════════════════════════════════════════════
function TodoPanel({ theme, todos, addTd, togTd, togPr, delTd }: {theme:Theme;todos:Todo[];addTd:(t:Todo)=>void;togTd:(id:string)=>void;togPr:(id:string)=>void;delTd:(id:string)=>void}) {
  const [text, setText] = useState("");
  const [list, setList] = useState("すべて");
  const ref = useRef<HTMLInputElement>(null);
  const add = () => { if(!text.trim()) return; addTd({id:gid(),text:text.trim(),done:false,priority:"none",list:list==="すべて"?"仕事":list,dueDate:""}); setText(""); ref.current?.focus(); };
  const filt = list==="すべて" ? todos : todos.filter(t=>t.list===list);
  const pen = filt.filter(t=>!t.done).sort((a,b)=>a.priority==="high"?-1:1);
  const done = filt.filter(t=>t.done);

  const Row = ({ t }: {t:Todo}) => {
    const lc = LC[t.list] ?? theme.primary;
    return (
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 8px",borderRadius:12,marginBottom:4,transition:"background .15s"}} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
        <B onClick={()=>togTd(t.id)} style={{width:20,height:20,borderRadius:6,background:t.done?lc:"transparent",outline:t.done?"none":`2px solid ${lc}`,outlineOffset:-1,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s",padding:0}}>
          {t.done&&<span style={{color:"white",fontSize:12,fontWeight:800}}>✓</span>}
        </B>
        <div style={{flex:1,minWidth:0,cursor:"pointer"}} onClick={()=>togTd(t.id)}>
          <div style={{fontSize:13,color:t.done?"#cbd5e1":"#374151",textDecoration:t.done?"line-through":"none",fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.text}</div>
          <div style={{display:"flex",gap:6,marginTop:2}}>
            <span style={{fontSize:10,padding:"1px 7px",borderRadius:10,fontWeight:700,background:`${lc}18`,color:lc}}>{t.list}</span>
            {t.dueDate&&<span style={{fontSize:10,color:"#d1d5db"}}>📅 {t.dueDate.slice(5)}</span>}
          </div>
        </div>
        <B onClick={()=>togPr(t.id)} style={{fontSize:16,color:t.priority==="high"?"#F59E0B":"#e2e8f0",transition:"color .15s",padding:"0 2px"}}>★</B>
        <B onClick={()=>delTd(t.id)} style={{fontSize:14,color:"#e2e8f0",padding:"0 2px",transition:"color .15s"}} onMouseEnter={e=>(e.currentTarget.style.color="#F43F5E")} onMouseLeave={e=>(e.currentTarget.style.color="#e2e8f0")}>✕</B>
      </div>
    );
  };

  return (
    <div style={{padding:"10px 0"}}>
      <div style={{display:"flex",gap:6,padding:"0 14px 10px",overflowX:"auto"}}>
        {["すべて","仕事","プライベート","自己成長"].map(l => { const c=LC[l]??theme.primary; return (
          <B key={l} onClick={()=>setList(l)} style={{padding:"5px 14px",borderRadius:20,background:list===l?c:"#f3f4f6",color:list===l?"white":"#6b7280",fontSize:12,fontWeight:700,whiteSpace:"nowrap",transition:"all .18s"}}>{l}</B>
        );})}
      </div>
      <div style={{display:"flex",gap:8,padding:"0 14px 12px"}}>
        <input ref={ref} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="新しいタスクを追加..."
          style={{flex:1,padding:"10px 14px",borderRadius:12,border:"1.5px solid #e5e7eb",fontSize:13,outline:"none",fontFamily:"inherit"}} onFocus={e=>(e.target.style.borderColor=theme.primary)} onBlur={e=>(e.target.style.borderColor="#e5e7eb")}/>
        <B onClick={add} style={{background:theme.primary,color:"white",borderRadius:12,padding:"10px 18px",fontSize:16,fontWeight:700}}>+</B>
      </div>
      <div style={{padding:"0 14px 16px"}}>
        {pen.length>0 && <><div style={{fontSize:11,fontWeight:700,color:"#d1d5db",marginBottom:6}}>未完了 ({pen.length})</div>{pen.map(t=><Row key={t.id} t={t}/>)}</>}
        {done.length>0 && <><div style={{fontSize:11,fontWeight:700,color:"#d1d5db",margin:"12px 0 6px"}}>完了 ({done.length})</div>{done.map(t=><Row key={t.id} t={t}/>)}</>}
        {filt.length===0 && <div style={{textAlign:"center",padding:"24px 0",color:"#e2e8f0",fontSize:13}}>タスクなし</div>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DIARY PANEL
// ═══════════════════════════════════════════════════════════
function DiaryPanel({ theme, sel, diary, saveD }: {theme:Theme;sel:string;diary:Diary[];saveD:(e:Diary)=>void}) {
  const ex = diary.find(d=>d.date===sel);
  const [mood, setMood] = useState(ex?.mood ?? "");
  const [body, setBody] = useState(ex?.body ?? "");
  const [saved, setSaved] = useState(false);
  const [last, setLast] = useState(sel);
  if(sel!==last) { const e=diary.find(d=>d.date===sel); setMood(e?.mood??""); setBody(e?.body??""); setSaved(false); setLast(sel); }
  const save = () => { saveD({date:sel,mood,body}); setSaved(true); setTimeout(()=>setSaved(false),2200); };
  const recent = [...diary].filter(d=>d.date!==sel).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);
  return (
    <div style={{padding:"14px 16px 20px"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:2}}>{sel.slice(5).replace("-","/")} の日記</div>
      <div style={{fontSize:12,color:"#94a3b8",marginBottom:14}}>気分と出来事を記録しよう</div>
      <div style={{display:"flex",justifyContent:"space-around",background:"#f8fafc",borderRadius:14,padding:"10px 0",marginBottom:14}}>
        {MOODS.map(m => (
          <B key={m.v} onClick={()=>setMood(m.v)} title={m.l} style={{background:mood===m.v?theme.light:"transparent",borderRadius:10,padding:"6px 8px",display:"flex",flexDirection:"column",alignItems:"center",gap:3,transition:"all .15s"}}>
            <span style={{fontSize:22,filter:mood===m.v?"none":"grayscale(.6) opacity(.4)",transition:"filter .2s"}}>{m.e}</span>
            <span style={{fontSize:10,fontWeight:600,color:mood===m.v?theme.primary:"#94a3b8"}}>{m.l}</span>
          </B>
        ))}
      </div>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="今日の出来事、気持ち、メモなど..." rows={5}
        style={{...IS,resize:"none",lineHeight:1.7,marginBottom:10}} onFocus={e=>(e.target.style.borderColor=theme.primary)} onBlur={e=>(e.target.style.borderColor="#e5e7eb")}/>
      <B onClick={save} style={{width:"100%",padding:12,borderRadius:12,background:saved?"#10B981":theme.primary,color:"white",fontSize:14,fontWeight:700,transition:"background .3s"}}>
        {saved ? "✓ 保存しました" : "保存する"}
      </B>
      {recent.length>0 && (
        <div style={{marginTop:18,borderTop:"1px solid #f1f5f9",paddingTop:14}}>
          <div style={{fontSize:11,fontWeight:700,color:"#d1d5db",marginBottom:8}}>過去の日記</div>
          {recent.map(e => { const m=MOODS.find(x=>x.v===e.mood); return (
            <div key={e.date} style={{display:"flex",gap:10,padding:"8px 0",borderBottom:"1px solid #f8fafc"}}>
              <span style={{fontSize:18}}>{m?.e??"📓"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:"#475569"}}>{e.date.slice(5).replace("-","/")}</div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.body||"（本文なし）"}</div>
              </div>
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// USER MENU
// ═══════════════════════════════════════════════════════════
function UserMenu({ user, theme, onLogout }: {user:User;theme:Theme;onLogout:()=>void}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{position:"relative"}}>
      <B onClick={()=>setOpen(v=>!v)} style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,.25)",border:"2px solid rgba(255,255,255,.5)",color:"white",fontSize:13,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>{user.avatar}</B>
      {open && <>
        <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:98}}/>
        <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:"white",borderRadius:16,boxShadow:"0 8px 32px #0001,0 0 0 1px #f1f5f9",minWidth:200,zIndex:99,overflow:"hidden"}}>
          <div style={{padding:"14px 16px 12px",borderBottom:"1px solid #f8fafc",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:theme.primary,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:14,fontWeight:700}}>{user.avatar}</div>
            <div><div style={{fontSize:13,fontWeight:700,color:"#0f172a"}}>{user.name}</div><div style={{fontSize:11,color:"#94a3b8"}}>{user.email}</div></div>
          </div>
          <div style={{padding:6}}>
            {[["⚙️","設定"],["🎨","テーマ変更"],["📊","統計"]].map(([icon,label]) => (
              <B key={label} onClick={()=>setOpen(false)} style={{width:"100%",padding:"9px 12px",borderRadius:10,textAlign:"left",fontSize:13,color:"#374151",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>(e.currentTarget.style.background="#f8fafc")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>{icon} {label}</B>
            ))}
          </div>
          <div style={{padding:6,borderTop:"1px solid #f8fafc"}}>
            <B onClick={()=>{setOpen(false);onLogout();}} style={{width:"100%",padding:"9px 12px",borderRadius:10,textAlign:"left",fontSize:13,color:"#64748b",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>{e.currentTarget.style.background="#fff5f5";e.currentTarget.style.color="#F43F5E"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#64748b"}}>👋 ログアウト</B>
          </div>
        </div>
      </>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════
export default function Page() {
  const S = useStore();
  const [screen,    setScreen]    = useState<"login"|"app">("login");
  const [tab,       setTab]       = useState("cal");
  const [view,      setView]      = useState<"month"|"week">("month");
  const [showTheme, setShowTheme] = useState(false);
  const [modal,     setModal]     = useState<Modal|null>(null);

  const openAdd  = useCallback(() => setModal({type:"add",dk:S.sel}), [S.sel]);
  const openEdit = useCallback((ev: Event) => setModal({type:"edit",ev}), []);
  const closeModal = useCallback(() => setModal(null), []);
  const save = useCallback((ev: Event) => { modal?.type==="edit" ? S.updEv(ev.id,ev) : S.addEv(ev); }, [modal, S]);

  const login  = (u: User) => { S.setUser(u); setScreen("app"); };
  const guest  = () => setScreen("app");
  const logout = () => { S.setUser(null); setScreen("login"); };

  if(screen==="login") return <Login theme={S.theme} onLogin={login} onGuest={guest}/>;

  const TABS = [["cal","📆","カレンダー"],["todo","✅","ToDo"],["diary","📓","日記"]];

  return (
    <div style={{minHeight:"100vh",background:"#f0f2f5",display:"flex",justifyContent:"center",alignItems:"flex-start",padding:"20px 16px 48px",fontFamily:"'Hiragino Sans','Yu Gothic UI',Meiryo,sans-serif"}}>
      <style>{`@keyframes su2{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}} .pnl{animation:su2 .24s cubic-bezier(.22,1,.36,1)}`}</style>
      <div style={{width:"100%",maxWidth:440}}>

        {/* ヘッダー */}
        <div style={{background:S.theme.primary,borderRadius:"20px 20px 0 0",padding:"14px 18px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:`0 4px 24px ${S.theme.primary}44`}}>
          <span style={{fontSize:17,fontWeight:800,color:"white",letterSpacing:-.5}}>📅 Life Calendar</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <B onClick={()=>setShowTheme(v=>!v)} style={{background:"rgba(255,255,255,.22)",borderRadius:8,padding:"5px 12px",color:"white",fontSize:12,fontWeight:600}}>テーマ</B>
            {S.user ? <UserMenu user={S.user} theme={S.theme} onLogout={logout}/> :
              <B onClick={()=>setScreen("login")} style={{background:"rgba(255,255,255,.22)",borderRadius:8,padding:"5px 12px",color:"white",fontSize:12,fontWeight:600}}>ログイン</B>}
          </div>
        </div>

        {/* テーマピッカー */}
        {showTheme && (
          <div style={{background:"white",padding:"10px 18px 12px",display:"flex",gap:10,alignItems:"center",borderBottom:"1px solid #f1f5f9"}}>
            <span style={{fontSize:11,color:"#94a3b8",fontWeight:700,whiteSpace:"nowrap"}}>テーマカラー</span>
            {THEMES.map(t => (
              <B key={t.name} title={t.name} onClick={()=>{S.setTheme(t);setShowTheme(false);}} style={{width:22,height:22,borderRadius:"50%",background:t.primary,outline:t.primary===S.theme.primary?`3px solid ${t.primary}`:"none",outlineOffset:2,boxShadow:"0 1px 4px #0002",padding:0,transition:"transform .15s"}} onMouseEnter={e=>(e.currentTarget.style.transform="scale(1.2)")} onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}/>
            ))}
          </div>
        )}

        {/* メインカード */}
        <div style={{background:"white",borderRadius:"0 0 20px 20px",boxShadow:"0 8px 40px #0001",overflow:"hidden"}}>
          <div style={{display:"flex",borderBottom:"1px solid #f1f5f9"}}>
            {TABS.map(([id,icon,label]) => (
              <B key={id} onClick={()=>setTab(id)} style={{flex:1,background:"none",padding:"12px 4px 10px",fontSize:12,fontWeight:700,color:tab===id?S.theme.primary:"#94a3b8",borderBottom:tab===id?`2.5px solid ${S.theme.primary}`:"2.5px solid transparent",transition:"color .2s,border-color .2s"}}>{icon} {label}</B>
            ))}
          </div>

          <div key={tab} className="pnl">
            {tab==="cal" && <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px 0"}}>
                <div style={{display:"flex",gap:4}}>
                  {(["month","week"] as const).map(v => <B key={v} onClick={()=>setView(v)} style={{padding:"5px 14px",borderRadius:20,background:view===v?S.theme.primary:"#f3f4f6",color:view===v?"white":"#6b7280",fontSize:12,fontWeight:700,transition:"all .18s"}}>{v==="month"?"月":"週"}</B>)}
                </div>
                {view==="month" && (
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <B onClick={S.prev} style={{background:"none",fontSize:18,color:"#d1d5db",padding:"2px 6px"}}>‹</B>
                    <span style={{fontSize:14,fontWeight:800,color:"#0f172a"}}>{S.yr}年 {MONTHS[S.mo]}</span>
                    <B onClick={S.next} style={{background:"none",fontSize:18,color:"#d1d5db",padding:"2px 6px"}}>›</B>
                  </div>
                )}
              </div>
              {view==="month"
                ? <MonthCal theme={S.theme} yr={S.yr} mo={S.mo} sel={S.sel} pick={S.pick} events={S.events} stamps={S.stamps}/>
                : <WeekView theme={S.theme} sel={S.sel} pick={S.pick} events={S.events} onEvClick={openEdit}/>
              }
              <DayPanel theme={S.theme} sel={S.sel} events={S.events} stamps={S.stamps} stamp={S.stamp} todos={S.todos} togTd={S.togTd} onAdd={openAdd} onEd={openEdit}/>
            </>}
            {tab==="todo"  && <TodoPanel  theme={S.theme} todos={S.todos} addTd={S.addTd} togTd={S.togTd} togPr={S.togPr} delTd={S.delTd}/>}
            {tab==="diary" && <DiaryPanel theme={S.theme} sel={S.sel} diary={S.diary} saveD={S.saveD}/>}
          </div>
        </div>

        <p style={{textAlign:"center",fontSize:11,color:"#d1d5db",marginTop:14}}>
          {S.user ? `${S.user.name} さん · メールログイン` : "ゲストモード"} · データはセッション中のみ保持
        </p>
      </div>

      {modal && (
        <EvModal theme={S.theme} dateKey={modal.type==="add"?modal.dk:modal.ev.date} edit={modal.type==="edit"?modal.ev:undefined} onClose={closeModal} onSave={save} onDel={S.delEv}/>
      )}
    </div>
  );
}
