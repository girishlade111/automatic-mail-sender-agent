import React from 'react'

export default function MockLink({
  href,
  children,
  ...props
}: {
  href: string
  children: React.ReactNode
  [key: string]: unknown
}) {
  return <a href={href} {...props}>{children}</a>
}
