import React from 'react';

interface ClosedDealsIconProps {
  isActive: boolean;
}

const ClosedDealsIcon: React.FC<ClosedDealsIconProps> = ({ isActive }) => {
  return (
    <div>
      {isActive ? (
       <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
       <path d="M14.406 7.48687C14.406 8.9204 13.8365 10.2952 12.8229 11.3088C11.8093 12.3225 10.4344 12.892 9.00083 12.892C7.5673 12.892 6.19251 12.3225 5.17886 11.3088C4.1652 10.2952 3.5957 8.9204 3.5957 7.48687" stroke="#064771" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M9 12.8826V18.1076" stroke="#064771" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M3.5957 19C7.09948 17.8016 10.9022 17.8016 14.406 19" stroke="#064771" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M3.5957 7.48617V3.41428C3.5957 2.77397 3.85009 2.15991 4.30285 1.70714C4.75562 1.25437 5.36973 1 6.01004 1H11.9556C12.596 1 13.2101 1.25437 13.6628 1.70714C14.1155 2.15991 14.3699 2.77397 14.3699 3.41428V7.48617" stroke="#064771" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M14.4043 3.32521C15.121 3.32521 15.8085 3.60993 16.3153 4.11676C16.8221 4.62359 17.1069 5.31102 17.1069 6.02777C17.1069 6.74454 16.8221 7.43196 16.3153 7.93879C15.8085 8.44567 15.121 8.73034 14.4043 8.73034" stroke="#064771" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
       <path d="M3.59514 8.73034C2.87838 8.73034 2.19101 8.44567 1.68418 7.93879C1.17735 7.43196 0.892578 6.74454 0.892578 6.02777C0.892578 5.31102 1.17735 4.62359 1.68418 4.11676C2.19101 3.60993 2.87838 3.32521 3.59514 3.32521" stroke="#064771" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
     </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 18 20" fill="none">
  <path d="M14.404 7.4873C14.404 8.92084 13.8346 10.2956 12.8209 11.3093C11.8073 12.3229 10.4324 12.8924 8.99888 12.8924C7.56535 12.8924 6.19056 12.3229 5.1769 11.3093C4.16324 10.2956 3.59375 8.92084 3.59375 7.4873" stroke="#838383" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M9 12.8828V18.1078" stroke="#838383" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M3.59375 19.0004C7.09753 17.802 10.9002 17.802 14.404 19.0004" stroke="#838383" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M3.59375 7.48617V3.41428C3.59375 2.77397 3.84813 2.15991 4.30089 1.70714C4.75366 1.25437 5.36778 1 6.00809 1H11.9537C12.594 1 13.2081 1.25437 13.6608 1.70714C14.1136 2.15991 14.368 2.77397 14.368 3.41428V7.48617" stroke="#838383" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M14.4023 3.3252C15.1191 3.3252 15.8065 3.60992 16.3133 4.11675C16.8201 4.62358 17.1049 5.311 17.1049 6.02776C17.1049 6.74453 16.8201 7.43195 16.3133 7.93878C15.8065 8.44566 15.1191 8.73033 14.4023 8.73033" stroke="#838383" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
  <path d="M3.59319 8.73033C2.87643 8.73033 2.18905 8.44566 1.68222 7.93878C1.17539 7.43195 0.890625 6.74453 0.890625 6.02776C0.890625 5.311 1.17539 4.62358 1.68222 4.11675C2.18905 3.60992 2.87643 3.3252 3.59319 3.3252" stroke="#838383" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
      )}
    </div>
  );
};

export default ClosedDealsIcon;
