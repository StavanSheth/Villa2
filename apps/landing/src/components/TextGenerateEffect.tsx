import { motion, stagger, useAnimate } from 'framer-motion';
import * as React from 'react';

function cn(...classes: (string | undefined | null | boolean)[]) {
  return classes.filter(Boolean).join(' ');
}

type TextGenerateEffectProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  words: string;
  filter?: boolean;
  duration?: number;
  staggerDelay?: number;
  splitBy?: 'word' | 'character';
  delay?: number;
};

const TextGenerateEffect = React.forwardRef<
  HTMLDivElement,
  TextGenerateEffectProps
>(
  (
    {
      words,
      className,
      filter = true,
      duration = 0.5,
      staggerDelay = 0.2,
      splitBy = 'word',
      delay = 0,
      ...props
    },
    ref,
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement);

    const [scope, animate] = useAnimate();
    const itemsArray = React.useMemo(
      () => (splitBy === 'character' ? words.split('') : words.split(' ')),
      [words, splitBy],
    );

    React.useEffect(() => {
      if (scope.current) {
        animate(
          'span',
          {
            opacity: 1,
            filter: filter ? 'blur(0px)' : 'none',
            y: 0,
            scale: 1,
          },
          {
            duration,
            delay: stagger(staggerDelay, { startDelay: delay }),
            ease: [0.16, 1, 0.3, 1],
          },
        );
      }
    }, [animate, delay, duration, filter, scope, staggerDelay]);

    return (
      <div
        className={cn('', className)}
        data-slot="text-generate-effect"
        ref={localRef}
        {...props}
      >
        <motion.div ref={scope} className="inline">
          {itemsArray.map((item, idx) => (
            <motion.span
              className="opacity-0 will-change-transform will-change-opacity will-change-filter inline-block"
              key={`${item}-${idx}`}
              style={{
                filter: filter ? 'blur(12px)' : 'none',
                transform: 'translateY(14px) scale(0.95)',
              }}
            >
              {splitBy === 'character'
                ? item === ' '
                  ? '\u00A0'
                  : item
                : `${item} `}
            </motion.span>
          ))}
        </motion.div>
      </div>
    );
  },
);

TextGenerateEffect.displayName = 'TextGenerateEffect';

export { TextGenerateEffect, type TextGenerateEffectProps };
export default TextGenerateEffect;
