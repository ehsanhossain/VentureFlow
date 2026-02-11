import React from 'react';

interface BrandSpinnerProps {
  /**
   * Size of the spinner
   * sm = 48px, md = 96px, lg = 144px
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

export const BrandSpinner: React.FC<BrandSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  // 1. Map string sizes to pixel values
  const sizeMap = {
    sm: 48,
    md: 96,
    lg: 144,
  };

  const pixelSize = sizeMap[size];

  // 2. Define Brand Colors
  const COLOR_PRIMARY = '#064771';
  const COLOR_TRACK = '#E5E7EB';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: pixelSize, height: pixelSize }}
      role="status"
      aria-label="Loading"
    >
      {/* 3. Inline Styles for Animation */}
      <style>{`
        @keyframes brand-fill-path {
          0% { stroke-dasharray: 0 200; stroke-dashoffset: 0; opacity: 0; }
          10% { opacity: 1; }
          60% { stroke-dasharray: 200 200; stroke-dashoffset: 0; }
          100% { stroke-dasharray: 200 200; stroke-dashoffset: -200; opacity: 0; }
        }
        @keyframes brand-pulse-arrow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        
        /* Track Layer Styles (Static) */
        .brand-track-stroke {
          stroke: ${COLOR_TRACK};
          fill: none;
          stroke-width: 8px;
          stroke-miterlimit: 10;
          stroke-linecap: round;
        }
        .brand-track-fill {
          fill: ${COLOR_TRACK};
        }

        /* Active Layer Styles (Animated) */
        .brand-active-stroke {
          stroke: ${COLOR_PRIMARY};
          fill: none;
          stroke-width: 8px;
          stroke-miterlimit: 10;
          stroke-linecap: round;
          /* Animation Config */
          stroke-dasharray: 200;
          stroke-dashoffset: 200;
          animation: brand-fill-path 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .brand-active-fill {
          fill: ${COLOR_PRIMARY};
          animation: brand-pulse-arrow 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Layer 1: The Inactive Track (Background) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 214.18 168.05"
        className="absolute inset-0 w-full h-full"
      >
        <g>
          <path className="brand-track-stroke" d="M87.32,113.2v6.86c0,1.63-1.07,3.13-2.66,3.51-.83.2-1.45.17-1.45.17-17.21,1.34-32.15-12.18-32.2-29.77-.04-13.24,9-25.12,21.73-28.76,9.35-2.68,18.46-.48,25.19,4.74,7.99,6.2,25.81,23.2,32.5,30.36" />
          <polygon className="brand-track-fill" points="109.97 98.28 129.15 98.93 129.79 79.76 137.65 88.17 137.01 107.34 117.84 106.69 109.97 98.28" />
        </g>
        <g>
          <path className="brand-track-stroke" d="M119.05,74.69v-6.86c0-1.63,1.07-3.13,2.66-3.51.83-.2,1.45-.17,1.45-.17,17.21-1.34,32.15,12.18,32.2,29.77.04,13.24-9,25.12-21.73,28.76-9.35,2.68-18.46.48-25.19-4.74-7.99-6.2-25.81-23.2-32.5-30.36" />
          <polygon className="brand-track-fill" points="96.4 89.61 77.22 88.95 76.58 108.13 68.72 99.72 69.37 80.55 88.53 81.19 96.4 89.61" />
        </g>
      </svg>

      {/* Layer 2: The Active Animation (Foreground) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 214.18 168.05"
        className="absolute inset-0 w-full h-full"
      >
        <g>
          <path className="brand-active-stroke" d="M87.32,113.2v6.86c0,1.63-1.07,3.13-2.66,3.51-.83.2-1.45.17-1.45.17-17.21,1.34-32.15-12.18-32.2-29.77-.04-13.24,9-25.12,21.73-28.76,9.35-2.68,18.46-.48,25.19,4.74,7.99,6.2,25.81,23.2,32.5,30.36" />
          <polygon className="brand-active-fill" points="109.97 98.28 129.15 98.93 129.79 79.76 137.65 88.17 137.01 107.34 117.84 106.69 109.97 98.28" />
        </g>
        {/* We keep both groups synchronized for a cohesive filling effect */}
        <g>
          <path className="brand-active-stroke" d="M119.05,74.69v-6.86c0-1.63,1.07-3.13,2.66-3.51.83-.2,1.45-.17,1.45-.17,17.21-1.34,32.15,12.18,32.2,29.77.04,13.24-9,25.12-21.73,28.76-9.35,2.68-18.46.48-25.19-4.74-7.99-6.2-25.81-23.2-32.5-30.36" />
          <polygon className="brand-active-fill" points="96.4 89.61 77.22 88.95 76.58 108.13 68.72 99.72 69.37 80.55 88.53 81.19 96.4 89.61" />
        </g>
      </svg>
    </div>
  );
};

export default BrandSpinner;