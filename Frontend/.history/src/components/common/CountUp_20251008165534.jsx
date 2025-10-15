import React, { useEffect, useState, useRef } from 'react';

const CountUp = ({ 
  end, 
  start = 0, 
  duration = 1000, 
  decimals = 0, 
  prefix = '', 
  suffix = '', 
  className = '',
  formatter = null,
  trigger = true
}) => {
  const [count, setCount] = useState(start);
  const [isAnimating, setIsAnimating] = useState(false);
  const frameRef = useRef();
  const startTimeRef = useRef();
  const prevEndRef = useRef(start);

  useEffect(() => {
    if (!trigger || end === prevEndRef.current) return;

    setIsAnimating(true);
    startTimeRef.current = Date.now();
    const startValue = prevEndRef.current;
    prevEndRef.current = end;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (end - startValue) * easeOutCubic;
      setCount(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, trigger]);

  const formatValue = (value) => {
    if (formatter) {
      return formatter(value);
    }
    
    const fixedValue = decimals > 0 ? value.toFixed(decimals) : Math.floor(value);
    return `${prefix}${fixedValue}${suffix}`;
  };

  return (
    <span className={`${className} ${isAnimating ? 'transition-all' : ''}`}>
      {formatValue(count)}
    </span>
  );
};

export default CountUp;
