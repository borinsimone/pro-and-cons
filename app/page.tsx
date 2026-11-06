"use client";

import { FormEvent, useEffect, useState } from "react";

type Side = "pros" | "cons";
type Item = { id: string; text: string };
type Topic = { id: string; title: string; category: string; notes: string; done: boolean; updated: number; pros: Item[]; cons: Item[] };
type Editor = { kind: "topic"; topic?: Topic } | { kind: "item"; side: Side; item?: Item } | { kind: "delete"; side?: Side; item?: Item };
type Filter = "all" | "open" | "done";

const storageKey = "a-mente.topics.v1";
const labels = { pros: "pro", cons: "contro" };
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const formatDate = new Intl.DateTimeFormat("it", { day: "numeric", month: "short", year: "numeric" });
const formatTime = new Intl.DateTimeFormat("it", { hour: "2-digit", minute: "2-digit" });

function dateLabel(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Oggi";
  today.setDate(today.getDate() - 1);
  return date.toDateString() === today.toDateString() ? "Ieri" : formatDate.format(date);
}

export default function Home() {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [active, setActive] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [recent, setRecent] = useState(true);
  const [menu, setMenu] = useState(false);
  const [editor, setEditor] = useState<Editor>();
  const [error, setError] = useState("");

  useEffect(() => {
    function syncRoute() {
      setActive(location.hash.slice(1));
      setMenu(false);
      setEditor(undefined);
    }

    function read() {
      try {
        const value = localStorage.getItem(storageKey);
        const saved = value ? JSON.parse(value) : [];
        if (!Array.isArray(saved)) throw new Error("Archivio non valido");
        setTopics(saved);
        setError("");
      } catch {
        setError("Impossibile leggere il taccuino su questo dispositivo.");
      }
    }

    read();
    syncRoute();
    window.addEventListener("hashchange", syncRoute);
    function syncStorage(event: StorageEvent) {
      if (event.key === storageKey || event.key === null) read();
    }
    window.addEventListener("storage", syncStorage);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(basePath + "/sw.js").catch(console.warn);
    }
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  const entries = topics ?? [];
  const topic = entries.find((entry) => entry.id === active);
  const counts = { all: entries.length, open: entries.filter((entry) => !entry.done).length, done: entries.filter((entry) => entry.done).length };
  const search = query.trim().toLocaleLowerCase("it");
  const visible = entries.filter((entry) =>
    (filter === "all" || entry.done === (filter === "done")) &&
    [entry.title, entry.category, entry.notes].some((value) => value.toLocaleLowerCase("it").includes(search))
  ).sort((a, b) => recent ? b.updated - a.updated : a.title.localeCompare(b.title, "it"));

  function save(change: (current: Topic[]) => Topic[]) {
    if (!topics) return false;
    try {
      const stored = localStorage.getItem(storageKey);
      const next = change(stored ? JSON.parse(stored) : []);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setTopics(next);
      setError("");
      return true;
    } catch {
      setError("Salvataggio non riuscito. Controlla lo spazio disponibile o le impostazioni del browser.");
      return false;
    }
  }

  function updateTopic(id: string, change: (current: Topic) => Topic) {
    return save((current) => current.map((entry) => entry.id === id ? { ...change(entry), updated: Date.now() } : entry));
  }

  function navigate(id = "") {
    if (id) location.hash = id;
    else if (location.hash) history.pushState(null, "", location.pathname + location.search);
    setActive(id);
    setMenu(false);
    window.scrollTo(0, 0);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => String(data.get(name) ?? "").trim();
    if (editor?.kind === "topic") {
      const title = field("title");
      if (!title) return;
      const fields = { title, category: field("category"), notes: field("notes") };
      const existing = editor.topic;
      const id = existing?.id ?? crypto.randomUUID();
      const saved = existing
        ? updateTopic(id, (entry) => ({ ...entry, ...fields }))
        : save((current) => [...current, { ...fields, id, updated: Date.now(), done: false, pros: [], cons: [] }]);
      if (!saved) return;
      navigate(id);
    } else if (editor?.kind === "item" && topic) {
      const text = field("text");
      if (!text) return;
      const { side, item } = editor;
      if (!updateTopic(topic.id, (entry) => ({
        ...entry,
        [side]: item ? entry[side].map((row) => row.id === item.id ? { ...row, text } : row)
          : [...entry[side], { id: crypto.randomUUID(), text }],
      }))) return;
    } else if (editor?.kind === "delete" && topic) {
      const { side, item } = editor;
      if (side && item) {
        if (!updateTopic(topic.id, (entry) => ({ ...entry, [side]: entry[side].filter((row) => row.id !== item.id) }))) return;
      } else {
        if (!save((current) => current.filter((entry) => entry.id !== topic.id))) return;
        navigate();
      }
    }
    setEditor(undefined);
  }

  return (
    <main className="shell">
      <header className="top">
        {topic ? (
          <>
            <button className="back" onClick={() => navigate()}><span aria-hidden="true">←</span> Archivio</button>
            <div className="menu-wrap">
              <button className="icon" aria-label="Azioni argomento" aria-expanded={menu} onClick={() => setMenu(!menu)}>···</button>
              {menu && <div className="menu">
                <button onClick={() => { setMenu(false); setEditor({ kind: "topic", topic }); }}>Modifica argomento</button>
                <button onClick={() => { updateTopic(topic.id, (entry) => ({ ...entry, done: !entry.done })); setMenu(false); }}>{topic.done ? "Riapri riflessione" : "Segna come concluso"}</button>
                <button className="danger" onClick={() => { setMenu(false); setEditor({ kind: "delete" }); }}>Elimina argomento</button>
              </div>}
            </div>
          </>
        ) : (
          <>
            <div className="brand"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 20h14m-7 0v-8m0 2c-5 0-7-2-7-6 4 0 7 2 7 6Zm0-3c0-4 2-6 7-6 0 4-3 6-7 6Z"/></svg>a mente</div>
          </>
        )}
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      {topic ? (
        <>
          <div className="detail-meta"><span className="eyebrow">{topic.category || "Riflessione"}</span><span className="status">{topic.done ? "✓ Scelta fatta" : "In riflessione"}</span></div>
          <h1>{topic.title}</h1>
          {topic.notes && <p className="intro notes">{topic.notes}</p>}
          <div className="balance">
            <div className="spread"><span>{topic.pros.length} pro</span><span className="danger">{topic.cons.length} contro</span></div>
            <div className="meter" aria-hidden="true">
              {!!topic.pros.length && <span style={{ flex: topic.pros.length }} />}
              {!!topic.cons.length && <span className="negative" style={{ flex: topic.cons.length }} />}
            </div>
            <small>Conta ciò che per te ha valore.</small>
          </div>
          {(["pros", "cons"] as const).map((side) => (
            <section className={`side ${side}`} key={side} aria-labelledby={side}>
              <h2 id={side}><span aria-hidden="true">{side === "pros" ? "+" : "−"}</span> {side === "pros" ? "Pro" : "Contro"} <small>{topic[side].length}</small></h2>
              {topic[side].length ? <ul>{topic[side].map((item) => <li key={item.id}>
                <button onClick={() => setEditor({ kind: "item", side, item })}><span aria-hidden="true">{side === "pros" ? "+" : "−"}</span>{item.text}<span className="edit-mark" aria-hidden="true">✎</span></button>
              </li>)}</ul> : <p className="side-empty">Ancora nessun {labels[side]}.</p>}
            </section>
          ))}
          <p className="saved">✓ Salvato · {dateLabel(topic.updated)}, {formatTime.format(topic.updated)}</p>
          <div className="actions">
            <button className="primary" onClick={() => setEditor({ kind: "item", side: "pros" })}>＋ Aggiungi pro</button>
            <button className="secondary" onClick={() => setEditor({ kind: "item", side: "cons" })}>＋ Aggiungi contro</button>
          </div>
        </>
      ) : (
        <>
          <h1>I tuoi argomenti</h1>
          <p className="intro">Ogni pensiero, un po’ più a fuoco.</p>
          <div className="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" aria-label="Cerca un argomento" placeholder="Cerca un argomento" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="filters">{(["all", "open", "done"] as const).map((key, index) => (
            <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{["Tutti", "In riflessione", "Conclusi"][index]} · {counts[key]}</button>
          ))}</div>
          <div className="list-heading spread"><span className="eyebrow">Il tuo taccuino</span><button onClick={() => setRecent(!recent)}>{recent ? "Più recenti ↓" : "Titolo A–Z"}</button></div>
          <div className="cards">
            {visible.map((entry) => <a className="card" key={entry.id} href={`#${entry.id}`} onClick={(event) => { event.preventDefault(); navigate(entry.id); }}>
              <div className="spread"><span className="eyebrow">{entry.category || "Riflessione"}</span><span className={entry.done ? "done" : ""}>{entry.done ? "✓ Scelta fatta" : "In riflessione"}</span></div>
              <div className="spread card-title"><h2>{entry.title}</h2><span aria-hidden="true">↗</span></div>
              <div className="spread"><span className="tally">{entry.pros.length} pro <b>·</b> <span className="danger">{entry.cons.length} contro</span></span><span>{dateLabel(entry.updated)}</span></div>
            </a>)}
            {topics && !visible.length && <div className="empty">
              <h2>{entries.length ? "Nessun risultato" : "Fai spazio a un pensiero."}</h2>
              <p>{entries.length ? "Prova a cambiare ricerca o filtro." : "Aggiungi un argomento e metti a fuoco i tuoi pro e contro."}</p>
              {!!entries.length && <button className="back" onClick={() => { setQuery(""); setFilter("all"); }}>Mostra tutti</button>}
            </div>}
          </div>
          <div className="actions"><button className="primary" disabled={!topics} onClick={() => setEditor({ kind: "topic" })}>＋ Nuovo argomento</button></div>
        </>
      )}
      {editor && <EditorDialog editor={editor} error={error} close={() => setEditor(undefined)} submit={submit} onDelete={(side, item) => setEditor({ kind: "delete", side, item })} />}
    </main>
  );
}

function EditorDialog({ editor, close, submit, onDelete, error }: {
  editor: Editor; close: () => void; submit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (side: Side, item: Item) => void; error: string;
}) {
  const title = editor.kind === "topic" ? (editor.topic ? "Modifica argomento" : "Nuovo argomento")
    : editor.kind === "item" ? `${editor.item ? "Modifica" : "Aggiungi"} ${labels[editor.side]}`
    : (editor.item ? "Eliminare questa voce?" : "Eliminare l’argomento?");

  return <dialog ref={(node) => { if (node && !node.open) node.showModal(); }} onCancel={(event) => { event.preventDefault(); close(); }} aria-labelledby="dialog-title">
    <form onSubmit={submit} key={editor.kind}>
      <div className="spread dialog-head"><h2 id="dialog-title">{title}</h2><button type="button" className="icon" aria-label="Chiudi" onClick={close}>×</button></div>
      {editor.kind === "topic" && <>
        <label>Titolo<input name="title" required pattern=".*\S.*" maxLength={100} defaultValue={editor.topic?.title} placeholder="Es. Cambiare lavoro?" /></label>
        <label>Categoria<input name="category" maxLength={40} defaultValue={editor.topic?.category} placeholder="Es. Lavoro" /></label>
        <label>Note<textarea name="notes" rows={3} maxLength={2000} defaultValue={editor.topic?.notes} placeholder="Cosa vuoi chiarire?" /></label>
      </>}
      {editor.kind === "item" && <label>La tua riflessione<input name="text" required pattern=".*\S.*" maxLength={500} defaultValue={editor.item?.text} /></label>}
      {editor.kind === "delete" && <p>{editor.item ? "La voce verrà rimossa dal taccuino." : "Verranno rimossi anche tutti i pro e i contro associati."}</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="dialog-actions">
        {editor.kind === "item" && editor.item && <button className="secondary" type="button" onClick={() => onDelete(editor.side, editor.item!)}>Elimina voce</button>}
        {editor.kind === "delete" && <button className="neutral" type="button" onClick={close}>Annulla</button>}
        <button className={editor.kind === "delete" ? "secondary" : "primary"} type="submit">{editor.kind === "delete" ? "Elimina" : "Salva"}</button>
      </div>
    </form>
  </dialog>;
}
