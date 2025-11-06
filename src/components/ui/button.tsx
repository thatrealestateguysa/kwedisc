import React from 'react'
export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary' }> = ({variant='primary', className='', ...props}) => (
  <button {...props} className={`btn ${variant==='primary'?'btn-primary':'btn-secondary'} ${className}`}/>
)
export default Button
