import React from 'react'
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref)=> (
  <input ref={ref} {...props} className={`input ${props.className||''}`} />
))
Input.displayName='Input'
export default Input
