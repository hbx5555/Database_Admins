import type { ReactNode } from 'react';

interface Props {
  caption: string;
  left: ReactNode;
  right: ReactNode;
}

export function TableView({ caption, left, right }: Props) {
  return (
    <div>
      <p className="text-sm text-[#4A6B52] mb-5 font-['Geist',ui-monospace,monospace] italic">
        {caption}
      </p>
      <div className="flex gap-8 items-start">
        <div className="flex-1 min-w-0">{left}</div>
        <div className="flex-1 min-w-0">{right}</div>
      </div>
    </div>
  );
}
