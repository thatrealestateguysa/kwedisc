import React from 'react'
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className='', ...props}) => (
  <div {...props} className={`card ${className}`}></div>
)
export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({className='', ...props}) => (
  <div {...props} className={`p-4 ${className}`}></div>
)
export default Card
