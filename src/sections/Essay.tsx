import { FilePlus2, FileText, Pencil, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../components/Toast';
import { Badge, Button, Card, Empty, Field, SectionHeader, cx, inputCls } from '../components/ui';
import { ESSAY_THEMES } from '../data/extras';
import { useStore } from '../hooks/useStore';
import { todayISO } from '../utils/date';
import { uid } from '../utils/format';

const CHARS_PER_LINE = 65; // média aproximada de uma linha manuscrita na folha de resposta

export function estimateLines(text: string): number {
  return text
    .split('\n')
    .filter((p) => p.trim().length > 0)
    .reduce((a, p) => a + Math.max(1, Math.ceil(p.trim().length / CHARS_PER_LINE)), 0);
}

export function Essay() {
  const { state, update } = useStore();
  const toast = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [themeChoice, setThemeChoice] = useState(ESSAY_THEMES[0]);
  const [customTheme, setCustomTheme] = useState('');
  const [text, setText] = useState('');
  const [score, setScore] = useState('');
  const [notes, setNotes] = useState('');

  const theme = themeChoice === '__custom' ? customTheme.trim() : themeChoice;
  const lines = estimateLines(text);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineTone = lines === 0 ? 'neutral' : lines < 20 ? 'bad' : lines > 30 ? 'warn' : 'ok';
  const scoreNum = score === '' ? null : Number(score.replace(',', '.'));
  const scoreValid = scoreNum === null || (Number.isFinite(scoreNum) && scoreNum >= 0 && scoreNum <= 100);

  const reset = () => {
    setEditingId(null);
    setText('');
    setScore('');
    setNotes('');
    setCustomTheme('');
    setThemeChoice(ESSAY_THEMES[0]);
  };

  const save = () => {
    if (!theme) return toast('Escolha ou escreva um tema.', 'bad');
    if (!text.trim()) return toast('Escreva o texto antes de salvar.', 'bad');
    if (!scoreValid) return toast('A nota deve estar entre 0 e 100.', 'bad');
    const now = Date.now();
    update((d) => {
      if (editingId) {
        const e = d.essays.find((x) => x.id === editingId);
        if (e) Object.assign(e, { theme, text, score: scoreNum, notes, updatedAt: now });
      } else {
        d.essays.push({ id: uid(), theme, text, score: scoreNum, notes, createdAt: now, updatedAt: now });
        // Marca a redação do dia, se o dia de hoje pedir redação.
        const today = todayISO(now);
        if (d.days[today]) d.days[today].essayDone = true;
        else d.days[today] = { mainDone: false, compDone: false, errorsCorrected: false, reviewDone: false, essayDone: true, completed: false, notes: '' };
      }
    });
    toast(editingId ? 'Redação atualizada.' : 'Redação salva.');
    reset();
  };

  const edit = (id: string) => {
    const e = state.essays.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    if (ESSAY_THEMES.includes(e.theme)) setThemeChoice(e.theme);
    else {
      setThemeChoice('__custom');
      setCustomTheme(e.theme);
    }
    setText(e.text);
    setScore(e.score === null ? '' : String(e.score));
    setNotes(e.notes);
    document.getElementById('redacao-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="redacao" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14">
      <SectionHeader
        eyebrow="Prova discursiva"
        title="Treino de redação"
        icon={<FileText size={14} />}
        subtitle="Na prova: texto de 20 a 30 linhas, manuscrito, sobre conhecimento específico do cargo. Conteúdo vale 80 pontos e correção formal, 20. Abaixo de 20 linhas = nota zero."
      />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card className="scroll-mt-24 p-5" >
          <div id="redacao-editor" className="scroll-mt-24" />
          <div className="grid gap-3">
            <Field label="Tema">
              <select className={inputCls} value={themeChoice} onChange={(e) => setThemeChoice(e.target.value)}>
                {ESSAY_THEMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__custom">Outro tema...</option>
              </select>
            </Field>
            {themeChoice === '__custom' && <input className={inputCls} placeholder="Digite o tema" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} aria-label="Tema personalizado" />}
            <textarea
              className={`${inputCls} min-h-[320px] resize-y font-serif text-[15px] leading-7`}
              placeholder="Escreva seu texto aqui. Introdução, desenvolvimento e conclusão, com linguagem formal."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Texto da redação"
            />
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Badge tone={lineTone}>≈ {lines} linhas manuscritas</Badge>
              <span className="text-slate-500">{words} palavras · estimativa de ~{CHARS_PER_LINE} caracteres por linha</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
              <Field label="Nota (0–100)">
                <input className={cx(inputCls, !scoreValid && 'border-bad')} inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} placeholder="manual" />
              </Field>
              <Field label="Observações">
                <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="O que melhorar?" />
              </Field>
            </div>
            <p className="text-[11px] text-slate-500">A nota é atribuída por você (ou por quem corrigir). Não há correção automática por IA.</p>
            <div className="flex gap-2">
              <Button variant="primary" onClick={save} className="flex-1 sm:flex-none">
                <Save size={16} /> {editingId ? 'Salvar alterações' : 'Salvar redação'}
              </Button>
              {editingId && (
                <Button variant="ghost" onClick={reset}>
                  <FilePlus2 size={16} /> Nova
                </Button>
              )}
            </div>
          </div>
        </Card>
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Minhas redações ({state.essays.length})</div>
          {state.essays.length === 0 ? (
            <Empty>Nenhuma redação salva.</Empty>
          ) : (
            <div className="grid gap-3">
              {[...state.essays].reverse().map((e) => (
                <Card key={e.id} className={cx('p-4', editingId === e.id && 'border-accent/50')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">{new Date(e.updatedAt).toLocaleDateString('pt-BR')} · ≈ {estimateLines(e.text)} linhas</div>
                      <div className="mt-0.5 text-sm font-semibold leading-snug text-white">{e.theme}</div>
                    </div>
                    {e.score !== null && <span className="font-mono text-lg font-bold text-accent">{e.score}</span>}
                  </div>
                  {e.notes && <p className="mt-1 text-xs text-slate-400">{e.notes}</p>}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => edit(e.id)}>
                      <Pencil size={13} /> Abrir / editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (!window.confirm('Excluir esta redação?')) return;
                        update((d) => void (d.essays = d.essays.filter((x) => x.id !== e.id)));
                        if (editingId === e.id) reset();
                      }}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
