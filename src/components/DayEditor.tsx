import { RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import { BASE_SCHEDULE } from '../data/schedule';
import { SUBJECTS, SUBJECT_MAP } from '../data/subjects';
import { useStore } from '../hooks/useStore';
import type { DayKind, DayPlan, SubjectId } from '../types';
import { fmtDateFull } from '../utils/date';
import { useToast } from './Toast';
import { Button, Field, Modal, inputCls } from './ui';

const KINDS: { v: DayKind; l: string }[] = [
  { v: 'normal', l: 'Estudo' },
  { v: 'revisao', l: 'Revisão' },
  { v: 'simulado', l: 'Simulado' },
  { v: 'final', l: 'Reta final' },
];

export function DayEditor({ plan, onClose }: { plan: DayPlan; onClose: () => void }) {
  const { update } = useStore();
  const toast = useToast();
  const [f, setF] = useState<DayPlan>(plan);
  const set = <K extends keyof DayPlan>(k: K, v: DayPlan[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = () => {
    if (!f.mainTopic.trim() || !f.compTopic.trim()) {
      toast('Preencha os dois assuntos.', 'bad');
      return;
    }
    if (!Number.isInteger(f.questions) || f.questions < 0 || f.questions > 500) {
      toast('Quantidade de questões inválida (0 a 500).', 'bad');
      return;
    }
    update((d) => {
      const { date: _date, ...rest } = f;
      void _date;
      d.scheduleOverrides[plan.date] = { ...rest, mainTopic: rest.mainTopic.trim(), compTopic: rest.compTopic.trim(), extra: rest.extra?.trim() || undefined };
    });
    toast(`Dia ${fmtDateFull(plan.date)} atualizado.`);
    onClose();
  };

  const restore = () => {
    if (!window.confirm('Restaurar o planejamento original deste dia?')) return;
    update((d) => {
      delete d.scheduleOverrides[plan.date];
    });
    toast('Planejamento original restaurado.', 'info');
    onClose();
  };

  const original = BASE_SCHEDULE.find((d) => d.date === plan.date);

  return (
    <Modal open onClose={onClose} title={`Editar ${fmtDateFull(plan.date)}`}>
      <div className="grid gap-4">
        <Field label="Tipo do dia">
          <select className={inputCls} value={f.kind} onChange={(e) => set('kind', e.target.value as DayKind)}>
            {KINDS.map((k) => (
              <option key={k.v} value={k.v}>
                {k.l}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Matéria principal">
            <select className={inputCls} value={f.mainSubject} onChange={(e) => set('mainSubject', e.target.value as SubjectId)}>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assunto principal">
            <input className={inputCls} list="ed-main" value={f.mainTopic} onChange={(e) => set('mainTopic', e.target.value)} />
            <datalist id="ed-main">
              {SUBJECT_MAP[f.mainSubject].topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Matéria complementar">
            <select className={inputCls} value={f.compSubject} onChange={(e) => set('compSubject', e.target.value as SubjectId)}>
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assunto complementar">
            <input className={inputCls} list="ed-comp" value={f.compTopic} onChange={(e) => set('compTopic', e.target.value)} />
            <datalist id="ed-comp">
              {SUBJECT_MAP[f.compSubject].topics.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <Field label="Meta de questões">
            <input className={inputCls} type="number" inputMode="numeric" min={0} value={f.questions} onChange={(e) => set('questions', Math.max(0, parseInt(e.target.value || '0', 10)))} />
          </Field>
          <Field label="Atividade extra" hint='Se contiver "redação", a redação vira requisito da meta.'>
            <input className={inputCls} value={f.extra ?? ''} placeholder="ex.: 1 redação discursiva" onChange={(e) => set('extra', e.target.value)} />
          </Field>
        </div>
        {original && (
          <p className="text-[11px] text-slate-500">
            Original: {SUBJECT_MAP[original.mainSubject].short} — {original.mainTopic} · {SUBJECT_MAP[original.compSubject].short} — {original.compTopic} · {original.questions} questões
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="ghost" onClick={restore}>
            <RotateCcw size={16} /> Restaurar original
          </Button>
          <Button variant="primary" onClick={save}>
            <Save size={16} /> Salvar alterações
          </Button>
        </div>
      </div>
    </Modal>
  );
}
