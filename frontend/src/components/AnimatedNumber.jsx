import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

export default function AnimatedNumber({ value, duration = 0.9, className }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{display}</span>;
}
