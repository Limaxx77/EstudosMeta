import { Fragment, type ReactNode } from 'react';

/**
 * Renderiza texto simples com quebras de linha, **negrito** e *itálico*.
 * Usado para reproduzir os destaques dos cadernos de prova.
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? 'mt-3' : undefined}>
          {p.split('\n').map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {inline(line)}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}

function inline(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    out.push(
      m[1] !== undefined ? (
        <strong key={m.index} className="font-bold text-white underline decoration-accent/60 decoration-2 underline-offset-2">
          {m[1]}
        </strong>
      ) : (
        <em key={m.index}>{m[2]}</em>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}
