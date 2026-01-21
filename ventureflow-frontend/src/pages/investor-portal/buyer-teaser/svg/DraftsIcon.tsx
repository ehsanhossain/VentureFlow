import React from 'react';

interface DraftsIconProps {
  isActive: boolean;
}

const DraftsIcon: React.FC<DraftsIconProps> = ({ isActive }) => {
  return (
    <div>
      {isActive ? (
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="20" viewBox="0 0 17 20" fill="none">
      <path d="M9.85039 4.6V8.2H12.1004M10.9166 1H6.70039C5.70628 1 4.90039 1.80589 4.90039 2.8V13.6C4.90039 14.5941 5.70628 15.4 6.70039 15.4H13.9004C14.8945 15.4 15.7004 14.5941 15.7004 13.6V5.71746C15.7004 5.23306 15.5052 4.7691 15.1588 4.43045L12.175 1.51299C11.8387 1.18414 11.387 1 10.9166 1Z" stroke="#064771" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.1008 15.3998V17.1998C12.1008 18.194 11.2949 18.9998 10.3008 18.9998H3.10078C2.10667 18.9998 1.30078 18.194 1.30078 17.1998V7.29985C1.30078 6.30574 2.10667 5.49985 3.10078 5.49985H4.90078" stroke="#064771" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="20" viewBox="0 0 16 20" fill="none">
  <path d="M9.35234 4.6V8.2H11.6023M10.4186 1H6.20234C5.20823 1 4.40234 1.80589 4.40234 2.8V13.6C4.40234 14.5941 5.20823 15.4 6.20234 15.4H13.4023C14.3965 15.4 15.2023 14.5941 15.2023 13.6V5.71746C15.2023 5.23306 15.0071 4.7691 14.6607 4.43045L11.6769 1.51299C11.3406 1.18414 10.889 1 10.4186 1Z" stroke="#838383" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M11.6008 15.4V17.2C11.6008 18.1941 10.7949 19 9.80078 19H2.60078C1.60667 19 0.800781 18.1941 0.800781 17.2V7.3C0.800781 6.30589 1.60667 5.5 2.60078 5.5H4.40078" stroke="#838383" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
      )}
    </div>
  );
};

export default DraftsIcon;
