import { memo } from "react";
interface Props {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  active: boolean;
}
export const AnnotationLine = memo(function AnnotationLine({ x1, y1, x2, y2, color, active }: Props) {
  return (
    <g className="transition-opacity" opacity={active ? 1 : 0.75}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={active ? 2 : 1.25} />
      <circle cx={x2} cy={y2} r={2.5} fill={color} />
    </g>
  );
});
