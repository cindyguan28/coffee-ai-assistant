import { SENSORY_DIMENSIONS, type SensoryDimension } from "../../lib/coffee/taste";

export function TasteRadar({ values }: { values: Record<SensoryDimension, number | null> }) {
  const center = 150;
  const radius = 105;
  const point = (index: number, scale: number) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / SENSORY_DIMENSIONS.length;
    return `${center + Math.cos(angle) * radius * scale},${center + Math.sin(angle) * radius * scale}`;
  };
  const polygon = SENSORY_DIMENSIONS.map((dimension, index) => point(index, (values[dimension] ?? 0) / 5)).join(" ");
  return <div className="radar-wrap"><svg className="taste-radar" viewBox="0 0 300 300" role="img" aria-label="Six-dimensional personal taste radar">
    {[1, .75, .5, .25].map((scale) => <polygon key={scale} points={SENSORY_DIMENSIONS.map((_, index) => point(index, scale)).join(" ")} className="radar-grid" />)}
    {SENSORY_DIMENSIONS.map((dimension, index) => <g key={dimension}><line x1={center} y1={center} x2={point(index, 1).split(",")[0]} y2={point(index, 1).split(",")[1]} className="radar-axis" /><text x={point(index, 1.18).split(",")[0]} y={point(index, 1.18).split(",")[1]} className="radar-label">{dimension === "body" ? "mouthfeel" : dimension === "sweetness" ? "natural sweetness" : dimension === "balance" ? "overall balance" : dimension}</text></g>)}
    <polygon points={polygon} className="radar-data" />
  </svg></div>;
}
