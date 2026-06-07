import React from 'react';

export default function IsraeliFlag({ className = "w-10 h-7" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 220 160" 
      className={`${className} border border-gray-150 rounded shadow-xs shrink-0 bg-white animate-waving-flag inline-block select-none`} 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pure White Background */}
      <rect width="220" height="160" fill="#ffffff" />
      
      {/* Top Blue Stripe */}
      <rect y="20" width="220" height="25" fill="#0038b8" />
      
      {/* Bottom Blue Stripe */}
      <rect y="115" width="220" height="25" fill="#0038b8" />
      
      {/* Star of David (Magen David) representing the national heritage */}
      <g transform="translate(110, 80) scale(0.85)">
        {/* Triangle Pointing Up */}
        <polygon 
          points="0,-24 21,12 -21,12" 
          fill="none" 
          stroke="#0038b8" 
          strokeWidth="4.5" 
          strokeLinejoin="round"
        />
        {/* Triangle Pointing Down */}
        <polygon 
          points="0,24 21,-12 -21,-12" 
          fill="none" 
          stroke="#0038b8" 
          strokeWidth="4.5" 
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
