/**
 * Copyright (c) 2026 VentureFlow. All rights reserved.
 * Unauthorized copying, modification, or distribution of this file is strictly prohibited.
 */

import React from 'react';

interface PartnershipStructureIconProps {
  isActive: boolean;
}

const PartnershipStructureIcon: React.FC<PartnershipStructureIconProps> = ({ isActive }) => {
  return (
    <div>
      {isActive ? (
       <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
       <path d="M6.90004 3.70002C6.90004 5.1912 5.6912 6.40004 4.20002 6.40004C2.70884 6.40004 1.5 5.1912 1.5 3.70002C1.5 2.20884 2.70884 1 4.20002 1C5.6912 1 6.90004 2.20884 6.90004 3.70002Z" stroke="#064771" strokeWidth="1.60005"/>
       <path d="M19.4997 3.70002C19.4997 5.1912 18.2909 6.40004 16.7996 6.40004C15.3084 6.40004 14.0996 5.1912 14.0996 3.70002C14.0996 2.20884 15.3084 1 16.7996 1C18.2909 1 19.4997 2.20884 19.4997 3.70002Z" stroke="#064771" strokeWidth="1.60005"/>
       <path d="M6.90004 16.3C6.90004 17.7912 5.6912 19 4.20002 19C2.70884 19 1.5 17.7912 1.5 16.3C1.5 14.8088 2.70884 13.6 4.20002 13.6C5.6912 13.6 6.90004 14.8088 6.90004 16.3Z" stroke="#064771" strokeWidth="1.60005"/>
       <path d="M19.4997 16.3C19.4997 17.7912 18.2909 19 16.7996 19C15.3084 19 14.0996 17.7912 14.0996 16.3C14.0996 14.8088 15.3084 13.6 16.7996 13.6C18.2909 13.6 19.4997 14.8088 19.4997 16.3Z" stroke="#064771" strokeWidth="1.60005"/>
       <path d="M6.90039 16.3009H14.1004" stroke="#064771" strokeWidth="1.60005" strokeLinecap="round"/>
       <path d="M6.90039 3.69928H14.1004" stroke="#064771" strokeWidth="1.60005" strokeLinecap="round"/>
       <path d="M16.8008 13.6003V6.40021" stroke="#064771" strokeWidth="1.60005" strokeLinecap="round"/>
       <path d="M4.19922 13.6003V6.40021" stroke="#064771" strokeWidth="1.60005" strokeLinecap="round"/>
     </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
        <path d="M6.90004 3.70002C6.90004 5.1912 5.6912 6.40004 4.20002 6.40004C2.70884 6.40004 1.5 5.1912 1.5 3.70002C1.5 2.20884 2.70884 1 4.20002 1C5.6912 1 6.90004 2.20884 6.90004 3.70002Z" stroke="#727272" strokeWidth="1.60005"/>
        <path d="M19.4997 3.70002C19.4997 5.1912 18.2909 6.40004 16.7996 6.40004C15.3084 6.40004 14.0996 5.1912 14.0996 3.70002C14.0996 2.20884 15.3084 1 16.7996 1C18.2909 1 19.4997 2.20884 19.4997 3.70002Z" stroke="#727272" strokeWidth="1.60005"/>
        <path d="M6.90004 16.3C6.90004 17.7912 5.6912 19 4.20002 19C2.70884 19 1.5 17.7912 1.5 16.3C1.5 14.8088 2.70884 13.6 4.20002 13.6C5.6912 13.6 6.90004 14.8088 6.90004 16.3Z" stroke="#727272" strokeWidth="1.60005"/>
        <path d="M19.4997 16.3C19.4997 17.7912 18.2909 19 16.7996 19C15.3084 19 14.0996 17.7912 14.0996 16.3C14.0996 14.8088 15.3084 13.6 16.7996 13.6C18.2909 13.6 19.4997 14.8088 19.4997 16.3Z" stroke="#727272" strokeWidth="1.60005"/>
        <path d="M6.90039 16.3009H14.1004" stroke="#727272" strokeWidth="1.60005" strokeLinecap="round"/>
        <path d="M6.90039 3.69928H14.1004" stroke="#727272" strokeWidth="1.60005" strokeLinecap="round"/>
        <path d="M16.8008 13.6003V6.40021" stroke="#727272" strokeWidth="1.60005" strokeLinecap="round"/>
        <path d="M4.19922 13.6003V6.40021" stroke="#727272" strokeWidth="1.60005" strokeLinecap="round"/>
      </svg>
      )}
    </div>
  );
};

export default PartnershipStructureIcon;
