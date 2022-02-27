import * as React from 'react';
import { ElementProps } from '../ElementProps';

export const CandyCane: React.FC<ElementProps> = ({
  id,
  colors = {
    off: '#333',
    on: 'red',
  },

  dimmable,
}) => {
  return (
    <svg
      style={{ fill: colors.off }}
      width="inherit"
      height="inherit"
      viewBox="0 0 640 1280"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g
        transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
        stroke="none"
      >
        <path
          id={id}
          fill="inherit"
          data-color-on={colors.on}
          data-color-off={colors.off}
          data-color-default={colors.off}
          data-dimmable={dimmable ? 'true' : 'false'}
          d="M2960 12789 c-377 -38 -767 -179 -1084 -390 -369 -246 -642 -557
-831 -944 -121 -246 -181 -434 -227 -712 l-22 -128 -3 -4978 c-3 -4290 -1
-4991 11 -5074 36 -242 214 -452 450 -530 69 -22 99 -27 201 -27 132 -1 190
12 301 66 166 81 294 239 351 433 17 57 18 321 23 5070 l5 5010 23 77 c59 203
131 334 257 467 113 119 215 190 365 253 224 95 482 110 718 42 333 -96 602
-353 711 -679 35 -105 48 -181 60 -360 11 -150 33 -232 88 -323 130 -214 337
-332 582 -332 249 0 481 147 591 375 59 123 74 210 67 387 -22 506 -186 957
-500 1373 -87 114 -334 359 -454 448 -335 248 -705 403 -1103 462 -136 20
-445 28 -580 14z"
        />
      </g>
    </svg>
  );
};
