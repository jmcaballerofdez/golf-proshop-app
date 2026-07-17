import { useState, useEffect, useMemo, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, doc, setDoc, addDoc, deleteDoc, updateDoc,
  onSnapshot, serverTimestamp, query, orderBy, Timestamp, runTransaction,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  LayoutDashboard, Clock, Package, ShoppingCart, Tag, Users,
  Plus, Pencil, Trash2, X, Menu, LogIn, LogOut, KeyRound,
  Minus, Trash, Receipt, AlertTriangle,
  GraduationCap, Wrench, Wallet, Home,
} from "lucide-react";

// ─── Firebase Config ───────────────────────────────────────────────
// Usa el MISMO proyecto Firebase que Golf B (golf-ciudad-real-50819).
// Las colecciones llevan el prefijo "proshop_" para no mezclarse con
// Academia ni Mantenimiento.
const firebaseConfig = {
  apiKey: "AIzaSyDQMYwKTt05hfSPW-Trl7NYPGyDFKA76dQ",
  authDomain: "golf-ciudad-real-50819.firebaseapp.com",
  projectId: "golf-ciudad-real-50819",
  storageBucket: "golf-ciudad-real-50819.firebasestorage.app",
  messagingSenderId: "447720199984",
  appId: "1:447720199984:web:312a8a1140d95554821af5",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ─── Resolución del club (multi-cliente) ───────────────────────────
function resolverClubId() {
  const host = window.location.hostname;
  if (host.endsWith(".golfb.es")) {
    const sub = host.split(".")[0];
    if (sub && sub !== "www") return sub;
  }
  return "ciudad-real";
}
const CLUB_ID = resolverClubId();

const LOGO_GOLFB_AZUL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXwAAADPCAYAAAD2zmqlAABaoklEQVR4nO29d7xlSVU2/Kzae59zU9/u22m6Z6YnJyYSBgZMgIoEwQSKgoqfyJCU0VfB8L36qT9F5VVfUSQjiMKAYchggFFkVBgkTmBiT+jumencfeMJe9f6/qiqferUqR3Ojadn6rm/urt2qrjPU6tWraoCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJOedBGJ+BRjFEpW97oBAQEBIwGRoWUTmXUKcP1LOdhCT40CAEBjxEEwh8OZeVVdG81G4RhyLnq2ZXeDwgIOMUQCL8avjJyry33mTrxrQbJ+64P8+xy0hIQEDBiCITvRxWBD+uvcz4s6hL2ap9XXQ8ICBhRBMLvRxkpU8G1smeGaQCGRR2pnSv8Vferwiy7FhAQMGIIhD8cyVPBtTr3iuIrulaEKsKtS/J1j0XX6pwHBASMEB7LhF9E9FVEXuccu572o1PT5129O5natlMkzW0iSjZBiEki0QQQgagJgMGQAEuAM879kGDZYSm7YNlimbVl2l2UaXshXTx5ojt3dP7+T/7JQ0766xC1fSzyl12riqfoPCAgYATwWCX8YaT4Qnf2867bNn3e1VdHY5MXiSg5j0R0Boh2AGIzEW0BEIPQABABJPR7QoddRJLmKJATL6sjIwOQApAMboG5DfACmGdZyiOcpQ/LrLNfdjtHOrMH77jz/b/8TZSTvO+8zjVfesvyFBAQMAJ4rBF+HaK3z4V9/ZKfefOF49vP+j6KG08iEV0Eoq1ENAPQGIAYgASQAWBFxvn70opXKgInXwNj4BKl736Uv0sUWedSx7/AzAtgeYSz7v0y7dyVtRf3Zq25h7oLJ462ju47yiwzSCn33/juoxgkeIli8vc1AIC/EfCdBwQEbAAeS4RfNuha6K78hb/9nnhyy4+QiJ9AJM4E0bS6x10ltXMGRhc9UrOl+ALU4T/yNQS+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";

// ─── Paleta "Golf B Premium" (unificada con el resto de la suite) ──
const PRIMARY = "#22593D";       // pino profundo — botones, sidebar activo, títulos
const PRIMARY_DARK = "#1B4531";  // hover/active del primario
const SIDEBAR_DARK = "#0C2A1C";  // verde-carbón del sidebar (familia Golf B)
const GOLD = "#C6A253";          // dorado premium — acento de firma de la suite
const GOLD_SOFT = "rgba(198,162,83,0.35)";
const ACCENT_PROSHOP = "#8c1c1c"; // rojo distintivo de Proshop (mismo que en Master)
const BACKGROUND = "#F8FAF9";    // fondo general de página
const CARD_BORDER = "#E9EFEC";   // borde sutil de tarjetas
const BORDER = "#E2E9E4";        // borde general (inputs, separadores)
const SECONDARY_BG = "#F0F4F2";  // fondo pill/secundario (salvia muy claro)
const ACCENT_BG = "#E7EFEB";     // fondo hover, chips
const MUTED_TEXT = "#66796F";    // texto secundario/gris-verde
const FOREGROUND = "#1B2621";    // texto principal (casi negro con base verde)
const DESTRUCTIVE = "#C32222";   // rojo de aviso/borrar
const FONT_SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

// ─── Datos iniciales (solo se crean la primera vez, colección vacía) ──
const EMPLEADOS_INICIALES = [
  { nombre: "Isabel Heredia Martín", rol: "Recepción / Proshop" },
  { nombre: "Cristina Pérez Rodríguez", rol: "Recepción / Proshop" },
  { nombre: "Vicente José Jurado Pérez", rol: "Recepción / Proshop" },
];

const CATEGORIAS_INICIALES = ["Palos", "Bolas", "Guantes", "Ropa", "Calzado", "Accesorios"];

const IVA_DEFECTO = 21;
const METODOS_PAGO = ["Efectivo", "Tarjeta", "Bono/Socio"];

// ─── Utilidades ─────────────────────────────────────────────────────
function cx(...args) { return args.filter(Boolean).join(" "); }

function fechaCorta(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function horaCorta(ts) {
  if (!ts) return "—";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}
function euros(n) {
  return (Number(n) || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

// ─── Badge corporativo ───────────────────────────────────────────────
function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[#E7EFEB] text-[#374842]",
    verde: "bg-[#E7EFEB] text-[#22593D]",
    ambar: "bg-[#FBF0DD] text-[#8A6416]",
    rojo: "bg-[#FBEAEA] text-[#C32222]",
    dorado: "bg-[#FBF0DD] text-[#8A6416]",
  };
  return (
    <span className={cx("px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap", tones[tone] || tones.neutral)}>
      {children}
    </span>
  );
}

// ─── Cabecera de sección reutilizable ────────────────────────────────
function Cabecera({ titulo, subtitulo, children }) {
  return (
    <div className="flex items-start justify-between mb-8 pb-5 flex-wrap gap-3 border-b border-[#E9EFEC]">
      <div className="pl-4 border-l-2" style={{ borderColor: GOLD }}>
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: GOLD }}>
          Proshop · Golf B
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1B2621]">{titulo}</h1>
        {subtitulo && <p className="text-[#66796F] mt-2 font-medium">{subtitulo}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

// ─── Botones corporativos ────────────────────────────────────────────
function BotonPrimario({ children, onClick, icon: Icon = Plus, type = "button", disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-[0_2px_8px_rgba(34,89,61,0.28)] hover:shadow-[0_4px_16px_rgba(34,89,61,0.36)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      style={{ background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)` }}
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  );
}
function BotonSecundario({ children, onClick, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-sm font-semibold border border-[#DCE5DF] text-[#1B2621] bg-white hover:bg-[#F0F4F2] hover:border-[#C7D4CD] shadow-sm transition-all duration-200"
    >
      {Icon && <Icon size={16} strokeWidth={2.25} />}
      {children}
    </button>
  );
}
function PillFiltro({ activo, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "px-4 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200",
        activo
          ? "text-white border-transparent shadow-[0_2px_10px_rgba(34,89,61,0.3)]"
          : "text-[#4A5850] border-[#E2E9E4] bg-white hover:border-[#C7D4CD] hover:bg-[#F0F4F2]"
      )}
      style={activo ? { background: `linear-gradient(135deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)` } : {}}
    >
      {children}
    </button>
  );
}

// ─── Tarjeta base ─────────────────────────────────────────────────────
function Tarjeta({ children, className = "", onClick }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "bg-white rounded-2xl border border-[#E9EFEC] shadow-[0_1px_3px_rgba(12,42,28,0.06)]",
        onClick && "cursor-pointer hover:shadow-[0_8px_24px_rgba(12,42,28,0.08)] hover:border-[#D8E2DC] hover:-translate-y-0.5 transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Tarjeta de estadística grande (panel principal) ─────────────────
function TarjetaStat({ titulo, valor, subtitulo, Icon, tintClass = "bg-[#22593D]/10 text-[#22593D]", valorClass = "text-[#1B2621]" }) {
  return (
    <Tarjeta className="overflow-hidden group">
      <div className="h-[3px]" style={{ background: GOLD }} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold tracking-wide text-[#66796F]">{titulo}</p>
          <div className={cx("p-2.5 rounded-xl group-hover:scale-110 transition-transform", tintClass)}>
            <Icon size={19} />
          </div>
        </div>
        <p className={cx("text-4xl font-semibold", valorClass)}>{valor}</p>
        {subtitulo && <p className="text-sm font-medium text-[#66796F] mt-2">{subtitulo}</p>}
      </div>
    </Tarjeta>
  );
}

// ─── Avatar de iniciales (para filas de tabla y tarjetas) ─────────────
const AVATAR_TONOS = [
  { bg: "#22593D1A", fg: "#22593D" }, { bg: "#8c1c1c1A", fg: "#8c1c1c" },
  { bg: "#C6A2531A", fg: "#8A6A2E" }, { bg: "#2E6DA41A", fg: "#2E6DA4" },
  { bg: "#7c3aed1A", fg: "#7c3aed" },
];
function Avatar({ nombre = "" }) {
  const iniciales = nombre.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("") || "?";
  let hash = 0; for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  const tono = AVATAR_TONOS[Math.abs(hash) % AVATAR_TONOS.length];
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: tono.bg, color: tono.fg }}>
      {iniciales}
    </div>
  );
}

// ─── Modal genérico ──────────────────────────────────────────────────
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C2A1C]/50 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div
        className={cx("bg-white rounded-2xl shadow-[0_24px_64px_rgba(12,42,28,0.28)] w-full max-h-[90vh] overflow-y-auto animate-[modalIn_0.18s_ease-out]", wide ? "max-w-2xl" : "max-w-md")}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9EFEC]">
          <h3 className="font-semibold text-lg tracking-tight" style={{ color: PRIMARY }}>{title}</h3>
          <button onClick={onClose} className="text-[#8A9A93] hover:text-[#1B2621] rounded-lg p-1.5 hover:bg-[#E7EFEB] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.97) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block mb-3.5">
      <span className="block text-[13px] font-medium text-[#374842] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full border border-[#DCE5DF] rounded-xl px-3.5 py-2.5 text-sm text-[#1B2621] bg-white focus:outline-none focus:ring-4 focus:ring-[#22593D]/10 focus:border-[#22593D] transition-all duration-200";

// ─── Rutas de Firestore ancladas al club (multi-cliente) ─────────────
function coleccionClub(nombre) { return collection(db, "clubes", CLUB_ID, nombre); }
function docClub(nombre, id) { return doc(db, "clubes", CLUB_ID, nombre, id); }

function useColeccion(nombre, ordenarPor = "creadoEn", dir = "desc") {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    const q = query(coleccionClub(nombre), orderBy(ordenarPor, dir));
    const unsub = onSnapshot(q, (snap) => {
      setDatos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setCargando(false);
    }, (err) => { console.error(`Error leyendo ${nombre}:`, err); setCargando(false); });
    return () => unsub();
  }, [nombre, ordenarPor, dir]);
  return { datos, cargando };
}
async function crearDoc(coleccion, data) { return addDoc(coleccionClub(coleccion), { ...data, creadoEn: serverTimestamp() }); }
async function actualizarDoc(coleccion, id, data) { return updateDoc(docClub(coleccion, id), data); }
async function borrarDoc(coleccion, id) { return deleteDoc(docClub(coleccion, id)); }

// ─── Semillas iniciales (empleados y categorías) ─────────────────────
function useSemillas(empleados, categorias) {
  useEffect(() => {
    if (empleados.cargando || empleados.datos.length > 0) return;
    EMPLEADOS_INICIALES.forEach((e) => crearDoc("proshop_empleados", { ...e, activo: true, pin: "" }));
  }, [empleados.cargando, empleados.datos.length]);
  useEffect(() => {
    if (categorias.cargando || categorias.datos.length > 0) return;
    CATEGORIAS_INICIALES.forEach((nombre, i) => crearDoc("proshop_categorias", { nombre, orden: i }));
  }, [categorias.cargando, categorias.datos.length]);
}

// ─── Cálculo de IVA sobre un producto/línea ──────────────────────────
function calcularLinea(precioSinIVA, iva, cantidad) {
  const base = Number(precioSinIVA) * Number(cantidad);
  const cuota = base * (Number(iva) / 100);
  return { baseImponible: base, cuotaIVA: cuota, subtotal: base + cuota };
}

// ════════════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════════════
const NAV_GROUPS = [
  { label: "Principal", items: [{ id: "panel", label: "Panel", Icon: LayoutDashboard }] },
  { label: "Operativa", items: [
    { id: "ventas", label: "Ventas (TPV)", Icon: ShoppingCart },
    { id: "historial", label: "Historial de ventas", Icon: Receipt },
    { id: "fichajes", label: "Fichajes", Icon: Clock },
  ]},
  { label: "Catálogo", items: [
    { id: "productos", label: "Productos", Icon: Package },
    { id: "ofertas", label: "Ofertas", Icon: Tag },
  ]},
  { label: "Sistema", items: [{ id: "equipo", label: "Equipo", Icon: Users }] },
];

// ─── Selector de apps Golf B (fila de iconos, siempre visible) ────────
const GOLFB_APPS = [
  { id: "academia", nombre: "Academia", color: "#B03A2E", url: "https://jmcaballerofdez.github.io/golf-academia-app/", Icon: GraduationCap },
  { id: "mantenimiento", nombre: "Mantenimiento", color: "#1A5C2A", url: "https://jmcaballerofdez.github.io/golf-mantenimiento-app/", Icon: Wrench },
  { id: "proshop", nombre: "Proshop", color: "#2E6DA4", url: "https://jmcaballerofdez.github.io/golf-proshop-app/", Icon: ShoppingCart },
  { id: "finanzas", nombre: "Finanzas", color: "#8E969E", url: "https://jmcaballerofdez.github.io/golf-finanzas-app/", Icon: Wallet },
  { id: "master", nombre: "Golf B Máster", color: "#C9A227", url: "https://jmcaballerofdez.github.io/golf-master-app/", Icon: Home },
];
function AppSwitcher({ actual }) {
  return (
    <div className="px-6 pb-4">
      <p className="text-[10px] text-white/30 uppercase font-semibold mb-2.5 tracking-wider">Cambiar de app</p>
      <div className="flex items-center gap-2">
        {GOLFB_APPS.map((app) => {
          const esActual = app.id === actual;
          return (
            <a
              key={app.id}
              href={esActual ? undefined : app.url}
              title={app.nombre}
              className={cx(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0",
                esActual ? "ring-2 ring-white/70 cursor-default" : "opacity-60 hover:opacity-100 hover:scale-110"
              )}
              style={{ background: `${app.color}` }}
              onClick={(e) => { if (esActual) e.preventDefault(); }}
            >
              <app.Icon size={15} color="white" strokeWidth={2} />
            </a>
          );
        })}
      </div>
    </div>
  );
}

function Sidebar({ vista, setVista, abierto, setAbierto }) {
  return (
    <>
      {abierto && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setAbierto(false)} />}
      <aside
        className={cx(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 text-white flex flex-col transition-transform",
          abierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: `linear-gradient(180deg, ${SIDEBAR_DARK} 0%, #081C12 100%)` }}
      >
        <div className="px-6 py-6">
          <img src={LOGO_GOLFB_AZUL} alt="Golf B" style={{ height: 38, objectFit: "contain" }} />
          <p className="text-[10.5px] mt-3 uppercase tracking-[0.2em]" style={{ color: GOLD }}>Proshop &amp; Recepción</p>
          <div className="mt-5 h-px" style={{ background: `linear-gradient(90deg, ${GOLD_SOFT}, transparent)` }} />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 space-y-5 mt-2">
          {NAV_GROUPS.map((g) => (
            <div key={g.label}>
              <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider px-3.5 mb-1.5">{g.label}</p>
              <div className="space-y-0.5">
                {g.items.map(({ id, label, Icon }) => {
                  const activo = vista === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { setVista(id); setAbierto(false); }}
                      className={cx(
                        "relative w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        activo ? "text-white" : "text-white/60 hover:bg-white/[0.06] hover:text-white/90"
                      )}
                      style={activo ? { background: "rgba(198,162,83,0.14)" } : {}}
                    >
                      {activo && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full" style={{ background: GOLD }} />
                      )}
                      <Icon size={18} strokeWidth={1.9} className={activo ? "opacity-100" : "opacity-60"} style={activo ? { color: GOLD } : {}} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <AppSwitcher actual="proshop" />
        <div className="px-6 py-4 border-t border-white/[0.08] mt-auto">
          <p className="text-[10px] text-white/40 uppercase font-semibold mb-0.5 tracking-wider">Club</p>
          <p className="font-medium text-sm text-white/85 truncate">Golf Ciudad Real C.D.</p>
        </div>
      </aside>
    </>
  );
}

function TopBar({ setAbierto, titulo }) {
  return (
    <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#E9EFEC] bg-white sticky top-0 z-20">
      <button onClick={() => setAbierto(true)} className="p-1.5 rounded-md hover:bg-[#E7EFEB]"><Menu size={20} /></button>
      <p className="text-sm text-[#66796F]">Golf B · {titulo}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PANEL (Dashboard)
// ════════════════════════════════════════════════════════════════════
function Panel({ ventas, productos, fichajes }) {
  const hoy = new Date().toDateString();
  const ventasHoy = ventas.datos.filter((v) => v.creadoEn?.toDate?.().toDateString() === hoy);
  const totalHoy = ventasHoy.reduce((s, v) => s + (v.total || 0), 0);
  const ticketMedio = ventasHoy.length ? totalHoy / ventasHoy.length : 0;
  const bajoStock = productos.datos.filter((p) => (p.stockActual ?? 0) <= (p.stockMinimo ?? 0));
  const fichadosAhora = fichajes.datos.filter((f) => f.entrada && !f.salida);

  return (
    <div>
      <Cabecera titulo="Panel de Proshop" subtitulo="Vista general de ventas, stock y personal." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <TarjetaStat titulo="Ventas Hoy" valor={euros(totalHoy)} subtitulo={`${ventasHoy.length} ticket(s)`} Icon={ShoppingCart} tintClass="bg-[#22593D]/10 text-[#22593D]" />
        <TarjetaStat titulo="Ticket Medio" valor={euros(ticketMedio)} Icon={Receipt} tintClass="bg-blue-500/10 text-blue-600" />
        <TarjetaStat
          titulo="Bajo Stock" valor={bajoStock.length} subtitulo={bajoStock.length === 1 ? "producto bajo mínimo" : "productos bajo mínimo"}
          Icon={AlertTriangle}
          tintClass={bajoStock.length > 0 ? "bg-[#C32222]/10 text-[#C32222]" : "bg-emerald-500/10 text-emerald-600"}
          valorClass={bajoStock.length > 0 ? "text-[#C32222]" : "text-[#1B2621]"}
        />
        <TarjetaStat titulo="En Jornada Ahora" valor={fichadosAhora.length} Icon={Clock} tintClass="bg-amber-500/10 text-amber-600" />
      </div>

      {bajoStock.length > 0 && (
        <Tarjeta className="p-6 mb-8">
          <p className="font-medium text-[#1B2621] mb-3">Productos por reponer</p>
          <div className="space-y-2">
            {bajoStock.slice(0, 6).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[#E9EFEC] last:border-0">
                <span className="text-[#1B2621]">{p.nombre}</span>
                <Badge tone="ambar">{p.stockActual ?? 0} / mín. {p.stockMinimo ?? 0}</Badge>
              </div>
            ))}
          </div>
        </Tarjeta>
      )}

      <Tarjeta className="p-6">
        <p className="font-medium text-[#1B2621] mb-3">Últimas ventas</p>
        <div className="space-y-2">
          {ventas.datos.slice(0, 6).map((v) => (
            <div key={v.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[#E9EFEC] last:border-0">
              <span className="text-[#66796F]">#{v.numeroTicket} · {v.empleadoNombre} · {horaCorta(v.creadoEn)}</span>
              <span className="font-medium" style={{ color: PRIMARY }}>{euros(v.total)}</span>
            </div>
          ))}
          {ventas.datos.length === 0 && <p className="text-sm text-[#8A9A93]">Todavía no hay ventas registradas.</p>}
        </div>
      </Tarjeta>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// FICHAJES
// ════════════════════════════════════════════════════════════════════
function ModalPin({ open, onClose, empleado, onConfirmar }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { setPin(""); setError(""); }, [open]);
  if (!open) return null;
  function confirmar() {
    if (pin.length !== 4) { setError("El PIN debe tener 4 dígitos."); return; }
    const ok = !empleado.pin || pin === empleado.pin;
    if (!ok) { setError("PIN incorrecto."); return; }
    onConfirmar();
  }
  return (
    <Modal open={open} onClose={onClose} title={`PIN de ${empleado?.nombre || ""}`}>
      <Field label="Introduce tu PIN de 4 dígitos">
        <input autoFocus type="password" inputMode="numeric" maxLength={4} value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className={cx(inputCls, "text-center text-lg tracking-widest")} />
      </Field>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <BotonPrimario icon={KeyRound} onClick={confirmar}>Confirmar</BotonPrimario>
    </Modal>
  );
}

function Fichajes({ empleados, fichajes }) {
  const [modalPin, setModalPin] = useState(null); // { empleado, accion: "entrada"|"salida" }

  const abiertoPara = useCallback((empId) => fichajes.datos.find((f) => f.empleadoId === empId && f.entrada && !f.salida), [fichajes.datos]);

  async function registrar() {
    const { empleado, accion, abierto } = modalPin;
    if (accion === "entrada") {
      await crearDoc("proshop_fichajes", { empleadoId: empleado.id, empleadoNombre: empleado.nombre, entrada: serverTimestamp(), salida: null });
    } else {
      await actualizarDoc("proshop_fichajes", abierto.id, { salida: serverTimestamp() });
    }
    setModalPin(null);
  }

  return (
    <div>
      <Cabecera titulo="Fichajes" subtitulo="Control de jornada del equipo de Proshop y Recepción." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {empleados.datos.map((e) => {
          const abierto = abiertoPara(e.id);
          return (
            <Tarjeta key={e.id} className="p-6">
              <p className="font-medium text-[#1B2621]">{e.nombre}</p>
              <p className="text-xs text-[#8A9A93] mb-3">{e.rol}</p>
              {abierto ? (
                <>
                  <Badge tone="verde">En jornada desde {horaCorta(abierto.entrada)}</Badge>
                  <div className="mt-3">
                    <BotonSecundario icon={LogOut} onClick={() => setModalPin({ empleado: e, accion: "salida", abierto })}>Registrar salida</BotonSecundario>
                  </div>
                </>
              ) : (
                <div className="mt-1">
                  <BotonPrimario icon={LogIn} onClick={() => setModalPin({ empleado: e, accion: "entrada" })}>Registrar entrada</BotonPrimario>
                </div>
              )}
            </Tarjeta>
          );
        })}
      </div>

      <Tarjeta className="p-6">
        <p className="font-medium text-[#1B2621] mb-3">Historial reciente</p>
        <div className="space-y-2">
          {fichajes.datos.slice(0, 15).map((f) => (
            <div key={f.id} className="flex items-center justify-between text-sm py-1.5 border-b border-[#E9EFEC] last:border-0">
              <span className="text-[#1B2621]">{f.empleadoNombre}</span>
              <span className="text-[#66796F]">{fechaCorta(f.entrada)} · {horaCorta(f.entrada)} → {f.salida ? horaCorta(f.salida) : "—"}</span>
            </div>
          ))}
          {fichajes.datos.length === 0 && <p className="text-sm text-[#8A9A93]">Sin fichajes todavía.</p>}
        </div>
      </Tarjeta>

      <ModalPin open={!!modalPin} onClose={() => setModalPin(null)} empleado={modalPin?.empleado} onConfirmar={registrar} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PRODUCTOS
// ════════════════════════════════════════════════════════════════════
function ModalProducto({ open, onClose, producto, categorias }) {
  const vacio = { nombre: "", categoria: categorias[0]?.nombre || "", precioVentaSinIVA: "", porcentajeIVA: IVA_DEFECTO, codigoBarras: "", stockActual: 0, stockMinimo: 3, unidad: "ud", proveedor: "", activo: true };
  const [form, setForm] = useState(vacio);
  useEffect(() => { setForm(producto ? { ...vacio, ...producto } : vacio); }, [producto, open]);

  async function guardar() {
    if (!form.nombre.trim()) return;
    const data = { ...form, precioVentaSinIVA: Number(form.precioVentaSinIVA) || 0, porcentajeIVA: Number(form.porcentajeIVA) || 0, stockActual: Number(form.stockActual) || 0, stockMinimo: Number(form.stockMinimo) || 0 };
    if (producto) await actualizarDoc("proshop_productos", producto.id, data);
    else await crearDoc("proshop_productos", data);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={producto ? "Editar producto" : "Nuevo producto"} wide>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        <Field label="Nombre del producto">
          <input className={inputCls} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </Field>
        <Field label="Categoría">
          <select className={inputCls} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </Field>
        <Field label="Precio de venta sin IVA (€)">
          <input type="number" step="0.01" className={inputCls} value={form.precioVentaSinIVA} onChange={(e) => setForm({ ...form, precioVentaSinIVA: e.target.value })} />
        </Field>
        <Field label="IVA (%)">
          <input type="number" className={inputCls} value={form.porcentajeIVA} onChange={(e) => setForm({ ...form, porcentajeIVA: e.target.value })} />
        </Field>
        <Field label="Código de barras / SKU (opcional)">
          <input className={inputCls} value={form.codigoBarras} onChange={(e) => setForm({ ...form, codigoBarras: e.target.value })} />
        </Field>
        <Field label="Proveedor (opcional)">
          <input className={inputCls} value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} />
        </Field>
        <Field label="Stock actual">
          <input type="number" className={inputCls} value={form.stockActual} onChange={(e) => setForm({ ...form, stockActual: e.target.value })} />
        </Field>
        <Field label="Stock mínimo (aviso de reposición)">
          <input type="number" className={inputCls} value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })} />
        </Field>
      </div>
      <div className="pt-2"><BotonPrimario onClick={guardar}>Guardar producto</BotonPrimario></div>
    </Modal>
  );
}

function Productos({ productos, categorias }) {
  const [modal, setModal] = useState(null); // null | {} | producto
  const [filtro, setFiltro] = useState("Todas");
  const lista = filtro === "Todas" ? productos.datos : productos.datos.filter((p) => p.categoria === filtro);

  return (
    <div>
      <Cabecera titulo="Productos" subtitulo="Catálogo, precios e IVA del Proshop.">
        <BotonPrimario onClick={() => setModal({})}>Nuevo producto</BotonPrimario>
      </Cabecera>

      <div className="flex flex-wrap gap-2 mb-5">
        <PillFiltro activo={filtro === "Todas"} onClick={() => setFiltro("Todas")}>Todas</PillFiltro>
        {categorias.datos.map((c) => (
          <PillFiltro key={c.id} activo={filtro === c.nombre} onClick={() => setFiltro(c.nombre)}>{c.nombre}</PillFiltro>
        ))}
      </div>

      <Tarjeta className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr className="border-b border-[#E9EFEC]">
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Producto</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Categoría</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Precio (IVA incl.)</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Stock</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const conIVA = (p.precioVentaSinIVA || 0) * (1 + (p.porcentajeIVA || 0) / 100);
              const bajo = (p.stockActual ?? 0) <= (p.stockMinimo ?? 0);
              return (
                <tr key={p.id} className="border-b border-[#F0F4F2] last:border-0 hover:bg-[#F8FAF9] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar nombre={p.nombre} />
                      <span className="text-[#1B2621] font-medium">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[#66796F]">{p.categoria}</td>
                  <td className="px-5 py-3 text-[#1B2621] font-medium">{euros(conIVA)}</td>
                  <td className="px-5 py-3"><Badge tone={bajo ? "ambar" : "neutral"}>{p.stockActual ?? 0} {p.unidad}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => setModal(p)} className="p-1.5 text-[#8A9A93] hover:text-[#1B2621] rounded-lg hover:bg-[#E7EFEB] transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => confirm(`¿Eliminar "${p.nombre}"?`) && borrarDoc("proshop_productos", p.id)} className="p-1.5 text-[#8A9A93] hover:text-[#C32222] rounded-lg hover:bg-[#FBEAEA] transition-colors"><Trash2 size={15} /></button>
                  </td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8A9A93]">No hay productos en esta categoría todavía.</td></tr>
            )}
          </tbody>
        </table>
      </Tarjeta>

      <ModalProducto open={!!modal} onClose={() => setModal(null)} producto={modal?.id ? modal : null} categorias={categorias.datos} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// VENTAS (TPV)
// ════════════════════════════════════════════════════════════════════
function TPV({ productos, empleados, siguienteTicket }) {
  const [carrito, setCarrito] = useState([]); // [{producto, cantidad}]
  const [empleadoId, setEmpleadoId] = useState(empleados.datos[0]?.id || "");
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0]);
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);

  const disponibles = productos.datos.filter((p) => p.activo !== false && p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  function añadir(p) {
    setCarrito((c) => {
      const existe = c.find((l) => l.producto.id === p.id);
      if (existe) return c.map((l) => l.producto.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l);
      return [...c, { producto: p, cantidad: 1 }];
    });
  }
  function cambiarCantidad(id, delta) {
    setCarrito((c) => c.map((l) => l.producto.id === id ? { ...l, cantidad: Math.max(1, l.cantidad + delta) } : l).filter((l) => l.cantidad > 0));
  }
  function quitar(id) { setCarrito((c) => c.filter((l) => l.producto.id !== id)); }

  const lineas = carrito.map((l) => {
    const { baseImponible, cuotaIVA, subtotal } = calcularLinea(l.producto.precioVentaSinIVA, l.producto.porcentajeIVA, l.cantidad);
    return { ...l, baseImponible, cuotaIVA, subtotal };
  });
  const baseImponibleTotal = lineas.reduce((s, l) => s + l.baseImponible, 0);
  const cuotaIVATotal = lineas.reduce((s, l) => s + l.cuotaIVA, 0);
  const total = baseImponibleTotal + cuotaIVATotal;

  async function cobrar() {
    if (lineas.length === 0 || guardando) return;
    setGuardando(true);
    const empleado = empleados.datos.find((e) => e.id === empleadoId);
    const numeroTicket = await siguienteTicket();
    await crearDoc("proshop_ventas", {
      numeroTicket,
      empleadoId, empleadoNombre: empleado?.nombre || "—",
      metodoPago,
      baseImponibleTotal, cuotaIVATotal, total,
      items: lineas.map((l) => ({
        productoId: l.producto.id, nombre: l.producto.nombre, cantidad: l.cantidad,
        precioUnitarioSinIVA: l.producto.precioVentaSinIVA, porcentajeIVA: l.producto.porcentajeIVA,
        baseImponible: l.baseImponible, cuotaIVA: l.cuotaIVA, subtotal: l.subtotal,
      })),
    });
    for (const l of lineas) {
      await actualizarDoc("proshop_productos", l.producto.id, { stockActual: Math.max(0, (l.producto.stockActual || 0) - l.cantidad) });
      await crearDoc("proshop_movimientosStock", { productoId: l.producto.id, tipo: "venta", cantidad: -l.cantidad, motivo: `Venta #${numeroTicket}`, empleadoId });
    }
    setCarrito([]);
    setGuardando(false);
  }

  return (
    <div>
      <Cabecera titulo="Ventas (TPV)" subtitulo="Registro rápido de ventas con IVA desglosado." />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <input placeholder="Buscar producto…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className={cx(inputCls, "mb-4")} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {disponibles.map((p) => (
              <Tarjeta key={p.id} className="p-4 cursor-pointer group" onClick={() => añadir(p)}>
                <div className="flex items-start justify-between mb-2">
                  <Avatar nombre={p.nombre} />
                  <div className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: PRIMARY }}>
                    <Plus size={13} color="white" strokeWidth={2.5} />
                  </div>
                </div>
                <p className="text-sm font-medium text-[#1B2621] line-clamp-2 leading-snug">{p.nombre}</p>
                <p className="text-xs text-[#8A9A93] mb-1.5">{p.categoria}</p>
                <p className="text-base font-bold" style={{ color: PRIMARY }}>{euros((p.precioVentaSinIVA || 0) * (1 + (p.porcentajeIVA || 0) / 100))}</p>
              </Tarjeta>
            ))}
            {disponibles.length === 0 && <p className="text-sm text-[#8A9A93] col-span-full py-6 text-center">Sin resultados.</p>}
          </div>
        </div>

        <Tarjeta className="p-5 self-start">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${PRIMARY}15`, color: PRIMARY }}><Receipt size={15} /></div>
            <p className="font-semibold text-[#1B2621]">Ticket</p>
          </div>
          <div className="space-y-2.5 mb-4 max-h-64 overflow-y-auto">
            {lineas.map((l) => (
              <div key={l.producto.id} className="flex items-center justify-between text-sm gap-2 pb-2.5 border-b border-[#F0F4F2] last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[#1B2621] font-medium">{l.producto.nombre}</p>
                  <p className="text-xs text-[#8A9A93]">{euros(l.subtotal)}</p>
                </div>
                <div className="flex items-center gap-0.5 bg-[#F0F4F2] rounded-lg p-0.5">
                  <button onClick={() => cambiarCantidad(l.producto.id, -1)} className="p-1 rounded-md hover:bg-white transition-colors"><Minus size={13} /></button>
                  <span className="w-5 text-center text-[#1B2621] font-medium text-xs">{l.cantidad}</span>
                  <button onClick={() => cambiarCantidad(l.producto.id, 1)} className="p-1 rounded-md hover:bg-white transition-colors"><Plus size={13} /></button>
                </div>
                <button onClick={() => quitar(l.producto.id)} className="p-1 rounded-md hover:bg-[#FBEAEA] text-[#8A9A93] hover:text-[#C32222] transition-colors"><Trash size={13} /></button>
              </div>
            ))}
            {lineas.length === 0 && <p className="text-sm text-[#8A9A93]">Añade productos al ticket.</p>}
          </div>

          <Field label="Empleado">
            <select className={inputCls} value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
              {empleados.datos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </Field>
          <Field label="Método de pago">
            <select className={inputCls} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
              {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>

          <div className="rounded-xl p-3.5 mt-3 space-y-1" style={{ background: "#F8FAF9" }}>
            <div className="flex justify-between text-xs text-[#66796F]"><span>Base imponible</span><span>{euros(baseImponibleTotal)}</span></div>
            <div className="flex justify-between text-xs text-[#66796F]"><span>IVA</span><span>{euros(cuotaIVATotal)}</span></div>
            <div className="flex justify-between text-xl font-bold pt-1.5 mt-1 border-t border-[#E2E9E4]" style={{ color: PRIMARY, fontFamily: "'Playfair Display', serif" }}><span>Total</span><span>{euros(total)}</span></div>
          </div>

          <div className="mt-4">
            <BotonPrimario icon={Receipt} onClick={cobrar} disabled={lineas.length === 0 || guardando}>{guardando ? "Guardando…" : "Cobrar y guardar ticket"}</BotonPrimario>
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// HISTORIAL DE VENTAS
// ════════════════════════════════════════════════════════════════════
function HistorialVentas({ ventas }) {
  const [abierta, setAbierta] = useState(null);
  return (
    <div>
      <Cabecera titulo="Historial de ventas" subtitulo="Todos los tickets emitidos, con IVA desglosado." />
      <Tarjeta className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left">
            <tr className="border-b border-[#E9EFEC]">
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Ticket</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Fecha</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Empleado</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Pago</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Base</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">IVA</th>
              <th className="px-5 py-3.5 font-semibold text-[10.5px] uppercase tracking-wider text-[#8A9A93]">Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.datos.map((v) => (
              <tr key={v.id} className="border-b border-[#F0F4F2] last:border-0 hover:bg-[#F8FAF9] cursor-pointer transition-colors" onClick={() => setAbierta(v)}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${GOLD}22`, color: "#8A6A2E" }}><Receipt size={14} /></div>
                    <span className="text-[#1B2621] font-medium">#{v.numeroTicket}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-[#66796F]">{fechaCorta(v.creadoEn)} · {horaCorta(v.creadoEn)}</td>
                <td className="px-5 py-3 text-[#374842]">{v.empleadoNombre}</td>
                <td className="px-5 py-3"><Badge>{v.metodoPago}</Badge></td>
                <td className="px-5 py-3 text-[#66796F]">{euros(v.baseImponibleTotal)}</td>
                <td className="px-5 py-3 text-[#66796F]">{euros(v.cuotaIVATotal)}</td>
                <td className="px-5 py-3 font-semibold" style={{ color: PRIMARY }}>{euros(v.total)}</td>
              </tr>
            ))}
            {ventas.datos.length === 0 && <tr><td colSpan={7} className="px-5 py-8 text-center text-[#8A9A93]">Sin ventas registradas todavía.</td></tr>}
          </tbody>
        </table>
      </Tarjeta>

      <Modal open={!!abierta} onClose={() => setAbierta(null)} title={abierta ? `Ticket #${abierta.numeroTicket}` : ""}>
        {abierta && (
          <div className="text-sm">
            <p className="text-[#66796F] mb-3">{fechaCorta(abierta.creadoEn)} · {horaCorta(abierta.creadoEn)} · {abierta.empleadoNombre} · {abierta.metodoPago}</p>
            <div className="space-y-1.5 mb-3">
              {abierta.items?.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-[#1B2621]">{it.cantidad}× {it.nombre}</span>
                  <span className="text-[#66796F]">{euros(it.subtotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E9EFEC] pt-2 space-y-1">
              <div className="flex justify-between text-[#66796F]"><span>Base imponible</span><span>{euros(abierta.baseImponibleTotal)}</span></div>
              <div className="flex justify-between text-[#66796F]"><span>IVA</span><span>{euros(abierta.cuotaIVATotal)}</span></div>
              <div className="flex justify-between font-semibold" style={{ color: PRIMARY }}><span>Total</span><span>{euros(abierta.total)}</span></div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// OFERTAS
// ════════════════════════════════════════════════════════════════════
function ModalOferta({ open, onClose, oferta, productos }) {
  const vacio = { productoId: productos[0]?.id || "", tipoDescuento: "porcentaje", valor: "", fechaInicio: "", fechaFin: "", activa: true };
  const [form, setForm] = useState(vacio);
  useEffect(() => { setForm(oferta ? { ...vacio, ...oferta } : vacio); }, [oferta, open]);

  async function guardar() {
    if (!form.productoId || !form.valor) return;
    const data = { ...form, valor: Number(form.valor) };
    if (oferta) await actualizarDoc("proshop_ofertas", oferta.id, data);
    else await crearDoc("proshop_ofertas", data);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={oferta ? "Editar oferta" : "Nueva oferta"}>
      <Field label="Producto">
        <select className={inputCls} value={form.productoId} onChange={(e) => setForm({ ...form, productoId: e.target.value })}>
          {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </Field>
      <Field label="Tipo de descuento">
        <select className={inputCls} value={form.tipoDescuento} onChange={(e) => setForm({ ...form, tipoDescuento: e.target.value })}>
          <option value="porcentaje">Porcentaje (%)</option>
          <option value="importe">Importe fijo (€)</option>
        </select>
      </Field>
      <Field label="Valor del descuento">
        <input type="number" step="0.01" className={inputCls} value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde">
          <input type="date" className={inputCls} value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} />
        </Field>
        <Field label="Hasta">
          <input type="date" className={inputCls} value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} />
        </Field>
      </div>
      <div className="pt-2"><BotonPrimario onClick={guardar}>Guardar oferta</BotonPrimario></div>
    </Modal>
  );
}

function Ofertas({ ofertas, productos }) {
  const [modal, setModal] = useState(null);
  const nombreProducto = (id) => productos.datos.find((p) => p.id === id)?.nombre || "—";

  return (
    <div>
      <Cabecera titulo="Ofertas" subtitulo="Promociones y descuentos activos.">
        <BotonPrimario onClick={() => setModal({})}>Nueva oferta</BotonPrimario>
      </Cabecera>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {ofertas.datos.map((o) => (
          <Tarjeta key={o.id} className="overflow-hidden">
            <div className="h-[3px]" style={{ background: o.activa ? PRIMARY : "#D8E2DC" }} />
            <div className="p-6">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-[#1B2621]">{nombreProducto(o.productoId)}</p>
                <Badge tone={o.activa ? "verde" : "neutral"}>{o.activa ? "Activa" : "Inactiva"}</Badge>
              </div>
              <p className="text-2xl font-bold mt-2" style={{ color: PRIMARY, fontFamily: "'Playfair Display', serif" }}>
                {o.tipoDescuento === "porcentaje" ? `-${o.valor}%` : `-${euros(o.valor)}`}
              </p>
              <p className="text-xs text-[#8A9A93] mt-2 mb-4">{o.fechaInicio || "—"} → {o.fechaFin || "—"}</p>
              <div className="flex items-center gap-1.5 pt-3 border-t border-[#F0F4F2]">
                <button onClick={() => setModal(o)} className="p-1.5 text-[#8A9A93] hover:text-[#1B2621] rounded-lg hover:bg-[#E7EFEB] transition-colors"><Pencil size={15} /></button>
                <button onClick={() => confirm("¿Eliminar esta oferta?") && borrarDoc("proshop_ofertas", o.id)} className="p-1.5 text-[#8A9A93] hover:text-[#C32222] rounded-lg hover:bg-[#FBEAEA] transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          </Tarjeta>
        ))}
        {ofertas.datos.length === 0 && <p className="text-sm text-[#8A9A93] col-span-full py-6 text-center">No hay ofertas creadas todavía.</p>}
      </div>
      <ModalOferta open={!!modal} onClose={() => setModal(null)} oferta={modal?.id ? modal : null} productos={productos.datos} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// EQUIPO
// ════════════════════════════════════════════════════════════════════
function ModalEmpleado({ open, onClose, empleado }) {
  const vacio = { nombre: "", rol: "Recepción / Proshop", pin: "", activo: true };
  const [form, setForm] = useState(vacio);
  useEffect(() => { setForm(empleado ? { ...vacio, ...empleado } : vacio); }, [empleado, open]);
  async function guardar() {
    if (!form.nombre.trim()) return;
    if (empleado) await actualizarDoc("proshop_empleados", empleado.id, form);
    else await crearDoc("proshop_empleados", form);
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title={empleado ? "Editar empleado" : "Nuevo empleado"}>
      <Field label="Nombre completo">
        <input className={inputCls} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
      </Field>
      <Field label="Rol">
        <input className={inputCls} value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} />
      </Field>
      <Field label="PIN de fichaje (4 dígitos)">
        <input inputMode="numeric" maxLength={4} className={inputCls} value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })} />
      </Field>
      <div className="pt-2"><BotonPrimario onClick={guardar}>Guardar</BotonPrimario></div>
    </Modal>
  );
}

function Equipo({ empleados }) {
  const [modal, setModal] = useState(null);
  return (
    <div>
      <Cabecera titulo="Equipo" subtitulo="Personal de Proshop y Recepción.">
        <BotonPrimario onClick={() => setModal({})}>Nuevo empleado</BotonPrimario>
      </Cabecera>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {empleados.datos.map((e) => (
          <Tarjeta key={e.id} className="p-6">
            <div className="flex items-center gap-3.5 mb-4">
              <Avatar nombre={e.nombre} />
              <div className="min-w-0">
                <p className="font-semibold text-[#1B2621] truncate">{e.nombre}</p>
                <p className="text-xs text-[#8A9A93] truncate">{e.rol}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pt-3 border-t border-[#F0F4F2]">
              <Badge tone={e.pin ? "verde" : "neutral"}>{e.pin ? "PIN configurado" : "Sin PIN"}</Badge>
              <button onClick={() => setModal(e)} className="p-1.5 text-[#8A9A93] hover:text-[#1B2621] rounded-lg hover:bg-[#E7EFEB] transition-colors ml-auto"><Pencil size={15} /></button>
            </div>
          </Tarjeta>
        ))}
      </div>
      <ModalEmpleado open={!!modal} onClose={() => setModal(null)} empleado={modal?.id ? modal : null} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [vista, setVista] = useState("panel");
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  const empleados = useColeccion("proshop_empleados", "nombre", "asc");
  const categorias = useColeccion("proshop_categorias", "orden", "asc");
  const productos = useColeccion("proshop_productos", "nombre", "asc");
  const ventas = useColeccion("proshop_ventas", "creadoEn", "desc");
  const fichajes = useColeccion("proshop_fichajes", "entrada", "desc");
  const ofertas = useColeccion("proshop_ofertas", "creadoEn", "desc");

  useSemillas(empleados, categorias);

  const siguienteTicket = useCallback(async () => {
    // Numeración secuencial simple basada en el nº de ventas existentes.
    return (ventas.datos.length || 0) + 1001;
  }, [ventas.datos.length]);

  const titulos = {
    panel: "Panel", ventas: "Ventas (TPV)", historial: "Historial de ventas",
    fichajes: "Fichajes", productos: "Productos", ofertas: "Ofertas", equipo: "Equipo",
  };

  return (
    <div className="min-h-screen flex" style={{ background: BACKGROUND }}>
      <Sidebar vista={vista} setVista={setVista} abierto={sidebarAbierto} setAbierto={setSidebarAbierto} />
      <div className="flex-1 min-w-0">
        <TopBar setAbierto={setSidebarAbierto} titulo={titulos[vista]} />
        <main className="p-4 md:p-10 max-w-6xl mx-auto">
          {vista === "panel" && <Panel ventas={ventas} productos={productos} fichajes={fichajes} />}
          {vista === "ventas" && <TPV productos={productos} empleados={empleados} siguienteTicket={siguienteTicket} />}
          {vista === "historial" && <HistorialVentas ventas={ventas} />}
          {vista === "fichajes" && <Fichajes empleados={empleados} fichajes={fichajes} />}
          {vista === "productos" && <Productos productos={productos} categorias={categorias} />}
          {vista === "ofertas" && <Ofertas ofertas={ofertas} productos={productos} />}
          {vista === "equipo" && <Equipo empleados={empleados} />}
        </main>
      </div>
    </div>
  );
}
