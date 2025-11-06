import React from 'react'
type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary' }
export const Button: React.FC<Props> = ({variant='primary', className='', ...props}) => (
  <button {...props} className={`btn ${variant==='primary'?'btn-primary':'btn-secondary'} ${className}`}/>
)
export default Button
