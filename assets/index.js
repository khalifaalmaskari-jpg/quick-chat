const { useEffect, useMemo, useRef, useState } = React;
const { createRoot } = ReactDOM;
const { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } = libphonenumber;
const h = React.createElement;

const VERSION = "2.1.7";
const popular = ["AE","SA","US","GB","IN","FR","DE","NL"];
const dn = typeof Intl.DisplayNames === "function"
  ? new Intl.DisplayNames([navigator.language || "en"], { type: "region" })
  : null;

const flag = c => c.replace(/./g, x => String.fromCodePoint(127397 + x.charCodeAt()));
const cname = c => { try { return dn?.of(c) || c; } catch { return c; } };
const C = getCountries()
  .map(c => [c, flag(c), cname(c), getCountryCallingCode(c)])
  .sort((a,b) => {
    const ai = popular.indexOf(a[0]), bi = popular.indexOf(b[0]);
    if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    return a[2].localeCompare(b[2]);
  });

const get = (k,d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const set = (k,v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function App() {
  const [country,setCountry] = useState(() => C.find(c => c[0] === get("qc_country","AE")) || C[0]);
  const [digits,setDigits] = useState("");
  const [message,setMessage] = useState("");
  const [showMsg,setShowMsg] = useState(false);
  const [sheet,setSheet] = useState(false);
  const [settings,setSettings] = useState(false);
  const [query,setQuery] = useState("");
  const [toast,setToast] = useState("");
  const [history,setHistory] = useState(() => get("qc_history_enabled",true));
  const [recents,setRecents] = useState(() => get("qc_recents",[]));

  const searchRef = useRef(null);
  const countryButtonRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const countryDialogRef = useRef(null);
  const settingsDialogRef = useRef(null);
  const toastTimerRef = useRef(null);

  const parsed = useMemo(() => {
    try { return parsePhoneNumberFromString(digits,country[0]); } catch { return null; }
  }, [digits,country]);

  const valid = !!parsed?.isValid();
  const full = valid ? parsed.number.slice(1) : "";
  const fmt = x => {
    try { return new AsYouType(country[0]).input((x || "").replace(/\D/g,"")); }
    catch { return x || ""; }
  };

  const notify = text => {
    clearTimeout(toastTimerRef.current);
    setToast(text);
    toastTimerRef.current = setTimeout(() => setToast(""), 2200);
  };

  const haptic = () => { try { navigator.vibrate?.(6); } catch {} };

  const ingest = raw => {
    let v = (raw || "").trim();
    if (!v) { setDigits(""); return; }
    if (v.startsWith("00")) v = "+" + v.slice(2);
    if (v.startsWith("+")) {
      try {
        const p = parsePhoneNumberFromString(v);
        if (p) {
          const match = C.find(c => c[0] === p.country);
          if (match) {
            setCountry(match);
            set("qc_country",match[0]);
          }
          setDigits(p.nationalNumber);
          return;
        }
      } catch {}
    }
    setDigits(v.replace(/\D/g,"").slice(0,17));
  };

  const open = n => {
    const target = n || full;
    if (!target) return;
    const url = "https://wa.me/" + target + (message.trim() && !n ? "?text=" + encodeURIComponent(message.trim()) : "");
    if (!n && history) {
      const next = [{n:target,d:country[3],t:Date.now()}, ...recents.filter(r => r.n !== target)].slice(0,8);
      setRecents(next);
      set("qc_recents",next);
    }
    window.location.assign(url);
  };

  const openCountry = () => setSheet(true);
  const closeCountry = () => {
    setSheet(false);
    setQuery("");
    requestAnimationFrame(() => countryButtonRef.current?.focus({preventScroll:true}));
  };
  const openSettings = () => setSettings(true);
  const closeSettings = () => {
    setSettings(false);
    requestAnimationFrame(() => settingsButtonRef.current?.focus({preventScroll:true}));
  };

  useEffect(() => {
    const activeDialog = sheet ? countryDialogRef.current : settings ? settingsDialogRef.current : null;
    if (!activeDialog) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    const initialFocus = sheet ? searchRef.current : activeDialog.querySelector(".close");
    const focusTimer = setTimeout(() => initialFocus?.focus({preventScroll:true}), 30);

    const onKeyDown = e => {
      if (e.key === "Escape") {
        e.preventDefault();
        sheet ? closeCountry() : closeSettings();
        return;
      }
      if (e.key !== "Tab") return;
      const items = [...activeDialog.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown",onKeyDown);
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown",onKeyDown);
      document.body.style.overflow = "";
    };
  }, [sheet,settings]);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().replace("+","");
    return C
      .filter(c => !q || c[2].toLowerCase().includes(q) || c[3].startsWith(q))
      .sort((a,b) => a[2].localeCompare(b[2]));
  }, [query]);

  const when = t => !t ? "Previously used"
    : Date.now() - t < 864e5 ? "Today"
    : Date.now() - t < 1728e5 ? "Yesterday"
    : new Date(t).toLocaleDateString(undefined,{month:"short",day:"numeric"});

  return h("div",{className:"app"},
    h("header",{className:"bar"},
      h("div",{className:"bar-row"},
        h("img",{className:"logo",src:"./icons/icon-192.png?v=2.1.7",alt:""}),
        h("div",{className:"brand"},
          h("h1",null,"Quick Chat"),
          h("p",null,"Message any number, no contact needed")
        ),
        h("button",{ref:settingsButtonRef,type:"button",className:"settings-btn",onClick:openSettings,"aria-label":"Settings","aria-haspopup":"dialog","aria-expanded":settings},"⚙")
      )
    ),
    h("main",{className:"main"},
      h("section",{className:"card entry","aria-label":"Start a WhatsApp chat"},
        h("div",{className:"field"},
          h("button",{ref:countryButtonRef,type:"button",className:"country",onClick:openCountry,"aria-label":"Choose country code","aria-haspopup":"dialog","aria-expanded":sheet},country[1]+" +"+country[3]+" ▾"),
          h("input",{className:"number",type:"tel",inputMode:"tel",autoComplete:"tel",enterKeyHint:"go",placeholder:"Phone number","aria-label":"Phone number",value:fmt(digits),onChange:e=>ingest(e.target.value),onPaste:e=>{const t=e.clipboardData?.getData("text");if(t){e.preventDefault();ingest(t)}},onKeyDown:e=>{if(e.key==="Enter"&&valid)open()}})
        ),
        h("div",{className:"preview "+(digits&&!valid&&digits.length>=4?"error":valid?"valid":""),role:"status","aria-live":"polite"},
          !digits ? "Enter the number without the country code"
          : valid ? "Valid number · "+parsed.formatInternational()
          : digits.length < 4 ? "Keep entering the phone number"
          : "Check the phone number for "+country[2]
        ),
        h("div",{className:"keys","aria-label":"Number keypad"},
          ...[1,2,3,4,5,6,7,8,9].map(k=>h("button",{key:k,type:"button",className:"key",onClick:()=>{haptic();setDigits(d=>(d+String(k)).slice(0,15))},"aria-label":String(k)},k)),
          h("button",{type:"button",className:"key utility",onClick:()=>{haptic();setDigits("")},"aria-label":"Clear phone number"},"Clear"),
          h("button",{type:"button",className:"key",onClick:()=>{haptic();setDigits(d=>(d+"0").slice(0,15))},"aria-label":"0"},"0"),
          h("button",{type:"button",className:"key utility",onClick:()=>{haptic();setDigits(d=>d.slice(0,-1))},"aria-label":"Delete last digit"},"⌫")
        ),
        h("div",{className:"desktop-hint"},"You can also type or paste a number using your keyboard."),
        h("button",{type:"button",className:"message-toggle",onClick:()=>setShowMsg(v=>!v),"aria-expanded":showMsg,"aria-controls":"optional-message"},
          h("span",null,"Add a message"),
          h("small",null,showMsg?"Hide":message.trim()?"Added":"Optional")
        ),
        showMsg && h("textarea",{id:"optional-message",className:"message",value:message,onChange:e=>setMessage(e.target.value),placeholder:"Type a message to pre-fill the chat","aria-label":"Optional WhatsApp message",rows:3}),
        h("button",{type:"button",className:"go",disabled:!valid,onClick:()=>{haptic();open()}},"Open in WhatsApp")
      ),
      history && recents.length > 0 && h("section",{className:"recents","aria-labelledby":"recent-title"},
        h("div",{className:"recents-head"},
          h("span",{id:"recent-title"},"Recent"),
          h("button",{type:"button",onClick:openSettings},"Manage")
        ),
        h("div",{className:"card"},
          recents.map(r=>h("div",{className:"recent",key:r.n},
            h("div",{className:"avatar","aria-hidden":"true"},"☎"),
            h("button",{type:"button",className:"recent-main",onClick:()=>open(r.n),"aria-label":"Open WhatsApp chat with +"+r.n},
              h("strong",null,"+"+r.n),
              h("small",null,when(r.t))
            ),
            h("button",{type:"button",className:"edit",onClick:()=>{ingest("+"+r.n);scrollTo({top:0,behavior:"smooth"})},"aria-label":"Edit +"+r.n},"Edit")
          ))
        )
      )
    ),
    sheet && h(React.Fragment,null,
      h("div",{className:"scrim",onClick:closeCountry,"aria-hidden":"true"}),
      h("div",{ref:countryDialogRef,className:"sheet",role:"dialog","aria-modal":"true","aria-labelledby":"country-title"},
        h("div",{className:"sheet-head"},
          h("h2",{id:"country-title"},"Country code"),
          h("button",{type:"button",className:"close",onClick:closeCountry,"aria-label":"Close country selector"},"×")
        ),
        h("input",{ref:searchRef,className:"search",value:query,onChange:e=>setQuery(e.target.value),placeholder:"Search country or code","aria-label":"Search countries"}),
        h("div",{className:"country-list"},
          filtered.map(c=>h("button",{type:"button",key:c[0],className:"country-row",onClick:()=>{setCountry(c);set("qc_country",c[0]);closeCountry()}},
            h("span",null,c[1]),
            h("span",null,c[2]),
            h("span",{className:"dial"},"+"+c[3])
          ))
        )
      )
    ),
    settings && h(React.Fragment,null,
      h("div",{className:"scrim",onClick:closeSettings,"aria-hidden":"true"}),
      h("div",{ref:settingsDialogRef,className:"settings-sheet",role:"dialog","aria-modal":"true","aria-labelledby":"settings-title"},
        h("div",{className:"sheet-head"},
          h("h2",{id:"settings-title"},"Settings"),
          h("button",{type:"button",className:"close",onClick:closeSettings,"aria-label":"Close settings"},"×")
        ),
        h("div",{className:"setting-row"},
          h("div",null,
            h("strong",{id:"history-label"},"Recent history"),
            h("small",{id:"history-help"},"Save recently opened numbers on this device")
          ),
          h("button",{type:"button",className:"switch "+(history?"on":""),role:"switch","aria-checked":history,"aria-labelledby":"history-label","aria-describedby":"history-help",onClick:()=>{const v=!history;setHistory(v);set("qc_history_enabled",v);notify(v?"History is on":"History is off")}},
            h("span",{"aria-hidden":"true"})
          )
        ),
        h("button",{type:"button",className:"danger-action",disabled:recents.length===0,onClick:()=>{setRecents([]);set("qc_recents",[]);notify("Recent history cleared")}},"Clear recent history"),
        h("div",{className:"about"},"Quick Chat v"+VERSION,
          h("small",null,"No account · No contacts access · History stays on this device")
        )
      )
    ),
    toast && h("div",{className:"toast",role:"status","aria-live":"polite"},toast)
  );
}

createRoot(document.getElementById("root")).render(h(App));

if ("serviceWorker" in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange",() => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
  addEventListener("load",async() => {
    try {
      const r = await navigator.serviceWorker.register("./sw.js",{updateViaCache:"none"});
      if (r.waiting) r.waiting.postMessage("SKIP_WAITING");
      r.addEventListener("updatefound",() => {
        const w = r.installing;
        if (w) w.addEventListener("statechange",() => {
          if (w.state === "installed" && navigator.serviceWorker.controller) w.postMessage("SKIP_WAITING");
        });
      });
      await r.update();
    } catch {}
  });
}
